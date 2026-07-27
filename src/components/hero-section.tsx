"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, MapPin, ChevronDown, Sparkles, UserPlus, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const popularSearches = [
  "BMW 3 Series",
  "Mercedes C-Class",
  "Volkswagen Golf",
  "Ford Focus",
  "Audi A3",
  "Toyota Corolla",
];

const cities = [
  "All UK",
  "London",
  "Manchester",
  "Birmingham",
  "Bristol",
  "Leeds",
  "Edinburgh",
];

export function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("All UK");
  const [showCities, setShowCities] = useState(false);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-36 lg:pt-28 bg-[#F8F9FA]">
      {/* Background Layers */}
      <div className="absolute inset-0">
        {/* Sports Car Background (Subtle) */}
        <div 
          className="absolute inset-0 opacity-[0.05] bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&w=1920&q=80')" }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0055FE]/10 mb-8 animate-fade-in border border-[#0055FE]/20">
          <Sparkles className="w-3.5 h-3.5 text-[#0055FE]" />
          <span className="text-xs font-semibold text-[#0055FE] tracking-wide">
            UK&apos;s #1 Premium Car Marketplace
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-slide-up text-gray-900">
          Find Your
          <br />
          <span className="text-[#0055FE]">
            Dream Car
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto mb-6 sm:mb-8 px-2 sm:px-0 animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          Browse through thousands of verified listings. Buy, sell, or exchange
          with confidence on the most trusted automotive platform.
        </p>

        {/* Registration CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 animate-slide-up">
          <Link href="/register/seller">
            <Button size="lg" className="w-full sm:w-auto bg-[#0055FE] hover:bg-blue-700 text-white font-extrabold h-12 px-6 text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:scale-105">
              <Building2 className="w-4 h-4 mr-2" />
              <span>Become a Dealer</span>
            </Button>
          </Link>

          <Link href="/register/buyer">
            <Button variant="outline" size="lg" className="w-full sm:w-auto border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-extrabold h-12 px-6 text-xs sm:text-sm rounded-xl shadow-xs transition-all">
              <UserPlus className="w-4 h-4 mr-2 text-[#0055FE]" />
              <span>Register as Buyer</span>
            </Button>
          </Link>
        </div>

        {/* Search Bar */}
        <div
          className="max-w-3xl mx-auto px-1 sm:px-0 animate-slide-up"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="bg-white rounded-2xl p-2.5 sm:p-2 shadow-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row gap-2">
              <select className="h-11 sm:h-12 px-4 bg-gray-50 rounded-xl text-base sm:text-sm text-gray-900 hover:bg-gray-100 transition-colors border border-transparent focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE] focus:outline-none w-full sm:w-auto min-w-[140px] appearance-none cursor-pointer">
                <option value="">Select Make</option>
                <option value="toyota">Toyota</option>
                <option value="honda">Honda</option>
                <option value="suzuki">Suzuki</option>
              </select>

              <select className="h-11 sm:h-12 px-4 bg-gray-50 rounded-xl text-base sm:text-sm text-gray-900 hover:bg-gray-100 transition-colors border border-transparent focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE] focus:outline-none w-full sm:w-auto min-w-[140px] appearance-none cursor-pointer">
                <option value="">Select Model</option>
                <option value="corolla">Corolla</option>
                <option value="civic">Civic</option>
                <option value="alto">Alto</option>
              </select>
              
              <select className="h-11 sm:h-12 px-4 bg-gray-50 rounded-xl text-base sm:text-sm text-gray-900 hover:bg-gray-100 transition-colors border border-transparent focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE] focus:outline-none w-full sm:w-auto min-w-[140px] appearance-none cursor-pointer">
                <option value="">Select City</option>
                <option value="london">London</option>
                <option value="manchester">Manchester</option>
                <option value="birmingham">Birmingham</option>
              </select>

              <select className="h-11 sm:h-12 px-4 bg-gray-50 rounded-xl text-base sm:text-sm text-gray-900 hover:bg-gray-100 transition-colors border border-transparent focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE] focus:outline-none w-full sm:w-auto min-w-[140px] appearance-none cursor-pointer">
                <option value="">Budget Range</option>
                <option value="under-1m">Under 1 Million</option>
                <option value="1m-3m">1M - 3M</option>
                <option value="over-3m">Over 3 Million</option>
              </select>

              {/* Search Button */}
              <Button
                onClick={() => router.push('/buy-car')}
                className="h-11 sm:h-12 bg-[#0055FE] hover:bg-blue-700 active:scale-95 text-white font-bold px-8 rounded-xl transition-all duration-200 w-full sm:w-auto sm:flex-1 shadow-sm hover:shadow-md"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          {/* Popular Searches */}
          <div className="flex items-center gap-2 mt-5 flex-wrap justify-center">
            <span className="text-xs text-gray-500 font-medium">Popular:</span>
            {popularSearches.map((term) => (
              <button
                key={term}
                onClick={() => setSearchQuery(term)}
                className="px-3 py-1 text-xs text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-200"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 max-w-2xl mx-auto mt-20 animate-slide-up"
          style={{ animationDelay: "0.3s" }}
        >
          {[
            { value: "50K+", label: "Active Listings" },
            { value: "120K+", label: "Happy Users" },
            { value: "15+", label: "UK Cities" },
            { value: "4.9★", label: "User Rating" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-gray-500">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#F8F9FA] to-transparent" />
    </section>
  );
}
