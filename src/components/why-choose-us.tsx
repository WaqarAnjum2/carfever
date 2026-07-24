"use client";

import { useState } from "react";
import {
  Shield,
  Search,
  FileCheck,
  Banknote,
  ArrowRight,
  X,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const features = [
  {
    key: "search",
    icon: Search,
    title: "Smart Search",
    description:
      "Advanced filters and AI-powered recommendations to find your perfect match in seconds.",
    color: "neon-red" as const,
    detailTitle: "AI-Powered Smart Search",
    detailDescription: "Our intelligent matching engine goes beyond basic filters. It analyzes your daily commute, budget, and desired features to recommend the absolute best vehicles matching your lifestyle.",
    benefits: [
      "Filter by precise specifications (sunroof, leather, safety kits)",
      "Smart pricing indicators (Fair Deal, Good Deal, Great Deal)",
      "Save searches & get notified instantly when new matching cars arrive"
    ],
    ctaText: "Try Smart Search",
    ctaHref: "/buy-car",
  },
  {
    key: "verified",
    icon: Shield,
    title: "Verified Listings",
    description:
      "Every listing goes through our rigorous verification process to ensure authenticity.",
    color: "electric-blue" as const,
    detailTitle: "100% Authentic & Verified Listings",
    detailDescription: "We hate scams and duplicate postings. That's why every single car submitted to Car Fever undergoes strict document verification before it goes live on the marketplace.",
    benefits: [
      "Physical verification of chassis and engine numbers",
      "Document authenticity verification (tax, registration, transfer sheets)",
      "Verified sellers with rating profiles & instant communication channels"
    ],
    ctaText: "Browse Certified Cars",
    ctaHref: "/buy-car",
  },
  {
    key: "dealers",
    icon: FileCheck,
    title: "Verified Dealerships",
    description:
      "Connect with certified dealership partners with verified inventory and buyer protection.",
    color: "neon-red" as const,
    detailTitle: "Verified Dealership Network",
    detailDescription: "Shop with peace of mind from our network of authorized car dealerships.",
    benefits: [
      "Verified dealership credentials & business checks",
      "Direct contact options & instant inquiry routing",
      "Authentic inventory listings updated daily"
    ],
    ctaText: "Browse Certified Dealers",
    ctaHref: "/dealers",
  },
  {
    key: "finance",
    icon: Banknote,
    title: "Easy Financing",
    description:
      "Compare financing options from top banks. Get pre-approved in minutes, not days.",
    color: "electric-blue" as const,
    detailTitle: "Hassle-Free Car Financing",
    detailDescription: "Turn your dream car into affordable monthly payments. Car Fever has partnered with top financial institutions to provide you with the lowest possible markup rates.",
    benefits: [
      "Lowest markup rates with quick 24-hour initial pre-approval",
      "Custom installment plans spanning from 1 to 7 years",
      "Minimal documentation requirements & exclusive insurance bundle deals"
    ],
    ctaText: "Explore Finance Options",
    ctaHref: "/buy-car",
  },
];

export function WhyChooseUs() {
  const [selectedFeature, setSelectedFeature] = useState<typeof features[0] | null>(null);

  return (
    <section className="relative py-20 sm:py-28 overflow-hidden bg-white">
      {/* Background effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0055FE]/[0.03] blur-[200px] rounded-full" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#FF6B00]/[0.03] blur-[200px] rounded-full" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-[2px] bg-[#FF6B00] rounded-full" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF6B00]">
              Why Car Fever
            </span>
            <div className="w-8 h-[2px] bg-[#FF6B00] rounded-full" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            The <span className="text-[#FF6B00]">Smarter</span> Way to Buy & Sell
          </h2>
          <p className="text-gray-600 mt-3 max-w-lg mx-auto">
            We&apos;ve reimagined the car buying experience with technology, trust,
            and transparency at its core.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            const isRed = feature.color === "neon-red";

            return (
              <div
                key={feature.title}
                className="group relative p-6 rounded-2xl bg-white border border-gray-200 hover:border-[#0055FE]/30 transition-all duration-500 hover:shadow-xl flex flex-col justify-between"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div>
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-500 group-hover:scale-110 ${
                      isRed
                        ? "bg-[#FF6B00]/10 text-[#FF6B00] group-hover:bg-[#FF6B00]/20 group-hover:shadow-lg group-hover:shadow-[#FF6B00]/20"
                        : "bg-[#0055FE]/10 text-[#0055FE] group-hover:bg-[#0055FE]/20 group-hover:shadow-lg group-hover:shadow-[#0055FE]/20"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-6">
                    {feature.description}
                  </p>
                </div>

                {/* Learn more trigger */}
                <button
                  onClick={() => setSelectedFeature(feature)}
                  className={`inline-flex items-center gap-1.5 text-sm font-medium transition-all duration-300 ${
                    isRed
                      ? "text-[#FF6B00] hover:text-orange-600"
                      : "text-[#0055FE] hover:text-blue-600"
                  }`}
                >
                  Learn more
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </button>

                {/* Corner accent */}
                <div
                  className={`absolute top-0 right-0 w-20 h-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-tr-2xl ${
                    isRed
                      ? "bg-gradient-to-bl from-[#FF6B00]/5 to-transparent"
                      : "bg-gradient-to-bl from-[#0055FE]/5 to-transparent"
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Details Dialog / Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setSelectedFeature(null)}
          />
          
          {/* Modal Box */}
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95">
            {/* Close Button */}
            <button 
              onClick={() => setSelectedFeature(null)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                selectedFeature.color === "neon-red" 
                  ? "bg-[#FF6B00]/10 text-[#FF6B00]" 
                  : "bg-[#0055FE]/10 text-[#0055FE]"
              }`}>
                {<selectedFeature.icon className="w-6 h-6" />}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                {selectedFeature.detailTitle}
              </h3>
            </div>

            {/* Description */}
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6">
              {selectedFeature.detailDescription}
            </p>

            {/* Benefits List */}
            <div className="space-y-3.5 mb-8">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Key Offerings</h4>
              {selectedFeature.benefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${
                    selectedFeature.color === "neon-red" ? "text-[#FF6B00]" : "text-[#0055FE]"
                  }`} />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setSelectedFeature(null)}
                className="border-gray-200 hover:bg-gray-50 text-gray-600 hover:text-gray-900"
              >
                Close
              </Button>
              <Link href={selectedFeature.ctaHref} onClick={() => setSelectedFeature(null)}>
                <Button className={
                  selectedFeature.color === "neon-red" 
                    ? "bg-[#FF6B00] hover:bg-orange-600 text-white" 
                    : "bg-[#0055FE] hover:bg-blue-600 text-white"
                }>
                  {selectedFeature.ctaText}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
