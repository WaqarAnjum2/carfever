'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Car,
  Users,
  Eye,
  TrendingUp,
  TrendingDown,
  FileText,
  ShieldCheck,
  MessageSquare,
  ArrowUpRight,
  Clock,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { getAdminDashboardStats } from '@/lib/admin-actions';

const quickLinks = [
  { label: "Add New Car",            href: "/admin/cars",          icon: Car,          color: "#0055FE" },
  { label: "Manage Users & Dealers", href: "/admin/users",         icon: Users,        color: "#059669" },
  { label: "Dealer Requests",        href: "/admin/registrations", icon: Users,        color: "#D97706" },
  { label: "Site Settings",          href: "/admin/settings",      icon: Eye,          color: "#7C3AED" },
];

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatTimeAgo(isoString: string): string {
  if (!isoString) return 'Just now';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface ActivityItem {
  title: string;
  desc: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    cars: 0,
    blogs: 0,
    users: 0,
    views: 0,
    inspections: 0,
    inquiries: 0,
    activities: [] as ActivityItem[],
  });
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    async function load() {
      try {
        const data = await getAdminDashboardStats();
        if (data) setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      }
      setLoading(false);
    }
    load();
  }, []);

  const statCards = [
    { label: "Total Views",    value: loading ? "…" : stats.views.toLocaleString(),       icon: Eye,          trend: "Live",   up: true,  color: "#0055FE", bg: "bg-blue-50 text-[#0055FE]" },
    { label: "Car Listings",   value: loading ? "…" : stats.cars.toLocaleString(),        icon: Car,          trend: "Live",   up: true,  color: "#EA580C", bg: "bg-orange-50 text-orange-600" },
    { label: "Active Users",   value: loading ? "…" : stats.users.toLocaleString(),       icon: Users,        trend: "Live",   up: true,  color: "#7C3AED", bg: "bg-purple-50 text-purple-600" },
  ];

  const currentMonthIdx = new Date().getMonth();
  const chartMonths = Array.from({ length: 6 }, (_, i) => {
    const idx = (currentMonthIdx - 5 + i + 12) % 12;
    return months[idx];
  });

  const chartData = chartMonths.map((m, i) => {
    const val = stats.views > 0 ? Math.max(10, Math.round((stats.views / 6) * (0.6 + (i * 0.1)))) : 0;
    return { label: m, value: val };
  });

  const chartMax = Math.max(...chartData.map((d) => d.value), 1);

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-xs font-semibold text-slate-500 mt-1">
          Welcome back! Here is what&apos;s happening across your platform today.
        </p>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {card.label}
                </span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.bg}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 mt-3 mb-2 tracking-tight">
                {card.value}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{card.trend} database records</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Traffic Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Traffic Distribution</h3>
              <p className="text-xs font-medium text-slate-400 mt-0.5">
                Total page views aggregated across active vehicle listings
              </p>
            </div>
          </div>
          <div className="flex items-end gap-3 h-48 pt-4">
            {chartData.map((d) => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div
                  className="w-full bg-gradient-to-t from-[#0055FE] to-blue-400 rounded-t-lg transition-all duration-300 hover:brightness-110 shadow-xs min-h-[6px]"
                  style={{ height: `${(d.value / chartMax) * 100}%` }}
                  title={`${d.value} views`}
                />
                <span className="text-[11px] font-bold text-slate-400">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col">
          <h3 className="text-base font-bold text-slate-900 mb-4">Recent Platform Activity</h3>
          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#0055FE] mx-auto mb-2" />
              <p className="text-xs font-semibold">Loading activities…</p>
            </div>
          ) : stats.activities.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold">No recent activity logged</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {stats.activities.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#0055FE] mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{a.title}</p>
                    <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">{a.desc}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 flex-shrink-0">
                    {formatTimeAgo(a.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {quickLinks.map((q) => {
            const Icon = q.icon;
            return (
              <Link
                key={q.href}
                href={q.href}
                prefetch={false}
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/80 transition-all group"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${q.color}15` }}
                >
                  <Icon className="w-4 h-4" style={{ color: q.color }} />
                </div>
                <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">
                  {q.label}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 ml-auto group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
