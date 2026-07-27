"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatedLogo } from "@/components/ui/animated-logo";
import {
  Car,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Zap,
  TrendingUp,
  ChevronLeft,
  UserPlus,
  UserX,
  Clock,
  KeyRound,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";

import { loginAdmin, checkAuthSession } from "@/lib/admin-actions";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    router.prefetch("/admin/dashboard");

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const errParam = params.get("error");
      if (errParam === "rate_limited") {
        setError("Too many requests. Please wait a moment before trying again.");
      } else if (errParam === "unauthorized") {
        setError("Please sign in to continue to your account.");
      } else if (errParam === "suspended" || errParam === "blocked") {
        setError("BLOCKED: Your account has been blocked by an administrator. Please contact support for assistance.");
      }
    }

    async function checkSession() {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("error")) {
          setChecking(false);
          return;
        }
      }

      try {
        const profile = await checkAuthSession();
        if (profile && !(profile as any).isSuspended && profile.status !== "suspended") {
          const role = profile.role;
          if (role === "buyer") {
            window.location.href = "/";
            return;
          } else if (role === "seller") {
            window.location.href = "/seller/dashboard";
            return;
          } else {
            window.location.href = "/admin/dashboard";
            return;
          }
        }
      } catch {
        // Continue to login page UI
      }
      setChecking(false);
    }
    checkSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await loginAdmin(email.trim(), password);

      if (result.success && result.user) {
        if (result.user.role === "buyer") {
          window.location.href = "/";
        } else if (result.user.role === "seller") {
          window.location.href = "/seller/dashboard";
        } else {
          window.location.href = "/admin/dashboard";
        }
        return;
      }

      // Handle non-throwing error returns (e.g. suspended, no_profile)
      if (!result.success) {
        const errType = (result as any).errorType;
        const errMsg = (result as any).error || "Login failed. Please try again.";
        if (errType === "suspended") {
          setError("BLOCKED: " + errMsg);
        } else {
          setError(errMsg);
        }
        setLoading(false);
      }
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("Failed to fetch") || msg.includes("fetch failed")) {
        setError("Network connection issue. Please check your internet connection or reload the page.");
      } else if (msg.toLowerCase().includes("suspended") || msg.toLowerCase().includes("blocked")) {
        setError("BLOCKED: " + msg);
      } else {
        setError(msg || "Invalid email or password. Please try again.");
      }
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-[#0055FE] border-t-transparent animate-spin" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Initializing Portal…
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans text-slate-900">
      
      {/* ── LEFT PANEL: BRANDING & HERO SHOWCASE ── */}
      <div className="lg:w-1/2 bg-gradient-to-br from-[#0043cb] via-[#0055FE] to-[#0080ff] relative overflow-hidden p-8 sm:p-12 lg:p-16 flex flex-col justify-between text-white min-h-[400px] lg:min-h-screen">
        {/* Background Decorative Circles & Glass Orbs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
        
        {/* Top Header Logo */}
        <div className="relative z-10">
          <AnimatedLogo variant="dark" size="lg" subtitle="Official Portal" href="/" />
        </div>

        {/* Center Hero Content */}
        <div className="relative z-10 my-auto py-12 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold mb-6">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Unified User & Management Portal</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4">
            Welcome to <br />
            CarFever Marketplace
          </h1>

          <p className="text-base text-blue-100/90 leading-relaxed mb-8">
            Access your account services, manage vehicle listings, request inspections, and oversee marketplace activities.
          </p>

          {/* Feature Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-start gap-3">
              <Zap className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Instant Access</h4>
                <p className="text-[11px] text-blue-100/80 mt-0.5">Real-time session authorization and instant panel syncing.</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Marketplace Services</h4>
                <p className="text-[11px] text-blue-100/80 mt-0.5">Manage cars, inquiries, inspections, and platform accounts.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-blue-200/80 flex items-center justify-between pt-6 border-t border-white/10">
          <span>&copy; {new Date().getFullYear()} CarFever Inc. All rights reserved.</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            System Operational
          </span>
        </div>
      </div>

      {/* ── RIGHT PANEL: LOGIN FORM ── */}
      <div className="lg:w-1/2 bg-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between">
        
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Marketplace
          </Link>

          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0055FE] hover:underline"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Request Access
          </Link>
        </div>

        {/* Center Form Container */}
        <div className="max-w-md w-full mx-auto my-auto py-6">
          
          {/* Form Header */}
          <div className="mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0055FE] mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign In to CarFever
            </h2>
            <p className="text-sm text-slate-500 mt-1.5">
              Enter your credentials to access your account.
            </p>
          </div>

          {/* Error / Blocked / No Account / Incorrect Password Banner */}
          {error && (
            error.startsWith("BLOCKED:") ? (
              <div className="flex items-start gap-3 bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="w-8 h-8 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-rose-700 uppercase tracking-wider mb-0.5">Account Blocked</p>
                  <p className="text-xs text-rose-600 font-medium">{error.replace("BLOCKED: ", "")}</p>
                  <p className="text-[11px] text-rose-500 mt-1">Contact us at <span className="font-bold">info@carfever.uk</span></p>
                </div>
              </div>
            ) : error.startsWith("NO_ACCOUNT:") ? (
              <div className="flex items-start gap-3 bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                  <UserX className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-amber-800 uppercase tracking-wider mb-0.5">Account Not Found</p>
                  <p className="text-xs text-amber-700 font-medium">{error.replace("NO_ACCOUNT: ", "")}</p>
                  <div className="mt-2.5">
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Register New Account</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : error.startsWith("INCORRECT_PASSWORD:") ? (
              <div className="flex items-start gap-3 bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="w-8 h-8 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-rose-700 uppercase tracking-wider mb-0.5">Incorrect Password</p>
                  <p className="text-xs text-rose-600 font-medium">{error.replace("INCORRECT_PASSWORD: ", "")}</p>
                </div>
              </div>
            ) : error.startsWith("PENDING:") ? (
              <div className="flex items-start gap-3 bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="w-8 h-8 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-[#0055FE]" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-[#0055FE] uppercase tracking-wider mb-0.5">Application Pending Review</p>
                  <p className="text-xs text-blue-700 font-medium">{error.replace("PENDING: ", "")}</p>
                </div>
              </div>
            ) : error.startsWith("REJECTED:") ? (
              <div className="flex items-start gap-3 bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="w-8 h-8 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
                  <XCircle className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-rose-700 uppercase tracking-wider mb-0.5">Application Rejected</p>
                  <p className="text-xs text-rose-600 font-medium">{error.replace("REJECTED: ", "")}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6 text-xs text-rose-700 animate-in fade-in slide-in-from-top-2 duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )
          )}


          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoComplete="email"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0055FE] focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0055FE] focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember & Forgot options */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 rounded border-slate-300 text-[#0055FE] focus:ring-[#0055FE]"
                />
                Keep me logged in
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#0055FE] hover:bg-blue-700 text-white font-bold rounded-2xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying Credentials…</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Bottom Help Note */}
        <div className="mt-8 text-center text-xs text-slate-400">
          Need assistance with your account?{" "}
          <Link href="/register" className="text-[#0055FE] font-bold hover:underline">
            Submit a Registration Request
          </Link>
        </div>

      </div>

    </div>
  );
}
