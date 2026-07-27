"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  CheckSquare,
  Square,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Eye,
  Phone,
  Mail,
  User,
  AlertCircle,
  Fuel,
  Gauge,
  MapPin,
  Calendar,
  Zap,
  Loader2,
  Building2,
} from "lucide-react";
import {
  getPendingCarListings,
  approveCarListing,
  rejectCarListing,
  bulkApproveCarListings,
  approveAllPendingListings,
} from "@/lib/admin-actions";

export default function AdminApprovalsPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [cars, setCars] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [make, setMake] = useState("all");
  const [city, setCity] = useState("all");

  // Multi-selection for bulk approval
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Rejection modal state
  const [rejectModalCar, setRejectModalCar] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadPendingListings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPendingCarListings({
        page,
        limit: 12,
        search,
        make: make === "all" ? undefined : make,
        city: city === "all" ? undefined : city,
      });

      setCars(res.cars || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      showToast(err?.message || "Failed to load pending listings", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, make, city]);

  useEffect(() => {
    loadPendingListings();
  }, [loadPendingListings]);

  // Single Approve Action
  const handleApprove = async (id: string, verified = false) => {
    setActionLoading(id);
    try {
      await approveCarListing(id, { verified });
      setCars((prev) => prev.filter((c) => c.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      showToast(verified ? "Listing approved & marked as Verified!" : "Listing approved successfully!");
    } catch (err: any) {
      showToast(err?.message || "Failed to approve listing", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Single Reject Action
  const handleConfirmReject = async () => {
    if (!rejectModalCar) return;
    const id = rejectModalCar.id;
    setActionLoading(id);
    try {
      await rejectCarListing(id, rejectionReason);
      setCars((prev) => prev.filter((c) => c.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      setRejectModalCar(null);
      setRejectionReason("");
      showToast("Listing rejected.", "error");
    } catch (err: any) {
      showToast(err?.message || "Failed to reject listing", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Bulk Approve Selected
  const handleBulkApproveSelected = async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      await bulkApproveCarListings(selectedIds);
      showToast(`Successfully approved ${selectedIds.length} listings!`);
      setSelectedIds([]);
      await loadPendingListings();
    } catch (err: any) {
      showToast(err?.message || "Bulk approval failed", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  // Approve All Pending
  const handleApproveAll = async () => {
    if (total === 0) return;
    if (!confirm(`Are you sure you want to approve ALL ${total} pending car listings at once?`)) return;

    setBulkLoading(true);
    try {
      await approveAllPendingListings();
      showToast("All pending car listings have been approved!");
      setSelectedIds([]);
      await loadPendingListings();
    } catch (err: any) {
      showToast(err?.message || "Failed to approve all listings", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  // Select All Checkbox Handler
  const toggleSelectAll = () => {
    if (selectedIds.length === cars.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cars.map((c) => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto font-sans text-slate-900 space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-sm font-bold animate-slide-up ${
            toastMessage.type === "success"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20"
              : "bg-rose-600 text-white border-rose-500 shadow-rose-500/20"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ── HEADER BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B132B] via-[#0048D9] to-[#0055FE] text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Admin Verification Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Pending Car Approvals Desk
            </h1>
            <p className="text-sm text-blue-100/90 mt-1 max-w-xl">
              Review, verify, or bulk-approve new car submissions from dealers and private sellers before they go live publicly.
            </p>
          </div>

          {/* Quick Counter Badge & Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/30 border border-amber-400/40 flex items-center justify-center font-black text-amber-300 text-lg">
                {total}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-blue-200 font-bold">Pending Review</span>
                <span className="text-sm font-extrabold text-white">{total === 1 ? "1 Listing" : `${total} Listings`}</span>
              </div>
            </div>

            <button
              onClick={handleApproveAll}
              disabled={bulkLoading || total === 0}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />}
              <span>Approve All ({total})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR & FILTERS ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search make, model, seller..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#0055FE] transition-colors"
            />
          </div>

          {/* Filters & Refresh */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <select
              value={make}
              onChange={(e) => setMake(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0055FE]"
            >
              <option value="all">All Brands</option>
              <option value="Toyota">Toyota</option>
              <option value="Honda">Honda</option>
              <option value="BMW">BMW</option>
              <option value="Mercedes">Mercedes</option>
              <option value="Audi">Audi</option>
              <option value="Suzuki">Suzuki</option>
              <option value="KIA">KIA</option>
              <option value="Hyundai">Hyundai</option>
            </select>

            <button
              onClick={() => loadPendingListings()}
              disabled={loading}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Multi-selection Bar */}
        {cars.length > 0 && (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-[#0055FE] transition-colors cursor-pointer"
            >
              {selectedIds.length === cars.length && cars.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-[#0055FE]" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Select All on Page ({cars.length})</span>
            </button>

            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkApproveSelected}
                disabled={bulkLoading}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                {bulkLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Approve Selected ({selectedIds.length})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── LISTINGS GRID ── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-10 h-10 text-[#0055FE] animate-spin mb-3" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Loading Pending Submissions…
          </p>
        </div>
      ) : cars.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center shadow-xs">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">All Caught Up!</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
            There are currently no pending car listings requiring admin approval. All submitted listings are reviewed and live on the marketplace.
          </p>
          <button
            onClick={() => loadPendingListings()}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
          >
            Check Again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car) => {
            const isSelected = selectedIds.includes(car.id);
            const isProcessing = actionLoading === car.id;
            const images = Array.isArray(car.images) && car.images.length > 0 ? car.images : [car.image_url || "/carfever-logo.png"];

            return (
              <div
                key={car.id}
                className={`bg-white rounded-3xl border transition-all duration-300 shadow-sm hover:shadow-md flex flex-col overflow-hidden relative ${
                  isSelected ? "border-[#0055FE] ring-2 ring-blue-500/20" : "border-slate-200"
                }`}
              >
                {/* Select Checkbox Top Left */}
                <button
                  onClick={() => toggleSelectOne(car.id)}
                  className="absolute top-3 left-3 z-20 p-1.5 rounded-xl bg-white/90 backdrop-blur-md shadow-sm border border-slate-200 text-slate-700 cursor-pointer"
                >
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-[#0055FE]" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                {/* Status Badge Top Right */}
                <div className="absolute top-3 right-3 z-20 px-3 py-1 rounded-full bg-amber-500 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-md">
                  Pending Review
                </div>

                {/* Image Header */}
                <div className="relative h-48 bg-slate-100 overflow-hidden group">
                  <img
                    src={images[0]}
                    alt={car.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                  
                  {/* Price Tag Overlay */}
                  <div className="absolute bottom-3 left-3 text-white">
                    <span className="text-xs uppercase tracking-wider text-blue-200 font-bold">Asking Price</span>
                    <div className="text-xl font-black leading-none mt-0.5">
                      £{(car.price || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900 line-clamp-1">
                      {car.title || `${car.year} ${car.make} ${car.model}`}
                    </h4>
                    
                    {/* Key Specs Chips */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-[11px] font-bold text-slate-700">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {car.year}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-[11px] font-bold text-slate-700">
                        <Gauge className="w-3 h-3 text-slate-400" />
                        {car.mileage ? `${car.mileage.toLocaleString()} mi` : "N/A"}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-[11px] font-bold text-slate-700">
                        <Fuel className="w-3 h-3 text-slate-400" />
                        {car.fuel_type || "Petrol"}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-[11px] font-bold text-slate-700">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {car.city || "UK"}
                      </span>
                    </div>
                  </div>

                  {/* Seller / Dealer Info */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#0055FE]" />
                        {car.seller_name || "Private Seller"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {new Date(car.created_at || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                    {car.seller_phone && (
                      <a href={`tel:${car.seller_phone}`} className="flex items-center gap-1.5 text-slate-600 hover:text-[#0055FE] transition-colors font-medium">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        {car.seller_phone}
                      </a>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      onClick={() => handleApprove(car.id, true)}
                      disabled={isProcessing}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-[#0055FE] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        </>
                      )}
                      <span>Approve & Verify Car</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/cars/${car.id}`}
                        target="_blank"
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                        title="View Full Car Details in Admin Panel"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#0055FE]" />
                        <span>View Details</span>
                      </Link>

                      <button
                        onClick={() => setRejectModalCar(car)}
                        disabled={isProcessing}
                        className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                        title="Reject Listing"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── PAGINATION ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-slate-200">
          <span className="text-xs font-bold text-slate-500">
            Page {page} of {totalPages} ({total} Total Pending)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="px-3.5 py-2 rounded-xl bg-[#0055FE] text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ── REJECTION MODAL ── */}
      {rejectModalCar && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-500" />
                Reject Car Listing
              </h3>
              <button
                onClick={() => setRejectModalCar(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to reject <strong>{rejectModalCar.title}</strong>? You can optionally provide feedback to the seller.
            </p>

            <textarea
              rows={3}
              placeholder="Reason for rejection (e.g., incomplete photos, invalid price)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-rose-500"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectModalCar(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-md shadow-rose-500/20 cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
