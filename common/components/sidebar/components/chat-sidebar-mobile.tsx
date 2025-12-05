"use client";

import { Plus, MessageSquare, Menu } from "lucide-react";
import { Button } from "@/common/components/ui/button";
import { ScrollArea } from "@/common/components/ui/scroll-area";
import { cn } from "@/common/lib/utils";
import Link from "next/link";
import { UserProfile } from "./user-profile";
import NextImage from "next/image";
import { IMAGES } from "@/common/constant/images";

interface Chat {
  id: string;
  title: string;
  updatedAt: Date;
}

interface ChatSidebarMobileProps {
  chats: Chat[];
  isActive: (chatId: string) => boolean;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onChatClick: (sessionId: string) => void;
  loading?: boolean;
  hasMore?: boolean;
  lastSessionRef?: React.RefObject<HTMLButtonElement | null>;
}

export function ChatSidebarMobile({
  chats,
  isActive,
  isOpen,
  onToggle,
  onClose,
  onChatClick,
  loading = false,
  lastSessionRef,
}: ChatSidebarMobileProps) {
  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-background/95 backdrop-blur-xl border-b border-border/50 z-50 flex items-center justify-between px-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-accent"
          onClick={onToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-linear-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-sm">
            <NextImage
              src={IMAGES.logo}
              alt="Logo"
              width={50}
              height={50}
              className="size-full object-contain rounded-lg"
            />
          </div>
          <span className="font-semibold text-base tracking-tight">
            OpenChat
          </span>
        </div>

        <Link href="/chat">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hover:bg-accent"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 w-64 bg-background/95 backdrop-blur-xl border-r border-border/50 z-50",
          "flex flex-col transition-transform duration-300 ease-in-out md:hidden shadow-2xl",
          "top-14 bottom-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-3">
          <Link href="/chat?new=true" onClick={onClose}>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2.5 h-9 px-3 hover:bg-accent/80 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">New Chat</span>
            </Button>
          </Link>
        </div>

        <div className="flex-1 overflow-hidden min-h-0">
          <div className="px-3 py-3">
            <h2 className="text-xs font-semibold text-muted-foreground px-2 uppercase tracking-wide">
              Your chats
            </h2>
          </div>
          <ScrollArea className="flex-1 px-2 pb-4 h-full">
            <div className="space-y-0.5 px-1 min-h-0">
              {chats.map((chat, index) => (
                <button
                  key={chat.id}
                  ref={index === chats.length - 1 ? lastSessionRef : undefined}
                  onClick={() => onChatClick(chat.id)}
                  className={cn(
                    "w-full rounded-lg px-3 py-2.5 text-left transition-all",
                    "group relative flex items-center gap-2.5 text-sm",
                    isActive(chat.id)
                      ? "bg-accent text-foreground"
                      : "hover:bg-accent/60 text-foreground/90 hover:text-foreground"
                  )}
                >
                  <MessageSquare className="h-4 w-4 shrink-0 opacity-70" />
                  <span className="line-clamp-1 flex-1 font-normal truncate">
                    {chat.title.length > 30
                      ? `${chat.title.substring(0, 30)}...`
                      : chat.title}
                  </span>
                </button>
              ))}
              {loading && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Loading more chats...
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="border-t border-border/50 p-3">
          <UserProfile isCollapsed={false} />
        </div>
      </aside>
    </>
  );
}
