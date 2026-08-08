"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCarOptions } from "@/lib/hooks/use-car-options";

export function BrowseByBrand() {
  const { makes } = useCarOptions();
  const activeMakes = makes.slice(0, 10);

  return (
    <section className="relative py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-[2px] bg-[#0055FE] rounded-full" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0055FE]">
              Browse
            </span>
            <div className="w-8 h-[2px] bg-[#0055FE] rounded-full" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Shop By <span className="text-[#0055FE]">Brand</span>
          </h2>
          <p className="text-gray-600 mt-2 max-w-md mx-auto">
            Explore vehicles from top automotive manufacturers across the UK.
          </p>
        </div>

        {/* Brand Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {activeMakes.map((brand) => (
            <Link
              key={brand.id || brand.name}
              href={`/buy-car?make=${encodeURIComponent(brand.name)}`}
              className="group relative flex flex-col items-center gap-3 p-6 rounded-2xl bg-white border border-gray-200 hover:border-[#0055FE]/30 transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/5"
            >
              {brand.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logo_url} alt={brand.name} className="w-10 h-10 object-contain transition-transform duration-500 group-hover:scale-110" />
              ) : (
                <div className="text-4xl mb-1 transition-transform duration-500 group-hover:scale-110">
                  🚘
                </div>
              )}

              <span className="text-sm font-semibold text-gray-900 group-hover:text-[#0055FE] transition-colors duration-300">
                {brand.name}
              </span>
              <span className="text-xs text-gray-500">
                Verified Listings
              </span>

              {/* Hover arrow */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ChevronRight className="w-4 h-4 text-[#0055FE]" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

