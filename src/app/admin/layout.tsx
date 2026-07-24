"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Car,
  LayoutDashboard,
  Users,
  ShieldCheck,
  MessageSquare,
  Settings,
  LogOut,
  Bell,
  FileText,
  BarChart3,
  Search as SearchIcon,
  ChevronDown,
  X,
  Building2,
  UserPlus,
  UserCog,
  Plus,
  Globe,
  Loader2,
  Menu,
} from "lucide-react";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { getAdminInitialData, logoutAdmin } from "@/lib/admin-actions";
import { createClient } from "@/lib/supabase/client";

interface MenuItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  roles: string[];
}

const menuItems: MenuItem[] = [
  { label: "Dashboard",         href: "/admin/dashboard",    icon: LayoutDashboard, roles: ["admin", "content_manager", "inspection_manager", "seller", "buyer"] },
  { label: "Manage Cars",       href: "/admin/cars",         icon: Car,             roles: ["admin", "content_manager", "seller"] },
  { label: "Manage Blogs",      href: "/admin/blogs",        icon: FileText,        roles: ["admin", "content_manager"] },
  { label: "Inspections",       href: "/admin/inspections",  icon: ShieldCheck,     roles: ["admin", "inspection_manager", "seller"] },
  { label: "Inquiries",         href: "/admin/inquiries",    icon: MessageSquare,   roles: ["admin", "inspection_manager", "seller"] },
  { label: "Registrations",     href: "/admin/registrations",icon: UserPlus,        roles: ["admin"] },
  { label: "Manage Users",      href: "/admin/users",        icon: Users,           roles: ["admin"] },
  { label: "Dealers",           href: "/admin/dealers",      icon: Building2,       roles: ["admin"] },
  { label: "Site Settings",     href: "/admin/settings",     icon: Settings,        roles: ["admin"] },
  { label: "Profile Settings",  href: "/admin/settings/profile", icon: UserCog,    roles: ["admin", "content_manager", "inspection_manager", "seller", "buyer"] },
];

