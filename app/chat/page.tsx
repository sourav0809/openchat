"use client";

import { ChatInput } from "../../common/components/sidebar/components/chat-input";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import ChatSuggestions from "../../common/components/sidebar/components/chat-suggestions";

export default function ChatPage() {
  const router = useRouter();

  const handleSend = (message: string) => {
    const chatId = crypto.randomUUID();
    sessionStorage.setItem(`chat-${chatId}-initial`, message);
    router.push(`/chat/${chatId}`);
  };

  return (
    <div className="flex flex-col h-screen bg-background pt-14 md:pt-0">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto px-4 py-8 md:px-6 lg:px-8">
          {/* Welcome Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 mb-6 shadow-lg">
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
            <ChatInput onSend={handleSend} />
          </div>
          <ChatSuggestions handleSend={handleSend} />
        </div>
      </div>
    </div>
  );
}
