"use client";

import { Sparkles, User } from "lucide-react";
import NextImage from "next/image";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface MessageBubbleProps {
  message: Message;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export function MessageBubble({ message, user }: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end gap-3 items-start">
        {/* User Message Content */}
        <div className="bg-teal-500 text-white px-4 py-3 rounded-2xl max-w-[80%] lg:max-w-[60%]">
          <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>

        {/* User Avatar */}
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-600 shrink-0 overflow-hidden">
          {user?.image ? (
            <NextImage
              width={28}
              height={28}
              src={user.image}
              alt={user.name || "User"}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-4 h-4 text-white" />
          )}
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
