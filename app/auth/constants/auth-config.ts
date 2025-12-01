import { Github, Chrome } from "lucide-react";

export const AUTH_PROVIDERS = [
  {
    id: "github",
    name: "GitHub",
    icon: Github,
    variant: "default" as const,
  },
  {
    id: "google",
    name: "Google",
    icon: Chrome,
    variant: "outline" as const,
  },
] as const;

export const BRAND_CONFIG = {
  name: "OpenChat",
  tagline: "Your AI-powered assistant for real-time help",
  description: "Get instant answers, creative solutions, and intelligent assistance - just like ChatGPT, but better.",
} as const;

