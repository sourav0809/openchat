"use client";

import { LucideIcon } from "lucide-react";
import { Button } from "@/common/components/ui/button";
import { cn } from "@/common/lib/utils";

interface SocialLoginButtonProps {
  provider: string;
  icon: LucideIcon;
  label: string;
  variant?: "default" | "outline";
  onClick: () => void;
  isLoading?: boolean;
}

export function SocialLoginButton({
  provider,
  icon: Icon,
  label,
  variant = "outline",
  onClick,
  isLoading = false,
}: SocialLoginButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size="lg"
      className={cn(
        "w-full h-12 cursor-pointer text-base font-medium relative overflow-hidden",
        "hover:scale-[1.02] active:scale-[0.98] transition-transform",
        variant === "default" && "shadow-md hover:shadow-lg"
      )}
      onClick={onClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Connecting...</span>
        </div>
      ) : (
        <>
          <Icon className="size-5 mr-2" />
          Continue with {label}
        </>
      )}
    </Button>
  );
}
