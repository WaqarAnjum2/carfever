'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  UserCheck,
  UserX,
  Eye,
  Loader2,
  Users as UsersIcon,
  Phone,
  Mail,
  Calendar,
  ShieldCheck,
  FileText,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Lock,
  RefreshCw,
  Copy,
  Check,
  Building2,
  Car,
  MapPin,
  ExternalLink,
  CheckCircle2,
  XCircle,
  UserPlus,
  Trash2,
  Key,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  updateUserStatus,
  updateUserRole,
  fetchAllUsers,
  getAdminProfile,
  resetUserPassword,
  fetchUserDetailWithCars,
  approveCar,
  rejectCar,
} from '@/lib/admin-actions';
import {
  approveRegistrationRequest,
  rejectRegistrationRequest,
  deleteRegistrationRequest,
  fetchRegistrationRequests,
} from '@/lib/registration-actions';
import type { DbUser, UserStatus, UserRole, DbRegistrationRequest } from '@/lib/supabase/types';

const STATUS_STYLE: Record<UserStatus, string> = {
  active:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  suspended: 'bg-rose-50 text-rose-700 border-rose-200',
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
};

const ROLE_STYLE: Record<UserRole, string> = {
  buyer:  'bg-blue-50 text-blue-700 border-blue-200',
  seller: 'bg-purple-50 text-purple-700 border-purple-200',
  admin:  'bg-rose-50 text-rose-700 border-rose-200',
};

const ROLE_LABEL: Record<UserRole, string> = {
  buyer:  'Buyer',
  seller: 'Dealer / Seller',
  admin:  'Admin',
};

