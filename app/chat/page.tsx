"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { flushSync } from "react-dom";
import { type Message } from "../../common/components/sidebar/components/message-list";
import { Loader2 } from "lucide-react";
import { addNewSession } from "../../common/components/sidebar/components/chat-sidebar";
import { handleStreamingResponse } from "../../common/lib/utils";
import { useAuth } from "@/auth/hooks";
import NextImage from "next/image";
import { IMAGES } from "@/common/constant/images";
import { useRouter, useSearchParams } from "next/navigation";
import { WelcomeScreen } from "./components/welcome-screen";
import { ChatConversation } from "./components/chat-conversation";
import { toast } from "sonner";

function ChatPageContent() {
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

  useEffect(() => {
    const isNewChat = searchParams.get("new");
    const currentPath = window.location.pathname;

    if (currentPath === "/chat" || isNewChat) {
      setMessages([]);
      setShowConversation(false);
      setSessionId(null);
      setIsLoading(false);
      setIsStreaming(false);

      if (isNewChat) {
        router.replace("/chat", { scroll: false });
      }

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

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

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

      if (!showConversation) {
        setMessages([userMessage]);
        setShowConversation(true);
      } else {
        setMessages((prev) => [...prev, userMessage]);
      }

      const requestBody: { message: string; sessionId?: string } = {
        message: message.trim(),
      };

      if (sessionId) {
        requestBody.sessionId = sessionId;
      }

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

          currentStreamDataRef.current = {
            userMessage: message.trim(),
            aiMessage: "",
            sessionId: metadata.sessionId,
            userMessageId: metadata.userMessageId,
            aiMessageId: aiMessageId,
          };

          if (
            !sessionId &&
            metadata.sessionId &&
            typeof metadata.sessionId === "string" &&
            metadata.sessionId.length > 0
          ) {
            setSessionId(metadata.sessionId);

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
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? { ...msg, id: aiMessageIdFromServer }
                : msg
            )
          );

          setIsStreaming(false);
          currentStreamDataRef.current = null;
          abortControllerRef.current = null;
        }
      );
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        console.log("Streaming stopped by user");
        return;
      }

      console.error("Error sending message:", error);

      setMessages((prev) => prev.filter((msg) => !msg.id.startsWith("temp-")));

      if (!sessionId) {
        setShowConversation(false);
      }

      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
      currentStreamDataRef.current = null;
    }
  };

  if (showConversation) {
    return (
      <ChatConversation
        messages={messages}
        isLoading={isLoading}
        isStreaming={isStreaming}
        user={user ?? null}
        onSend={handleSend}
        onStop={stopStreaming}
      />
    );
  }

  return (
    <WelcomeScreen
      onSend={handleSend}
      onStop={stopStreaming}
      isLoading={isLoading}
      isStreaming={isStreaming}
    />
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col h-screen bg-background pt-14 md:pt-0">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-br from-teal-500 to-teal-600 mb-6 shadow-lg">
                <NextImage
                  src={IMAGES.logo}
                  alt="Logo"
                  width={50}
                  height={50}
                  className="size-full object-contain rounded-lg"
                />
              </div>
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
