"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/common/components/ui/button";
import { Textarea } from "@/common/components/ui/textarea";
import { Send, Square } from "lucide-react";
import { cn } from "@/common/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  isStreaming?: boolean;
}

export function ChatInput({
  onSend,
  onStop,
  placeholder = "Ask me anything...",
  disabled = false,
  className,
  isStreaming = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (message.trim() && !disabled && !isStreaming) {
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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 200) + "px";
    }
  }, [message]);

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative flex items-end gap-3 px-4 py-3 bg-background border border-border/60 rounded-xl shadow-sm hover:border-border hover:shadow-md transition-all min-h-[44px]">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isStreaming}
          className="flex-1 resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none bg-transparent text-sm placeholder:text-muted-foreground/60 min-h-[20px] max-h-[120px] leading-relaxed [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/60 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-border [&::-webkit-scrollbar-button]:hidden scrollbar-thin scrollbar-thumb-border/60 scrollbar-track-transparent hover:scrollbar-thumb-border shadow-none hover:shadow-none"
          rows={1}
        />

        {isStreaming ? (
          <Button
            onClick={onStop}
            size="sm"
            variant="destructive"
            className="h-8 w-8 rounded-full shrink-0 transition-all shadow-md hover:shadow-lg"
          >
            <Square className="h-4 w-4 fill-current" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!message.trim() || disabled}
            size="sm"
            className={cn(
              "h-8 w-8 rounded-full shrink-0 transition-all",
              message.trim() && !disabled
                ? "bg-linear-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-md hover:shadow-lg"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground/80 text-center mt-3">
        OpenChat can make mistakes. Consider checking important information.
      </p>
    </div>
  );
}
