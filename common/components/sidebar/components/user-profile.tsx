"use client";

import { useState, useRef, useEffect } from "react";
import { User, LogOut } from "lucide-react";
import { Button } from "@/common/components/ui/button";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/common/components/ui/dialog";

interface UserProfileProps {
  isCollapsed: boolean;
}

export function UserProfile({ isCollapsed }: UserProfileProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  const user = session?.user;

  // Get user initials from name or fallback to "SP"
  const getInitials = (name?: string | null) => {
    if (!name) return "SP";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const userData = {
    name: user?.name || "User",
    email: user?.email || "",
    image: user?.image,
    initials: getInitials(user?.name),
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  if (isCollapsed) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="w-10 h-10 hover:bg-accent/80 transition-colors p-0 cursor-pointer"
      >
        {userData.image ? (
          <Image
            src={userData.image}
            alt={userData.name}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
            {userData.initials}
          </div>
        )}
      </Button>
    );
  }

  return (
    <div className="relative">
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2.5 h-auto py-2 px-3 hover:bg-accent/80 transition-colors cursor-pointer"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          {userData.image ? (
            <Image
              src={userData.image}
              alt={userData.name}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {userData.initials}
            </div>
          )}
          <div className="flex flex-col items-start flex-1 min-w-0">
            <span className="text-sm font-medium truncate w-full text-left">
              {userData.name}
            </span>
            <span
              className="text-xs text-muted-foreground truncate w-full text-left"
              title={userData.email}
            >
              {userData.email}
            </span>
          </div>
        </Button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-56 bg-popover border border-border rounded-lg shadow-lg py-1 z-50">
            <button
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors cursor-pointer"
              onClick={() => {
                setIsDropdownOpen(false);
              }}
            >
              <User className="h-4 w-4" />
              <span>Profile</span>
            </button>
            <div className="h-px bg-border my-1" />
            <button
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-accent transition-colors cursor-pointer"
              onClick={() => {
                setIsDropdownOpen(false);
                setShowLogoutDialog(true);
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-red-600" />
              Confirm Logout
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to log out? You&apos;ll need to sign in
              again to access your chats.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setShowLogoutDialog(false);
                await signOut({ callbackUrl: "/" });
              }}
              className="cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
