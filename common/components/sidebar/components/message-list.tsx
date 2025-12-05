"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/common/components/ui/scroll-area";
import { MessageBubble } from "./message-bubble";
import { LoadingMessage } from "./loading-message";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export function MessageList({ messages, isLoading, user }: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  return (
    <ScrollArea ref={scrollAreaRef} className="flex-1 h-full">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} user={user} />
        ))}
        {isLoading && <LoadingMessage />}
      </div>
    </ScrollArea>
  );
}
