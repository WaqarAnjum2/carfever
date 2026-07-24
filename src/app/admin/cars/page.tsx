'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Car as CarIcon,
  X,
  MapPin,
  Calendar,
  Gauge,
  Fuel,
  Sliders,
  DollarSign,
  User,
  Phone,
  ShieldAlert,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchAdminCars, fetchSellerCars, deleteCar, approveCar, rejectCar } from '@/lib/admin-actions';

function formatPricePKR(price?: number): string {
  if (!price || isNaN(price)) return '£0';
  return `£${price.toLocaleString('en-GB')}`;
}


function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; dot: string; label: string }> = {
    approved: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500', label: 'Approved' },
    rejected: { bg: 'bg-rose-50 text-rose-700 border-rose-200/80', dot: 'bg-rose-500', label: 'Rejected' },
    pending:  { bg: 'bg-amber-50 text-amber-700 border-amber-200/80', dot: 'bg-amber-500 animate-pulse', label: 'Pending Review' },
  };
  const item = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${item.bg} shadow-xs`}>
      <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
      {item.label}
    </span>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
      <p className="text-xs font-semibold text-slate-500">
        Showing Page <span className="text-slate-900 font-extrabold">{page}</span> of{' '}
        <span className="text-slate-900 font-extrabold">{totalPages}</span>
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-xs cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-all shadow-xs cursor-pointer"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function AdminCarsPage() {
  const pathname = usePathname();
  const isSeller = pathname.startsWith('/seller');
  const newCarUrl = isSeller ? '/seller/sell-car' : '/admin/cars/new';

  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCars = useCallback(async () => {
    setLoading(true);
    try {
      const result = isSeller
        ? await fetchSellerCars(debounced, page)
        : await fetchAdminCars(debounced, page);
      setCars(result.data || []);
      setTotalPages(result.totalPages);
    } catch {
      toast.error('Failed to load vehicle listings');
    }
    setLoading(false);
  }, [debounced, page]);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  const handleDelete = async (id: string, title?: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title || 'this vehicle'}"?`)) return;
    try {
      await deleteCar(id);
      toast.success('Vehicle listing deleted successfully');
      setCars((prev) => prev.filter((x) => x.id !== id));
    } catch {
      toast.error('Failed to delete car listing');
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      if (newStatus === 'approved') await approveCar(id);
      else await rejectCar(id);

      toast.success(`Vehicle listing ${newStatus}`);
      setCars((prev) => prev.map((x) => (x.id === id ? { ...x, status: newStatus } : x)));
    } catch {
      toast.error('Status update failed');
    }
  };

  const filteredCars = cars.filter((car) => {
    if (statusFilter === 'all') return true;
    return car.status === statusFilter;
  });

  return (
    <div className="space-y-6 max-w-7xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <CarIcon className="w-7 h-7 text-[#0055FE]" />
            Car Inventory & Listings
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Manage, review photos, edit specs, approve or remove vehicle listings across the platform.
          </p>
        </div>
        <Link
          href={newCarUrl}
          prefetch={false}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0055FE] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" /> Create New Vehicle Listing
        </Link>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 overflow-x-auto">
          {[
            { id: 'all', label: 'All Vehicles' },
            { id: 'pending', label: 'Pending' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white text-[#0055FE] shadow-xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full bg-white border border-slate-200 rounded-xl text-xs font-semibold pl-10 pr-4 py-2.5 text-slate-900 outline-none focus:border-[#0055FE] focus:ring-2 focus:ring-[#0055FE]/10 transition-all shadow-xs placeholder:text-slate-400"
            placeholder="Search by title, brand, model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-visible">
        <div className="overflow-x-auto rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Vehicle Info</th>
                <th className="py-4 px-6">Price</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Date Added</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-slate-100 rounded-xl" />
                        <div className="space-y-2">
                          <div className="h-4 w-44 bg-slate-100 rounded" />
                          <div className="h-3 w-28 bg-slate-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6"><div className="h-4 w-24 bg-slate-100 rounded" /></td>
                    <td className="py-4 px-6"><div className="h-5 w-20 bg-slate-100 rounded-full" /></td>
                    <td className="py-4 px-6"><div className="h-4 w-20 bg-slate-100 rounded" /></td>
                    <td className="py-4 px-6"><div className="h-8 w-24 bg-slate-100 rounded-xl ml-auto" /></td>
                  </tr>
                ))
              ) : filteredCars.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                        <CarIcon className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-extrabold text-slate-900">No vehicles found</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Try adjusting your search criteria or add a new listing.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCars.map((car) => {
                  const displayImage =
                    (Array.isArray(car.images) && car.images.length > 0 && car.images[0]) ||
                    car.image_url ||
                    'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=600&q=80';

                  return (
                    <tr key={car.id} className="hover:bg-blue-50/30 transition-colors group">
                      {/* Vehicle Column */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200 shadow-xs relative group-hover:scale-105 transition-transform">
                            <img
                              src={displayImage}
                              alt={car.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=600&q=80';
                              }}
                            />
                            {Array.isArray(car.images) && car.images.length > 1 && (
                              <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                                +{car.images.length - 1}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 text-sm group-hover:text-[#0055FE] transition-colors">
                              {car.title}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold mt-1 flex-wrap">
                              <span>{car.brand || car.make}</span>
                              <span>•</span>
                              <span>{car.model}</span>
                              <span>•</span>
                              <span>{car.year}</span>
                              {car.city && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-0.5 text-slate-600">
                                    <MapPin className="w-3 h-3 text-slate-400" /> {car.city}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Price Column */}
                      <td className="py-4 px-6">
                        <div className="font-black text-slate-900 text-sm">
                          {formatPricePKR(car.price)}
                        </div>
                        {car.price >= 100000 && (
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                            PKR {car.price?.toLocaleString()}
                          </div>
                        )}
                      </td>

                      {/* Status Column */}
                      <td className="py-4 px-6">
                        <StatusBadge status={car.status || 'pending'} />
                      </td>

                      {/* Added Date */}
                      <td className="py-4 px-6 text-slate-500 font-medium text-xs">
                        {car.created_at ? new Date(car.created_at).toLocaleDateString() : 'N/A'}
                      </td>

                      {/* Explicit Inline Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* View Details Page Link */}
                          <Link
                            href={isSeller ? `/seller/cars/${car.id}` : `/admin/cars/${car.id}`}
                            prefetch={false}
                            title="View Full Vehicle & Owner Details Page"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer hover:border-slate-300"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" /> View
                          </Link>

                          {/* Edit Listing Button */}
                          <Link
                            href={isSeller ? `/seller/cars/${car.id}?edit=true` : `/admin/cars/${car.id}?edit=true`}
                            prefetch={false}
                            title="Edit Listing Details & Photos"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-[#0055FE] text-xs font-bold transition-all shadow-xs hover:border-blue-300"
                          >
                            <Edit className="w-3.5 h-3.5 text-[#0055FE]" /> Edit
                          </Link>

                          {/* Admin Approval Quick Action */}
                          {!isSeller && car.status !== 'approved' && (
                            <button
                              onClick={() => handleStatusChange(car.id, 'approved')}
                              title="Approve Listing"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Approve
                            </button>
                          )}

                          {/* Delete Action Button */}
                          <button
                            onClick={() => handleDelete(car.id, car.title)}
                            title="Delete Car Listing"
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-400 transition-all shadow-xs cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}