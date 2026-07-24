"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Car,
  ShieldCheck,
  PhoneCall,
  BarChart3,
  UserPlus,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function SellCarPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 lg:pt-24 pb-20 bg-slate-50 font-sans text-slate-900">
        {/* ── DEALER & SELLER SHOWCASE HERO ── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 mb-12 shadow-xl">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0055FE]/20 blur-[180px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 blur-[160px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Dealer & Seller Partnership</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto mb-6">
              Become a <span className="text-[#0055FE]">Certified Dealer</span> & Sell Vehicles
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
              Grow your automotive business. Register for a verified Dealership or Seller account to list inventory, reach thousands of active car buyers, and manage your showroom.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/register/seller">
                <Button size="lg" className="w-full sm:w-auto bg-[#0055FE] hover:bg-blue-600 text-white font-extrabold h-14 px-8 text-base rounded-2xl shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95">
                  <UserPlus className="w-5 h-5 mr-2" />
                  <span>Register as Dealer / Seller</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>

              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-extrabold h-14 px-8 text-base rounded-2xl transition-all">
                  <span>Sign In to Seller Portal</span>
                </Button>
              </Link>
            </div>

            {/* ── DEALER ACCOUNT FEATURES GRID ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 backdrop-blur-md hover:border-blue-500/50 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-4">
                  <Car className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Showroom Inventory</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  List your vehicle inventory with full photo galleries, specifications, pricing, and mileage details.
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 backdrop-blur-md hover:border-emerald-500/50 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Verified Dealer Badge</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Gain instant buyer trust with an official Verified Dealer badge and dedicated company profile page.
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 backdrop-blur-md hover:border-purple-500/50 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-4">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Direct Buyer Leads</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Receive direct phone calls and inquiries from ready-to-buy customers across your region.
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 backdrop-blur-md hover:border-amber-500/50 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Seller Console</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Track vehicle views, edit pricing, mark listings sold, and manage your showroom in real-time.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
