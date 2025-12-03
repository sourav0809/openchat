"use client";

import { useState, useEffect } from "react";
import { ChatInput } from "../../../common/components/sidebar/components/chat-input";
import {
  MessageList,
  type Message,
} from "../../../common/components/sidebar/components/message-list";
import { useParams } from "next/navigation";

// Dummy responses for demonstration
const getDummyResponse = (userMessage: string): string => {
  return (
    "Thanks for your message! I'm a demo AI assistant. In a real implementation, this would connect to an AI backend to provide helpful responses.\n\nYou said: \"" +
    userMessage +
    '"'
  );
};

export default function ChatDetailPage() {
  const params = useParams();
  const chatId = params.chatId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load initial message from sessionStorage (if coming from main chat page)
  useEffect(() => {
    const initialMessage = sessionStorage.getItem(`chat-${chatId}-initial`);
    if (initialMessage) {
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: initialMessage,
        createdAt: new Date(),
      };

      setMessages((prevMessages) => [...prevMessages, userMessage]);
      sessionStorage.removeItem(`chat-${chatId}-initial`);

      // Simulate AI response
      setIsLoading(true);
      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: getDummyResponse(initialMessage),
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 1500);
    }
  }, [chatId]);

  const handleSend = (message: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getDummyResponse(message),
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-background pt-14 md:pt-0">
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4">
              <p className="text-muted-foreground text-sm">
                No messages yet. Start the conversation below!
              </p>
            </div>
          </div>
        ) : (
          <MessageList messages={messages} isLoading={isLoading} />
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border/50 bg-background">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <ChatInput
            onSend={handleSend}
            disabled={isLoading}
            placeholder="Type your message..."
          />
        </div>
      </div>
    </div>
  );
}
