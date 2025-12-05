import { db } from "../db";
import { ChatSession, Message } from "../db/schema";
import { eq, asc, and, desc } from "drizzle-orm";

import { llmService } from "./llm.service";
import { ModelMessage } from "ai";
import {
  CHAT_CONFIG,
  SESSION_METADATA_PROMPTS,
  MESSAGE_ROLES,
  TOOL_CONFIG,
  ChatSessionType,
  MessageType,
  ProcessMessageResult,
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

  /**
   * Generate the session metadata
   * @param sessionId - The ID of the session to generate the metadata for
   * @param firstUserMessage - The first user message to generate the metadata for
   */
  async generateSessionMetadata(
    sessionId: string,
    firstUserMessage: string
  ): Promise<void> {
    const prompt = SESSION_METADATA_PROMPTS.METADATA_GENERATION.replace(
      "{message}",
      firstUserMessage
    );

    try {
      const rawText = await llmService.generateText(prompt);

      // Clean markdown formatting from LLM response
      const text = rawText
        .replace(/```json\s*/g, "") // Remove ```json
        .replace(/```\s*$/g, "") // Remove closing ```
        .trim(); // Remove extra whitespace

      const metadata = JSON.parse(text);

      await db
        .update(ChatSession)
        .set({
          title: metadata.title,
          description: metadata.description,
        })
        .where(eq(ChatSession.id, sessionId));
    } catch (error) {
      console.error("Failed to generate session metadata", error);
      throw new Error("Failed to generate session metadata");
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
   * @returns The user's chat sessions
   */
  async getUserSessions(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ChatSessionType[]> {
    return db
      .select()
      .from(ChatSession)
      .where(eq(ChatSession.userId, userId))
      .orderBy(desc(ChatSession.updatedAt))
      .limit(limit)
      .offset(offset);
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

  /**
   * Process a message
   * @param userId - The ID of the user to process the message for
   * @param userMessage - The message to process
   * @param sessionId - The ID of the session to process the message in
   * @returns The result of the message processing
   */
  async processMessage(
    userId: string,
    userMessage: string,
    sessionId?: string
  ): Promise<ProcessMessageResult> {
    let isNewSession = false;

    let session: ChatSessionType | null = null;
    let userMessageRecord: MessageType | null = null;
    let aiMessageRecord: MessageType | null = null;

    await db.transaction(async (tx) => {
      // Create or validate session
      if (!sessionId) {
        isNewSession = true;

        const [created] = await tx
          .insert(ChatSession)
          .values({
            userId,
            title: "New Session",
            description: "New Session",
          })
          .returning();

        session = created;
        sessionId = created.id;
      } else {
        const [existing] = await tx
          .select()
          .from(ChatSession)
          .where(eq(ChatSession.id, sessionId))
          .limit(1);

        if (!existing || existing.userId !== userId) {
          throw new Error("Session not found or unauthorized");
        }

        session = existing;
      }

      // Save user message
      const [msg] = await tx
        .insert(Message)
        .values({
          chatSessionId: session!.id,
          role: MESSAGE_ROLES.USER,
          content: userMessage,
        })
        .returning();

      userMessageRecord = msg;

      // Update updatedAt
      await tx
        .update(ChatSession)
        .set({ updatedAt: new Date() })
        .where(eq(ChatSession.id, session!.id));
    });

    if (!session) throw new Error("Fatal: session not created.");
    if (!userMessageRecord) throw new Error("Fatal: user message not saved.");

    const safeSession = session as ChatSessionType;

    // Load the history as an array of ModelMessage
    const history = await this.loadHistoryAsModelMessages(safeSession.id);

    const aiResult = await llmService.invoke({
      messages: history,
      useTools: TOOL_CONFIG.ENABLED,
    });

    // Save the AI response
    await db.transaction(async (tx) => {
      const [aiMsg] = await tx
        .insert(Message)
        .values({
          chatSessionId: safeSession.id,
          role: MESSAGE_ROLES.ASSISTANT,
          content: aiResult.text,
        })
        .returning();

      aiMessageRecord = aiMsg;

      await tx
        .update(ChatSession)
        .set({ updatedAt: new Date() })
        .where(eq(ChatSession.id, safeSession.id));
    });

    if (!aiMessageRecord) throw new Error("Fatal: AI message not saved.");

    // Generate the session metadata
    if (isNewSession) {
      await this.generateSessionMetadata(safeSession.id, userMessage);
      session = await this.getSessionById(safeSession.id); // refresh updated metadata
    }

    return {
      session: safeSession,
      userMessage: userMessageRecord!,
      aiMessage: aiMessageRecord!,
      toolCalls: aiResult.toolCalls,
      toolResults: aiResult.toolResults,
      isNewSession,
    };
  }

  /**
   * Process a message with streaming response
   * @param userId - The ID of the user
   * @param userMessage - The user's message content
   * @param sessionId - Optional existing session ID
   * @returns Streaming response data
   */
  async processMessageStreaming(
    userId: string,
    userMessage: string,
    sessionId?: string
  ): Promise<{
    session: ChatSessionType;
    userMessage: MessageType;
    textStream: AsyncIterable<string>;
    toolCalls: unknown[];
    toolResults: unknown[];
    isNewSession: boolean;
  }> {
    let isNewSession = false;

    let session: ChatSessionType | null = null;
    let userMessageRecord: MessageType | null = null;

    await db.transaction(async (tx) => {
      // Create or validate session
      if (!sessionId) {
        isNewSession = true;

        const [created] = await tx
          .insert(ChatSession)
          .values({
            userId,
            title: "New Session",
            description: "New Session",
          })
          .returning();

        session = created;
        sessionId = created.id;
      } else {
        const [existing] = await tx
          .select()
          .from(ChatSession)
          .where(eq(ChatSession.id, sessionId))
          .limit(1);

        if (!existing || existing.userId !== userId) {
          throw new Error("Session not found or unauthorized");
        }

        session = existing;
      }

      // Save user message
      const [msg] = await tx
        .insert(Message)
        .values({
          chatSessionId: session!.id,
          role: MESSAGE_ROLES.USER,
          content: userMessage,
        })
        .returning();

      userMessageRecord = msg;

      // Update updatedAt
      await tx
        .update(ChatSession)
        .set({ updatedAt: new Date() })
        .where(eq(ChatSession.id, session!.id));
    });

    if (!session) throw new Error("Fatal: session not created.");
    if (!userMessageRecord) throw new Error("Fatal: user message not saved.");

    const safeSession = session as ChatSessionType;

    // Load the history as an array of ModelMessage
    const history = await this.loadHistoryAsModelMessages(safeSession.id);

    const aiResult = await llmService.streamInvoke({
      messages: history,
      useTools: TOOL_CONFIG.ENABLED,
    });

    return {
      session: safeSession,
      userMessage: userMessageRecord,
      textStream: aiResult.textStream,
      toolCalls: aiResult.toolCalls,
      toolResults: aiResult.toolResults,
      isNewSession,
    };
  }

  /**
   * Save AI message after streaming is complete
   * @param sessionId - The session ID
   * @param aiMessageContent - The complete AI message content
   * @returns The saved AI message record
   */
  async saveAiMessageAfterStreaming(
    sessionId: string,
    aiMessageContent: string
  ): Promise<MessageType> {
    const [aiMsg] = await db
      .insert(Message)
      .values({
        chatSessionId: sessionId,
        role: MESSAGE_ROLES.ASSISTANT,
        content: aiMessageContent,
      })
      .returning();

    if (!aiMsg) throw new Error("Fatal: AI message not saved.");

    // Update session updatedAt
    await db
      .update(ChatSession)
      .set({ updatedAt: new Date() })
      .where(eq(ChatSession.id, sessionId));

    return aiMsg;
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
