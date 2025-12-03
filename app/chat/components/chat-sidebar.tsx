"use client";

import { Plus, MessageSquare, Menu, X, Sparkles } from "lucide-react";
import { Button } from "@/common/components/ui/button";
import { ScrollArea } from "@/common/components/ui/scroll-area";
import { cn } from "@/common/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface Chat {
  id: string;
  title: string;
  updatedAt: Date;
}

interface ChatSidebarProps {
  chats?: Chat[];
}

interface SidebarContentProps {
  chats: Chat[];
  isActive: (chatId: string) => boolean;
  onClose: () => void;
}

function SidebarContent({ chats, isActive, onClose }: SidebarContentProps) {
  return (
    <>
      {/* Logo/Brand */}
      <div className="p-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="font-semibold text-lg">OpenChat</span>
      </div>

      {/* New Chat Button */}
      <div className="px-4 pb-4">
        <Link href="/chat">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-10 hover:bg-accent"
            onClick={onClose}
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-normal">New Chat</span>
          </Button>
        </Link>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-1">
          {chats.map((chat) => (
            <Link key={chat.id} href={`/chat/${chat.id}`}>
              <button
                onClick={onClose}
                className={cn(
                  "w-full rounded-lg px-3 py-2.5 text-left transition-all hover:bg-accent",
                  "group relative flex items-center gap-2",
                  isActive(chat.id) && "bg-accent"
                )}
              >
                <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm line-clamp-1 flex-1">
                  {chat.title}
                </span>
              </button>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </>
  );
}

export function ChatSidebar({ chats = [] }: ChatSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Dummy data for demonstration
  const dummyChats: Chat[] =
    chats.length > 0
      ? chats
      : [
          {
            id: "1",
            title: "Previous chat example",
            updatedAt: new Date(),
          },
        ];

  const isActive = (chatId: string) => pathname === `/chat/${chatId}`;
  const handleClose = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 md:hidden bg-background/80 backdrop-blur-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={handleClose}
        />
      )}

      {/* Sidebar - Mobile */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-60 bg-background border-r border-border",
          "flex flex-col transition-transform duration-300 md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent
          chats={dummyChats}
          isActive={isActive}
          onClose={handleClose}
        />
      </aside>

      {/* Sidebar - Desktop & Tablet */}
      <aside className="hidden md:flex md:flex-col w-60 bg-background border-r border-border h-screen sticky top-0 shrink-0">
        <SidebarContent
          chats={dummyChats}
          isActive={isActive}
          onClose={handleClose}
        />
      </aside>
    </>
  );
}
