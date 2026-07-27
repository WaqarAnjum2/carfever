"use client";

import React, { useState, useEffect } from "react";
import { Phone, Mail, MapPin, ShieldCheck } from "lucide-react";
import { AnimatedLogo } from "@/components/ui/animated-logo";

const HERO_WALLPAPERS = [
  "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1600&q=80&fm=webp",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80&fm=webp",
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1600&q=80&fm=webp",
  "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=1600&q=80&fm=webp",
  "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1600&q=80&fm=webp",
];

interface AboutHeroCarouselProps {
  heading: string;
  subheading: string;
  phone: string;
  email: string;
  location: string;
}

export function AboutHeroCarousel({
  heading,
  subheading,
  phone,
  email,
  location,
}: AboutHeroCarouselProps) {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % HERO_WALLPAPERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white py-10 sm:py-14 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
      {/* Auto-Carousel Background Slideshow */}
      {HERO_WALLPAPERS.map((url, idx) => (
        <div
          key={url}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out pointer-events-none ${
            idx === currentIdx ? "opacity-35 scale-105" : "opacity-0 scale-100"
          } transition-transform duration-10000`}
        >
          <img
            src={url}
            alt="CarFever Luxury Vehicle Wallpaper"
            className="w-full h-full object-cover"
            loading={idx === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}

      {/* Dark Vignette Gradient Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/60 pointer-events-none" />
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-[#0055FE]/20 blur-3xl pointer-events-none" />

      {/* Hero Content (Compact & Clean) */}
      <div className="max-w-5xl mx-auto relative z-10 flex flex-col items-center text-center">
        
        {/* Compact Logo & Badge */}
        <div className="mb-4">
          <AnimatedLogo variant="dark" size="md" subtitle="Official Portal" href="/" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-blue-200 mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>UK Verified Car Marketplace</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight max-w-3xl mb-3">
          {heading}
        </h1>

        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed mb-6">
          {subheading}
        </p>

        {/* Compact Contact Badges Pill */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4">
          <a
            href={`tel:${phone.replace(/\s+/g, "")}`}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md flex items-center gap-2 text-xs font-bold text-white transition-all hover:scale-105"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>{phone}</span>
          </a>

          <a
            href={`mailto:${email}`}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md flex items-center gap-2 text-xs font-bold text-white transition-all hover:scale-105"
          >
            <Mail className="w-3.5 h-3.5 text-blue-400" />
            <span>{email}</span>
          </a>

          <div className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md flex items-center gap-2 text-xs font-bold text-slate-200">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>{location}</span>
          </div>
        </div>

        {/* Carousel Indicator Dots */}
        <div className="flex items-center gap-1.5 mt-5">
          {HERO_WALLPAPERS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIdx(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIdx ? "w-6 bg-[#0055FE]" : "w-1.5 bg-white/30"
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
