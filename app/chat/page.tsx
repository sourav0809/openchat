"use client";

import { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { ChatInput } from "../../common/components/sidebar/components/chat-input";
import {
  MessageList,
  type Message,
} from "../../common/components/sidebar/components/message-list";
import { Loader2 } from "lucide-react";
import ChatSuggestions from "../../common/components/sidebar/components/chat-suggestions";
import { addNewSession } from "../../common/components/sidebar/components/chat-sidebar";
import { handleStreamingResponse } from "../../common/lib/utils";
import { useAuth } from "@/auth/hooks";
import NextImage from "next/image";
import { IMAGES } from "@/common/constant/images";
import { useRouter, useSearchParams } from "next/navigation";

export default function ChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showConversation, setShowConversation] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentStreamDataRef = useRef<{
    userMessage: string;
    aiMessage: string;
    sessionId: string;
    userMessageId: string;
    aiMessageId: string;
  } | null>(null);

  // Reset state when navigating to /chat or when 'new' param is present
  useEffect(() => {
    const isNewChat = searchParams.get("new");
    const currentPath = window.location.pathname;

    if (currentPath === "/chat" || isNewChat) {
      // Reset everything to show welcome screen
      setMessages([]);
      setShowConversation(false);
      setSessionId(null);
      setIsLoading(false);
      setIsStreaming(false);

      // Clean URL by removing the 'new' param if present
      if (isNewChat) {
        router.replace("/chat", { scroll: false });
      }

      // Ensure URL is correct if it was changed via history.replaceState
      if (currentPath !== "/chat") {
        window.history.replaceState(null, "", "/chat");
      }
    }
  }, [searchParams, router]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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

      const requestBody: { message: string; sessionId?: string } = {
        message: message.trim(),
      };

      // Include sessionId for subsequent messages in the same conversation
      if (sessionId) {
        requestBody.sessionId = sessionId;
      }

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      const aiMessageId = `ai-${Date.now()}`;
      const aiMessage: Message = {
        id: aiMessageId,
        role: "assistant",
        content: "",
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      let aiMessageContent = "";

      await handleStreamingResponse(
        response,
        (metadata) => {
          setIsLoading(false);
          setIsStreaming(true);

          // Store current stream data for potential stop
          currentStreamDataRef.current = {
            userMessage: message.trim(),
            aiMessage: "",
            sessionId: metadata.sessionId,
            userMessageId: metadata.userMessageId,
            aiMessageId: aiMessageId,
          };

          // Update URL immediately without navigation to avoid component unmounting
          if (
            !sessionId &&
            metadata.sessionId &&
            typeof metadata.sessionId === "string" &&
            metadata.sessionId.length > 0
          ) {
            setSessionId(metadata.sessionId);

            // Update URL in browser without triggering navigation
            window.history.replaceState(
              null,
              "",
              `/chat/${metadata.sessionId}`
            );

            addNewSession({
              id: metadata.sessionId,
              title: "New Chat",
              description: "New Chat",
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === userMessage.id
                ? { ...msg, id: metadata.userMessageId }
                : msg
            )
          );
        },
        (text) => {
          aiMessageContent += text;

          // Update current stream data
          if (currentStreamDataRef.current) {
            currentStreamDataRef.current.aiMessage = aiMessageContent;
          }

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

      setMessages((prev) => prev.filter((msg) => !msg.id.startsWith("temp-")));

      // If this was the first message and it failed, reset the conversation state
      if (!sessionId) {
        setShowConversation(false);
      }

      alert("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
      currentStreamDataRef.current = null;
    }
  };

  // If we have a conversation, show it instead of the welcome screen
  if (showConversation) {
    return (
      <div className="flex flex-col h-screen bg-background pt-14 md:pt-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <MessageList messages={messages} isLoading={isLoading} user={user} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border/50 bg-background">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <ChatInput
              onSend={handleSend}
              onStop={stopStreaming}
              disabled={isLoading}
              isStreaming={isStreaming}
              placeholder={
                isLoading ? "Sending..." : "Continue the conversation..."
              }
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background pt-14 md:pt-0">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto px-4 py-8 md:px-6 lg:px-8">
          {/* Welcome Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-br from-teal-500 to-teal-600 mb-6 shadow-lg">
              <NextImage
                src={IMAGES.logo}
                alt="Logo"
                width={50}
                height={50}
                className="size-full object-contain rounded-lg"
              />
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
              onStop={stopStreaming}
              disabled={isLoading}
              isStreaming={isStreaming}
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
