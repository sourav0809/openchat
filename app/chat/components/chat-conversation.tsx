"use client";

import {
  MessageList,
  type Message,
} from "@/common/components/sidebar/components/message-list";
import { ChatInput } from "@/common/components/sidebar/components/chat-input";

interface ChatConversationProps {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  onSend: (message: string) => void;
  onStop: () => void;
}

export function ChatConversation({
  messages,
  isLoading,
  isStreaming,
  user,
  onSend,
  onStop,
}: ChatConversationProps) {
  return (
    <div className="flex flex-col h-screen bg-background pt-14 md:pt-0">
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} isLoading={isLoading} user={user} />
      </div>

      <div className="border-t border-border/50 bg-background">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <ChatInput
            onSend={onSend}
            onStop={onStop}
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
