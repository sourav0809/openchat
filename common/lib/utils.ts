import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Streaming response types
export interface StreamingMetadata {
  sessionId: string;
  userMessageId: string;
  toolCalls?: unknown[];
  toolResults?: unknown[];
  isNewSession: boolean;
}

export interface StreamingResult {
  metadata: StreamingMetadata | null;
  aiMessageContent: string;
  error?: Error;
}

/**
 * Handles streaming response from chat API
 * @param response - The fetch response containing the stream
 * @param onMetadata - Callback when metadata is received
 * @param onTextChunk - Callback for each text chunk received
 * @param onComplete - Callback when streaming is complete with final message IDs
 * @returns Promise that resolves with the streaming result
 */
export async function handleStreamingResponse(
  response: Response,
  onMetadata: (metadata: StreamingMetadata) => void,
  onTextChunk: (text: string) => void,
  onComplete: (userMessageId: string, aiMessageId: string) => void
): Promise<StreamingResult> {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error("Failed to get response reader");
  }

  let metadata: StreamingMetadata | null = null;
  let aiMessageContent = "";
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      // Decode chunk and add to buffer
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // Process complete messages from buffer
      const lines = buffer.split("\n");
      buffer = ""; // Clear buffer after processing

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        if (trimmedLine.startsWith("data: ")) {
          const data = trimmedLine.slice(6).trim();

          if (data === "[DONE]") {
            break;
          }

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === "DONE") {
              // Stream completed with message IDs
              if (parsed.userMessageId && parsed.aiMessageId) {
                onComplete(parsed.userMessageId, parsed.aiMessageId);
              }
              break;
            }

            if ("sessionId" in parsed && "userMessageId" in parsed) {
              // This is metadata - stream is starting
              metadata = parsed as StreamingMetadata;
              onMetadata(metadata);
            } else if ("text" in parsed) {
              // This is a text chunk
              aiMessageContent += parsed.text;
              onTextChunk(parsed.text);
            }
          } catch (parseError) {
            console.error(
              "Error parsing streaming data:",
              parseError,
              "Data:",
              data
            );
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return {
    metadata,
    aiMessageContent,
  };
}
