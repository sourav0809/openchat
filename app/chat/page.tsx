"use client";

import { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { ChatInput } from "../../common/components/sidebar/components/chat-input";
import {
  MessageList,
  type Message,
} from "../../common/components/sidebar/components/message-list";
import { Sparkles, Loader2 } from "lucide-react";
import ChatSuggestions from "../../common/components/sidebar/components/chat-suggestions";

// Streaming response types
interface StreamingMetadata {
  sessionId: string;
  userMessageId: string;
  toolCalls?: unknown[];
  toolResults?: unknown[];
  isNewSession: boolean;
}

export default function ChatPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showConversation, setShowConversation] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleSend = async (message: string) => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      // Add user message to UI immediately
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: message.trim(),
        createdAt: new Date(),
      };

      // If this is a new conversation, start fresh. If continuing, append to existing messages
      if (!showConversation) {
        setMessages([userMessage]);
        setShowConversation(true);
      } else {
        setMessages((prev) => [...prev, userMessage]);
      }

      // Prepare API request body
      const requestBody: { message: string; sessionId?: string } = {
        message: message.trim(),
      };

      // Include sessionId for subsequent messages in the same conversation
      if (sessionId) {
        requestBody.sessionId = sessionId;
      }

      // Send message to API with streaming
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
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

                  // Update session ID if this is the first message
                  if (!sessionId) {
                    setSessionId(metadata.sessionId);
                    // Update URL to include session ID without page reload
                    if (isMountedRef.current) {
                      window.history.replaceState(
                        null,
                        "",
                        `/chat/${metadata.sessionId}`
                      );
                    }
                  }

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

      // If this was the first message and it failed, reset the conversation state
      if (!sessionId) {
        setShowConversation(false);
      }

      alert("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // If we have a conversation, show it instead of the welcome screen
  if (showConversation) {
    return (
      <div className="flex flex-col h-screen bg-background pt-14 md:pt-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <MessageList messages={messages} isLoading={isLoading} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border/50 bg-background">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <ChatInput
              onSend={handleSend}
              disabled={isLoading}
              placeholder={
                isLoading ? "Sending..." : "Continue the conversation..."
              }
            />
          </div>
        </div>
      </div>
    );
  }

  // Default welcome screen
  return (
    <div className="flex flex-col h-screen bg-background pt-14 md:pt-0">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto px-4 py-8 md:px-6 lg:px-8">
          {/* Welcome Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-br from-teal-500 to-teal-600 mb-6 shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-3 text-foreground tracking-tight">
              How can I help you today?
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Ask me anything or choose a suggestion below
            </p>
          </div>

          {/* Input Box */}
          <div className="mb-8">
            <ChatInput
              onSend={handleSend}
              disabled={isLoading}
              placeholder={isLoading ? "Sending..." : "Type your message..."}
            />
            {isLoading && (
              <div className="flex items-center justify-center mt-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Sending your message...
                </span>
              </div>
            )}
          </div>
          <ChatSuggestions handleSend={handleSend} />
        </div>
      </div>
    </div>
  );
}
