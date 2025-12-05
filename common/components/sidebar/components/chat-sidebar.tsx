"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { ChatSidebarDesktop } from "./chat-sidebar-desktop";
import { ChatSidebarMobile } from "./chat-sidebar-mobile";

interface ChatSession {
  id: string;
  title: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

let refreshSidebarCallback: (() => void) | null = null;
let addNewSessionCallback: ((session: ChatSession) => void) | null = null;

export function refreshSidebar() {
  if (refreshSidebarCallback) {
    refreshSidebarCallback();
  }
}

export function addNewSession(session: ChatSession) {
  if (addNewSessionCallback) {
    addNewSessionCallback(session);
  }
}

export function ChatSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastSessionRef = useRef<HTMLDivElement | null>(null);

  const LIMIT = 20;

  // Fetch sessions from API
  const fetchSessions = useCallback(
    async (isLoadMore = false) => {
      try {
        setLoading(true);
        const currentOffset = isLoadMore ? offset : 0;

        const response = await fetch(
          `/api/chat?sessions=true&limit=${LIMIT}&offset=${currentOffset}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch sessions");
        }

        const data = await response.json();
        const newSessions = data.sessions || [];

        if (isLoadMore) {
          setSessions((prev) => [...prev, ...newSessions]);
          setOffset((prev) => prev + LIMIT);
        } else {
          setSessions(newSessions);
          setOffset(LIMIT);
        }

        // If we got less than LIMIT, we've reached the end
        if (newSessions.length < LIMIT) {
          setHasMore(false);
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setLoading(false);
      }
    },
    [offset]
  );

  // Initial load and set refresh callback
  useEffect(() => {
    fetchSessions();

    // Set the global refresh callback
    refreshSidebarCallback = () => {
      fetchSessions(false); // Refresh from beginning
    };

    // Set the global add new session callback
    addNewSessionCallback = (session: ChatSession) => {
      setSessions((prev) => [session, ...prev]);
    };

    return () => {
      refreshSidebarCallback = null;
      addNewSessionCallback = null;
    };
  }, [fetchSessions]);

  // Infinite scroll observer
  useEffect(() => {
    if (loading) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchSessions(true);
        }
      },
      { threshold: 0.1 }
    );

    if (lastSessionRef.current) {
      observerRef.current.observe(lastSessionRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, fetchSessions]);

  const isActive = (chatId: string) => pathname === `/chat/${chatId}`;

  const handleChatClick = (sessionId: string) => {
    router.push(`/chat/${sessionId}`);
    setIsMobileOpen(false); // Close mobile sidebar on navigation
  };

  const handleMobileToggle = () => setIsMobileOpen(!isMobileOpen);
  const handleMobileClose = () => setIsMobileOpen(false);
  const handleDesktopToggle = () => setIsDesktopCollapsed(!isDesktopCollapsed);

  // Transform sessions to match the expected format
  const chatList = sessions.map((session) => ({
    id: session.id,
    title: session.title || "Untitled Chat",
    updatedAt: session.updatedAt,
  }));

  return (
    <>
      <ChatSidebarMobile
        chats={chatList}
        isActive={isActive}
        isOpen={isMobileOpen}
        onToggle={handleMobileToggle}
        onClose={handleMobileClose}
        onChatClick={handleChatClick}
        loading={loading}
        hasMore={hasMore}
        lastSessionRef={lastSessionRef}
      />

      <ChatSidebarDesktop
        chats={chatList}
        isActive={isActive}
        isCollapsed={isDesktopCollapsed}
        onToggleCollapse={handleDesktopToggle}
        onChatClick={handleChatClick}
        loading={loading}
        hasMore={hasMore}
        lastSessionRef={lastSessionRef}
      />
    </>
  );
}
