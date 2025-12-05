"use client";

import { Sparkles, Zap } from "lucide-react";
import NextImage from "next/image";
import { BRAND_CONFIG } from "../constants/auth-config";
import { IMAGES } from "../../../common/constant/images";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Real-time Conversations",
    description: "Get instant responses to your questions",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Insights",
    description: "Smart assistance powered by advanced AI",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Experience seamless, rapid interactions",
  },
];

export function AuthHero() {
  return (
    <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-linear-to-br from-blue-600 via-blue-500 to-indigo-600">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-tr from-blue-400/20 via-transparent to-indigo-400/20 animate-pulse" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-size-[4rem_4rem]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white w-full max-w-2xl mx-auto">
        {/* Brand Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <NextImage
                src={IMAGES.logo}
                alt="Logo"
                width={50}
                height={50}
                className="size-full object-contain rounded-lg"
              />
            </div>
            <h1 className="text-5xl font-bold tracking-tight">
              {BRAND_CONFIG.name}
            </h1>
          </div>
          <p className="text-xl text-blue-50 font-medium mb-3">
            {BRAND_CONFIG.tagline}
          </p>
          <p className="text-base text-blue-100/90 leading-relaxed">
            {BRAND_CONFIG.description}
          </p>
        </div>

        {/* Features */}
        <div className="space-y-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="flex items-start gap-4 p-5 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
              >
                <div className="p-2.5 bg-white/10 rounded-lg shrink-0">
                  <Icon className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-blue-50/80">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 right-20 size-32 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 size-40 bg-indigo-300/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
