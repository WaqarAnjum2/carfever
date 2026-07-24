'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ExternalLink,
  MapPin,
  Calendar,
  Gauge,
  Fuel,
  Sliders,
  DollarSign,
  User,
  Phone,
  Mail,
  Eye,
  ShieldCheck,
  Tag,
  Sparkles,
  Car as CarIcon,
  MessageSquare,
  Maximize2,
  X,
  Clock,
  Save,
  Upload,
  Plus,
  Check,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchCarDetailsById, approveCar, rejectCar, deleteCar, updateCar, uploadImage, deleteStorageImage } from '@/lib/admin-actions';
import { convertMultipleToWebP } from '@/lib/image-utils';

const CAR_FEATURES_LIST = [
  "Sunroof / Moonroof",
  "Navigation / Touchscreen",
  "Leather Seats",
  "ABS Brakes",
  "Airbags",
  "Cruise Control",
  "Alloy Rims",
  "Reverse Camera",
  "Push Start Button",
  "Climate Control",
  "Keyless Entry",
  "Power Windows",
];


function formatPricePKR(price?: number): string {
  if (!price || isNaN(price)) return '£0';
  return `£${price.toLocaleString('en-GB')}`;
}


function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; dot: string; label: string }> = {
    approved: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Approved & Live' },
    rejected: { bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', label: 'Rejected' },
    pending:  { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500 animate-pulse', label: 'Pending Review' },
  };
  const item = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${item.bg} shadow-xs`}>
      <span className={`w-2 h-2 rounded-full ${item.dot}`} />
      {item.label}
    </span>
  );
}

const EXTERIOR_COLORS = [
  'White',
  'Black',
  'Silver',
  'Grey',
  'Red',
  'Blue',
  'Pearl White',
  'Bronze',
];

const INTERIOR_COLORS = [
  'Black',
  'Beige',
  'Grey',
  'Red / Leather',
  'Tan',
  'Brown',
];

export default function CarDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const pathname = usePathname();
  const router = useRouter();
  const isSeller = pathname.startsWith('/seller');
  const backUrl = isSeller ? '/seller/cars' : '/admin/cars';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ car: any; sellerProfile: any; inquiryCount: number } | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [editForm, setEditForm] = useState<any>({
    title: '',
    make: '',
    model: '',
    year: '',
    price: '',
    mileage: '',
    engine: '',
    exterior_color: '',
    interior_color: '',
    body_type: 'Sedan',
    fuel_type: 'Petrol',
    transmission: 'Automatic',
    city: '',
    seller_name: '',
    seller_phone: '',
    description: '',
    status: 'pending',
  });
  const [editImages, setEditImages] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      loadDetails();
    }
  }, [id]);

  async function loadDetails() {
    setLoading(true);
    try {
      const res = await fetchCarDetailsById(id);
      setData(res);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load vehicle details');
    } finally {
      setLoading(false);
    }
  }

function extractCarFeatures(featuresRaw: any, descriptionRaw?: string | null): { features: string[]; description: string } {
  let list: string[] = [];

  if (Array.isArray(featuresRaw) && featuresRaw.length > 0) {
    list = featuresRaw.map(f => String(f).trim()).filter(Boolean);
  } else if (typeof featuresRaw === 'string' && featuresRaw.trim().length > 0) {
    try {
      const parsed = JSON.parse(featuresRaw);
      if (Array.isArray(parsed)) {
        list = parsed.map(f => String(f).trim()).filter(Boolean);
      } else {
        list = featuresRaw.split(',').map(f => f.trim()).filter(Boolean);
      }
    } catch {
      list = featuresRaw.split(',').map(f => f.trim()).filter(Boolean);
    }
  }

  let cleanDesc = descriptionRaw || '';

  if (cleanDesc.includes('Features:')) {
    const match = cleanDesc.match(/Features:\s*([^\n\r]+)/i);
    if (match && match[1]) {
      const extracted = match[1].split(',').map(f => f.trim()).filter(Boolean);
      extracted.forEach(f => {
        if (!list.includes(f)) {
          list.push(f);
        }
      });
      cleanDesc = cleanDesc.replace(/\n?Features:\s*[^\n\r]+/i, '').trim();
    }
  }

  return { features: list, description: cleanDesc };
}

  const openEditModal = () => {
    if (!data) return;
    const c = data.car;
    const s = data.sellerProfile;
    const { features: parsedFeatures, description: cleanDescription } = extractCarFeatures(c.features, c.description);

    let editPrice = c.price || '';
    if (typeof editPrice === 'number') {
      while (editPrice >= 1000000000) {
        editPrice = editPrice / 100000;
      }
    }

    setEditForm({
      title: c.title || '',
      make: c.make || c.brand || '',
      model: c.model || '',
      year: c.year || new Date().getFullYear(),
      price: editPrice,
      mileage: c.mileage || '',
      engine: c.engine ? c.engine.toString().replace(/[^0-9]/g, '') : (c.engine_capacity ? c.engine_capacity.toString().replace(/[^0-9]/g, '') : ''),
      exterior_color: c.exterior_color || c.color || '',
      interior_color: c.interior_color || '',
      body_type: c.body_type || 'Sedan',
      fuel_type: c.fuel_type || 'Petrol',
      transmission: c.transmission || 'Automatic',
      city: c.city || '',
      seller_name: c.seller_name || s?.name || '',
      seller_phone: c.seller_phone || s?.phone || '',
      description: cleanDescription,
      status: c.status || 'pending',
      features: parsedFeatures,
    });
    const imgs: string[] = Array.isArray(c.images) && c.images.length > 0
      ? [...c.images]
      : c.image_url ? [c.image_url] : [];
    setEditImages(imgs);
    setIsEditing(true);
  };

  const searchParams = useSearchParams();
  useEffect(() => {
    if (data && searchParams.get('edit') === 'true' && !isEditing) {
      openEditModal();
    }
  }, [data, searchParams]);

  const handleStatusChange = async (newStatus: 'approved' | 'rejected') => {
    try {
      if (newStatus === 'approved') await approveCar(id);
      else await rejectCar(id);

      toast.success(`Vehicle listing ${newStatus}`);
      setData((prev) => (prev ? { ...prev, car: { ...prev.car, status: newStatus } } : null));
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this car listing?')) return;
    try {
      await deleteCar(id);
      toast.success('Vehicle listing deleted');
      router.push(backUrl);
    } catch {
      toast.error('Failed to delete car listing');
    }
  };

  const handleKeyDownNumber = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target;
    if (['price', 'mileage', 'engine', 'year'].includes(name)) {
      value = value.replace(/[^0-9.]/g, '');
      if (value !== '' && parseFloat(value) < 0) value = '0';
    }
    setEditForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleRemoveImage = async (indexToRemove: number) => {
    const urlToRemove = editImages[indexToRemove];
    if (urlToRemove && urlToRemove.includes('car-images')) {
      toast.info('Deleting image from storage bucket...');
      try {
        await deleteStorageImage(urlToRemove);
      } catch (err) {
        console.error('Failed to delete image from bucket:', err);
      }
    }
    setEditImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    toast.success('Image removed from listing');
  };

  const handleUploadNewImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingImages(true);
    toast.info('Converting images to WebP & uploading to storage...');
    try {
      const rawFiles = Array.from(e.target.files);
      const webpFiles = await convertMultipleToWebP(rawFiles);
      const uploadedUrls: string[] = [];
      for (const file of webpFiles) {
        const url = await uploadImage(file);
        if (url) uploadedUrls.push(url);
      }
      setEditImages((prev) => [...prev, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} image(s) uploaded successfully!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const computedTitle = editForm.title || `${editForm.year} ${editForm.make} ${editForm.model}`;
      const engineValue = editForm.engine ? `${editForm.engine} cc` : null;

        const rawDesc = (editForm.description || '').replace(/\n?Features:\s*[^\n\r]+/i, '').trim();
        const finalDesc = editForm.features && editForm.features.length > 0
          ? `${rawDesc}\nFeatures: ${editForm.features.join(', ')}`.trim()
          : (rawDesc || null);

          const cleanEditImages = editImages.filter((url: any) => typeof url === 'string' && url.trim().length > 0);

          const payload: any = {
            title: computedTitle,
            make: editForm.make,
            brand: editForm.make,
            model: editForm.model,
            year: parseInt(String(editForm.year)) || new Date().getFullYear(),
            price: parseFloat(String(editForm.price)) || 0,
            currency: 'PKR',
            mileage: editForm.mileage ? parseInt(String(editForm.mileage)) : null,
            engine: engineValue,
            engine_capacity: engineValue,
            exterior_color: editForm.exterior_color || null,
            interior_color: editForm.interior_color || null,
            color: editForm.exterior_color || null,
            body_type: editForm.body_type || 'Sedan',
            fuel_type: editForm.fuel_type,
            transmission: editForm.transmission,
            city: editForm.city || null,
            seller_name: editForm.seller_name || null,
            seller_phone: editForm.seller_phone || null,
            description: finalDesc,
            features: editForm.features || [],
            status: editForm.status,
            images: cleanEditImages,
            image_url: cleanEditImages[0] || null,
          };

        await updateCar(id, payload);
        toast.success('Vehicle listing updated successfully!');
        
        setActiveImageIndex(0);
        // Update local view state
        setData((prev: any) => ({
          ...prev,
          car: {
            ...prev.car,
            ...payload,
          },
        }));
        setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update vehicle listing');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-pulse p-4">
        <div className="h-6 w-36 bg-slate-200 rounded-lg" />
        <div className="h-10 w-96 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-96 bg-slate-200 rounded-3xl" />
          <div className="h-96 bg-slate-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!data || !data.car) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <CarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Vehicle Listing Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          The requested car listing does not exist or may have been deleted.
        </p>
        <Link
          href={backUrl}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0055FE] text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Inventory
        </Link>
      </div>
    );
  }

  const { car, sellerProfile, inquiryCount } = data;

  const rawImages: string[] =
    Array.isArray(car.images) && car.images.length > 0
      ? car.images
      : car.image_url
      ? [car.image_url]
      : [];

  const cleanImages = rawImages.filter((u: any) => typeof u === 'string' && u.trim().length > 0);

  const images: string[] = cleanImages;

  const safeActiveIndex = activeImageIndex < images.length ? activeImageIndex : 0;

  const featuresList: string[] = Array.isArray(car.features)
    ? car.features
    : typeof car.features === 'string'
    ? car.features.split(',').map((f: string) => f.trim()).filter(Boolean)
    : [];

  const inputClass =
    'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0055FE] focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold text-xs';
  const labelClass = 'block text-xs font-extrabold text-slate-700 mb-1';

  return (
    <div className="space-y-6 max-w-7xl pb-16">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <Link
          href={backUrl}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#0055FE] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Car Inventory
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          {!isEditing ? (
            <>
              {!isSeller && car.status !== 'approved' && (
                <button
                  onClick={() => handleStatusChange('approved')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold transition-all cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" /> Approve Listing
                </button>
              )}

              {!isSeller && car.status !== 'rejected' && (
                <button
                  onClick={() => handleStatusChange('rejected')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-xs font-bold transition-all cursor-pointer"
                >
                  <XCircle className="w-4 h-4" /> Reject Listing
                </button>
              )}

              <button
                onClick={openEditModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0055FE] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <Edit className="w-4 h-4" /> Edit Vehicle
              </button>

              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-bold transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <X className="w-4 h-4" /> Cancel Editing
            </button>
          )}
        </div>
      </div>

      {/* IN-PLACE EDIT MODE FORM */}
      {isEditing ? (
        <form onSubmit={handleSaveEdit} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-lg space-y-8 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-[#0055FE]" /> Advanced Vehicle Edit Mode
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Update technical specifications, seller information, and manage images with bucket deletion.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-[#0055FE] text-xs font-extrabold border border-blue-100">
              Editing Mode Active
            </span>
          </div>

          {/* Section 1: Basic Specifications */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
              1. Title & Core Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Make / Brand</label>
                <input
                  type="text"
                  name="make"
                  value={editForm.make}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. Toyota"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Model</label>
                <input
                  type="text"
                  name="model"
                  value={editForm.model}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. Corolla"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Model Year</label>
                <input
                  type="number"
                  name="year"
                  min="1950"
                  max="2030"
                  value={editForm.year}
                  onKeyDown={handleKeyDownNumber}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 2022"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Price (GBP £)</label>
                <input
                  type="number"
                  name="price"
                  min="0"
                  value={editForm.price}
                  onKeyDown={handleKeyDownNumber}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. 18500"
                  className={inputClass}
                />
              </div>


              <div>
                <label className={labelClass}>Mileage (KM)</label>
                <input
                  type="number"
                  name="mileage"
                  min="0"
                  value={editForm.mileage}
                  onKeyDown={handleKeyDownNumber}
                  onChange={handleFormChange}
                  placeholder="e.g. 45000"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Engine Capacity (CC)</label>
                <input
                  type="number"
                  name="engine"
                  min="0"
                  value={editForm.engine}
                  onKeyDown={handleKeyDownNumber}
                  onChange={handleFormChange}
                  placeholder="e.g. 1800"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Colors & Style */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
              2. Colors, Body & Transmission
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>Exterior Color</label>
                <input
                  type="text"
                  name="exterior_color"
                  value={editForm.exterior_color}
                  onChange={handleFormChange}
                  placeholder="e.g. Pearl White"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Interior Color</label>
                <input
                  type="text"
                  name="interior_color"
                  value={editForm.interior_color}
                  onChange={handleFormChange}
                  placeholder="e.g. Black / Beige"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Body Type</label>
                <select
                  name="body_type"
                  value={editForm.body_type}
                  onChange={handleFormChange}
                  className={inputClass}
                >
                  <option value="Sedan">Sedan</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="SUV">SUV / Crossover</option>
                  <option value="Pickup">Pickup Truck</option>
                  <option value="Coupe">Coupe</option>
                  <option value="Van">Van / MPV</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Fuel Type</label>
                <select
                  name="fuel_type"
                  value={editForm.fuel_type}
                  onChange={handleFormChange}
                  className={inputClass}
                >
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Electric">Electric</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Transmission</label>
                <select
                  name="transmission"
                  value={editForm.transmission}
                  onChange={handleFormChange}
                  className={inputClass}
                >
                  <option value="Automatic">Automatic</option>
                  <option value="Manual">Manual</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>City Location</label>
                <input
                  type="text"
                  name="city"
                  value={editForm.city}
                  onChange={handleFormChange}
                  placeholder="e.g. Lahore"
                  className={inputClass}
                />
              </div>

              {!isSeller && (
                <div>
                  <label className={labelClass}>Listing Status</label>
                  <select
                    name="status"
                    value={editForm.status}
                    onChange={handleFormChange}
                    className={inputClass}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Owner Information & Description */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
              3. Seller Information & Description
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Seller Contact Name</label>
                <input
                  type="text"
                  name="seller_name"
                  value={editForm.seller_name}
                  onChange={handleFormChange}
                  placeholder="e.g. Ahmad Ali"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Seller Phone Number</label>
                <input
                  type="text"
                  name="seller_phone"
                  value={editForm.seller_phone}
                  onChange={handleFormChange}
                  placeholder="e.g. 03001234567"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Detailed Seller Description</label>
              <textarea
                name="description"
                rows={5}
                value={editForm.description}
                onChange={handleFormChange}
                placeholder="Describe features, maintenance history, condition..."
                className={`${inputClass} leading-relaxed`}
              />
            </div>
          </div>

          {/* Section: Vehicle Features & Equipment */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                3b. Features & Vehicle Options
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {(editForm.features || []).length} Selected
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {CAR_FEATURES_LIST.map((feat) => {
                const checked = (editForm.features || []).includes(feat);
                return (
                  <button
                    key={feat}
                    type="button"
                    onClick={() => {
                      setEditForm((prev: any) => {
                        const current = prev.features || [];
                        const next = current.includes(feat)
                          ? current.filter((f: string) => f !== feat)
                          : [...current, feat];
                        return { ...prev, features: next };
                      });
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-left ${
                      checked
                        ? "bg-blue-50 border-blue-200 text-[#0055FE]"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <CheckCircle className={`w-3.5 h-3.5 shrink-0 ${checked ? "text-[#0055FE]" : "text-slate-300"}`} />
                    <span className="truncate">{feat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Image Management with Storage Bucket Deletion */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                4. Manage Vehicle Images (Bucket Storage Sync)
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {editImages.length} Image(s) Attached
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {editImages.map((imgUrl, idx) => (
                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 group shadow-xs">
                  <img src={imgUrl} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    title="Delete Image from Storage Bucket"
                    className="absolute top-1.5 right-1.5 p-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-md cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                    #{idx + 1}
                  </span>
                </div>
              ))}

              <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#0055FE] bg-slate-50/50 hover:bg-blue-50/30 flex flex-col items-center justify-center cursor-pointer transition-all text-center p-2">
                {uploadingImages ? (
                  <RefreshCw className="w-5 h-5 text-[#0055FE] animate-spin mb-1" />
                ) : (
                  <Upload className="w-5 h-5 text-[#0055FE] mb-1" />
                )}
                <span className="text-[11px] font-extrabold text-slate-700">
                  {uploadingImages ? 'Uploading...' : 'Add WebP Photo'}
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleUploadNewImages}
                  disabled={uploadingImages}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0055FE] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Vehicle Updates
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* Main Title & Price Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  {car.title}
                </h1>
                <StatusBadge status={car.status || 'pending'} />
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                <span>{car.brand || car.make}</span>
                <span>•</span>
                <span>{car.model}</span>
                <span>•</span>
                <span>{car.year} Model</span>
                {car.city && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-[#0055FE]" /> {car.city}
                    </span>
                  </>
                )}
              </p>
            </div>

            <div className="text-left md:text-right bg-blue-50/60 p-4 rounded-2xl border border-blue-100">
              <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">Listing Price</p>
              <p className="text-2xl md:text-3xl font-black text-slate-900 mt-0.5">
                {formatPricePKR(car.price)}
              </p>
              <p className="text-xs font-bold text-slate-500">
                PKR {car.price?.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Certified Inspector Verification Banner */}
          {car.is_inspected && (
            <div className="bg-emerald-50/90 border border-emerald-200 p-5 rounded-2xl shadow-xs flex flex-col justify-between gap-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-black text-emerald-950 uppercase tracking-wide">
                        CarFever Certified 200+ Point Inspected
                      </h3>
                      {car.inspection_rating && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-extrabold shadow-xs">
                          ★ {car.inspection_rating} / 10
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-emerald-800 mt-1">
                      This vehicle has passed physical audit and technical verification by our certified inspection engineer team.
                    </p>
                  </div>
                </div>

                {car.inspected_at && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-3 py-1.5 rounded-xl self-start md:self-auto whitespace-nowrap">
                    Inspected {new Date(car.inspected_at).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Inspector Contact Info & Audit Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-emerald-200/60">
                <div className="bg-white/80 p-3 rounded-xl border border-emerald-200/60">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-900 tracking-wider block mb-1">
                    Certified Inspector Details
                  </span>
                  <div className="text-xs font-bold text-slate-900">
                    {car.inspector_name || "Official CarFever Inspector"}
                  </div>
                  {car.inspector_email && (
                    <div className="text-[11px] font-medium text-slate-600 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-emerald-600" /> {car.inspector_email}
                    </div>
                  )}
                  {car.inspector_phone && (
                    <div className="text-[11px] font-medium text-slate-600 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-emerald-600" /> {car.inspector_phone}
                    </div>
                  )}
                </div>

                <div className="bg-white/80 p-3 rounded-xl border border-emerald-200/60">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-900 tracking-wider block mb-1">
                    Inspector Verification Notes
                  </span>
                  <p className="text-xs font-medium text-emerald-950 italic">
                    "{car.inspection_notes || "All major components inspected and verified."}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Hero Grid: Gallery & Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Interactive Image Gallery */}
            <div className="lg:col-span-2 space-y-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              {images.length > 0 ? (
                <div className="relative w-full h-80 md:h-96 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 group">
                  <img
                    src={images[safeActiveIndex] || images[0]}
                    alt={car.title}
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                      onClick={() => setLightboxOpen(true)}
                      className="p-2 rounded-xl bg-black/70 hover:bg-black/90 text-white text-xs font-bold backdrop-blur-md transition-all cursor-pointer shadow-lg"
                      title="Expand Fullscreen Image"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md text-white text-xs font-bold px-3.5 py-1.5 rounded-full">
                    Photo {safeActiveIndex + 1} of {images.length}
                  </div>
                </div>
              ) : (
                <div className="w-full h-80 md:h-96 rounded-2xl bg-slate-100 flex flex-col items-center justify-center border border-slate-200 text-slate-400">
                  <CarIcon className="w-12 h-12 mb-2 stroke-1" />
                  <span className="text-xs font-semibold">No Vehicle Photos Uploaded</span>
                </div>
              )}

              {/* Thumbnails Carousel */}
              {images.length > 1 && (
                <div className="flex items-center gap-2.5 overflow-x-auto pt-1 pb-2">
                  {images.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer bg-slate-100 ${
                        safeActiveIndex === idx
                          ? 'border-[#0055FE] ring-2 ring-[#0055FE]/20 scale-105 shadow-md'
                          : 'border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Key Specs Quick Cards */}
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  Quick Specs Overview
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#0055FE]" /> Year
                    </span>
                    <p className="text-sm font-black text-slate-900 mt-1">{car.year}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-[#0055FE]" /> Mileage
                    </span>
                    <p className="text-sm font-black text-slate-900 mt-1">
                      {car.mileage ? `${car.mileage.toLocaleString()} km` : 'N/A'}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5 text-[#0055FE]" /> Fuel Type
                    </span>
                    <p className="text-sm font-black text-slate-900 mt-1">{car.fuel_type || 'N/A'}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-[#0055FE]" /> Transmission
                    </span>
                    <p className="text-sm font-black text-slate-900 mt-1">{car.transmission || 'N/A'}</p>
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Eye className="w-3.5 h-3.5" /> Total Views
                    </span>
                    <span className="font-black text-slate-900">{car.views_count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <span className="flex items-center gap-1 text-slate-400">
                      <MessageSquare className="w-3.5 h-3.5" /> Inquiries
                    </span>
                    <span className="font-black text-slate-900">{inquiryCount}</span>
                  </div>
                </div>

                {car.slug && (
                  <Link
                    href={`/cars/${car.slug}`}
                    target="_blank"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs"
                  >
                    Open Live Buyer Page <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Owner / Seller Profile & Detailed Specifications */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Full Vehicle Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Complete Technical Specifications */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0055FE]" /> Full Technical Specifications
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Make / Brand</p>
                    <p className="font-extrabold text-slate-900 mt-0.5">{car.brand || car.make || 'N/A'}</p>
                  </div>

                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Model</p>
                    <p className="font-extrabold text-slate-900 mt-0.5">{car.model || 'N/A'}</p>
                  </div>

                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Body Type</p>
                    <p className="font-extrabold text-slate-900 mt-0.5">{car.body_type || 'N/A'}</p>
                  </div>

                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Engine Capacity</p>
                    <p className="font-extrabold text-slate-900 mt-0.5">
                      {car.engine ? car.engine : (car.engine_capacity ? car.engine_capacity : 'N/A')}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Exterior Color</p>
                    <p className="font-extrabold text-slate-900 mt-0.5">{car.exterior_color || car.color || 'N/A'}</p>
                  </div>

                  <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Interior Color</p>
                    <p className="font-extrabold text-slate-900 mt-0.5">{car.interior_color || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Features Checklist */}
              {featuresList.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#0055FE]" /> Features & Accessories
                  </h3>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {featuresList.map((feature, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/60 border border-blue-100 text-blue-800 text-xs font-bold"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-[#0055FE]" /> {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Description */}
              {car.description && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">
                    Seller's Detailed Description
                  </h3>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-line">
                    {car.description}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Full Owner / Seller Information Card */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <User className="w-5 h-5 text-[#0055FE]" />
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">
                    Vehicle Owner / Seller Information
                  </h3>
                </div>

                <div className="space-y-3 text-xs font-semibold">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Seller Name</span>
                    <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">
                      {car.seller_name || sellerProfile?.name || 'Individual Seller'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" /> Phone Number
                    </span>
                    <span className="font-extrabold text-slate-900 mt-0.5 block">
                      {car.seller_phone || sellerProfile?.phone || 'Not specified'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" /> Email Address
                    </span>
                    <span className="font-extrabold text-slate-900 mt-0.5 block break-all">
                      {sellerProfile?.email || car.seller_email || 'Not specified'}
                    </span>
                  </div>

                  {sellerProfile?.role && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Account Role</span>
                      <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[11px] font-extrabold border border-purple-200">
                        {sellerProfile.role.toUpperCase()}
                      </span>
                    </div>
                  )}

                  {car.seller_id && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Seller Account ID</span>
                      <span className="font-mono text-[10px] text-slate-600 block mt-0.5 break-all">
                        {car.seller_id}
                      </span>
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> Listing Created Date
                    </span>
                    <span className="font-extrabold text-slate-900 mt-0.5 block">
                      {car.created_at ? new Date(car.created_at).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={images[activeImageIndex] || images[0]}
            alt={car.title}
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
