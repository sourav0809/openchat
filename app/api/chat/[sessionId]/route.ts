import { NextResponse } from "next/server";
import {
  withAuth,
  AuthenticatedRequest,
} from "../../../../server/middleware/auth.middleware";
import { chatService } from "@/services/chat.service";
import { z } from "zod";

// Query parameters schema
const GetMessagesQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 50)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 0)),
});

// Types
type GetMessagesResponse = {
  session: {
    id: string;
    title: string | null;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  messages: Array<{
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  pagination: {
    limit: number;
    offset: number;
    totalCount: number;
  };
};

type DeleteSessionResponse = {
  success: boolean;
  message: string;
};

/**
 * GET /api/chat/[sessionId] - Get messages for a specific chat session
 */
async function handleGetMessages(
  request: AuthenticatedRequest,
  context: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const sessionId = params.sessionId;
    const userId = request.user.id;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = GetMessagesQuerySchema.parse({
      limit: searchParams.get("limit") || undefined,
      offset: searchParams.get("offset") || undefined,
    });

    // Verify session ownership
    const session = await chatService.getSessionById(sessionId);

    if (!session || session.userId !== userId) {
      return NextResponse.json(
        { error: "Session not found or access denied" },
        { status: 404 }
      );
    }

    // Get messages for the session
    const messages = await chatService.getConversationMessages(
      sessionId,
      query.limit
    );

    // Get session stats for total count
    const stats = await chatService.getSessionStats(sessionId);

    const response: GetMessagesResponse = {
      session: {
        id: session.id,
        title: session.title,
        description: session.description,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
      messages: messages.map((message) => ({
        id: message.id,
        role: message.role as "user" | "assistant" | "system",
        content: message.content,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      })),
      pagination: {
        limit: query.limit,
        offset: query.offset,
        totalCount: stats.messageCount,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Get messages API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to retrieve messages" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chat/[sessionId] - Delete a chat session and all its messages
 */
async function handleDeleteSession(
  request: AuthenticatedRequest,
  context: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const sessionId = params.sessionId;
    const userId = request.user.id;

    // Delete the session
    const deleted = await chatService.deleteSession(userId, sessionId);

    if (!deleted) {
      return NextResponse.json(
        { error: "Session not found or access denied" },
        { status: 404 }
      );
    }

    const response: DeleteSessionResponse = {
      success: true,
      message: "Session and all messages deleted successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Delete session API error:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}

// Export handlers with authentication
export const GET = withAuth(handleGetMessages);
export const DELETE = withAuth(handleDeleteSession);
