"use client";

import { Plus, MessageSquare, Sparkles, PanelLeft } from "lucide-react";
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

interface ChatSidebarDesktopProps {
  chats: Chat[];
  isActive: (chatId: string) => boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onChatClick: (sessionId: string) => void;
  loading?: boolean;
  hasMore?: boolean;
  lastSessionRef?: React.RefObject<HTMLButtonElement | null>;
}

export function ChatSidebarDesktop({
  chats,
  isActive,
  isCollapsed,
  onToggleCollapse,
  onChatClick,
  loading = false,
  lastSessionRef,
}: ChatSidebarDesktopProps) {
  if (isCollapsed) {
    return (
      <aside
        className={cn(
          "hidden md:flex flex-col bg-background border-r border-border/50 h-screen sticky top-0 shrink-0 transition-all duration-300 ease-in-out",
          "w-16"
        )}
      >
        <div
          className="relative p-3 flex justify-center group cursor-pointer"
          onClick={onToggleCollapse}
        >
          <div className="w-9 h-9 rounded-md bg-linear-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-sm">
            <NextImage
              src={IMAGES.logo}
              alt="Logo"
              width={50}
              height={50}
              className="size-full object-contain rounded-lg"
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/95 rounded-md">
            <PanelLeft className="w-5 h-5 text-foreground" />
          </div>
        </div>

        <div className="px-2 pb-2">
          <Link href="/chat">
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-10 bg-accent/80 hover:bg-accent/90 cursor-pointer transition-colors"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        <div className="mt-auto p-3 flex justify-center cursor-pointer">
          <UserProfile isCollapsed={true} />
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-background border-r border-border/50 h-screen sticky top-0 shrink-0 transition-all duration-300 ease-in-out",
        "w-64"
      )}
    >
      {/* Header Section */}
      <div className="flex flex-col gap-2 p-3">
        {/* Brand with Close Button */}
        <div className="flex items-center gap-2.5 px-2 py-1.5 mb-2">
          <div className="w-7 h-7 rounded-md bg-linear-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-sm">
            <NextImage
              src={IMAGES.logo}
              alt="Logo"
              width={50}
              height={50}
              className="size-full object-contain rounded-lg"
            />
          </div>
          <span className="font-semibold text-base tracking-tight flex-1">
            OpenChat
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-accent cursor-pointer"
            onClick={onToggleCollapse}
          >
            <PanelLeft className="h-4 w-4 rotate-180" />
          </Button>
        </div>

        {/* New Chat Button */}
        <Link href="/chat?new=true">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2.5 h-9 px-3 hover:bg-accent/80 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">New Chat</span>
          </Button>
        </Link>
      </div>

      {/* Chat History Section */}
      <div className="flex-1 overflow-hidden min-h-0">
        <div className="px-3 py-3">
          <h2 className="text-xs font-semibold text-muted-foreground px-2 uppercase tracking-wide">
            Your chats
          </h2>
        </div>
        <ScrollArea className="flex-1 px-2 pb-4 h-full">
          <div className="space-y-0.5 px-1 min-h-0 mb-8 cursor-pointer">
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
                  {chat.title.length > 23
                    ? `${chat.title.substring(0, 23)}...`
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

      {/* User Profile at Bottom */}
      <div className="border-t border-border/50 p-3">
        <UserProfile isCollapsed={false} />
      </div>
    </aside>
  );
}
