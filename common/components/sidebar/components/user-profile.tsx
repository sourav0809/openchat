"use client";

import { useState, useRef, useEffect } from "react";
import { User, LogOut } from "lucide-react";
import { Button } from "@/common/components/ui/button";

interface UserProfileProps {
  isCollapsed: boolean;
}

export function UserProfile({ isCollapsed }: UserProfileProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user = {
    name: "Sourav Pathak",
    email: "sourav.pathak@example.com",
    initials: "SP",
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
        className="w-10 h-10 hover:bg-accent/80 transition-colors p-0"
      >
        <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold">
          {user.initials}
        </div>
      </Button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        className="w-full justify-start gap-2.5 h-auto py-2 px-3 hover:bg-accent/80 transition-colors"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
          {user.initials}
        </div>
        <div className="flex flex-col items-start flex-1 min-w-0">
          <span className="text-sm font-medium truncate w-full text-left">
            {user.name}
          </span>
          <span
            className="text-xs text-muted-foreground truncate w-full text-left"
            title={user.email}
          >
            {user.email}
          </span>
        </div>
      </Button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-56 bg-popover border border-border rounded-lg shadow-lg py-1 z-50">
          <button
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
            onClick={() => {
              setIsDropdownOpen(false);
            }}
          >
            <User className="h-4 w-4" />
            <span>Profile</span>
          </button>
          <div className="h-px bg-border my-1" />
          <button
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-accent transition-colors"
            onClick={() => {
              setIsDropdownOpen(false);
            }}
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
