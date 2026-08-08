'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatedLogo } from '@/components/ui/animated-logo';
import {
  Car,
  Mail,
  UserIcon,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Phone,
  MessageSquare,
  ChevronLeft,
  ShieldCheck,
  Sparkles,
  Users,
  Building2,
  ShoppingCart,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { submitRegistrationRequest } from '@/lib/registration-actions';

interface RegistrationFormProps {
  initialRole: 'buyer' | 'seller';
}

export function RegistrationForm({ initialRole }: RegistrationFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role] = useState<'buyer' | 'seller'>(initialRole);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [autoApprovedInfo, setAutoApprovedInfo] = useState<{ email: string } | null>(null);

  const isSeller = role === 'seller';

  const validateForm = () => {
    const errors: typeof fieldErrors = {};

    if (!name.trim()) {
      errors.name = 'Full name is required';
    } else if (name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters';
    }

    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (phone.trim() && phone.trim().length < 7) {
      errors.phone = 'Please enter a valid phone number (min 7 digits)';
    }

    if (!isSeller) {
      if (!password) {
        errors.password = 'Password is required';
      } else if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters long';
      }

      if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await submitRegistrationRequest({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim() || undefined,
        role,
        message: message.trim() || undefined,
        password: !isSeller ? password : undefined,
      });

      if (result.success) {
        if (result.autoApproved) {
          setAutoApprovedInfo({ email: result.email || email });
        }
        setSuccess(true);
      } else {
        const msg = result.error || 'Failed to submit request';
        if (msg.includes('Failed to fetch') || msg.includes('fetch failed')) {
          setError('Network connection issue. Please check your connection and try again.');
        } else {
          setError(msg);
        }
      }
    } catch {
      setError('Network connection issue. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 sm:p-10 text-center border border-slate-100 animate-in zoom-in-95 fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
            {autoApprovedInfo ? 'Account Active' : 'Request Received'}
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-3 mb-2">
            {autoApprovedInfo ? 'Account Created & Active!' : 'Registration Submitted!'}
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            {autoApprovedInfo ? (
              <>Your <strong className="text-slate-900">Car Buyer</strong> account has been created and activated instantly. You can log in right now with your chosen password!</>
            ) : (
              <>Your application for a <strong className="text-slate-900">Dealership / Seller</strong> account has been sent to our administrator for review.</>
            )}
          </p>

          {autoApprovedInfo && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 text-left space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Your Account Details</p>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500">Email:</span>
                <span className="font-bold text-slate-900">{autoApprovedInfo.email}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500">Password:</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Set by you
                </span>
              </div>
            </div>
          )}

          {!autoApprovedInfo && (
            <p className="text-[11px] text-slate-400 mb-6">
              We review applications within 24 hours. Check your email for status updates.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5">
            {autoApprovedInfo ? (
              <Button onClick={() => router.push('/login')} className="w-full bg-[#0055FE] hover:bg-blue-700 text-white font-bold h-11 text-xs rounded-xl shadow-md shadow-blue-500/20">
                Sign In Now
              </Button>
            ) : (
              <>
                <Button onClick={() => router.push('/')} variant="outline" className="flex-1 border-slate-200 text-slate-700 font-bold h-11 text-xs rounded-xl">
                  Home Page
                </Button>
                <Button onClick={() => router.push('/buy-car')} className="flex-1 bg-[#0055FE] hover:bg-blue-700 text-white font-bold h-11 text-xs rounded-xl shadow-md shadow-blue-500/20">
                  Browse Cars
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-slate-50 flex flex-col lg:flex-row font-sans text-slate-900">

      {/* ── LEFT PANEL: COMPACT HERO SHOWCASE ── */}
      <div className={`lg:w-1/2 relative overflow-hidden p-6 sm:p-10 lg:p-12 flex flex-col justify-between text-white shrink-0 ${
        isSeller
          ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950'
          : 'bg-gradient-to-br from-[#0043cb] via-[#0055FE] to-[#0080ff]'
      }`}>
        {/* Background Orbs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-300/20 blur-3xl pointer-events-none" />

        {/* Top Logo */}
        <div className="relative z-10">
          <AnimatedLogo
            variant="dark"
            size="md"
            subtitle={isSeller ? 'Dealer Registration Desk' : 'Buyer Registration Desk'}
            href="/"
          />
        </div>

        {/* Center Hero Content */}
        <div className="relative z-10 my-auto py-6 sm:py-8 max-w-lg">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{isSeller ? 'Verified Dealer Network' : 'Car Buyer Registration'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight mb-3">
            {isSeller ? (
              <>Become a Verified <br /><span className="text-blue-300">Dealer</span></>
            ) : (
              <>Create Your <br /><span className="text-blue-200">Car Buyer Account</span></>
            )}
          </h1>

          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed mb-6">
            {isSeller
              ? 'List showroom inventory, connect with verified buyers, and grow your dealership sales across the UK.'
              : 'Browse certified vehicles, save wishlist cars, and connect directly with verified dealerships.'}
          </p>

          {/* Compact Feature Bullets */}
          <div className="space-y-2.5">
            {isSeller ? (
              <>
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-xs">
                    🏬
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Showroom Inventory</h4>
                    <p className="text-[11px] text-blue-100/80">Publish unlimited cars with photos & specs</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-xs">
                    🛡️
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Verified Dealer Badge</h4>
                    <p className="text-[11px] text-blue-100/80">Gain buyer trust with official verification</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-xs">
                    🚗
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Browse Certified Cars</h4>
                    <p className="text-[11px] text-blue-100/80">Search vehicles by make, budget & city</p>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center text-xs">
                    ❤️
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Wishlist & Alerts</h4>
                    <p className="text-[11px] text-blue-100/80">Save favorite cars and track price changes</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-[11px] text-blue-100/70">
          <span>© 2026 CarFever Inc.</span>
          <span className="flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" /> Verified Network
          </span>
        </div>
      </div>

      {/* ── RIGHT PANEL: COMPACT FORM ── */}
      <div className="lg:w-1/2 bg-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between items-center overflow-y-auto">
        <div className="w-full max-w-md my-auto">

          {/* Top Bar Link */}
          <div className="mb-4 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#0055FE] transition-colors group"
            >
              <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Home
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#0055FE] hover:underline"
            >
              Sign In Instead
            </Link>
          </div>

          {/* ── CROSS-LINK PROMPT TO SWITCH REGISTRATION PAGE ── */}
          <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0055FE] flex items-center justify-center shrink-0">
                {isSeller ? <ShoppingCart className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {isSeller ? 'Looking to buy cars?' : 'Want to sell vehicles?'}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {isSeller ? 'Open Buyer Registration' : 'Apply for Dealer account'}
                </p>
              </div>
            </div>

            <Link href={isSeller ? '/register/buyer' : '/register/seller'}>
              <Button size="sm" variant="outline" className="border-[#0055FE] text-[#0055FE] hover:bg-blue-50 font-bold text-[11px] h-8 px-3 rounded-lg shrink-0">
                {isSeller ? 'Buyer Account' : 'Become Seller'}
              </Button>
            </Link>
          </div>

          {/* Form Header */}
          <div className="mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0055FE] mb-2">
              {isSeller ? <Building2 className="w-5 h-5" /> : <Users className="w-5 h-5" />}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {isSeller ? 'Dealership / Seller Registration' : 'Car Buyer Registration'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your details to create your {isSeller ? 'Dealer' : 'Buyer'} account.
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 rounded-xl p-3 mb-4 text-xs text-rose-700 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            
            {/* Name */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Full Name / Dealership Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={e => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: undefined }));
                  }}
                  placeholder={isSeller ? "e.g. Metro Motors / Ali Ahmed" : "e.g. Ali Ahmed"}
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 transition-all ${
                    fieldErrors.name ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10 bg-rose-50/20' : 'border-slate-200 focus:border-[#0055FE] focus:ring-blue-500/10'
                  }`}
                />
              </div>
              {fieldErrors.name && (
                <p className="text-[10px] text-rose-600 font-medium mt-1">{fieldErrors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 transition-all ${
                    fieldErrors.email ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10 bg-rose-50/20' : 'border-slate-200 focus:border-[#0055FE] focus:ring-blue-500/10'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-[10px] text-rose-600 font-medium mt-1">{fieldErrors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => {
                    setPhone(e.target.value);
                    if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: undefined }));
                  }}
                  placeholder="e.g. 07911 123456"
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 transition-all ${
                    fieldErrors.phone ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10 bg-rose-50/20' : 'border-slate-200 focus:border-[#0055FE] focus:ring-blue-500/10'
                  }`}
                />
              </div>
              {fieldErrors.phone && (
                <p className="text-[10px] text-rose-600 font-medium mt-1">{fieldErrors.phone}</p>
              )}
            </div>

            {/* Password Fields for Buyers */}
            {!isSeller && (
              <>
                {/* Password */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                      }}
                      placeholder="At least 6 characters"
                      className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 transition-all ${
                        fieldErrors.password ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10 bg-rose-50/20' : 'border-slate-200 focus:border-[#0055FE] focus:ring-blue-500/10'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none p-0.5"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-[10px] text-rose-600 font-medium mt-1">{fieldErrors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => {
                        setConfirmPassword(e.target.value);
                        if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }));
                      }}
                      placeholder="Re-enter your password"
                      className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 transition-all ${
                        fieldErrors.confirmPassword ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10 bg-rose-50/20' : 'border-slate-200 focus:border-[#0055FE] focus:ring-blue-500/10'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none p-0.5"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-[10px] text-rose-600 font-medium mt-1">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              </>
            )}

            {/* Message */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Message / Business Info (Optional)
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <textarea
                  rows={2}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={isSeller ? "Dealership address, city, or business notes..." : "Additional notes..."}
                  className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0055FE] focus:ring-2 focus:ring-blue-500/10 transition-all resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#0055FE] hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 active:scale-[0.99] disabled:opacity-70 cursor-pointer mt-1"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting…
                </span>
              ) : (
                <>
                  <span>Create {isSeller ? 'Seller' : 'Buyer'} Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

          </form>

          {/* Bottom link */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
            Already registered?{' '}
            <Link href="/login" className="font-bold text-[#0055FE] hover:underline">
              Sign in to portal
            </Link>
          </div>

        </div>

        <div className="mt-4 text-center text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
          CarFever Registration — {isSeller ? 'Dealer Account' : 'Buyer Account'}
        </div>
      </div>

    </div>
  );
}

