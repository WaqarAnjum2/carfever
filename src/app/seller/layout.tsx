"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Car,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  LogOut,
  Plus,
  Home,
  User,
  ChevronDown,
  Menu,
  X,
  FileText,
} from "lucide-react";
import { getAdminInitialData, logoutAdmin } from "@/lib/admin-actions";
import { createClient } from "@/lib/supabase/client";

interface SellerMenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
}

const sellerMenuItems: SellerMenuItem[] = [
  { label: "Seller Dashboard", href: "/seller/dashboard", icon: LayoutDashboard },
  { label: "My Cars",         href: "/seller/cars",      icon: Car },
  { label: "List Vehicle",    href: "/seller/sell-car",  icon: Plus },
  { label: "Inquiries",       href: "/seller/inquiries",   icon: MessageSquare },
  { label: "Profile Settings", href: "/seller/settings/profile", icon: User },
];

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sellerUser, setSellerUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const [showDelayedBtn, setShowDelayedBtn] = useState(false);
  const sessionCheckedRef = useRef(false);

  useEffect(() => {
    if (sessionCheckedRef.current) return;
    sessionCheckedRef.current = true;

    // Show manual fallback button after 3s if still verifying
    const btnTimer = setTimeout(() => setShowDelayedBtn(true), 3000);

    async function initSeller() {
      try {
        const res = await getAdminInitialData();

        if (!res || !res.profile) {
          window.location.href = "/login";
          return;
        }

        if (res.suspended || (res.profile as any).isSuspended || res.profile.status === "suspended") {
          await logoutAdmin();
          window.location.href = "/login?error=suspended";
          return;
        }

        if (res.profile.role === "buyer") {
          window.location.href = "/";
          return;
        }

        setSellerUser(res.profile);
        setIsAuthenticated(true);
      } catch (err: any) {
        if (err?.message?.includes("suspended")) {
          await logoutAdmin();
          window.location.href = "/login?error=suspended";
        } else {
          window.location.href = "/login";
        }
      } finally {
        clearTimeout(btnTimer);
      }
    }

    initSeller();

    return () => {
      clearTimeout(btnTimer);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    try {
      await logoutAdmin();
    } catch {}
    setSellerUser(null);
    setIsAuthenticated(false);
    window.location.href = "/login";
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 rounded-full border-3 border-[#0055FE] border-t-transparent animate-spin" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Verifying Seller Portal…
          </span>
          {showDelayedBtn && (
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <button
                onClick={() => { window.location.href = "/login"; }}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer"
              >
                Return to Login
              </button>
              <button
                onClick={() => { window.location.reload(); }}
                className="px-4 py-2 bg-[#0055FE] text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
              >
                Refresh Session
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const breadcrumb = pathname
    .split("/")
    .filter(Boolean)
    .slice(1)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" / ") || "Dashboard";

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans">
      
      {/* ── MOBILE OVERLAY ── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-slate-200 flex-col z-50 shadow-sm">
        
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20 flex-shrink-0">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-extrabold text-slate-900 leading-none">
              Car<span className="text-purple-600">Fever</span>
            </div>
            <div className="text-[10px] font-bold text-purple-600 uppercase tracking-[0.15em] mt-1">
              Seller Console
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-4 border-b border-slate-100">
          <Link
            href="/seller/sell-car"
            className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>List New Vehicle</span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {sellerMenuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  active
                    ? "bg-purple-50 text-purple-700 border-l-4 border-purple-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-purple-600" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Public site link */}
        <div className="p-4 border-t border-slate-100">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-purple-600 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Back to Marketplace</span>
          </Link>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 font-bold text-xs flex-shrink-0">
              {sellerUser?.name?.[0]?.toUpperCase() || "S"}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-slate-900 truncate">
                {sellerUser?.name || "Seller User"}
              </div>
              <div className="text-[10px] text-slate-400 font-medium truncate">
                {sellerUser?.email}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </aside>

      {/* ── MOBILE SIDEBAR ── */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-white z-50 transform transition-transform duration-300 lg:hidden flex flex-col border-r border-slate-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-bold">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-extrabold text-slate-900 leading-none">
                Car<span className="text-purple-600">Fever</span>
              </div>
              <div className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mt-1">
                Seller Console
              </div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sellerMenuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                  active
                    ? "bg-purple-50 text-purple-700 border-l-4 border-purple-600"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-purple-600" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="text-xs font-semibold text-purple-600">
                Seller Console / {breadcrumb}
              </div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight capitalize">
                {breadcrumb}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/seller/sell-car"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-xs font-bold border border-purple-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>List Vehicle</span>
            </Link>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                  {sellerUser?.name?.[0]?.toUpperCase() || "S"}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-none">
                    {sellerUser?.name || "Seller User"}
                  </div>
                  <div className="text-[10px] text-purple-600 font-semibold mt-0.5 capitalize">
                    {sellerUser?.role || "Seller"}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{sellerUser?.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{sellerUser?.email}</p>
                  </div>
                  <Link
                    href="/seller/settings/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Profile Settings
                  </Link>
                  <Link
                    href="/"
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <Home className="w-3.5 h-3.5 text-slate-400" />
                    Marketplace
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-8 flex-1 overflow-x-hidden">
          {children}
        </main>

      </div>
    </div>
  );
}
