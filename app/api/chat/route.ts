import { NextResponse } from "next/server";
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

// Types
type SendMessageRequest = z.infer<typeof SendMessageSchema>;
type SendMessageResponse = {
  sessionId: string;
  userMessageId: string;
  aiMessageId: string;
  response: string;
  toolCalls?: unknown[];
  toolResults?: unknown[];
  isNewSession: boolean;
};

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
 * POST /api/chat - Send a chat message
 */
async function handleSendMessage(
  request: AuthenticatedRequest
): Promise<NextResponse> {
  try {
    const body: SendMessageRequest = await request.json();
    const { message, sessionId } = SendMessageSchema.parse(body);

    const userId = request.user.id;

    // Process the message using the chat service
    const result = await chatService.processMessage(userId, message, sessionId);

    const response: SendMessageResponse = {
      sessionId: result.session.id,
      userMessageId: result.userMessage.id,
      aiMessageId: result.aiMessage.id,
      response: result.aiMessage.content,
      toolCalls: result.toolCalls,
      toolResults: result.toolResults,
      isNewSession: result.isNewSession,
    };

    return NextResponse.json(response);
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
 * GET /api/chat?sessions=true - Get user's chat sessions
 */
async function handleGetSessions(
  request: AuthenticatedRequest
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const getSessions = searchParams.get("sessions") === "true";

    if (!getSessions) {
      return NextResponse.json(
        { error: "Invalid query parameter. Use ?sessions=true" },
        { status: 400 }
      );
    }

    const userId = request.user.id;

    // Get user's chat sessions
    const sessions = await chatService.getUserSessions(userId);

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
    return NextResponse.json(
      { error: "Failed to retrieve sessions" },
      { status: 500 }
    );
  }
}

// Export handlers with authentication
export const POST = withAuth(handleSendMessage);
export const GET = withAuth(handleGetSessions);
