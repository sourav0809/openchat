import { db } from "../db";
import { ChatSession, Message } from "../db/schema";
import { eq, asc, and, desc } from "drizzle-orm";

import { llmService } from "./llm.service";
import { ModelMessage } from "ai";
import { cleanMarkdownFormatting } from "../helpers/common";
import {
  CHAT_CONFIG,
  SESSION_METADATA_PROMPTS,
  MESSAGE_ROLES,
  TOOL_CONFIG,
  ChatSessionType,
  MessageType,
} from "../constants/chat.constants";

export class ChatService {
  /**
   * Load the history as an array of ModelMessage
   * @param sessionId - The ID of the session to load the history for
   * @returns The history as an array of ModelMessage
   */
  private async loadHistoryAsModelMessages(
    sessionId: string
  ): Promise<ModelMessage[]> {
    const rows = await db
      .select()
      .from(Message)
      .where(eq(Message.chatSessionId, sessionId))
      .orderBy(asc(Message.createdAt))
      .limit(CHAT_CONFIG.MAX_CONVERSATION_HISTORY);

    return rows.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
  }

  async generateSessionMetadata(
    firstUserMessage: string
  ): Promise<{ title: string; description: string }> {
    const prompt = SESSION_METADATA_PROMPTS.METADATA_GENERATION.replace(
      "{message}",
      firstUserMessage
    );

    try {
      const rawText = await llmService.generateText(prompt);

      // Clean markdown formatting from LLM response
      const text = cleanMarkdownFormatting(rawText);

      const metadata = JSON.parse(text);
      return {
        title: metadata.title || "New Session",
        description: metadata.description || "New Session",
      };
    } catch (error) {
      console.error("Failed to generate session metadata", error);
      return {
        title: "New Session",
        description: "New Session",
      };
    }
  }

  /**
   * Get a session by ID
   * @param sessionId - The ID of the session to get
   * @returns The session or null if not found
   */
  async getSessionById(sessionId: string): Promise<ChatSessionType | null> {
    const rows = await db
      .select()
      .from(ChatSession)
      .where(eq(ChatSession.id, sessionId))
      .limit(1);

    return rows[0] ?? null;
  }

  /**
   * Get user's chat sessions with pagination
   * @param userId - The ID of the user to get sessions for
   * @param limit - Maximum number of sessions to return (default: 20)
   * @param offset - Number of sessions to skip (default: 0)
   * @returns The user's chat sessions and hasMore flag
   */
  async getUserSessions(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ sessions: ChatSessionType[]; hasMore: boolean }> {
    // Fetch one extra item to determine if there's more data
    const rows = await db
      .select()
      .from(ChatSession)
      .where(eq(ChatSession.userId, userId))
      .orderBy(desc(ChatSession.updatedAt))
      .limit(limit + 1)
      .offset(offset);

    const hasMore = rows.length > limit;
    const sessions = rows.slice(0, limit); // Return only the requested limit

    return { sessions, hasMore };
  }

  /**
   * Get conversation messages for a session
   * @param sessionId - The ID of the session to get messages for
   * @param limit - Maximum number of messages to return
   * @returns The conversation messages
   */
  async getConversationMessages(
    sessionId: string,
    limit: number = CHAT_CONFIG.MAX_CONVERSATION_HISTORY
  ): Promise<MessageType[]> {
    return db
      .select()
      .from(Message)
      .where(eq(Message.chatSessionId, sessionId))
      .orderBy(asc(Message.createdAt))
      .limit(limit);
  }

