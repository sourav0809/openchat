"use client";

import { ChatInput } from "./components/chat-input";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import ChatSuggestions from "./components/chat-suggestions";

export default function ChatPage() {
  const router = useRouter();

  const handleSend = (message: string) => {
    const chatId = crypto.randomUUID();
    sessionStorage.setItem(`chat-${chatId}-initial`, message);
    router.push(`/chat/${chatId}`);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto px-4 py-8">
          {/* Welcome Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-100 mb-6">
              <Sparkles className="w-8 h-8 text-teal-500" />
            </div>
            <h1 className="text-4xl font-semibold mb-3 text-gray-900">
              How can I help you today?
            </h1>
            <p className="text-gray-500 text-base">
              Ask me anything or choose a suggestion below
            </p>
          </div>

          {/* Input Box */}
          <div className="mb-6">
            <ChatInput onSend={handleSend} />
          </div>
          <ChatSuggestions handleSend={handleSend} />
        </div>
      </div>
    </div>
  );
}
