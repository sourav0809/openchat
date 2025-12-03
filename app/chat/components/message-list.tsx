"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/common/components/ui/scroll-area";
import { Sparkles } from "lucide-react";
import { cn } from "@/common/lib/utils";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <ScrollArea className="flex-1">
      <div ref={scrollRef} className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isLoading && <LoadingMessage />}
      </div>
    </ScrollArea>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="inline-flex items-center gap-2 bg-teal-500 text-white px-5 py-2.5 rounded-full max-w-[80%] lg:max-w-[60%]">
          <span className="text-sm font-medium">{message.content}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 items-start">
      {/* AI Avatar */}
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-100 shrink-0">
        <Sparkles className="w-4 h-4 text-teal-600" />
      </div>

      {/* AI Message Content */}
      <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 max-w-[85%]">
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    </div>
  );
}

function LoadingMessage() {
  return (
    <div className="flex gap-3 items-start">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-100 shrink-0">
        <Sparkles className="w-4 h-4 text-teal-600" />
      </div>
      <div className="bg-gray-100 rounded-2xl px-4 py-3">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
        </div>
      </div>
    </div>
  );
}

