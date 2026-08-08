'use client';

import { useState, useEffect, useTransition, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import {
  SlidersHorizontal,
  Heart,
  Fuel,
  Gauge,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Car,
  Loader2,
  Search,
  MapPin,
  Lock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { fetchApprovedCars, type ApprovedCar, type FetchCarsFilters } from '@/lib/server-actions';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// ── Wishlist helpers ─────────────────────────────────────────────────────────
function getWishlistIds(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('cf_wishlist_ids') || '[]'); } catch { return []; }
}
function addToWishlistId(id: string): void {
  if (typeof window === 'undefined') return;
  const ids = getWishlistIds();
  if (!ids.includes(id)) {
    localStorage.setItem('cf_wishlist_ids', JSON.stringify([...ids, id]));
    window.dispatchEvent(new CustomEvent('wishlist-updated'));
  }
}
function removeFromWishlistId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('cf_wishlist_ids', JSON.stringify(getWishlistIds().filter((x) => x !== id)));
  window.dispatchEvent(new CustomEvent('wishlist-updated'));
}
function isInWishlistId(id: string): boolean {
  return getWishlistIds().includes(id);
}

// ── Formatters ─────────────────────────────────────────────────────────────

function formatPrice(price: number, currency?: string | null): string {
  if (!price || isNaN(price)) return '£0';
  const curr = currency || 'GBP';
  if (curr === 'GBP' || curr === '£') {
    return `£${price.toLocaleString('en-GB')}`;
  }
  if (curr === 'USD' || curr === '$') {
    return `$${price.toLocaleString('en-US')}`;
  }
  if (curr === 'EUR' || curr === '€') {
    return `€${price.toLocaleString('en-IE')}`;
  }
  let p = price;
  if (p >= 10000000) {
    return `${curr} ${(p / 10000000).toFixed(2)} Crore`;
  }
  if (p >= 100000) {
    const lacs = p / 100000;
    return `${curr} ${lacs % 1 === 0 ? lacs.toFixed(0) : lacs.toFixed(1)} Lacs`;
  }
  return `${curr} ${p.toLocaleString()}`;
}

function formatMileage(miles: number | null, currency?: string | null): string {
  if (!miles) return 'N/A';
  const unit = (currency === 'GBP' || currency === '£' || !currency) ? 'miles' : 'km';
  return `${miles.toLocaleString()} ${unit}`;
}

// ── Car Card Component ────────────────────────────────────────────────────────

