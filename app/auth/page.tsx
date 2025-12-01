import { AuthHero } from "./components/auth-hero";
import { AuthForm } from "./components/auth-form";

export const metadata = {
  title: "Sign In - OpenChat",
  description: "Sign in to OpenChat to get AI-powered assistance",
};

export default function AuthPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Section with Gradient Background */}
      <AuthHero />

      {/* Right Side - Authentication Form */}
      <div className="flex-1 flex items-center justify-center bg-background">
        <AuthForm />
      </div>
    </div>
  );
}
