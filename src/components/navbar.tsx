"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatedLogo } from "@/components/ui/animated-logo";
import {
  Car,
  Menu,
  X,
  ChevronDown,
  Heart,
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  Lock,
  LogOut,
  AlertCircle,
  CheckCircle2,
  User as UserIcon,
  LayoutDashboard,
  ShieldCheck,
  MessageSquare,
  FileText,
  Briefcase,
  Building2,
  UserCog,
  Search,
  Clock,
  HelpCircle,
  Loader2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { checkRegistrationStatus, type AllowedRegistrationRole } from "@/lib/registration-actions";
import { getCurrentUserProfileAction } from "@/lib/server-actions";

interface NavLink {
  label: string;
  href: string;
  children?: { label: string; href: string; }[];
}

const navLinks = [
  { label: "Buy Cars", href: "/buy-car" },
  { label: "Sell Car", href: "/sell-car" },
  { label: "Certified Dealers", href: "/dealers" },
  { label: "Blog", href: "/blog" },
  { label: "Careers", href: "/jobs" },
  { label: "About Us", href: "/about" },
];



interface DbUser {
  name: string;
  email: string;
  role: string;
}

const ROLE_BASED_LINKS: Record<string, { label: string; href: string; icon: React.ComponentType<any> }[]> = {
  admin: [
    { label: "Admin Portal", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Manage Cars", href: "/admin/cars", icon: Car },
    { label: "Users & Dealers", href: "/admin/users", icon: UserCog },
    { label: "Profile Settings", href: "/admin/settings/profile", icon: UserCog },
  ],
  buyer: [
    { label: "Profile Settings", href: "/admin/settings/profile", icon: UserCog },
  ],
  seller: [
    { label: "Seller Console", href: "/seller/dashboard", icon: LayoutDashboard },
    { label: "My Car Listings", href: "/seller/cars", icon: Car },
    { label: "Post New Car", href: "/seller/sell-car", icon: Plus },
    { label: "Profile Settings", href: "/seller/settings/profile", icon: UserCog },
  ],
};

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  admin: { label: "Super Admin", color: "#0055FE" },
  buyer: { label: "Buyer Account", color: "#8B5CF6" },
  seller: { label: "Verified Dealer", color: "#EC4899" },
};

function getWishlistCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    return JSON.parse(localStorage.getItem("cf_wishlist_ids") || "[]").length;
  } catch {
    return 0;
  }
}

