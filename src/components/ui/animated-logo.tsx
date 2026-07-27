"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AnimatedLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  subtitle?: string;
  variant?: "light" | "dark" | "gradient";
  href?: string;
  interactive?: boolean;
}

export function AnimatedLogo({
  className,
  size = "md",
  showText = true,
  subtitle = "Marketplace",
  variant = "light",
  href = "/",
  interactive = true,
}: AnimatedLogoProps) {
  // Sizing definitions
  const badgeSizeMap = {
    sm: "w-9 h-9 sm:w-10 sm:h-10",
    md: "w-11 h-11 sm:w-12 sm:h-12",
    lg: "w-14 h-14 sm:w-16 sm:h-16",
    xl: "w-18 h-18 sm:w-22 sm:h-22",
  };

  const titleSizeMap = {
    sm: "text-lg sm:text-xl",
    md: "text-xl sm:text-2xl",
    lg: "text-2xl sm:text-3xl font-black",
    xl: "text-3xl sm:text-5xl font-black",
  };

  const subtitleSizeMap = {
    sm: "text-[10px]",
    md: "text-[11px]",
    lg: "text-[12px]",
    xl: "text-[14px]",
  };

  const isDarkTheme = variant === "dark";

  const Content = (
    <div
      className={cn(
        "group relative flex items-center gap-3 select-none transition-all duration-300",
        interactive && "hover:opacity-95 cursor-pointer",
        className
      )}
    >
      {/* ===== EMBLEM BADGE (Official WebP Logo) ===== */}
      <div className="relative flex items-center justify-center">
        {/* Glow Aura Background */}
        <div
          className={cn(
            "absolute -inset-1.5 rounded-2xl bg-gradient-to-r fill-none opacity-40 blur-md transition-all duration-500 group-hover:opacity-90 group-hover:blur-lg",
            "from-[#0055FE] via-[#FF6B00] to-[#00D5FF]"
          )}
        />

        {/* Outer Container Badge with Official Logo */}
        <div
          className={cn(
            "relative rounded-xl overflow-hidden shadow-lg border flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-blue-500/25",
            badgeSizeMap[size],
            isDarkTheme
              ? "bg-[#0B132B] border-slate-700/60 shadow-black/50"
              : "bg-[#0B132B] border-blue-400/30"
          )}
        >
          <img
            src="/carfever-logo.webp"
            alt="CarFever Official Logo"
            className="w-full h-full object-cover p-0.5 rounded-lg"
          />

          {/* Shimmer Sweep Animation Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
        </div>
      </div>

      {/* ===== LOGO TEXT ===== */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-0.5 font-extrabold tracking-tight">
            <span
              className={cn(
                titleSizeMap[size],
                "transition-colors duration-200",
                isDarkTheme ? "text-white" : "text-slate-900"
              )}
            >
              Car
            </span>
            <span
              className={cn(
                titleSizeMap[size],
                "bg-gradient-to-r from-[#0055FE] via-[#FF6B00] to-[#FFA800] bg-clip-text text-transparent group-hover:from-[#0066FF] group-hover:via-[#FF9E00] group-hover:to-[#00D5FF] transition-all duration-500 drop-shadow-xs"
              )}
            >
              Fever
            </span>

            {/* Animated Dot Accent */}
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] ml-0.5 animate-pulse inline-block self-baseline mt-1" />
          </div>

          {subtitle && (
            <span
              className={cn(
                subtitleSizeMap[size],
                "font-semibold tracking-[0.22em] uppercase mt-0.5 transition-colors duration-200",
                isDarkTheme ? "text-slate-400" : "text-slate-500"
              )}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {Content}
      </Link>
    );
  }

  return Content;
}
