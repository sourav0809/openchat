import { NextResponse } from "next/server";
import { ReadableStream } from "stream/web";
import { randomUUID } from "crypto";
import {
  withAuth,
  AuthenticatedRequest,
} from "../../../server/middleware/auth.middleware";
import { chatService } from "../../../server/services/chat.service";
import { z } from "zod";

const SendMessageSchema = z.object({
  message: z.string().min(1).max(10000).trim(),
  sessionId: z.string().uuid().optional(),
});

const GetSessionsQuerySchema = z.object({
  sessions: z.literal("true"),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 20)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 0)),
});

type SendMessageRequest = z.infer<typeof SendMessageSchema>;

type GetSessionsResponse = {
  sessions: Array<{
    id: string;
    title: string | null;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  hasMore: boolean;
};

async function handleSendMessage(
  request: AuthenticatedRequest
): Promise<NextResponse> {
  try {
    const body: SendMessageRequest = await request.json();
    const { message, sessionId } = SendMessageSchema.parse(body);

    const userId = request.user.id;

    const result = await chatService.processMessageStreaming(
      userId,
      message,
      sessionId
    );

    let fullAiResponse = "";
    const tempUserMessageId = randomUUID();
    let alreadySaved = false;
    let streamClosed = false;
    let abortSaveResult: {
      userMessage: { id: string };
      aiMessage: { id: string };
      sessionId: string;
    } | null = null;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Add abort listener to save partial response on browser close
          request.signal.addEventListener("abort", async () => {
            if (alreadySaved || streamClosed) return;

            try {
              alreadySaved = true;
              abortSaveResult = await chatService.saveMessagesAfterStreaming(
                userId,
                message,
                fullAiResponse,
                result.sessionId,
                result.isNewSession
              );
            } catch (saveError) {
              console.error(
                "Failed to save partial response on abort:",
                saveError
              );
            } finally {
              try {
                controller.close();
              } catch (closeError) {
                console.error("Controller already closed:", closeError);
              }
            }
          });

          const metadata = {
            sessionId: result.sessionId,
            userMessageId: tempUserMessageId,
            toolCalls: result.toolCalls,
            toolResults: result.toolResults,
            isNewSession: result.isNewSession,
          };

          controller.enqueue(`data: ${JSON.stringify(metadata)}\n`);

          for await (const textPart of result.textStream) {
            for (const char of textPart) {
              fullAiResponse += char;
              controller.enqueue(`data: ${JSON.stringify({ text: char })}\n`);
              await new Promise((resolve) => setTimeout(resolve, 30));
            }
          }

          // Only save if not already saved by abort handler
          let saveResult;
          if (!alreadySaved) {
            alreadySaved = true;
            saveResult = await chatService.saveMessagesAfterStreaming(
              userId,
              message,
              fullAiResponse,
              result.sessionId,
              result.isNewSession
            );
          } else {
            // Use the result from abort save
            saveResult = abortSaveResult;
          }

          if (saveResult) {
            controller.enqueue(
              `data: ${JSON.stringify({
                type: "DONE",
                userMessageId: saveResult.userMessage.id,
                aiMessageId: saveResult.aiMessage.id,
                sessionId: saveResult.sessionId,
              })}\n`
            );
          } else {
            controller.enqueue(
              `data: ${JSON.stringify({
                type: "DONE",
                sessionId: result.sessionId,
                saveFailed: true,
              })}\n`
            );
          }
          streamClosed = true;
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);

          if (!alreadySaved && result.isNewSession) {
            await chatService.cleanupOrphanedSession(result.sessionId);
          }

          controller.error(error);
        }
      },
    });

    return new NextResponse(stream as unknown as BodyInit, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}

async function handleGetSessions(
  request: AuthenticatedRequest
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    const query = GetSessionsQuerySchema.parse({
      sessions: searchParams.get("sessions"),
      limit: searchParams.get("limit") || undefined,
      offset: searchParams.get("offset") || undefined,
    });

    const userId = request.user.id;

    const result = await chatService.getUserSessions(
      userId,
      query.limit,
      query.offset
    );

    const response: GetSessionsResponse = {
      sessions: result.sessions.map((session) => ({
        id: session.id,
        title: session.title,
        description: session.description,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      })),
      hasMore: result.hasMore,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Get sessions API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to retrieve sessions" },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handleSendMessage);
export const GET = withAuth(handleGetSessions);
