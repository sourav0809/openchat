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
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastSessionRef = useRef<HTMLButtonElement | null>(null);
  const isFetchingRef = useRef(false);
  const offsetRef = useRef(0);

  const LIMIT = 20;

  const fetchSessions = useCallback(
    async (isLoadMore = false) => {
      if (isFetchingRef.current || (!isLoadMore && !hasMore)) return;

      try {
        isFetchingRef.current = true;
        setLoading(true);
        const currentOffset = isLoadMore ? offsetRef.current : 0;

        const response = await fetch(
          `/api/chat?sessions=true&limit=${LIMIT}&offset=${currentOffset}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch sessions");
        }

        const data = await response.json();
        const newSessions = data.sessions || [];
        const hasMoreFromResponse = data.hasMore || false;

        if (isLoadMore) {
          setSessions((prev) => [...prev, ...newSessions]);
          offsetRef.current = offsetRef.current + LIMIT;
        } else {
          setSessions(newSessions);
          offsetRef.current = LIMIT;
        }

        setHasMore(hasMoreFromResponse);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [hasMore]
  );

  useEffect(() => {
    offsetRef.current = 0;
    fetchSessions();

    refreshSidebarCallback = () => {
      offsetRef.current = 0;
      setHasMore(true);
      fetchSessions(false);
    };

    addNewSessionCallback = (session: ChatSession) => {
      setSessions((prev) => [session, ...prev]);
    };

    return () => {
      refreshSidebarCallback = null;
      addNewSessionCallback = null;
    };
  }, [fetchSessions]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (hasMore && !loading && !isFetchingRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (
            entries[0].isIntersecting &&
            hasMore &&
            !loading &&
            !isFetchingRef.current
          ) {
            fetchSessions(true);
          }
        },
        {
          threshold: 0.1,
          rootMargin: "50px",
        }
      );

      if (lastSessionRef.current) {
        observerRef.current.observe(lastSessionRef.current);
      }
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [hasMore, loading, fetchSessions, sessions]);

  const isActive = (chatId: string) => pathname === `/chat/${chatId}`;

  const handleChatClick = (sessionId: string) => {
    router.push(`/chat/${sessionId}`);
    setIsMobileOpen(false); // Close mobile sidebar on navigation
  };

  const handleMobileToggle = () => setIsMobileOpen(!isMobileOpen);
  const handleMobileClose = () => setIsMobileOpen(false);
  const handleDesktopToggle = () => setIsDesktopCollapsed(!isDesktopCollapsed);

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
