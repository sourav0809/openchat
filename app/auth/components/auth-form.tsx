"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";
import { Separator } from "@/common/components/ui/separator";
import { SocialLoginButton } from "./social-login-button";
import { AUTH_PROVIDERS } from "../constants/auth-config";
import { ShieldCheck } from "lucide-react";

export function AuthForm() {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleSocialLogin = async (providerId: string) => {
    try {
      setLoadingProvider(providerId);
      await signIn(providerId, { callbackUrl: "/" });
    } catch (error) {
      console.error("Authentication error:", error);
      setLoadingProvider(null);
    }
  };

  return (
    <div className="flex items-center justify-center px-6 py-12 lg:px-8">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="space-y-3 pb-8">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-primary/5 rounded-2xl">
              <ShieldCheck className="size-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center">
            Welcome back
          </CardTitle>
          <CardDescription className="text-center text-base">
            Sign in to continue to OpenChat
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Social Login Buttons */}
          <div className="space-y-3">
            {AUTH_PROVIDERS.map((provider) => (
              <SocialLoginButton
                key={provider.id}
                provider={provider.id}
                icon={provider.icon}
                label={provider.name}
                variant={provider.variant}
                onClick={() => handleSocialLogin(provider.id)}
                isLoading={loadingProvider === provider.id}
              />
            ))}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Secure Authentication
              </span>
            </div>
          </div>

          {/* Footer Text */}
          <div className="space-y-4 text-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
              By continuing, you agree to OpenChat&apos;s Terms of Service and
              Privacy Policy.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              <span>Your data is encrypted and secure</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