  async processMessageStreaming(
    userId: string,
    userMessage: string,
    sessionId?: string
  ): Promise<{
    sessionId: string;
    textStream: AsyncIterable<string>;
    toolCalls: unknown[];
    toolResults: unknown[];
    isNewSession: boolean;
  }> {
    let isNewSession = false;
    let history: ModelMessage[] = [];
    let finalSessionId = sessionId;

    if (sessionId) {
      // Validate existing session
      const [existing] = await db
        .select()
        .from(ChatSession)
        .where(eq(ChatSession.id, sessionId))
        .limit(1);

      if (!existing || existing.userId !== userId) {
        throw new Error("Session not found or unauthorized");
      }

      // Load history for existing session
      history = await this.loadHistoryAsModelMessages(sessionId);
    } else {
      const metadata = await this.generateSessionMetadata(userMessage);

      isNewSession = true;

      const [created] = await db
        .insert(ChatSession)
        .values({
          userId,
          title: metadata.title,
          description: metadata.description,
        })
        .returning();

      finalSessionId = created.id;
    }

    const messages = [
      ...history,
      { role: "user" as const, content: userMessage },
    ];

    const aiResult = await llmService.streamInvoke({
      messages,
      useTools: TOOL_CONFIG.ENABLED,
    });

    return {
      sessionId: finalSessionId!,
      textStream: aiResult.textStream,
      toolCalls: aiResult.toolCalls,
      toolResults: aiResult.toolResults,
      isNewSession,
    };
  }

  async saveMessagesAfterStreaming(
    userId: string,
    userMessage: string,
    aiMessageContent: string,
    sessionId: string,
    isNewSession: boolean
  ): Promise<{
    userMessage: MessageType;
    aiMessage: MessageType;
    sessionId: string;
  }> {
    let userMessageRecord: MessageType | null = null;
    let aiMessageRecord: MessageType | null = null;

    await db.transaction(async (tx) => {
      if (!isNewSession) {
        await tx
          .update(ChatSession)
          .set({ updatedAt: new Date() })
          .where(eq(ChatSession.id, sessionId));
      }

      // Save messages
      const [userMsg] = await tx
        .insert(Message)
        .values({
          chatSessionId: sessionId,
          role: MESSAGE_ROLES.USER,
          content: userMessage,
        })
        .returning();

      const [aiMsg] = await tx
        .insert(Message)
        .values({
          chatSessionId: sessionId,
          role: MESSAGE_ROLES.ASSISTANT,
          content: aiMessageContent,
        })
        .returning();

      userMessageRecord = userMsg;
      aiMessageRecord = aiMsg;
    });

    if (!userMessageRecord || !aiMessageRecord) {
      throw new Error("Fatal: messages not saved.");
    }

    return {
      userMessage: userMessageRecord,
      aiMessage: aiMessageRecord,
      sessionId,
    };
  }

  /**
   * Delete a session (cascade deletes messages)
   * @param userId - The ID of the user to delete the session for
   * @param sessionId - The ID of the session to delete
   * @returns True if the session was deleted, false otherwise
   */
  async deleteSession(userId: string, sessionId: string): Promise<boolean> {
    return await db.transaction(async (tx) => {
      const rows = await tx
        .delete(ChatSession)
        .where(
          and(eq(ChatSession.id, sessionId), eq(ChatSession.userId, userId))
        )
        .returning();

      return rows.length > 0;
    });
  }

  /**
   * Clean up orphaned session by ID (session with no messages)
   * Called immediately when streaming fails after session creation
   * @param sessionId - The ID of the session to clean up
   */
  async cleanupOrphanedSession(sessionId: string): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        // Check if session has any messages
        const messages = await tx
          .select({ id: Message.id })
          .from(Message)
          .where(eq(Message.chatSessionId, sessionId))
          .limit(1);

        if (messages.length === 0) {
          await tx.delete(ChatSession).where(eq(ChatSession.id, sessionId));
        }
      });
    } catch (error) {
      console.error("Failed to cleanup orphaned session:", error);
    }
  }

  /**
   * Get the stats for a session
   * @param sessionId - The ID of the session to get the stats for
   * @returns The stats for the session
   */
  async getSessionStats(sessionId: string) {
    const session = await this.getSessionById(sessionId);

    if (!session) {
      return { session: null, messageCount: 0, lastActivity: null };
    }

    const messages = await db
      .select({ id: Message.id })
      .from(Message)
      .where(eq(Message.chatSessionId, sessionId));

    return {
      session,
      messageCount: messages.length,
      lastActivity: session.updatedAt,
    };
  }
}

export const chatService = new ChatService();
