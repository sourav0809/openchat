"use client";

import { Loader2 } from "lucide-react";
import NextImage from "next/image";
import { IMAGES } from "@/common/constant/images";
import { ChatInput } from "@/common/components/sidebar/components/chat-input";
import ChatSuggestions from "@/common/components/sidebar/components/chat-suggestions";

interface WelcomeScreenProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isLoading: boolean;
  isStreaming: boolean;
}

export function WelcomeScreen({
  onSend,
  onStop,
  isLoading,
  isStreaming,
}: WelcomeScreenProps) {
  return (
    <div className="flex flex-col h-screen bg-background pt-14 md:pt-0">
      <div className="flex-1 flex items-center justify-center overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto px-4 py-8 md:px-6 lg:px-8">
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

          <div className="mb-8">
            <ChatInput
              onSend={onSend}
              onStop={onStop}
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
          <ChatSuggestions handleSend={onSend} />
        </div>
      </div>
    </div>
  );
}