const ROLE_LABELS: Record<string, string> = {
  admin: "Super Administrator",
  content_manager: "Content Manager",
  inspection_manager: "Inspection Manager",
  seller: "Verified Seller",
  buyer: "Registered Buyer",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [isAuthenticated,    setIsAuthenticated]    = useState(false);
  const [adminUser,          setAdminUser]          = useState<any>(null);
  const [profileOpen,        setProfileOpen]        = useState(false);
  const [sidebarOpen,        setSidebarOpen]        = useState(false);
  const [newRegistrationsCount, setNewRegistrationsCount] = useState(0);
  const { newListingsCount, newInquiriesCount, clearCounts } = useRealtimeNotifications();

  const userRole: string = adminUser?.role || '';
  const allowedMenus = menuItems.filter(m => m.roles.includes(userRole) || userRole === 'admin');

  const [showDelayedBtn, setShowDelayedBtn] = useState(false);
  const sessionCheckedRef = useRef(false);

  useEffect(() => {
    if (pathname === "/admin/login" || pathname === "/login") return;

    if (sessionCheckedRef.current) return;
    sessionCheckedRef.current = true;

    // Show manual fallback button after 3s if still verifying
    const btnTimer = setTimeout(() => setShowDelayedBtn(true), 3000);

    async function initAdmin() {
      try {
        const res = await getAdminInitialData();

        if (!res || !res.profile) {
          window.location.href = "/login";
          return;
        }

        if (res.suspended || (res.profile as any).isSuspended || res.profile.status === 'suspended') {
          await logoutAdmin();
          window.location.href = "/login?error=suspended";
          return;
        }

        const ADMIN_ALLOWED_ROLES = ['admin', 'content_manager', 'inspection_manager'];
        if (!ADMIN_ALLOWED_ROLES.includes(res.profile.role)) {
          if (res.profile.role === 'seller') {
            window.location.href = '/seller/dashboard';
          } else {
            window.location.href = '/';
          }
          return;
        }

        setAdminUser(res.profile);
        setIsAuthenticated(true);
        setNewRegistrationsCount(res.pendingRegistrations);
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

    initAdmin();

    return () => {
      clearTimeout(btnTimer);
    };
  }, [pathname]);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    try {
      await logoutAdmin();
    } catch {}
    setAdminUser(null);
    setIsAuthenticated(false);
    window.location.href = "/login";
  };

  if (pathname === "/admin/login" || pathname === "/login") return <>{children}</>;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 rounded-full border-3 border-[#0055FE] border-t-transparent animate-spin" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Verifying Admin Session…
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
          <div className="w-10 h-10 rounded-2xl bg-[#0055FE] flex items-center justify-center text-white shadow-md shadow-blue-500/20 flex-shrink-0">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-extrabold text-slate-900 leading-none">
              Car<span className="text-[#0055FE]">Fever</span>
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mt-1">
              Admin Console
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {allowedMenus.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const isRegistrationsItem = item.href === "/admin/registrations";
            const isCarsItem = item.href === "/admin/cars";
            const isInquiriesItem = item.href === "/admin/inquiries";
            const count = isRegistrationsItem
              ? newRegistrationsCount
              : isCarsItem
              ? newListingsCount
              : isInquiriesItem
              ? newInquiriesCount
              : 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={() => {
                  if (isCarsItem || isInquiriesItem) clearCounts();
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  active
                    ? "bg-blue-50/80 text-[#0055FE] border-l-4 border-[#0055FE] shadow-xs"
                    : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-[#0055FE]" : "text-slate-400"}`} />
                <span>{item.label}</span>
                {count > 0 && (
                  <span className="ml-auto bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Profile & Logout Section */}
        <div className="p-4 border-t border-slate-100 space-y-1">
          <Link
            href="/admin/settings/profile"
            prefetch={false}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 transition-all"
          >
            <UserCog className="w-4 h-4 text-slate-400" />
            <span>Profile Settings</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── MOBILE SIDEBAR DRAWER ── */}
      {sidebarOpen && (
        <aside className="fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-slate-200 flex flex-col z-50 lg:hidden shadow-2xl">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="text-base font-extrabold text-slate-900">
              Car<span className="text-[#0055FE]">Fever</span> Admin
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-xl text-slate-400 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {allowedMenus.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              const isRegistrationsItem = item.href === "/admin/registrations";
              const isCarsItem = item.href === "/admin/cars";
              const isInquiriesItem = item.href === "/admin/inquiries";
              const count = isRegistrationsItem
                ? newRegistrationsCount
                : isCarsItem
                ? newListingsCount
                : isInquiriesItem
                ? newInquiriesCount
                : 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  onClick={() => {
                    setSidebarOpen(false);
                    if (isRegistrationsItem || isCarsItem || isInquiriesItem) clearCounts();
                  }}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    active
                      ? "bg-blue-50 text-[#0055FE] border-l-4 border-[#0055FE]"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-[#0055FE]" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                  {count > 0 && (
                    <span className="ml-auto bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>
      )}

      {/* ── MAIN CONTENT WRAPPER ── */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">

        {/* TOPBAR HEADER */}
        <header className="h-16 border-b border-slate-200 px-6 lg:px-10 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">

          {/* Left: Mobile Toggle & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Admin / <span className="text-slate-900">{breadcrumb}</span>
            </div>
          </div>

          {/* Right Toolbar Actions */}
          <div className="flex items-center gap-3">

            {/* View Main Site */}
            <Link
              href="/"
              target="_blank"
              prefetch={false}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-[#0055FE]" />
              <span>Main Site</span>
            </Link>

            {/* Quick Action: Add Car */}
            <Link
              href="/admin/cars"
              prefetch={false}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0055FE] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Car</span>
            </Link>

            {/* Quick Action: New Blog */}
            <Link
              href="/admin/blogs"
              prefetch={false}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>New Blog</span>
            </Link>

            <div className="w-px h-6 bg-slate-200" />

            {/* Notifications */}
            <button
              onClick={() => clearCounts()}
              className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {(newListingsCount + newInquiriesCount) > 0 && (
                <span className="absolute top-1 right-1 bg-rose-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                  {newListingsCount + newInquiriesCount}
                </span>
              )}
            </button>

            <div className="w-px h-6 bg-slate-200" />

            {/* User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2.5 p-1.5 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0055FE] to-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                  {adminUser?.name?.[0]?.toUpperCase() || "A"}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-none">
                    {adminUser?.name || "Admin"}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold mt-1">
                    {ROLE_LABELS[userRole] || userRole}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <>
                  <div
                    onClick={() => setProfileOpen(false)}
                    className="fixed inset-0 z-30"
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-4 border-b border-slate-100">
                      <div className="text-xs font-bold text-slate-900">
                        {adminUser?.name || "Admin"}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {adminUser?.email || ""}
                      </div>
                      <div className="text-[10px] font-bold text-[#0055FE] uppercase tracking-wider mt-1.5">
                        {ROLE_LABELS[userRole] || userRole}
                      </div>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      <Link
                        href="/admin/settings/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        <UserCog className="w-4 h-4 text-slate-400" />
                        <span>Profile Settings</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </header>

        {/* MAIN PAGE VIEW */}
        <main className="flex-1 p-6 lg:p-10 max-w-7xl w-full mx-auto">
          {children}
        </main>

      </div>
    </div>
  );
}
