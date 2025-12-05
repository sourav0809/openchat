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
import { useRouter } from "next/navigation";
import NextImage from "next/image";
import { IMAGES } from "@/common/constant/images";

export default function ChatPage() {
  const { user } = useAuth();
  const router = useRouter();
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

          if (
            !sessionId &&
            metadata.sessionId &&
            typeof metadata.sessionId === "string" &&
            metadata.sessionId.length > 0
          ) {
            setSessionId(metadata.sessionId);

            if (isMountedRef.current) {
              router.replace(`/chat/${metadata.sessionId}`);
            }

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
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, id: aiMessageIdFromServer }
                : msg
            )
          );
        }
      );
    } catch (error) {
      console.error("Error sending message:", error);

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
          <MessageList messages={messages} isLoading={isLoading} user={user} />
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