function CarCard({
  car,
  isAuthenticated,
  onRequestLogin,
}: {
  car: ApprovedCar;
  isAuthenticated: boolean;
  onRequestLogin: () => void;
}) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    setIsWishlisted(isInWishlistId(car.id));
    const handleUpdate = () => setIsWishlisted(isInWishlistId(car.id));
    window.addEventListener('wishlist-updated', handleUpdate);
    return () => window.removeEventListener('wishlist-updated', handleUpdate);
  }, [car.id]);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      onRequestLogin();
      return;
    }

    if (isWishlisted) {
      removeFromWishlistId(car.id);
      toast('Removed from Wishlist', { description: car.title });
    } else {
      addToWishlistId(car.id);
      toast.success('Saved to Wishlist! ❤️', { description: car.title });
    }
  };

  const images: string[] = Array.isArray(car.images) ? (car.images as string[]) : [];
  const primaryImage =
    images[0] ||
    'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=600&q=80';

  return (
    <div className="group rounded-2xl overflow-hidden bg-white border border-slate-200/80 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col">
      <div className="relative aspect-[16/11] overflow-hidden shrink-0 bg-slate-100">
        <img
          src={primaryImage}
          alt={car.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
        
        {car.is_featured && (
          <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-[#0055FE] text-white shadow-md shadow-blue-500/30">
            Featured
          </span>
        )}

        {car.city && (
          <span className="absolute bottom-3 left-3 px-2.5 py-1 text-xs font-bold text-white bg-slate-900/70 backdrop-blur-md rounded-lg flex items-center gap-1">
            <MapPin className="w-3 h-3 text-red-400" />
            {car.city}
          </span>
        )}

        <button
          onClick={handleWishlistToggle}
          title={isAuthenticated ? (isWishlisted ? "Remove from Wishlist" : "Add to Wishlist") : "Sign in to add to Wishlist"}
          className={`absolute top-3 right-3 p-2.5 rounded-full bg-white/90 backdrop-blur-md transition-all duration-200 active:scale-90 shadow-md ${
            isWishlisted
              ? 'text-rose-500 scale-105 bg-rose-50'
              : 'text-slate-400 hover:text-rose-500 hover:bg-white'
          }`}
        >
          <Heart
            className={`w-4 h-4 transition-all duration-200 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`}
          />
        </button>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-base font-extrabold text-slate-900 group-hover:text-[#0055FE] transition-colors duration-300 mb-3 line-clamp-1">
          {car.title}
        </h3>

        <div className="grid grid-cols-2 gap-2 mb-4 text-slate-600">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs font-bold text-slate-700">{car.year}</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
            <Gauge className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs font-bold text-slate-700 truncate">
              {formatMileage(car.mileage, car.currency)}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 col-span-2">
            <Fuel className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs font-bold text-slate-700">
              {car.fuel_type || 'Petrol'} {car.transmission ? `• ${car.transmission}` : ''}
            </span>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Price</span>
            <span className="text-lg font-black text-[#0055FE]">
              {formatPrice(car.price, car.currency)}
            </span>
          </div>
          <Link href={`/buy-car/${car.id}`} prefetch={false}>
            <Button
              size="sm"
              className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-500/20 px-4 cursor-pointer"
            >
              View Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton Card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-slate-200/80 flex flex-col animate-pulse">
      <div className="aspect-[16/11] bg-slate-100" />
      <div className="p-5 flex flex-col flex-1 gap-4">
        <div className="h-4 bg-slate-100 rounded-lg w-3/4" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-9 bg-slate-50 rounded-xl" />
          <div className="h-9 bg-slate-50 rounded-xl" />
          <div className="h-9 bg-slate-50 rounded-xl col-span-2" />
        </div>
        <div className="flex justify-between items-center pt-3 mt-auto border-t border-slate-100">
          <div className="h-6 bg-slate-100 rounded-lg w-24" />
          <div className="h-9 bg-slate-100 rounded-xl w-24" />
        </div>
      </div>
    </div>
  );
}

// ── Filter Sidebar Component ──────────────────────────────────────────────────

import { useCarOptions } from '@/lib/hooks/use-car-options';

interface FilterSidebarProps {
  selectedMake: string | null;
  setSelectedMake: (v: string | null) => void;
  selectedCity: string | null;
  setSelectedCity: (v: string | null) => void;
  maxPrice: number;
  setMaxPrice: (v: number) => void;
  selectedYear: string | null;
  setSelectedYear: (v: string | null) => void;
  selectedFuel: string[];
  setSelectedFuel: (v: string[]) => void;
  selectedTransmission: string | null;
  setSelectedTransmission: (v: string | null) => void;
  selectedBodyType: string | null;
  setSelectedBodyType: (v: string | null) => void;
  mileageMin: string;
  setMileageMin: (v: string) => void;
  mileageMax: string;
  setMileageMax: (v: string) => void;
  onReset: () => void;
}

function FilterSidebar({
  selectedMake,
  setSelectedMake,
  selectedCity,
  setSelectedCity,
  maxPrice,
  setMaxPrice,
  selectedYear,
  setSelectedYear,
  selectedFuel,
  setSelectedFuel,
  selectedTransmission,
  setSelectedTransmission,
  selectedBodyType,
  setSelectedBodyType,
  mileageMin,
  setMileageMin,
  mileageMax,
  setMileageMax,
  onReset,
}: FilterSidebarProps) {
  const { makeNames, cityNames, bodyTypeNames, fuelTypeNames } = useCarOptions();
  const makes = makeNames;
  const cities = cityNames;
  const fuelTypes = fuelTypeNames;
  const transmissions = ['Automatic', 'Manual'];
  const bodyTypes = bodyTypeNames;

  const handleFuelToggle = (fuel: string, checked: boolean) => {
    if (checked) {
      setSelectedFuel([...selectedFuel, fuel]);
    } else {
      setSelectedFuel(selectedFuel.filter((f) => f !== fuel));
    }
  };

  return (
    <div className="space-y-6 text-xs font-medium text-slate-700">
      
      {/* Make / Brand */}
      <div>
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">
          Make / Brand
        </h3>
        <select
          value={selectedMake || ''}
          onChange={(e) => setSelectedMake(e.target.value || null)}
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 hover:bg-white focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE] outline-none cursor-pointer"
        >
          <option value="">All Makes & Brands</option>
          {makes.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* City / Location */}
      <div>
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">
          City / Location
        </h3>
        <select
          value={selectedCity || ''}
          onChange={(e) => setSelectedCity(e.target.value || null)}
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 hover:bg-white focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE] outline-none cursor-pointer"
        >
          <option value="">All Cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="h-px w-full bg-slate-100" />

      {/* Max Price */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
            Max Price Filter
          </h3>
          <span className="text-[11px] font-bold text-[#0055FE] bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
            {maxPrice >= 10000000 ? `${(maxPrice / 10000000).toFixed(1)} Crore` : `${(maxPrice / 100000).toFixed(0)} Lacs`}
          </span>
        </div>
        <input
          type="range"
          min="500000"
          max="100000000"
          step="500000"
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0055FE]"
        />
        <div className="flex justify-between items-center mt-2 text-[10px] font-bold text-slate-400">
          <span>5 Lacs</span>
          <span>10 Crore+</span>
        </div>
      </div>

      <div className="h-px w-full bg-slate-100" />

      {/* Model Year */}
      <div>
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">
          Model Year
        </h3>
        <select
          value={selectedYear || ''}
          onChange={(e) => setSelectedYear(e.target.value || null)}
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 hover:bg-white focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE] outline-none cursor-pointer"
        >
          <option value="">Any Year</option>
          {Array.from({ length: 32 }, (_, i) => 2026 - i).map((yr) => (
            <option key={yr} value={yr}>{yr}</option>
          ))}
        </select>
      </div>

      <div className="h-px w-full bg-slate-100" />

      {/* Fuel Type */}
      <div>
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">
          Fuel Type
        </h3>
        <div className="space-y-2.5">
          {fuelTypes.map((fuel) => {
            const isChecked = selectedFuel.includes(fuel);
            return (
              <label key={fuel} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => handleFuelToggle(fuel, e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#0055FE] focus:ring-[#0055FE]"
                />
                <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
                  {fuel}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="h-px w-full bg-slate-100" />

      {/* Transmission */}
      <div>
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">
          Transmission
        </h3>
        <select
          value={selectedTransmission || ''}
          onChange={(e) => setSelectedTransmission(e.target.value || null)}
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 hover:bg-white focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE] outline-none cursor-pointer"
        >
          <option value="">Any Transmission</option>
          {transmissions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="h-px w-full bg-slate-100" />

      {/* Body Type */}
      <div>
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">
          Body Style
        </h3>
        <select
          value={selectedBodyType || ''}
          onChange={(e) => setSelectedBodyType(e.target.value || null)}
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 hover:bg-white focus:border-[#0055FE] focus:ring-1 focus:ring-[#0055FE] outline-none cursor-pointer"
        >
          <option value="">Any Body Style</option>
          {bodyTypes.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      <div className="h-px w-full bg-slate-100" />

      {/* Mileage Range */}
      <div>
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">
          Mileage Range (KM)
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min KM"
            value={mileageMin}
            onChange={(e) => setMileageMin(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-[#0055FE]"
          />
          <span className="text-slate-400 text-[10px] font-bold">TO</span>
          <input
            type="number"
            min="0"
            placeholder="Max KM"
            value={mileageMax}
            onChange={(e) => setMileageMax(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-[#0055FE]"
          />
        </div>
      </div>

      <Button
        onClick={onReset}
        variant="outline"
        className="w-full border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs rounded-xl h-10 mt-2 transition-colors"
      >
        Reset All Filters
      </Button>
    </div>
  );
}

// ── Main Page Content ─────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 6;
const MAX_PRICE = 100000000;

function BuyCarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const [selectedMake, setSelectedMake] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<number>(MAX_PRICE);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedFuel, setSelectedFuel] = useState<string[]>([]);
  const [selectedTransmission, setSelectedTransmission] = useState<string | null>(null);
  const [selectedBodyType, setSelectedBodyType] = useState<string | null>(null);
  const [mileageMin, setMileageMin] = useState('');
  const [mileageMax, setMileageMax] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<FetchCarsFilters['sortBy']>('newest');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [cars, setCars] = useState<ApprovedCar[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  // Check auth session
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  // Sync URL query params
  useEffect(() => {
    const q = searchParams?.get('search') || '';
    if (q) setSearchQuery(q);
  }, [searchParams]);

  const loadCars = useCallback(() => {
    setLoading(true);
    startTransition(async () => {
      const result = await fetchApprovedCars({
        make: selectedMake,
        maxPrice: maxPrice < MAX_PRICE ? maxPrice : null,
        year: selectedYear ? parseInt(selectedYear) : null,
        fuelType: selectedFuel.length > 0 ? selectedFuel : null,
        transmission: selectedTransmission,
        bodyType: selectedBodyType,
        mileageMin: mileageMin ? parseInt(mileageMin) : null,
        mileageMax: mileageMax ? parseInt(mileageMax) : null,
        search: searchQuery || null,
        sortBy,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      });

      // Filter by city if selected client-side or backend
      let filtered = result.cars;
      if (selectedCity) {
        filtered = filtered.filter((c: any) => c.city?.toLowerCase().includes(selectedCity.toLowerCase()));
      }

      setCars(filtered);
      setTotal(selectedCity ? filtered.length : result.total);
      setTotalPages(selectedCity ? Math.ceil(filtered.length / ITEMS_PER_PAGE) : result.totalPages);
      setLoading(false);
    });
  }, [selectedMake, selectedCity, maxPrice, selectedYear, selectedFuel, selectedTransmission, selectedBodyType, mileageMin, mileageMax, searchQuery, sortBy, currentPage]);

  useEffect(() => {
    loadCars();
  }, [loadCars]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMake, selectedCity, maxPrice, selectedYear, selectedFuel, selectedTransmission, selectedBodyType, mileageMin, mileageMax, searchQuery, sortBy]);

  const handleResetFilters = () => {
    setSelectedMake(null);
    setSelectedCity(null);
    setMaxPrice(MAX_PRICE);
    setSelectedYear(null);
    setSelectedFuel([]);
    setSelectedTransmission(null);
    setSelectedBodyType(null);
    setMileageMin('');
    setMileageMax('');
    setSearchQuery('');
    setCurrentPage(1);
    router.push('/buy-car');
  };

  const hasActiveFilters =
    selectedMake ||
    selectedCity ||
    maxPrice < MAX_PRICE ||
    selectedYear ||
    selectedFuel.length > 0 ||
    selectedTransmission ||
    selectedBodyType ||
    mileageMin ||
    mileageMax ||
    searchQuery;

  const isLoadingState = loading || isPending;

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 lg:pt-24 pb-20 bg-[#F8F9FA] font-sans text-slate-900">
        
        {/* ── SEARCH & FILTER TOP BANNER ── */}
        <section className="bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950 text-white py-10 px-4 sm:px-6 lg:px-8 mb-8 shadow-md">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold uppercase tracking-wider mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Certified Marketplace</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  Browse Verified Vehicles
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Discover certified cars from verified dealerships across Pakistan.
                </p>
              </div>

              {/* Quick Search Bar */}
              <div className="w-full md:w-96 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by title, make or model…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-2xl text-xs font-medium pl-10 pr-10 py-3 text-white placeholder-slate-400 outline-none focus:border-[#0055FE] focus:ring-2 focus:ring-[#0055FE]/30 transition-all shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Desktop Filter Sidebar */}
            <aside className="hidden lg:block w-1/4 shrink-0">
              <div className="sticky top-28 bg-white border border-slate-200/80 shadow-sm p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-900">Advanced Filters</h3>
                  {hasActiveFilters && (
                    <button
                      onClick={handleResetFilters}
                      className="text-xs font-bold text-[#0055FE] hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <FilterSidebar
                  selectedMake={selectedMake}
                  setSelectedMake={setSelectedMake}
                  selectedCity={selectedCity}
                  setSelectedCity={setSelectedCity}
                  maxPrice={maxPrice}
                  setMaxPrice={setMaxPrice}
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                  selectedFuel={selectedFuel}
                  setSelectedFuel={setSelectedFuel}
                  selectedTransmission={selectedTransmission}
                  setSelectedTransmission={setSelectedTransmission}
                  selectedBodyType={selectedBodyType}
                  setSelectedBodyType={setSelectedBodyType}
                  mileageMin={mileageMin}
                  setMileageMin={setMileageMin}
                  mileageMax={mileageMax}
                  setMileageMax={setMileageMax}
                  onReset={handleResetFilters}
                />
              </div>
            </aside>

            {/* Main Listings Grid Area */}
            <div className="w-full lg:w-3/4">

              {/* Mobile Filter Button */}
              <div className="flex lg:hidden justify-between items-center mb-4">
                <span className="text-xs font-bold text-slate-600">
                  {total} {total === 1 ? 'Vehicle' : 'Vehicles'} Found
                </span>
                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <SheetTrigger
                    render={
                      <Button
                        variant="outline"
                        className="border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-bold text-xs h-10 rounded-xl"
                      >
                        <SlidersHorizontal className="w-4 h-4 mr-2" />
                        Filters
                      </Button>
                    }
                  />
                  <SheetContent side="right" className="w-[300px] bg-white border-l border-slate-200 p-6 overflow-y-auto">
                    <SheetHeader className="mb-6 px-0">
                      <SheetTitle className="text-slate-900 text-left text-lg font-bold">Filter Vehicles</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-6">
                      <FilterSidebar
                        selectedMake={selectedMake}
                        setSelectedMake={setSelectedMake}
                        selectedCity={selectedCity}
                        setSelectedCity={setSelectedCity}
                        maxPrice={maxPrice}
                        setMaxPrice={setMaxPrice}
                        selectedYear={selectedYear}
                        setSelectedYear={setSelectedYear}
                        selectedFuel={selectedFuel}
                        setSelectedFuel={setSelectedFuel}
                        selectedTransmission={selectedTransmission}
                        setSelectedTransmission={setSelectedTransmission}
                        selectedBodyType={selectedBodyType}
                        setSelectedBodyType={setSelectedBodyType}
                        mileageMin={mileageMin}
                        setMileageMin={setMileageMin}
                        mileageMax={mileageMax}
                        setMileageMax={setMileageMax}
                        onReset={handleResetFilters}
                      />
                      <Button
                        onClick={() => setMobileFiltersOpen(false)}
                        className="w-full bg-[#0055FE] hover:bg-blue-700 text-white font-bold h-11 rounded-xl"
                      >
                        Apply Filters
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Active Filter Badges */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 items-center mb-4 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-xs font-bold text-slate-400 mr-1">Active:</span>
                  {searchQuery && (
                    <Badge variant="outline" className="flex items-center gap-1.5 border-slate-200 text-slate-700 pl-2.5 pr-1.5 py-1 bg-slate-50 text-xs font-semibold rounded-lg">
                      Search: &ldquo;{searchQuery}&rdquo;
                      <button onClick={() => setSearchQuery('')} className="hover:text-rose-600"><X className="w-3.5 h-3.5" /></button>
                    </Badge>
                  )}
                  {selectedMake && (
                    <Badge variant="outline" className="flex items-center gap-1.5 border-slate-200 text-slate-700 pl-2.5 pr-1.5 py-1 bg-slate-50 text-xs font-semibold rounded-lg">
                      Make: {selectedMake}
                      <button onClick={() => setSelectedMake(null)} className="hover:text-rose-600"><X className="w-3.5 h-3.5" /></button>
                    </Badge>
                  )}
                  {selectedCity && (
                    <Badge variant="outline" className="flex items-center gap-1.5 border-slate-200 text-slate-700 pl-2.5 pr-1.5 py-1 bg-slate-50 text-xs font-semibold rounded-lg">
                      City: {selectedCity}
                      <button onClick={() => setSelectedCity(null)} className="hover:text-rose-600"><X className="w-3.5 h-3.5" /></button>
                    </Badge>
                  )}
                  {maxPrice < MAX_PRICE && (
                    <Badge variant="outline" className="flex items-center gap-1.5 border-slate-200 text-slate-700 pl-2.5 pr-1.5 py-1 bg-slate-50 text-xs font-semibold rounded-lg">
                      Under {(maxPrice / 100000).toFixed(0)} Lacs
                      <button onClick={() => setMaxPrice(MAX_PRICE)} className="hover:text-rose-600"><X className="w-3.5 h-3.5" /></button>
                    </Badge>
                  )}
                  {selectedYear && (
                    <Badge variant="outline" className="flex items-center gap-1.5 border-slate-200 text-slate-700 pl-2.5 pr-1.5 py-1 bg-slate-50 text-xs font-semibold rounded-lg">
                      Year: {selectedYear}
                      <button onClick={() => setSelectedYear(null)} className="hover:text-rose-600"><X className="w-3.5 h-3.5" /></button>
                    </Badge>
                  )}
                  {selectedFuel.map((f) => (
                    <Badge key={f} variant="outline" className="flex items-center gap-1.5 border-slate-200 text-slate-700 pl-2.5 pr-1.5 py-1 bg-slate-50 text-xs font-semibold rounded-lg">
                      Fuel: {f}
                      <button onClick={() => setSelectedFuel(selectedFuel.filter((x) => x !== f))} className="hover:text-rose-600"><X className="w-3.5 h-3.5" /></button>
                    </Badge>
                  ))}
                  {selectedTransmission && (
                    <Badge variant="outline" className="flex items-center gap-1.5 border-slate-200 text-slate-700 pl-2.5 pr-1.5 py-1 bg-slate-50 text-xs font-semibold rounded-lg">
                      Transmission: {selectedTransmission}
                      <button onClick={() => setSelectedTransmission(null)} className="hover:text-rose-600"><X className="w-3.5 h-3.5" /></button>
                    </Badge>
                  )}
                  {selectedBodyType && (
                    <Badge variant="outline" className="flex items-center gap-1.5 border-slate-200 text-slate-700 pl-2.5 pr-1.5 py-1 bg-slate-50 text-xs font-semibold rounded-lg">
                      Body: {selectedBodyType}
                      <button onClick={() => setSelectedBodyType(null)} className="hover:text-rose-600"><X className="w-3.5 h-3.5" /></button>
                    </Badge>
                  )}
                  <button onClick={handleResetFilters} className="text-xs font-bold text-[#0055FE] hover:underline ml-auto">
                    Clear All
                  </button>
                </div>
              )}

              {/* Sort Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <span className="text-slate-900 text-xs font-bold mb-3 sm:mb-0 flex items-center gap-2">
                  {isLoadingState ? (
                    <><Loader2 className="w-4 h-4 animate-spin text-[#0055FE]" /> Loading Vehicles…</>
                  ) : (
                    <>{total} {total === 1 ? 'Vehicle' : 'Vehicles'} Available</>
                  )}
                </span>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-xs font-bold text-slate-400 shrink-0">Sort By:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as FetchCarsFilters['sortBy'])}
                    className="flex-1 sm:w-48 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#0055FE] cursor-pointer"
                  >
                    <option value="newest">Newest Listed</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="year-desc">Year: Newest First</option>
                  </select>
                </div>
              </div>

              {/* Cars Grid */}
              {isLoadingState ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : cars.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-300">
                  {cars.map((car) => (
                    <CarCard
                      key={car.id}
                      car={car}
                      isAuthenticated={isAuthenticated}
                      onRequestLogin={() => setLoginModalOpen(true)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 border border-blue-100 text-[#0055FE]">
                    <Car className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 mb-1">No Cars Found</h3>
                  <p className="text-xs font-medium text-slate-500 max-w-sm mb-6">
                    We couldn&apos;t find any vehicles matching your filter criteria. Try clearing or adjusting your search filters.
                  </p>
                  <Button
                    onClick={handleResetFilters}
                    className="bg-[#0055FE] hover:bg-blue-700 text-white font-bold text-xs h-11 px-6 rounded-xl shadow-md shadow-blue-500/20"
                  >
                    Clear All Filters
                  </Button>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && !isLoadingState && (
                <div className="flex justify-center items-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-slate-200 text-slate-600 bg-white rounded-xl"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 7) }).map((_, idx) => {
                    const page = idx + 1;
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? 'default' : 'outline'}
                        className={`w-10 h-10 text-xs font-bold rounded-xl ${
                          page === currentPage
                            ? 'bg-[#0055FE] text-white hover:bg-blue-700 border-none shadow-md shadow-blue-500/20'
                            : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                        }`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-slate-200 text-slate-600 bg-white rounded-xl"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ── LOGIN REQUIRED MODAL FOR WISHLIST ── */}
        {loginModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setLoginModalOpen(false)}
            />
            <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <button
                onClick={() => setLoginModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-4">
                <Lock className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-extrabold text-slate-900 mb-1">Sign In to Save Favorites</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6 font-medium">
                Please sign in to your CarFever account to add vehicles to your Wishlist and access them anytime.
              </p>

              <div className="flex flex-col gap-2.5">
                <Button
                  onClick={() => router.push(`/login?redirect=${encodeURIComponent('/buy-car')}`)}
                  className="w-full bg-[#0055FE] hover:bg-blue-700 text-white font-bold h-11 text-xs rounded-xl shadow-md shadow-blue-500/20"
                >
                  Sign In to Account
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLoginModalOpen(false)}
                  className="w-full border-slate-200 text-slate-600 font-bold h-11 text-xs rounded-xl"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

export default function BuyCarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0055FE]" />
        </div>
      }
    >
      <BuyCarContent />
    </Suspense>
  );
}
