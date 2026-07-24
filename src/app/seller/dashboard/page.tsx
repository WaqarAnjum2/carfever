'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Car,
  Eye,
  User,
  Plus,
  ArrowUpRight,
  TrendingUp,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { fetchSellerCars } from '@/lib/admin-actions';

export default function SellerDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    myCars: 0,
    totalViews: 0,
  });
  const [recentCars, setRecentCars] = useState<any[]>([]);

  useEffect(() => {
    async function loadDealerData() {
      try {
        const carsRes = await fetchSellerCars(undefined, 1, 5).catch(() => ({ data: [], total: 0, page: 1, totalPages: 1 }));
        const carsList = (carsRes as any)?.data || [];
        const totalViews = carsList.reduce((acc: number, c: any) => acc + (c.views_count || 0), 0);

        setStats({
          myCars: (carsRes as any)?.total || carsList.length || 0,
          totalViews,
        });

        setRecentCars(carsList);
      } catch (err) {
        console.error('Failed to load dealer metrics', err);
      } finally {
        setLoading(false);
      }
    }

    loadDealerData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            Loading Dealer Dashboard…
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl shadow-purple-900/10">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold mb-3 border border-white/15 text-purple-200">
              <TrendingUp className="w-3.5 h-3.5 text-purple-300" />
              <span>Dealer Performance Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Welcome to Your Dealer Portal
            </h1>
            <p className="text-sm text-purple-200/90 mt-1 max-w-xl">
              Track vehicle view metrics, manage active inventory listings, update pricing, and list new cars for sale.
            </p>
          </div>

          <Link
            href="/seller/sell-car"
            className="inline-flex items-center gap-2 px-5 py-3 bg-white text-purple-900 hover:bg-purple-50 font-bold rounded-2xl text-xs transition-all shadow-lg shadow-black/10 active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 text-purple-700" />
            <span>List New Car</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Vehicle Listings</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.myCars}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <Car className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Listing Views</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.totalViews}</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0055FE]">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account Status</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">Verified Dealer</h3>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          href="/seller/cars"
          className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-300 hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                Manage My Cars
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Edit, mark sold, or update prices</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/seller/sell-car"
          className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-300 hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                Post New Car Ad
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">List a new vehicle on marketplace</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/seller/settings/profile"
          className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-300 hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0055FE] flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#0055FE] transition-colors">
                Dealer Settings
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">Manage profile & dealership info</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Recent Vehicles Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Your Recent Listings</h3>
            <p className="text-xs text-slate-400 mt-0.5">Overview of vehicles posted on the marketplace</p>
          </div>
          <Link
            href="/seller/cars"
            className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1"
          >
            <span>View All Cars</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentCars.length === 0 ? (
          <div className="p-8 text-center">
            <Car className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">No vehicle listings yet</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Post your first vehicle to reach thousands of buyers across the UK.</p>
            <Link
              href="/seller/sell-car"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20"
            >
              <Plus className="w-3.5 h-3.5" /> List Vehicle Now
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentCars.map((car) => (
              <div key={car.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {car.image_url ? (
                      <img src={car.image_url} alt={car.title} className="w-full h-full object-cover" />
                    ) : (
                      <Car className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{car.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      £{Number(car.price || 0).toLocaleString()} &bull; {car.city || 'UK'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                    {car.status || 'Active'}
                  </span>
                  <Link
                    href={`/buy-car/${car.id}`}
                    prefetch={false}
                    className="p-2 rounded-xl text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                    title="View Listing Page"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

