import { NextResponse } from "next/server";
import {
  withAuth,
  AuthenticatedRequest,
} from "../../../../server/middleware/auth.middleware";
import { db } from "../../../../server/db";
import { Message, ChatSession } from "../../../../server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const SavePartialSchema = z.object({
  userMessage: z.string().min(1),
  aiMessage: z.string(),
  sessionId: z.string().uuid(),
});

type SavePartialRequest = z.infer<typeof SavePartialSchema>;

/**
 * Save partial AI response when user stops streaming
 * Messages haven't been persisted yet, so we always save them
 */
async function handleSavePartial(
  request: AuthenticatedRequest
): Promise<NextResponse> {
  try {
    const body: SavePartialRequest = await request.json();
    const { userMessage, aiMessage, sessionId } = SavePartialSchema.parse(body);

    // Save messages in transaction
    const result = await db.transaction(async (tx) => {
      // Update session timestamp
      await tx
        .update(ChatSession)
        .set({ updatedAt: new Date() })
        .where(eq(ChatSession.id, sessionId));

      // Always save user message (streaming was stopped, so it wasn't persisted yet)
      const [userMsg] = await tx
        .insert(Message)
        .values({
          chatSessionId: sessionId,
          role: "user",
          content: userMessage,
        })
        .returning();

      // Always save partial AI response (even if empty)
      const [aiMsg] = await tx
        .insert(Message)
        .values({
          chatSessionId: sessionId,
          role: "assistant",
          content: aiMessage || "(Stopped by user)",
        })
        .returning();

      return { userMsg, aiMsg };
    });

    return NextResponse.json({
      success: true,
      userMessageId: result.userMsg.id,
      aiMessageId: result.aiMsg.id,
    });
  } catch (error) {
    console.error("Save partial API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to save partial response" },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handleSavePartial);
