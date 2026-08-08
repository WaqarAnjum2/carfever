"use client";

import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

import { useCarOptions } from "@/lib/hooks/use-car-options";

const popularSearches = [
  "BMW 3 Series",
  "Mercedes C-Class",
  "Volkswagen Golf",
  "Ford Focus",
  "Audi A3",
  "Tesla Model 3",
];

export function HeroSection() {
  const router = useRouter();
  const { makeNames, cityNames } = useCarOptions();
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedPrice, setSelectedPrice] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedMake) params.set('make', selectedMake);
    if (selectedCity) params.set('city', selectedCity);
    if (selectedPrice) params.set('maxPrice', selectedPrice);
    router.push(`/buy-car?${params.toString()}`);
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-36 lg:pt-28 bg-[#F8F9FA]">
      {/* Background Layers */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 opacity-[0.05] bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=1920')" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0055FE]/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center z-10">
        {/* Top Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[#0055FE] text-xs font-semibold mb-6 animate-in fade-in duration-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>UK&apos;s Premium Certified Car Marketplace</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.1] max-w-4xl mx-auto mb-4">
          Find, Buy & Sell <br className="hidden sm:inline" />
          <span className="text-[#0055FE]">Verified Cars</span> in the UK
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto mb-8 font-medium">
          Browse thousands of quality inspected vehicles from certified dealerships and verified private sellers across the UK.
        </p>

        {/* Search Bar Card */}
        <div className="max-w-4xl mx-auto bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 animate-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedMake}
              onChange={(e) => setSelectedMake(e.target.value)}
              className="h-11 sm:h-12 px-4 bg-gray-50 rounded-xl text-base sm:text-sm text-gray-900 hover:bg-gray-100 transition-colors border border-transparent focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE] focus:outline-none w-full sm:w-auto min-w-[140px] cursor-pointer"
            >
              <option value="">All Makes & Brands</option>
              {makeNames.map((make) => (
                <option key={make} value={make}>{make}</option>
              ))}
            </select>

            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="h-11 sm:h-12 px-4 bg-gray-50 rounded-xl text-base sm:text-sm text-gray-900 hover:bg-gray-100 transition-colors border border-transparent focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE] focus:outline-none w-full sm:w-auto min-w-[140px] cursor-pointer"
            >
              <option value="">All UK Cities</option>
              {cityNames.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>

            <select
              value={selectedPrice}
              onChange={(e) => setSelectedPrice(e.target.value)}
              className="h-11 sm:h-12 px-4 bg-gray-50 rounded-xl text-base sm:text-sm text-gray-900 hover:bg-gray-100 transition-colors border border-transparent focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE] focus:outline-none w-full sm:w-auto min-w-[140px] cursor-pointer"
            >
              <option value="">Budget Range</option>
              <option value="5000">Under £5,000</option>
              <option value="15000">Under £15,000</option>
              <option value="30000">Under £30,000</option>
              <option value="50000">Under £50,000</option>
            </select>

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              className="h-11 sm:h-12 bg-[#0055FE] hover:bg-blue-700 active:scale-95 text-white font-bold px-8 rounded-xl transition-all duration-200 w-full sm:w-auto sm:flex-1 shadow-sm hover:shadow-md cursor-pointer"
            >
              <Search className="w-4 h-4 mr-2" />
              Search Cars
            </Button>
          </div>
        </div>

        {/* Popular Searches */}
        <div className="flex items-center gap-2 mt-5 flex-wrap justify-center">
          <span className="text-xs text-gray-500 font-medium">Popular:</span>
          {popularSearches.map((term) => (
            <button
              key={term}
              onClick={() => setSelectedMake(term.split(' ')[0])}
              className="px-3 py-1 text-xs text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-200 cursor-pointer"
            >
              {term}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 max-w-2xl mx-auto mt-16 animate-slide-up">
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
