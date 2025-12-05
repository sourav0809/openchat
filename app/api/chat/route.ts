import { NextResponse } from "next/server";
import { ReadableStream } from "stream/web";
import {
  withAuth,
  AuthenticatedRequest,
} from "../../../server/middleware/auth.middleware";
import { chatService } from "../../../server/services/chat.service";
import { z } from "zod";

// Request/Response schemas
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

// Types
type SendMessageRequest = z.infer<typeof SendMessageSchema>;

type GetSessionsResponse = {
  sessions: Array<{
    id: string;
    title: string | null;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
};

/**
 * POST /api/chat - Send a chat message with streaming response
 */
async function handleSendMessage(
  request: AuthenticatedRequest
): Promise<Response> {
  try {
    const body: SendMessageRequest = await request.json();
    const { message, sessionId } = SendMessageSchema.parse(body);

    const userId = request.user.id;

    // Process the message using the streaming chat service
    const result = await chatService.processMessageStreaming(
      userId,
      message,
      sessionId
    );

    // Collect the full AI response for saving
    let fullAiResponse = "";

    // Create a ReadableStream for the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial metadata as JSON
          const metadata = {
            sessionId: result.session.id,
            userMessageId: result.userMessage.id,
            toolCalls: result.toolCalls,
            toolResults: result.toolResults,
            isNewSession: result.isNewSession,
          };

          // Send metadata
          controller.enqueue(`data: ${JSON.stringify(metadata)}\n`);

          // Stream the AI response character by character
          for await (const textPart of result.textStream) {
            // Split the chunk into individual characters for smoother streaming
            for (const char of textPart) {
              fullAiResponse += char;
              controller.enqueue(`data: ${JSON.stringify({ text: char })}\n`);
              // Small delay between characters for smooth streaming effect
              await new Promise((resolve) => setTimeout(resolve, 30));
            }
          }

          // Send end marker
          controller.enqueue(`data: [DONE]\n`);
          controller.close();

          // Save the complete AI message after streaming
          try {
            await chatService.saveMessagesAfterStreaming(
              result.session.id,
              message,
              fullAiResponse
            );
          } catch (saveError) {
            console.error("Error saving messages:", saveError);
            // Don't fail the response if saving fails
          }
        } catch (error) {
          console.error("Streaming error:", error);
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

/**
 * GET /api/chat?sessions=true&limit=20&offset=0 - Get user's chat sessions with pagination
 */
async function handleGetSessions(
  request: AuthenticatedRequest
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const query = GetSessionsQuerySchema.parse({
      sessions: searchParams.get("sessions"),
      limit: searchParams.get("limit") || undefined,
      offset: searchParams.get("offset") || undefined,
    });

    const userId = request.user.id;

    // Get user's chat sessions with pagination
    const sessions = await chatService.getUserSessions(
      userId,
      query.limit,
      query.offset
    );

    const response: GetSessionsResponse = {
      sessions: sessions.map((session) => ({
        id: session.id,
        title: session.title,
        description: session.description,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      })),
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

// Export handlers with authentication
export const POST = withAuth(handleSendMessage);
export const GET = withAuth(handleGetSessions);
