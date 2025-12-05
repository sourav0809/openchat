"use client";

import { Sparkles } from "lucide-react";

export function LoadingMessage() {
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
