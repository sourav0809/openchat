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
import { handleStreamingResponse } from "../../../common/lib/utils";
import { useAuth } from "@/auth/hooks";

// API response types
interface GetMessagesResponse {
  session: {
    id: string;
    title: string | null;
    description: string | null;
    createdAt: string;
    updatedAt: string;
  };
  messages: Array<{
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: {
    limit: number;
    offset: number;
    totalCount: number;
  };
}

export default function ChatDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const sessionId = params.chatId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentStreamDataRef = useRef<{
    userMessage: string;
    aiMessage: string;
    sessionId: string;
    userMessageId: string;
    aiMessageId: string;
  } | null>(null);

  // Load conversation history with retry logic for new sessions
  const loadConversationHistory = useCallback(
    async (retryCount = 0) => {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedMessages: any[] = data.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: new Date(msg.createdAt),
        }));

        setMessages(formattedMessages);
      } catch (error) {
        console.error("Error loading conversation:", error);

        // If it's a network error and we haven't retried much, try again
        if (
          retryCount < 2 &&
          (error instanceof TypeError ||
            (error as Error).message.includes("fetch"))
        ) {
          console.log(
            `Network error, retrying in ${(retryCount + 1) * 500}ms...`
          );
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
    },
    [sessionId]
  );

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

  const stopStreaming = async () => {
    if (!isStreaming || !currentStreamDataRef.current) return;

    // Abort the fetch request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Save the partial response
    try {
      const data = currentStreamDataRef.current;
      const response = await fetch("/api/chat/save-partial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userMessage: data.userMessage,
          aiMessage: data.aiMessage,
          sessionId: data.sessionId,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Update message IDs with the real database IDs
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === data.userMessageId) {
              return { ...msg, id: result.userMessageId };
            }
            if (msg.id === data.aiMessageId) {
              return { ...msg, id: result.aiMessageId };
            }
            return msg;
          })
        );
      }
    } catch (error) {
      console.error("Error saving partial response:", error);
    }

    // Reset state
    setIsStreaming(false);
    currentStreamDataRef.current = null;
  };

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

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

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
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      // Create AI message placeholder
      const aiMessageId = `ai-${Date.now()}`;
      const aiMessage: Message = {
        id: aiMessageId,
        role: "assistant",
        content: "",
        createdAt: new Date(),
      };

      // Add AI message to UI
      setMessages((prev) => [...prev, aiMessage]);

      let aiMessageContent = "";

      // Handle streaming response
      await handleStreamingResponse(
        response,
        (metadata) => {
          // This is metadata - stream is starting, hide loading
          setIsLoading(false);
          setIsStreaming(true);

          // Store current stream data for potential stop
          currentStreamDataRef.current = {
            userMessage: message.trim(),
            aiMessage: "",
            sessionId: sessionId,
            userMessageId: metadata.userMessageId,
            aiMessageId: aiMessageId,
          };

          // Update user message with real ID
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === userMessage.id
                ? { ...msg, id: metadata.userMessageId }
                : msg
            )
          );
        },
        (text) => {
          // This is a text chunk
          aiMessageContent += text;

          // Update current stream data
          if (currentStreamDataRef.current) {
            currentStreamDataRef.current.aiMessage = aiMessageContent;
          }

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
        },
        (userMessageId, aiMessageIdFromServer) => {
          // Update AI message with real ID
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, id: aiMessageIdFromServer }
                : msg
            )
          );

          // Streaming complete - clean up
          setIsStreaming(false);
          currentStreamDataRef.current = null;
          abortControllerRef.current = null;
        }
      );
    } catch (error) {
      // Check if this is an abort error (user stopped streaming)
      if ((error as Error).name === "AbortError") {
        console.log("Streaming stopped by user");
        return; // Don't show error, partial response is already saved
      }

      console.error("Error sending message:", error);

      // Remove the temporary user message on error
      setMessages((prev) => prev.filter((msg) => !msg.id.startsWith("temp-")));

      setError(
        error instanceof Error ? error.message : "Failed to send message"
      );
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
      currentStreamDataRef.current = null;
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
          <MessageList messages={messages} isLoading={isLoading} user={user} />
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border/50 bg-background">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <ChatInput
            onSend={handleSend}
            onStop={stopStreaming}
            disabled={isLoading}
            placeholder={isLoading ? "Sending..." : "Type your message..."}
            isStreaming={isStreaming}
          />
          {error && (
            <div className="mt-2 text-sm text-destructive">{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}
