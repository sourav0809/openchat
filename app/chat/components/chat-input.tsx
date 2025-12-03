"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/common/components/ui/button";
import { Textarea } from "@/common/components/ui/textarea";
import { Send } from "lucide-react";
import { cn } from "@/common/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ChatInput({
  onSend,
  placeholder = "Ask me anything...",
  disabled = false,
  className,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto height textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 200) + "px";
    }
  }, [message]);

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative flex items-end gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow min-h-[44px]">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none bg-transparent text-sm placeholder:text-gray-400 min-h-[20px] max-h-[120px] leading-relaxed [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-sm [&::-webkit-scrollbar-thumb:hover]:bg-gray-400 [&::-webkit-scrollbar-button]:hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400"
          rows={1}
        />

        <Button
          onClick={handleSubmit}
          disabled={!message.trim() || disabled}
          size="sm"
          className={cn(
            "h-8 w-8 rounded-full shrink-0",
            message.trim() && !disabled
              ? "bg-teal-500 hover:bg-teal-600 text-white"
              : "bg-gray-200 text-gray-400 hover:bg-gray-300"
          )}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-sm text-gray-500 text-center mt-3">
        AI can make mistakes. Consider checking important information.
      </p>
    </div>
  );
}
