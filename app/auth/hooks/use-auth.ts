"use client";

import { useSession } from "next-auth/react";

/**
 * Custom hook for authentication state
 * Wraps NextAuth's useSession with additional helper properties
 */
export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user,
    session,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    isUnauthenticated: status === "unauthenticated",
  };
}

