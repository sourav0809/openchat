"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChatSidebarDesktop } from "./chat-sidebar-desktop";
import { ChatSidebarMobile } from "./chat-sidebar-mobile";

interface Chat {
  id: string;
  title: string;
  updatedAt: Date;
}

interface ChatSidebarProps {
  chats?: Chat[];
}

const DUMMY_CHATS: Chat[] = [
  {
    id: "1",
    title: "Clarification request",
    updatedAt: new Date(),
  },
  {
    id: "2",
    title: "New chat",
    updatedAt: new Date(),
  },
  {
    id: "3",
    title: "User input error",
    updatedAt: new Date(),
  },
  {
    id: "4",
    title: "Accidental input clarification",
    updatedAt: new Date(),
  },
  {
    id: "5",
    title: "Fix unmatched braces error",
    updatedAt: new Date(),
  },
  {
    id: "6",
    title: "Check JSON column",
    updatedAt: new Date(),
  },
];

export function ChatSidebar({ chats = [] }: ChatSidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  const chatList = chats.length > 0 ? chats : DUMMY_CHATS;

  const isActive = (chatId: string) => pathname === `/chat/${chatId}`;

  const handleMobileToggle = () => setIsMobileOpen(!isMobileOpen);
  const handleMobileClose = () => setIsMobileOpen(false);
  const handleDesktopToggle = () => setIsDesktopCollapsed(!isDesktopCollapsed);

  return (
    <>
      <ChatSidebarMobile
        chats={chatList}
        isActive={isActive}
        isOpen={isMobileOpen}
        onToggle={handleMobileToggle}
        onClose={handleMobileClose}
      />

      <ChatSidebarDesktop
        chats={chatList}
        isActive={isActive}
        isCollapsed={isDesktopCollapsed}
        onToggleCollapse={handleDesktopToggle}
      />
    </>
  );
}
