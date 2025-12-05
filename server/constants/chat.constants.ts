import { ChatSession, Message } from "../db/schema";
import { z } from "zod";
import { InferSelectModel } from "drizzle-orm";

// Chat service configuration constants
export const CHAT_CONFIG = {
  MAX_CONVERSATION_HISTORY: 20,
  DEFAULT_TITLE_FALLBACK: "New Conversation",
  DEFAULT_DESCRIPTION_FALLBACK: "General conversation",
} as const;

// Session metadata generation prompts
export const SESSION_METADATA_PROMPTS = {
  TITLE_GENERATION: `
    Analyze this user message and create a concise, descriptive title (max 50 characters).
    Focus on the main topic or intent of the conversation.

    User message: "{message}"

    Return only the title, nothing else.
  `,

  DESCRIPTION_GENERATION: `
    Based on this user message, provide a brief description (max 200 characters) of what this conversation might be about.

    User message: "{message}"

    Return only the description, nothing else.
  `,

  METADATA_GENERATION: `
    Analyze this user message and create appropriate metadata for a chat session:

    1. A concise title (max 50 characters)
    2. A brief description (max 200 characters)

    User message: "{message}"

    Return ONLY valid JSON without any markdown formatting or code blocks:
    {"title": "title here", "description": "description here"}
  `,
} as const;

// Message roles
export const MESSAGE_ROLES = {
  USER: "user",
  ASSISTANT: "assistant",
  SYSTEM: "system",
} as const;

// Tool usage configuration
export const TOOL_CONFIG = {
  ENABLED: true,
  MAX_STEPS: 5,
} as const;

// ---------- Type Definitions ----------
export type ChatSessionType = InferSelectModel<typeof ChatSession>;
export type MessageType = InferSelectModel<typeof Message>;

export const SessionMetadataSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
});

