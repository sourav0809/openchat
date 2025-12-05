"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import { ChatInput } from "../../../common/components/sidebar/components/chat-input";
import {
  MessageList,
  type Message,
} from "../../../common/components/sidebar/components/message-list";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";

// Streaming response types
interface StreamingMetadata {
  sessionId: string;
  userMessageId: string;
  aiMessageId: string;
  toolCalls?: unknown[];
  toolResults?: unknown[];
  isNewSession: boolean;
}

export default function ChatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.chatId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // Load conversation history with retry logic for new sessions
  const loadConversationHistory = useCallback(async (retryCount = 0) => {
    try {
      setIsLoadingHistory(true);
      setError(null);

      const response = await fetch(`/api/chat/${sessionId}`);

      if (response.status === 404) {
        // If session not found, it might still be creating from home page
        // Wait a bit and retry for new sessions
        if (retryCount < 3) {
          console.log(`Session not found, retrying in ${retryCount + 1}s...`);
          setTimeout(() => {
            loadConversationHistory(retryCount + 1);
          }, 1000 * (retryCount + 1)); // 1s, 2s, 3s delays
          return;
        }
        setError("Chat session not found");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load conversation");
      }

      const data: GetMessagesResponse = await response.json();

      // Convert API messages to component format
      const formattedMessages: Message[] = data.messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: new Date(msg.createdAt),
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error loading conversation:", error);

      // If it's a network error and we haven't retried much, try again
      if (retryCount < 2 && (error instanceof TypeError || error.message.includes('fetch'))) {
        console.log(`Network error, retrying in ${(retryCount + 1) * 500}ms...`);
        setTimeout(() => {
          loadConversationHistory(retryCount + 1);
        }, 500 * (retryCount + 1));
        return;
      }

      setError(
        error instanceof Error ? error.message : "Failed to load conversation"
      );
    } finally {
      setIsLoadingHistory(false);
    }
  }, [sessionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load conversation history on mount
  useEffect(() => {
    if (sessionId) {
      loadConversationHistory();
    }
  }, [sessionId, loadConversationHistory]);

  const handleSend = async (message: string) => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      // Add user message to UI immediately
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: message.trim(),
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Send message to API with streaming
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message.trim(),
          sessionId: sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Failed to get response reader");
      }

      let metadata: StreamingMetadata | null = null;
      let aiMessageContent = "";
      const aiMessageId = `ai-${Date.now()}`;
      let buffer = ""; // Accumulate chunks

      // Create AI message placeholder
      const aiMessage: Message = {
        id: aiMessageId,
        role: "assistant",
        content: "",
        createdAt: new Date(),
      };

      // Add AI message to UI
      setMessages((prev) => [...prev, aiMessage]);

      try {
        console.log("Starting to read stream...");
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

                if ("sessionId" in parsed && "userMessageId" in parsed) {
                  // This is metadata - stream is starting, hide loading
                  console.log("Stream starting, hiding loading indicator");
                  setIsLoading(false);

                  metadata = parsed as StreamingMetadata;

                  // Update user message with real ID
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === userMessage.id
                        ? { ...msg, id: metadata!.userMessageId }
                        : msg
                    )
                  );
                } else if ("text" in parsed) {
                  // This is a text chunk
                  aiMessageContent += parsed.text;

                  // Force immediate re-render to show streaming effect
                  flushSync(() => {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === aiMessageId
                          ? { ...msg, content: aiMessageContent }
                          : msg
                      )
                    );
                  });
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
    } catch (error) {
      console.error("Error sending message:", error);

      // Remove the temporary user message on error
      setMessages((prev) => prev.filter((msg) => !msg.id.startsWith("temp-")));

      setError(
        error instanceof Error ? error.message : "Failed to send message"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    router.push("/chat");
  };

  // Show loading state while loading history
  if (isLoadingHistory) {
    return (
      <div className="flex flex-col h-full bg-background pt-14 md:pt-0">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading conversation...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col h-full bg-background pt-14 md:pt-0">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-lg font-semibold mb-2">Error</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Back to Chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background pt-14 md:pt-0">
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4">
              <p className="text-muted-foreground text-sm">
                No messages yet. Start the conversation below!
              </p>
            </div>
          </div>
        ) : (
          <MessageList messages={messages} isLoading={isLoading} />
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border/50 bg-background">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <ChatInput
            onSend={handleSend}
            disabled={isLoading}
            placeholder={isLoading ? "Sending..." : "Type your message..."}
          />
          {error && (
            <div className="mt-2 text-sm text-destructive">{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}