function getInitial(name: string): string {
  return (name?.trim()?.[0] ?? '?').toUpperCase();
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function generateRandomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  let pass = '';
  for (let i = 0; i < 10; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass + '1!';
}

/* ─────────────────────────────────────────────────────────────
   User Profile & Vehicles Modal
───────────────────────────────────────────────────────────── */
function ProfileModal({
  user,
  onClose,
}: {
  user: DbUser;
  onClose: () => void;
}) {
  const [detailData, setDetailData] = useState<{ user: DbUser; dealer: any; cars: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'cars'>('info');
  const [actionCarId, setActionCarId] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    async function loadDetails() {
      try {
        const data = await fetchUserDetailWithCars(user.id);
        setDetailData(data);
        if (data.cars && data.cars.length > 0 && user.role === 'seller') {
          setActiveTab('cars');
        }
      } catch (err: any) {
        toast.error(`Failed to load details: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, [user.id, user.role]);

  const handleApproveCar = async (carId: string) => {
    setActionCarId(carId);
    try {
      await approveCar(carId);
      toast.success('Vehicle listing approved');
      setDetailData(prev => prev ? {
        ...prev,
        cars: prev.cars.map(c => c.id === carId ? { ...c, status: 'approved' } : c)
      } : null);
    } catch {
      toast.error('Failed to approve listing');
    } finally {
      setActionCarId(null);
    }
  };

  const handleRejectCar = async (carId: string) => {
    setActionCarId(carId);
    try {
      await rejectCar(carId);
      toast.success('Vehicle listing rejected');
      setDetailData(prev => prev ? {
        ...prev,
        cars: prev.cars.map(c => c.id === carId ? { ...c, status: 'rejected' } : c)
      } : null);
    } catch {
      toast.error('Failed to reject listing');
    } finally {
      setActionCarId(null);
    }
  };

  const rows = [
    { label: 'Email',          icon: <Mail className="w-3.5 h-3.5" />,      value: user.email },
    { label: 'Phone',          icon: <Phone className="w-3.5 h-3.5" />,     value: user.phone ?? '—' },
    { label: 'Role',           icon: <ShieldCheck className="w-3.5 h-3.5"/>,value: (
        <Badge className={`text-[10px] font-bold px-2 py-0.5 uppercase border ${ROLE_STYLE[user.role]}`}>
          {ROLE_LABEL[user.role]}
        </Badge>
      )},
    { label: 'Status',         icon: <Clock className="w-3.5 h-3.5" />,     value: (
        <Badge className={`text-[10px] font-bold px-2 py-0.5 uppercase border ${STATUS_STYLE[user.status]}`}>
          {user.status}
        </Badge>
      )},
    { label: 'Cars Listed',    icon: <FileText className="w-3.5 h-3.5" />,  value: detailData?.cars?.length ?? user.listings_count },
    { label: 'Last Login',     icon: <Clock className="w-3.5 h-3.5" />,     value: formatDateTime(user.last_login) },
    { label: 'Member Since',   icon: <Calendar className="w-3.5 h-3.5" />,  value: formatDate(user.created_at) },
  ];

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" />
      <div
        className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0055FE] to-emerald-500 flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-md">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="w-full h-full rounded-2xl object-cover" />
              ) : (
                getInitial(user.name)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-slate-900">{user.name}</h3>
                <Badge className={`text-[10px] font-bold px-2 py-0.5 uppercase border ${ROLE_STYLE[user.role]}`}>
                  {ROLE_LABEL[user.role]}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-100 px-6 bg-white">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'info'
                ? 'border-[#0055FE] text-[#0055FE]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Account Details</span>
          </button>
          <button
            onClick={() => setActiveTab('cars')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'cars'
                ? 'border-[#0055FE] text-[#0055FE]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Listed Vehicles ({detailData?.cars?.length ?? 0})</span>
          </button>
        </div>

        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-[#0055FE] mx-auto mb-2" />
              <p className="text-xs font-semibold">Loading dealer profile & vehicle catalog…</p>
            </div>
          ) : activeTab === 'info' ? (
            <div className="space-y-6">
              {detailData?.dealer && (
                <div className="p-4 bg-purple-50/80 border border-purple-200/80 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-purple-500/20">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{detailData.dealer.company_name}</h4>
                    <p className="text-xs font-semibold text-purple-700 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{detailData.dealer.city || 'Verified UK Dealership'}</span>
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {rows.map(row => (
                  <div key={row.label} className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                      {row.icon}
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{row.label}</span>
                    </div>
                    <div className="text-xs text-slate-900 font-extrabold truncate max-w-[50%]">{row.value}</div>
                  </div>
                ))}
              </div>

              {user.bio && (
                <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl">
                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">User Bio</p>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">{user.bio}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {detailData?.cars.length === 0 ? (
                <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <Car className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">No vehicle listings found for this dealer account.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Vehicles posted by this dealer will be listed here.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {detailData?.cars.map((car: any) => {
                    const imgUrl = car.image_url || (Array.isArray(car.images) && car.images[0] ? car.images[0] : '/placeholder-car.jpg');
                    const isProcessing = actionCarId === car.id;

                    return (
                      <div
                        key={car.id}
                        className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4"
                      >
                        {/* Vehicle Photo & Main Short Specs */}
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                          <div className="w-24 h-20 sm:w-28 sm:h-20 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative group">
                            <img src={imgUrl} alt={car.title || 'Car'} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                              {car.year || 'N/A'}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="text-xs font-black text-slate-900 truncate">
                                {car.title || `${car.year} ${car.brand || car.make} ${car.model}`}
                              </h5>
                              <Badge
                                className={`text-[9px] font-extrabold px-2 py-0.5 uppercase border ${
                                  car.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  car.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                  'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {car.status}
                              </Badge>
                            </div>

                            <p className="text-sm font-black text-[#0055FE]">
                              £{Number(car.price || 0).toLocaleString()} <span className="text-[10px] font-bold text-slate-400">GBP</span>
                            </p>

                            {/* Short Specifications Tags */}
                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[10px] font-bold text-slate-600">
                              {car.mileage && (
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                                  {Number(car.mileage).toLocaleString()} mi
                                </span>
                              )}
                              {car.fuel_type && (
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                                  {car.fuel_type}
                                </span>
                              )}
                              {car.transmission && (
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                                  {car.transmission}
                                </span>
                              )}
                              {car.city && (
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#0055FE] border border-blue-100 flex items-center gap-0.5">
                                  <MapPin className="w-2.5 h-2.5" /> {car.city}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Admin Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                          {car.status !== 'approved' && (
                            <button
                              onClick={() => handleApproveCar(car.id)}
                              disabled={isProcessing}
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1 shadow-xs"
                              title="Approve listing"
                            >
                              {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                              <span>Approve</span>
                            </button>
                          )}
                          {car.status !== 'rejected' && (
                            <button
                              onClick={() => handleRejectCar(car.id)}
                              disabled={isProcessing}
                              className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1 shadow-xs"
                              title="Reject listing"
                            >
                              {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                              <span>Reject</span>
                            </button>
                          )}
                          <a
                            href={`/admin/cars/${car.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                            title="View & Edit Car Details in Admin Console"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Reset Password Modal
───────────────────────────────────────────────────────────── */
function ResetPasswordModal({
  user,
  onClose,
}: {
  user: DbUser;
  onClose: () => void;
}) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    toast.success('Password copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const res = await resetUserPassword(user.id, password);
      toast.success(res.message);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" />
      <div
        className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Reset User Password</h3>
              <p className="text-xs text-slate-500 font-medium">{user.name} ({user.email})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password (min. 6 chars)"
                required
                minLength={6}
                className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-[#0055FE] focus:ring-3 focus:ring-blue-500/10 transition-all"
              />
              <div className="absolute right-2 top-2 flex items-center gap-1">
                {password && (
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                    title="Copy password"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPassword(generateRandomPassword())}
                  className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-[#0055FE] hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Random
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !password || password.length < 6}
              className="px-5 py-2 text-xs font-bold text-white bg-[#0055FE] hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating…</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Unified User & Dealer Hub Page
───────────────────────────────────────────────────────────── */
export default function UsersPage() {
  const [users,       setUsers]       = useState<DbUser[]>([]);
  const [requests,    setRequests]    = useState<DbRegistrationRequest[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [reqLoading,  setReqLoading]  = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tabFilter, setTabFilter]     = useState<'all' | 'requests' | 'seller' | 'buyer' | 'admin'>('all');
  const [reqStatusFilter, setReqStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const [togglingId,  setTogglingId]  = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<DbUser | null>(null);
  const [resetUser,   setResetUser]   = useState<DbUser | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);

  // Request Modals
  const [selectedReq, setSelectedReq] = useState<DbRegistrationRequest | null>(null);
  const [approveModalReq, setApproveModalReq] = useState<DbRegistrationRequest | null>(null);
  const [deleteModalReq, setDeleteModalReq] = useState<DbRegistrationRequest | null>(null);

  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [approvalResult, setApprovalResult] = useState<{ email: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getAdminProfile().then(p => setCurrentAdmin(p)).catch(() => {});

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') || params.get('filter');
      if (tabParam === 'requests' || tabParam === 'registrations') {
        setTabFilter('requests');
      } else if (tabParam === 'dealers' || tabParam === 'seller') {
        setTabFilter('seller');
      } else if (tabParam === 'buyer') {
        setTabFilter('buyer');
      } else if (tabParam === 'admin') {
        setTabFilter('admin');
      }
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchQuery); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAllUsers(debouncedSearch || undefined, page);
      setUsers(result.data as DbUser[]);
      setTotalUsers(result.total);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      toast.error(`Failed to load users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  const loadRequests = useCallback(async () => {
    setReqLoading(true);
    try {
      const statusArg = reqStatusFilter === 'all' ? undefined : reqStatusFilter;
      const res = await fetchRegistrationRequests(statusArg);
      setRequests(Array.isArray(res) ? res : (res as any)?.data ?? []);
    } catch {
      // handled
    } finally {
      setReqLoading(false);
    }
  }, [reqStatusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const pendingRequestsCount = useMemo(() => {
    return requests.filter(r => r.status === 'pending').length;
  }, [requests]);

  const filteredUsers = useMemo(() => {
    if (tabFilter === 'all') return users;
    if (tabFilter === 'requests') return [];
    return users.filter(u => u.role === tabFilter);
  }, [users, tabFilter]);

  const filteredRequests = useMemo(() => {
    return requests.filter(r =>
      !debouncedSearch ||
      r.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      r.email.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [requests, debouncedSearch]);

  const stats = useMemo(() => ({
    total:     totalUsers,
    active:    users.filter(u => u.status === 'active').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    sellers:   users.filter(u => u.role === 'seller').length,
    buyers:    users.filter(u => u.role === 'buyer').length,
    pendingReqs: pendingRequestsCount,
  }), [users, totalUsers, pendingRequestsCount]);

  const handleToggleStatus = async (user: DbUser) => {
    const nextStatus: UserStatus =
      user.status === 'active' ? 'suspended' : 'active';

    setUsers(prev =>
      prev.map(u => (u.id === user.id ? { ...u, status: nextStatus } : u)),
    );
    setTogglingId(user.id);

    try {
      await updateUserStatus(user.id, nextStatus);
      toast.success(
        nextStatus === 'suspended'
          ? `${user.name} has been suspended.`
          : `${user.name} is now active.`,
      );
    } catch (err: any) {
      setUsers(prev =>
        prev.map(u => (u.id === user.id ? { ...u, status: user.status } : u)),
      );
      toast.error(`Failed to update status: ${err.message}`);
    } finally {
      setTogglingId(null);
    }
  };

  const handleRoleChange = async (user: DbUser, newRole: UserRole) => {
    if (user.role === newRole) return;
    setUsers(prev =>
      prev.map(u => (u.id === user.id ? { ...u, role: newRole } : u)),
    );
    try {
      await updateUserRole(user.id, newRole);
      toast.success(`${user.name}'s role updated to ${ROLE_LABEL[newRole]}.`);
    } catch (err: any) {
      setUsers(prev =>
        prev.map(u => (u.id === user.id ? { ...u, role: user.role } : u)),
      );
      toast.error(`Failed to update role: ${err.message}`);
    }
  };

  // Request Handlers
  const openApproveModal = (req: DbRegistrationRequest) => {
    setApproveModalReq(req);
    setPasswordInput(generateRandomPassword());
    setAdminNotesInput('');
    setSelectedReq(null);
  };

  const handleConfirmApproval = async () => {
    if (!approveModalReq) return;
    if (!passwordInput || passwordInput.trim().length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setActionLoading(true);
    try {
      const result = await approveRegistrationRequest(
        approveModalReq.id,
        passwordInput.trim(),
        adminNotesInput.trim() || undefined
      );
      setApprovalResult({ email: result.email, tempPassword: result.tempPassword });
      setApproveModalReq(null);
      loadRequests();
      fetchUsers();
      toast.success('Dealer account approved and credentials generated!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve registration');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(true);
    try {
      await rejectRegistrationRequest(id);
      toast.success('Registration request rejected');
      setSelectedReq(null);
      loadRequests();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteReq = async () => {
    if (!deleteModalReq) return;
    setActionLoading(true);
    try {
      await deleteRegistrationRequest(deleteModalReq.id);
      toast.success('Registration request deleted permanently');
      setDeleteModalReq(null);
      setSelectedReq(null);
      loadRequests();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete request');
    } finally {
      setActionLoading(false);
    }
  };

  const copyPassword = async () => {
    if (!approvalResult) return;
    try {
      await navigator.clipboard.writeText(approvalResult.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy password');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          User & Dealer Control Hub
        </h1>
        <p className="text-xs font-semibold text-slate-500 mt-1">
          Unified control center to review dealer applications, manage active accounts, reset credentials, and control access permissions.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Accounts',  value: stats.total,       color: 'text-slate-900' },
          { label: 'Pending Dealer Reqs', value: stats.pendingReqs, color: 'text-amber-600' },
          { label: 'Dealers / Sellers',value: stats.sellers,     color: 'text-purple-600' },
          { label: 'Buyers',          value: stats.buyers,      color: 'text-blue-600' },
          { label: 'Suspended',       value: stats.suspended,   color: 'text-rose-600' },
        ].map(s => (
          <div
            key={s.label}
            className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs"
          >
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {s.label}
            </p>
            <p className={`text-2xl font-extrabold mt-2 ${s.color}`}>
              {loading ? (
                <span className="inline-block w-8 h-6 bg-slate-100 rounded animate-pulse" />
              ) : (
                s.value
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Main Tabbed Navigation Bar & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60 overflow-x-auto">
          {[
            { id: 'all',      label: 'All Accounts' },
            { id: 'requests', label: 'Dealer Requests', badge: pendingRequestsCount },
            { id: 'seller',   label: 'Dealers / Sellers' },
            { id: 'buyer',    label: 'Buyers' },
            { id: 'admin',    label: 'Admins' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setTabFilter(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                tabFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-extrabold bg-amber-500 text-white rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl text-xs font-medium pl-10 pr-4 py-2.5 text-slate-900 outline-none focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE] transition-all shadow-xs"
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: DEALER REGISTRATION REQUESTS VIEW
      ───────────────────────────────────────────────────────────── */}
      {tabFilter === 'requests' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-amber-50/60 border border-amber-200/70 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Dealer Registration Applications</h3>
                <p className="text-xs text-slate-600">Review pending dealership registration requests and generate login credentials.</p>
              </div>
            </div>

            {/* Filter Status Pills */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-amber-200">
              {(['pending', 'approved', 'rejected', 'all'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setReqStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    reqStatusFilter === st
                      ? 'bg-[#0055FE] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-5">Applicant Name</th>
                    <th className="py-3.5 px-5">Contact Details</th>
                    <th className="py-3.5 px-5">Role Applied</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5">Submitted Date</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {reqLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin text-[#0055FE] mx-auto mb-2" />
                        <p className="text-xs font-semibold">Loading registration applications…</p>
                      </td>
                    </tr>
                  ) : filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
                        No registration requests found matching current filter.
                      </td>
                    </tr>
                  ) : filteredRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold shadow-xs">
                            {req.name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{req.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{req.id.slice(0, 8)}…</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <p className="text-slate-800 font-semibold">{req.email}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{req.phone ?? '—'}</p>
                      </td>
                      <td className="py-4 px-5">
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px] font-bold uppercase">
                          Dealer / Seller
                        </Badge>
                      </td>
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_STYLE[req.status as UserStatus] || 'bg-slate-100 text-slate-600'}`}>
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-slate-400 font-medium whitespace-nowrap">
                        {formatDate(req.created_at)}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedReq(req)}
                            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="View Application Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {req.status === 'pending' && (
                            <>
                              <button
                                onClick={() => openApproveModal(req)}
                                disabled={actionLoading}
                                className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
                                title="Approve & Generate Password"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleReject(req.id)}
                                disabled={actionLoading}
                                className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-50"
                                title="Reject Application"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => setDeleteModalReq(req)}
                            disabled={actionLoading}
                            className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-50"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            TAB 2: ALL ACCOUNTS / USERS / DEALERS TABLE
        ───────────────────────────────────────────────────────────── */
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">User Account</th>
                  <th className="py-3.5 px-5">Contact Details</th>
                  <th className="py-3.5 px-5">Account Role</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Member Since</th>
                  <th className="py-3.5 px-5">Car Listings</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {loading && (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
                          <div className="space-y-1.5">
                            <div className="h-3 w-28 bg-slate-200 rounded" />
                            <div className="h-2.5 w-20 bg-slate-100 rounded" />
                          </div>
                        </div>
                      </td>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="py-4 px-5">
                          <div className="h-3 w-20 bg-slate-100 rounded" />
                        </td>
                      ))}
                      <td className="py-4 px-5">
                        <div className="flex justify-end gap-2">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg" />
                        </div>
                      </td>
                    </tr>
                  ))
                )}

                {!loading && filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                      <UsersIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">
                        {searchQuery ? 'No accounts match your search query.' : 'No user accounts found in this category.'}
                      </p>
                    </td>
                  </tr>
                )}

                {!loading && filteredUsers.map(user => {
                  const isToggling = togglingId === user.id;
                  const isSelf = currentAdmin && (
                    user.id === currentAdmin.id ||
                    (user.email && currentAdmin.email && user.email.toLowerCase() === currentAdmin.email.toLowerCase())
                  );

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50/70 transition-colors ${isSelf ? 'bg-blue-50/30' : ''}`}
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0055FE] to-emerald-500 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden shadow-xs">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              getInitial(user.name)
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-xs font-bold text-slate-900 truncate max-w-[140px]">
                                {user.name}
                              </p>
                              {isSelf && (
                                <Badge className="bg-blue-100 text-[#0055FE] border-blue-200 text-[9px] font-extrabold px-1.5 py-0">
                                  You
                                </Badge>
                              )}
                              {user.role === 'seller' && (
                                <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[9px] font-extrabold px-1.5 py-0">
                                  Dealer
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                              {user.id.slice(0, 8)}…
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <p className="text-xs font-semibold text-slate-800 truncate max-w-[180px]">
                          {user.email}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {user.phone ?? '—'}
                        </p>
                      </td>

                      <td className="py-4 px-5">
                        <Badge
                          className={`text-[10px] font-bold px-2.5 py-0.5 uppercase border ${ROLE_STYLE[user.role] || 'bg-slate-50 text-slate-700'}`}
                        >
                          {ROLE_LABEL[user.role] || user.role}
                        </Badge>
                      </td>

                      <td className="py-4 px-5">
                        <Badge
                          className={`text-[10px] font-bold px-2.5 py-0.5 uppercase border ${STATUS_STYLE[user.status] || 'bg-slate-50 text-slate-700'}`}
                        >
                          {user.status}
                        </Badge>
                      </td>

                      <td className="py-4 px-5 text-slate-500 font-medium whitespace-nowrap">
                        {formatDate(user.created_at)}
                      </td>

                      <td className="py-4 px-5 text-xs font-bold text-slate-800">
                        {user.listings_count}
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setProfileUser(user)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer text-[11px] font-bold"
                            title="View Account Details & Car Listings"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          <button
                            onClick={() => setResetUser(user)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer text-[11px] font-bold"
                            title="Reset Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Reset PW</span>
                          </button>

                          <button
                            onClick={() => {
                              if (isSelf) {
                                toast.info('You cannot suspend your own active admin account.');
                                return;
                              }
                              handleToggleStatus(user);
                            }}
                            disabled={isToggling || isSelf}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-[11px] font-bold ${
                              isSelf
                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                                : user.status === 'active'
                                ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 cursor-pointer'
                                : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                            }`}
                            title={
                              isSelf
                                ? 'You cannot suspend your own account'
                                : user.status === 'active'
                                ? 'Suspend Account'
                                : 'Activate Account'
                            }
                          >
                            {isToggling ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : user.status === 'active' ? (
                              <UserX className="w-3.5 h-3.5" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!loading && filteredUsers.length > 0 && (
            <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400 font-medium">
                Page <span className="text-slate-800 font-bold">{page}</span> of{' '}
                <span className="text-slate-800 font-bold">{totalPages}</span> ({totalUsers} total)
              </p>
              <div className="flex items-center gap-2">
                {totalPages > 1 && (
                  <div className="flex gap-1">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer">
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <button onClick={fetchUsers}
                  className="text-xs font-bold text-[#0055FE] hover:underline flex items-center gap-1 cursor-pointer">
                  <Loader2 className="w-3 h-3" /> Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Account Details Modal */}
      {profileUser && (
        <ProfileModal
          user={profileUser}
          onClose={() => setProfileUser(null)}
        />
      )}

      {/* Reset Password Modal */}
      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          onClose={() => setResetUser(null)}
        />
      )}

      {/* Request Details View Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setSelectedReq(null)} />
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-extrabold text-slate-900">Dealer Registration Details</h3>
              <button onClick={() => setSelectedReq(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-lg font-bold">
                  {selectedReq.name[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="text-slate-900 font-bold text-sm">{selectedReq.name}</div>
                  <div className="text-slate-500 text-xs font-semibold">{selectedReq.email}</div>
                  {selectedReq.phone && <div className="text-slate-400 text-xs">{selectedReq.phone}</div>}
                </div>
                <span className={`ml-auto px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_STYLE[selectedReq.status as UserStatus] || 'bg-slate-100'}`}>
                  {selectedReq.status.charAt(0).toUpperCase() + selectedReq.status.slice(1)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Role Applied</div>
                  <div className="text-slate-900 font-bold text-xs">Dealer / Seller</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Submitted Date</div>
                  <div className="text-slate-900 font-bold text-xs">{new Date(selectedReq.created_at).toLocaleString()}</div>
                </div>
              </div>

              {selectedReq.message && (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Applicant Message / Reason</div>
                  <div className="text-slate-700 text-xs font-medium whitespace-pre-wrap">{selectedReq.message}</div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              {selectedReq.status === 'pending' && (
                <>
                  <Button
                    onClick={() => openApproveModal(selectedReq)}
                    disabled={actionLoading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-xl cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve & Set Password
                  </Button>
                  <Button
                    onClick={() => handleReject(selectedReq.id)}
                    disabled={actionLoading}
                    variant="outline"
                    className="border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs h-10 rounded-xl cursor-pointer"
                  >
                    <X className="w-4 h-4 mr-1.5" /> Reject
                  </Button>
                </>
              )}
              <Button
                onClick={() => { setDeleteModalReq(selectedReq); setSelectedReq(null); }}
                variant="outline"
                className="border-slate-200 text-rose-600 hover:bg-rose-50 font-bold text-xs h-10 rounded-xl cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-1.5" /> Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Approval & Password Setup Modal */}
      {approveModalReq && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setApproveModalReq(null)} />
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Approve Dealership Application</h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Set portal login credentials for dealer.</p>
              </div>
              <button onClick={() => setApproveModalReq(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-900">{approveModalReq.name}</span>
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px] font-bold uppercase">
                    Dealer / Seller
                  </Badge>
                </div>
                <div className="text-[11px] font-semibold text-slate-600">{approveModalReq.email}</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="passwordInput" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-[#0055FE]" />
                    Set Default Login Password <span className="text-rose-500">*</span>
                  </Label>
                  <button
                    type="button"
                    onClick={() => setPasswordInput(generateRandomPassword())}
                    className="text-[11px] font-bold text-[#0055FE] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Auto-Generate
                  </button>
                </div>

                <div className="relative">
                  <Input
                    id="passwordInput"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    className="bg-slate-50/50 border-slate-200 rounded-xl text-xs font-mono font-bold pr-10 focus:bg-white focus:border-[#0055FE]"
                    placeholder="Enter default login password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="text-[10px] font-medium text-slate-400">Admin can share this default password with the dealer for initial access.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminNotesInput" className="text-xs font-bold text-slate-700">Admin Notes (Optional)</Label>
                <Textarea
                  id="adminNotesInput"
                  rows={2}
                  value={adminNotesInput}
                  onChange={e => setAdminNotesInput(e.target.value)}
                  className="bg-slate-50/50 border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-[#0055FE]"
                  placeholder="Optional notes regarding approval..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setApproveModalReq(null)}
                className="flex-1 border-slate-200 text-slate-600 font-bold text-xs h-10 rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmApproval}
                disabled={actionLoading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-xl shadow-xs cursor-pointer"
              >
                {actionLoading ? 'Approving...' : 'Confirm & Create User'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalReq && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setDeleteModalReq(null)} />
          <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Delete Registration Request?</h3>
            <p className="text-xs font-medium text-slate-500 mb-6">
              Are you sure you want to permanently delete registration request for <span className="font-bold text-slate-900">&ldquo;{deleteModalReq.name}&rdquo;</span> ({deleteModalReq.email})? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteModalReq(null)}
                className="flex-1 border-slate-200 text-slate-600 font-bold text-xs h-10 rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteReq}
                disabled={actionLoading}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-10 rounded-xl cursor-pointer shadow-xs"
              >
                {actionLoading ? 'Deleting...' : 'Delete Permanently'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Credentials Result Modal */}
      {approvalResult && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setApprovalResult(null)} />
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Account Created & Approved!</h3>
            <p className="text-xs font-semibold text-slate-500 mb-4">
              Portal account created for <span className="text-slate-900 font-bold">{approvalResult.email}</span>. Share these login credentials:
            </p>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4 space-y-2 text-left">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Default Login Password</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white text-emerald-700 font-mono text-xs px-3 py-2 rounded-lg border border-slate-200 font-bold select-all">
                  {approvalResult.tempPassword}
                </code>
                <button
                  onClick={copyPassword}
                  className="p-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                  title="Copy password"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              onClick={() => setApprovalResult(null)}
              className="w-full bg-[#0055FE] hover:bg-blue-700 text-white font-bold text-xs h-10 rounded-xl cursor-pointer shadow-xs"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