export function Navbar() {
  const router = useRouter();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [registerMenuOpen, setRegisterMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [authModal, setAuthModal] = useState<"login" | "signup" | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);

  const [authData, setAuthData] = useState({ name: "", email: "", password: "", role: "buyer" as AllowedRegistrationRole, message: "" });
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [authErrors, setAuthErrors] = useState<{ name?: string; email?: string; password?: string; general?: string }>({});
  const [authLoading, setAuthLoading] = useState(false);

  // Status Modal State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusEmail, setStatusEmail] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<{
    found: boolean;
    status?: 'pending' | 'approved' | 'rejected';
    role?: string;
    createdAt?: string;
    reviewedAt?: string | null;
    adminNotes?: string | null;
  } | null>(null);
  const [statusError, setStatusError] = useState("");

  const handleStatusCheckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusError("");
    setStatusResult(null);

    if (!statusEmail.trim()) {
      setStatusError("Please enter your email address.");
      return;
    }

    setStatusLoading(true);
    try {
      const res = await checkRegistrationStatus(statusEmail);
      if (res.success && res.found !== undefined) {
        setStatusResult({
          found: res.found,
          status: res.status,
          role: res.role,
          createdAt: res.createdAt,
          reviewedAt: res.reviewedAt,
          adminNotes: res.adminNotes,
        });
      } else {
        setStatusError(res.error || "Failed to check request status.");
      }
    } catch {
      setStatusError("An unexpected error occurred.");
    } finally {
      setStatusLoading(false);
    }
  };

  const [wishlistCount, setWishlistCount] = useState(0);

  const userRole: string = dbUser?.role || supabaseUser?.role || "";
  const isLoggedIn = !!supabaseUser;
  const roleLinks = ROLE_BASED_LINKS[userRole] || [];
  const roleBadge = ROLE_BADGE[userRole];

  const fetchedUserIdRef = useRef<string | null>(null);

  const fetchDbUser = useCallback(async (authUser: User) => {
    if (fetchedUserIdRef.current === authUser.id) return;
    fetchedUserIdRef.current = authUser.id;
    try {
      const profile = await getCurrentUserProfileAction();
      if (profile) {
        setDbUser({ name: profile.name, email: profile.email, role: profile.role } as any);
      }
    } catch {
      // User record may not exist yet
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        fetchDbUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session?.user) {
        setSupabaseUser(session.user);
        fetchDbUser(session.user);
      } else {
        fetchedUserIdRef.current = null;
        setSupabaseUser(null);
        setDbUser(null);
      }
    });

    setWishlistCount(getWishlistCount());
    const handleWishlistUpdate = () => setWishlistCount(getWishlistCount());
    window.addEventListener("wishlist-updated", handleWishlistUpdate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("wishlist-updated", handleWishlistUpdate);
    };
  }, [fetchDbUser]);

  const currentUserName = dbUser?.name || supabaseUser?.user_metadata?.name || supabaseUser?.email?.split("@")[0] || "User";

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: typeof authErrors = {};

    if (authModal === "signup") {
      if (!authData.name.trim()) {
        errors.name = "Please enter your full name.";
      }
      if (!authData.role) {
        errors.general = "Please select a role.";
      }
    }
    if (!authData.email.trim()) {
      errors.email = "Email address is required.";
    } else if (!validateEmail(authData.email)) {
      errors.email = "Please enter a valid email address.";
    }
    if (authModal === "login") {
      if (!authData.password) {
        errors.password = "Password is required.";
      } else if (authData.password.length < 6) {
        errors.password = "Password must be at least 6 characters.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setAuthErrors(errors);
      return;
    }

    setAuthLoading(true);
    const supabase = createClient();

    try {
      if (authModal === "signup") {
        const { submitRegistrationRequest } = await import("@/lib/registration-actions");
        const result = await submitRegistrationRequest({
          name: authData.name.trim(),
          email: authData.email.toLowerCase().trim(),
          phone: "",
          role: authData.role,
          message: authData.message.trim() || undefined,
        });

        if (!result.success) {
          setAuthErrors({ general: result.error || "Failed to submit request" });
          return;
        }

        setRegistrationSuccess(true);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: authData.email.trim(),
          password: authData.password,
        });

        if (signInError) {
          setAuthErrors({ general: signInError.message });
          return;
        }

        setAuthModal(null);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setSupabaseUser(null);
    setDbUser(null);
    setProfileMenuOpen(false);
    router.push("/");
  };

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const navDropdownRef = useRef<HTMLDivElement>(null);
  const exploreRef = useRef<HTMLDivElement>(null);
  const registerMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (navDropdownRef.current && !navDropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
      if (exploreRef.current && !exploreRef.current.contains(event.target as Node)) {
        setExploreOpen(false);
      }
      if (registerMenuRef.current && !registerMenuRef.current.contains(event.target as Node)) {
        setRegisterMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openAuth = (type: "login" | "signup") => {
    setAuthModal(type);
    setAuthErrors({});
    setAuthData({ name: "", email: "", password: "", role: "buyer", message: "" });
    setRegistrationSuccess(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">

            {/* Logo */}
            <AnimatedLogo size="md" subtitle="Marketplace" href="/" />

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              <Link
                href="/buy-car"
                className="px-4 py-2 text-sm font-bold text-gray-700 hover:text-[#0055FE] rounded-xl hover:bg-blue-50/80 transition-all duration-200"
              >
                Buy Cars
              </Link>
              <Link
                href="/sell-car"
                className="px-4 py-2 text-sm font-bold text-gray-700 hover:text-[#0055FE] rounded-xl hover:bg-blue-50/80 transition-all duration-200"
              >
                Sell Car
              </Link>

              {/* Explore Dropdown */}
              <div ref={exploreRef} className="relative">
                <button
                  onClick={() => setExploreOpen((v) => !v)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-gray-700 hover:text-[#0055FE] rounded-xl hover:bg-blue-50/80 transition-all duration-200 cursor-pointer"
                >
                  <span>Explore</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${exploreOpen ? "rotate-180 text-[#0055FE]" : "text-gray-400"}`} />
                </button>

                {exploreOpen && (
                  <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-[60] animate-in fade-in zoom-in-95 duration-150">
                    <Link
                      href="/dealers"
                      onClick={() => setExploreOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50/70 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0055FE] flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 group-hover:text-[#0055FE] transition-colors">Certified Dealers</p>
                        <p className="text-[10px] text-gray-400 font-medium">Explore verified UK dealerships</p>
                      </div>
                    </Link>

                    <Link
                      href="/blog"
                      onClick={() => setExploreOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50/70 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 group-hover:text-purple-600 transition-colors">Blog & Journal</p>
                        <p className="text-[10px] text-gray-400 font-medium">Reviews, buying guides & news</p>
                      </div>
                    </Link>

                    <Link
                      href="/jobs"
                      onClick={() => setExploreOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50/70 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">Careers & Jobs</p>
                        <p className="text-[10px] text-gray-400 font-medium">Join the CarFever UK team</p>
                      </div>
                    </Link>

                    <Link
                      href="/about"
                      onClick={() => setExploreOpen(false)}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50/70 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 group-hover:text-slate-900 transition-colors">About Us</p>
                        <p className="text-[10px] text-gray-400 font-medium">Our mission, team & HQ</p>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="relative p-2.5 rounded-lg text-gray-500 hover:text-[#0055FE] hover:bg-blue-50 transition-all duration-200 hidden sm:block"
                title="Wishlist"
              >
                <Heart className="w-[18px] h-[18px]" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#0055FE] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Check Status */}
              <button
                onClick={() => { setStatusModalOpen(true); setStatusResult(null); setStatusError(""); }}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#0055FE] bg-gray-100 hover:bg-blue-50 px-3 py-2 rounded-xl transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <span>Check Status</span>
              </button>

              {isLoggedIn ? (
                /* ── Logged In: Profile Dropdown ── */
                <div ref={profileMenuRef} className="relative">
                  <button
                    onClick={() => setProfileMenuOpen((v) => !v)}
                    className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-gray-100 transition-all duration-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0055FE] to-[#00B67A] flex items-center justify-center text-white text-xs font-bold">
                      {currentUserName.charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${profileMenuOpen ? "rotate-180 text-[#0055FE]" : "text-gray-400"}`} />
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        {/* User info */}
                        <div className="p-4 border-b border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0055FE] to-[#00B67A] flex items-center justify-center text-white text-sm font-bold">
                              {currentUserName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">{currentUserName}</p>
                              <p className="text-xs text-gray-500 truncate">{supabaseUser?.email}</p>
                            </div>
                          </div>
                          {roleBadge && (
                            <div className="mt-2">
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                style={{ background: `${roleBadge.color}15`, color: roleBadge.color }}>
                                {roleBadge.label}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Role-based links */}
                        {roleLinks.length > 0 && (
                          <div className="py-1">
                            {roleLinks.map(link => {
                              const Icon = link.icon;
                              return (
                                <Link
                                  key={link.href}
                                  href={link.href}
                                  onClick={() => setProfileMenuOpen(false)}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <Icon className="w-4 h-4 text-gray-400" />
                                  {link.label}
                                </Link>
                              );
                            })}
                          </div>
                        )}

                        {/* Logout */}
                        <div className="border-t border-gray-100 py-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                  )}
                </div>
              ) : (
                /* ── Not Logged In: Streamlined Auth Buttons ── */
                <div className="hidden sm:flex items-center gap-2">
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-700 hover:text-[#0055FE] hover:bg-blue-50 font-bold text-xs rounded-xl"
                    >
                      Login
                    </Button>
                  </Link>

                  {/* Register Dropdown */}
                  <div ref={registerMenuRef} className="relative">
                    <button
                      onClick={() => setRegisterMenuOpen((v) => !v)}
                      className="px-4 py-2 bg-[#0055FE] hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                    >
                      <span>Join Platform</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${registerMenuOpen ? "rotate-180" : ""}`} />
                    </button>

                    {registerMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-[60] animate-in fade-in zoom-in-95 duration-150">
                        <Link
                          href="/register/buyer"
                          onClick={() => setRegisterMenuOpen(false)}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-blue-50 transition-colors text-xs font-bold text-slate-800 group"
                        >
                          <UserIcon className="w-4 h-4 text-[#0055FE]" />
                          <div className="flex flex-col">
                            <span>Register Buyer</span>
                            <span className="text-[10px] text-slate-400 font-medium">Create buyer account</span>
                          </div>
                        </Link>
                        <Link
                          href="/register/seller"
                          onClick={() => setRegisterMenuOpen(false)}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-purple-50 transition-colors text-xs font-bold text-purple-700 group border-t border-slate-100 mt-1 pt-2"
                        >
                          <Building2 className="w-4 h-4 text-purple-600" />
                          <div className="flex flex-col">
                            <span>Become a Dealer</span>
                            <span className="text-[10px] text-purple-400 font-medium">Verify dealership account</span>
                          </div>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <div className="lg:hidden flex items-center gap-1">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger className="p-2 rounded-lg text-gray-500 hover:text-gray-900 transition-all duration-200">
                    <Menu className="w-5 h-5" />
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                          <div className="w-8 h-8 rounded-lg bg-[#0055FE] flex items-center justify-center">
                            <Car className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-base font-bold text-gray-900">
                            Car<span className="text-[#0055FE]">Fever</span>
                          </span>
                        </Link>
                        <SheetClose className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                          <X className="w-5 h-5" />
                        </SheetClose>
                      </div>

                      <nav className="flex-1 overflow-y-auto py-2">
                        {navLinks.map((link) => (
                          <div key={link.label} className="border-b border-gray-100">
                            <Link
                              href={link.href}
                              className="flex items-center px-5 py-3.5 text-gray-900 hover:text-[#0055FE] text-sm font-bold hover:bg-blue-50/60 transition-colors"
                              onClick={() => setMobileOpen(false)}
                            >
                              {link.label}
                            </Link>
                          </div>
                        ))}

                        {/* Mobile role links */}
                        {isLoggedIn && roleLinks.length > 0 && (
                          <>
                            <div className="px-5 pt-4 pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              {roleBadge ? roleBadge.label : "Account"}
                            </div>
                            {roleLinks.map(link => {
                              const Icon = link.icon;
                              return (
                                <Link key={link.href} href={link.href}
                                  className="flex items-center gap-3 px-5 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all text-sm font-medium"
                                  onClick={() => setMobileOpen(false)}>
                                  <Icon className="w-4 h-4 text-gray-400" />
                                  {link.label}
                                </Link>
                              );
                            })}
                          </>
                        )}
                      </nav>

                      <div className="p-4 border-t border-gray-100 space-y-2.5">
                        {isLoggedIn ? (
                          <>
                            <div className="flex items-center gap-2.5 px-1 py-1.5">
                              <div className="w-8 h-8 rounded-full bg-[#0055FE] flex items-center justify-center text-white text-xs font-bold">
                                {currentUserName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{currentUserName}</p>
                                <p className="text-xs text-gray-500 truncate">{supabaseUser?.email}</p>
                              </div>
                            </div>
                            <Button variant="outline" className="w-full h-11 border-gray-200 text-[#0055FE] hover:bg-blue-50 gap-2 text-sm" onClick={() => { setMobileOpen(false); handleLogout(); }}>
                              <LogOut className="w-4 h-4" /> Log Out
                            </Button>
                          </>
                        ) : (
                          <>
                            <Link
                              href="/register/buyer"
                              className="block w-full text-center py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all"
                              onClick={() => setMobileOpen(false)}
                            >
                              Register as Buyer
                            </Link>
                            <Link
                              href="/register/seller"
                              className="block w-full text-center py-2.5 rounded-xl bg-[#0055FE] text-white hover:bg-blue-700 text-xs font-bold transition-all shadow-md shadow-blue-500/20"
                              onClick={() => setMobileOpen(false)}
                            >
                              Become a Dealer
                            </Link>

                            <Link
                              href="/login"
                              className="block w-full text-center py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all"
                              onClick={() => setMobileOpen(false)}
                            >
                              Login
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>

      </header>



      {/* ── CHECK REQUEST STATUS MODAL ── */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setStatusModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 fade-in duration-200">
            <button onClick={() => setStatusModalOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6 text-[#0055FE]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Check Request Status</h2>
              <p className="text-gray-500 text-xs mt-1">Enter the email address you used when requesting access</p>
            </div>

            <form onSubmit={handleStatusCheckSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={statusEmail}
                    onChange={e => setStatusEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0055FE] transition-all text-sm"
                  />
                </div>
              </div>

              {statusError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{statusError}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={statusLoading}
                className="w-full bg-[#0055FE] hover:bg-blue-700 text-white font-bold h-11 transition-colors"
              >
                {statusLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Checking...
                  </span>
                ) : (
                  <>Check Status <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </form>

            {/* Result display */}
            {statusResult && (
              <div className="mt-6 pt-6 border-t border-gray-100 animate-in fade-in duration-300">
                {!statusResult.found ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
                    <HelpCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-900">No Request Found</p>
                    <p className="text-xs text-gray-500 mt-1">We couldn&apos;t find any registration request or account associated with this email address.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Status Banner */}
                    {statusResult.status === 'pending' && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-1">
                          <Clock className="w-4 h-4 text-amber-600" /> Pending Admin Review
                        </div>
                        <p className="text-xs text-amber-700">Your application has been received and is waiting for administrator approval.</p>
                      </div>
                    )}
                    {statusResult.status === 'approved' && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Request Approved!
                        </div>
                        <p className="text-xs text-emerald-700">Your account is active. You can log in using your registered credentials.</p>
                      </div>
                    )}
                    {statusResult.status === 'rejected' && (
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-red-800 font-bold text-sm mb-1">
                          <AlertCircle className="w-4 h-4 text-red-600" /> Request Rejected
                        </div>
                        <p className="text-xs text-red-700">Your application was not approved.</p>
                        {statusResult.adminNotes && (
                          <div className="mt-2 pt-2 border-t border-red-200/60 text-xs text-red-800 font-mono">
                            Admin Note: &quot;{statusResult.adminNotes}&quot;
                          </div>
                        )}
                      </div>
                    )}

                    {/* Metadata details */}
                    <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1.5 text-gray-600">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Role Applied:</span>
                        <span className="font-semibold text-gray-800 capitalize">{statusResult.role?.replace('_', ' ')}</span>
                      </div>
                      {statusResult.createdAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Submitted:</span>
                          <span className="text-gray-700">{new Date(statusResult.createdAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backdrop for panels */}
      {profileMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => { setProfileMenuOpen(false); setOpenDropdown(null); }} />
      )}
    </>
  );
}
