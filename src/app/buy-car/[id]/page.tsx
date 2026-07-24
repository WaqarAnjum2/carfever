"use client";

import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Calendar,
  Gauge,
  Fuel,
  MapPin,
  Share2,
  CircleDot,
  ChevronRight,
  ShieldCheck,
  Zap,
  Phone,
  MessageSquare,
  X,
  CheckCircle2,
  User,
  Mail,
  FileText,
  DollarSign,
  Loader2,
  Car as CarIcon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getCarDetailsPageDataAction, type ApprovedCar } from "@/lib/server-actions";
import { submitInquiry } from "@/lib/server-actions";

export default function CarDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState("description");
  const [contactOpen, setContactOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [offerForm, setOfferForm] = useState({ name: "", email: "", phone: "", offerPrice: "", note: "" });
  const [formError, setFormError] = useState("");
  const [car, setCar] = useState<ApprovedCar | null>(null);
  const [similarCars, setSimilarCars] = useState<ApprovedCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const loadedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;
    if (loadedIdRef.current === id) return;
    loadedIdRef.current = id;

    let isMounted = true;
    async function loadCar() {
      setLoading(true);
      try {
        const res = await getCarDetailsPageDataAction(id);
        if (!isMounted) return;
        if (!res.user) {
          router.replace(`/login?redirect=${encodeURIComponent(`/buy-car/${id}`)}`);
          return;
        }
        setCar(res.car);
        setUser(res.user);
        setSimilarCars(res.similarCars);
      } catch (err) {
        console.error("Failed to load car details:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCar();
    return () => { isMounted = false; };
  }, [id]);

  const handleContactClick = () => {
    if (!user) {
      router.push('/register?redirect=' + encodeURIComponent(`/buy-car/${id}`));
      return;
    }
    setContactOpen(true);
    setFormSubmitted(false);
    setFormError("");
  };

  const handleOfferClick = () => {
    if (!user) {
      router.push('/register?redirect=' + encodeURIComponent(`/buy-car/${id}`));
      return;
    }
    setOfferOpen(true);
    setFormSubmitted(false);
    setFormError("");
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 lg:pt-24 bg-[#F8F9FA] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#0055FE]" />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen pt-32 lg:pt-24 bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Car Not Found</h2>
          <p className="text-gray-500 mb-4">This listing may have been removed or expired.</p>
          <Link href="/buy-car">
            <Button className="bg-[#0055FE] hover:bg-blue-700 text-white">
              Browse All Cars
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number, currency?: string | null) => {
    if (!price || isNaN(price)) return '£0';
    const curr = currency || car?.currency || 'GBP';
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
    while (p >= 1000000000) {
      p = p / 100000;
    }
    if (p >= 10000000) {
      return `${curr} ${(p / 10000000).toFixed(2)} Crore`;
    }
    if (p >= 100000) {
      const lacs = (p / 100000).toFixed(2);
      return `${curr} ${lacs} Lac`;
    }
    return `${curr} ${p.toLocaleString()}`;
  };

  const featuresList: string[] = (() => {
    const f = (car as any).features;
    return Array.isArray(f) ? f : typeof f === 'string' ? f.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
  })();

  const rawImages: string[] = Array.isArray(car.images) && car.images.length > 0
    ? (car.images as string[])
    : (car as any).image_url ? [(car as any).image_url] : [];

  const cleanImages = rawImages.filter((u: any) => typeof u === 'string' && u.trim().length > 0);

  const images: string[] = cleanImages;

  const safeActiveImage = activeImage < images.length ? activeImage : 0;

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      setFormError("Please fill in all required fields.");
      return;
    }
    setFormError("");
    const result = await submitInquiry({
      name: contactForm.name,
      email: contactForm.email,
      phone: contactForm.phone,
      subject: `Inquiry about ${car.title} (${car.year})`,
      message: contactForm.message,
      carId: id,
    });
    if (result.success) {
      setFormSubmitted(true);
      setTimeout(() => { setContactOpen(false); setFormSubmitted(false); setContactForm({ name: "", email: "", phone: "", message: "" }); }, 2500);
    } else {
      setFormError(result.error || "Failed to submit inquiry");
    }
  };

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerForm.name.trim() || !offerForm.email.trim() || !offerForm.offerPrice.trim()) {
      setFormError("Please fill name, email and offer price.");
      return;
    }
    setFormError("");
    const result = await submitInquiry({
      name: offerForm.name,
      email: offerForm.email,
      phone: offerForm.phone,
      subject: `Offer: ${offerForm.offerPrice} for ${car.title} (${car.year})`,
      message: offerForm.note || `I would like to offer ${offerForm.offerPrice} for your ${car.title}.`,
      carId: id,
    });
    if (result.success) {
      setFormSubmitted(true);
      setTimeout(() => { setOfferOpen(false); setFormSubmitted(false); setOfferForm({ name: "", email: "", phone: "", offerPrice: "", note: "" }); }, 2500);
    } else {
      setFormError(result.error || "Failed to submit offer");
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32 lg:pt-24 pb-32 lg:pb-20 bg-[#F8F9FA]">

        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/buy-car" className="hover:text-gray-900 transition-colors">Buy Car</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">{car.title} {car.year}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Section */}
          <div className="flex flex-col lg:flex-row gap-10 mb-12 sm:mb-16">

            {/* Left: Gallery (60%) */}
            <div className="w-full lg:w-[60%]">
              {images.length > 0 ? (
                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-4 bg-gray-100 group border border-gray-200">
                  <img
                    src={images[safeActiveImage]}
                    alt={car.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* 360 View Badge / Button */}
                  <div className="absolute top-4 left-4">
                    <Button size="sm" className="bg-white/90 backdrop-blur-md text-gray-900 hover:bg-white border border-gray-200 rounded-full h-9 shadow-sm">
                      <CircleDot className="w-4 h-4 mr-2 text-[#0055FE] animate-pulse" />
                      360° View
                    </Button>
                  </div>

                  {/* Actions */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button className="p-2.5 rounded-full bg-white/90 backdrop-blur-md text-gray-600 hover:text-[#0055FE] hover:bg-white border border-gray-200 transition-all active:scale-90 shadow-sm">
                      <Heart className="w-4 h-4" />
                    </button>
                    <button className="p-2.5 rounded-full bg-white/90 backdrop-blur-md text-gray-600 hover:text-[#0055FE] hover:bg-white border border-gray-200 transition-all active:scale-90 shadow-sm">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-4 bg-gray-100 flex flex-col items-center justify-center border border-gray-200 text-gray-400">
                  <span className="text-sm font-semibold">No Vehicle Photos Available</span>
                </div>
              )}

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto snap-x scrollbar-hide pb-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`relative w-24 h-16 sm:w-32 sm:h-20 shrink-0 rounded-lg overflow-hidden snap-center border-2 transition-all active:scale-95 bg-gray-100 ${safeActiveImage === idx ? 'border-[#0055FE] scale-105 opacity-100 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                    >
                      <img
                        src={img}
                        alt={`Thumb ${idx}`}
                        className="w-full h-full object-cover rounded-md"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Details (40%) */}
            <div className="w-full lg:w-[40%] flex flex-col">

              {/* Badges & Realtime */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-[#0055FE] text-xs font-semibold uppercase tracking-wider w-fit border border-blue-100">
                  <ShieldCheck className="w-3.5 h-3.5" /> Certified
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-[#0055FE] animate-pulse" />
                  12 people viewing this right now
                </div>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                {car.title}
              </h1>

              <div className="flex items-center gap-2 text-gray-500 text-sm mb-6 pb-6 border-b border-gray-200">
                <MapPin className="w-4 h-4 text-gray-400" />
                {car.city || 'Location not specified'}
              </div>

              {/* Price */}
              <div className="mb-6 sm:mb-8">
                <div className="text-sm text-gray-500 mb-1">Asking Price</div>
                <div className="text-3xl sm:text-4xl font-bold text-[#0055FE]">
                  {formatPrice(car.price, car.currency)}
                </div>
              </div>

              {/* Key Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 sm:mb-8">
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-gray-200 shadow-sm">
                  <Calendar className="w-5 h-5 text-gray-400 mb-2" />
                  <span className="text-[10px] text-gray-500 font-medium">Year</span>
                  <span className="text-sm font-semibold text-gray-900">{car.year}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-gray-200 shadow-sm">
                  <Gauge className="w-5 h-5 text-gray-400 mb-2" />
                  <span className="text-[10px] text-gray-500 font-medium">Mileage</span>
                  <span className="text-sm font-semibold text-gray-900 truncate max-w-full">
                    {car.mileage ? `${car.mileage.toLocaleString()} ${(!car.currency || car.currency === 'GBP' || car.currency === '£') ? 'miles' : 'km'}` : 'N/A'}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-gray-200 shadow-sm">
                  <Fuel className="w-5 h-5 text-gray-400 mb-2" />
                  <span className="text-[10px] text-gray-500 font-medium">Fuel</span>
                  <span className="text-sm font-semibold text-gray-900">{car.fuel_type || 'Petrol'}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-gray-200 shadow-sm">
                  <Zap className="w-5 h-5 text-gray-400 mb-2" />
                  <span className="text-[10px] text-gray-500 font-medium">Engine</span>
                  <span className="text-sm font-semibold text-gray-900">{car.engine || car.engine_capacity || 'N/A'}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-gray-200 shadow-sm">
                  <CircleDot className="w-5 h-5 text-gray-400 mb-2" />
                  <span className="text-[10px] text-gray-500 font-medium">Transmission</span>
                  <span className="text-sm font-semibold text-gray-900">{car.transmission || 'Automatic'}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white border border-gray-200 shadow-sm">
                  <CarIcon className="w-5 h-5 text-gray-400 mb-2" />
                  <span className="text-[10px] text-gray-500 font-medium">Body Type</span>
                  <span className="text-sm font-semibold text-gray-900">{car.body_type || 'Sedan'}</span>
                </div>
              </div>

              {/* Additional Specs */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Exterior Color</span>
                  <span className="font-semibold text-gray-900">{car.exterior_color || car.color || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Interior Color</span>
                  <span className="font-semibold text-gray-900">{car.interior_color || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Registration City</span>
                  <span className="font-semibold text-gray-900">{car.city || 'N/A'}</span>
                </div>
              </div>

              {/* Action Bar (hidden on mobile, sticky bottom bar instead) */}
              <div className="hidden lg:flex flex-col gap-3">
                <Button onClick={handleContactClick} size="lg" className="w-full bg-[#0055FE] hover:bg-blue-700 text-white font-bold h-14 text-base shadow-sm">
                  <Phone className="w-5 h-5 mr-2" />
                  {user ? 'Contact Seller' : 'Register to Contact Seller'}
                </Button>
                <Button onClick={handleOfferClick} variant="outline" size="lg" className="w-full border-[#0055FE] text-[#0055FE] hover:bg-blue-50 h-14 text-base transition-colors bg-white">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  {user ? 'Make an Offer' : 'Register to Make Offer'}
                </Button>
              </div>

            </div>
          </div>

          {/* Details Tabs */}
          <div className="mb-20">
            <div className="flex border-b border-gray-200 mb-6 overflow-x-auto scrollbar-hide">
              {['description', 'features'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 text-sm font-medium capitalize whitespace-nowrap transition-colors border-b-2 ${activeTab === tab
                    ? 'border-[#0055FE] text-[#0055FE]'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                >
                  {tab === 'features' ? 'Features & Options' : 'Description'}
                </button>
              ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 min-h-[300px] shadow-sm">
              {activeTab === 'description' && (
                <div className="text-gray-600 leading-relaxed space-y-4">
                  <div className="whitespace-pre-line">
                    {car.description || `Up for sale is a meticulously maintained ${car.title} ${car.year} model.`}
                  </div>
                  <div className="border-t border-gray-100 pt-4 mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-400">Make:</span> <span className="font-semibold text-gray-900">{car.make}</span></div>
                    <div><span className="text-gray-400">Model:</span> <span className="font-semibold text-gray-900">{car.model}</span></div>
                    <div><span className="text-gray-400">Year:</span> <span className="font-semibold text-gray-900">{car.year}</span></div>
                    <div><span className="text-gray-400">Price:</span> <span className="font-semibold text-[#0055FE]">{formatPrice(car.price)}</span></div>
                    <div><span className="text-gray-400">Mileage:</span> <span className="font-semibold text-gray-900">{car.mileage ? `${car.mileage.toLocaleString()} km` : 'N/A'}</span></div>
                    <div><span className="text-gray-400">Fuel Type:</span> <span className="font-semibold text-gray-900">{car.fuel_type || 'Petrol'}</span></div>
                    <div><span className="text-gray-400">Transmission:</span> <span className="font-semibold text-gray-900">{car.transmission || 'Automatic'}</span></div>
                    <div><span className="text-gray-400">Body Type:</span> <span className="font-semibold text-gray-900">{car.body_type || 'Sedan'}</span></div>
                    <div><span className="text-gray-400">Engine:</span> <span className="font-semibold text-gray-900">{car.engine || car.engine_capacity || 'N/A'}</span></div>
                    <div><span className="text-gray-400">Exterior Color:</span> <span className="font-semibold text-gray-900">{car.exterior_color || car.color || 'N/A'}</span></div>
                    <div><span className="text-gray-400">Interior Color:</span> <span className="font-semibold text-gray-900">{car.interior_color || 'N/A'}</span></div>
                    <div><span className="text-gray-400">Location:</span> <span className="font-semibold text-gray-900">{car.city || 'N/A'}</span></div>
                  </div>
                </div>
              )}
              {activeTab === 'features' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-8 text-sm text-gray-600">
                  {featuresList.length > 0
                    ? featuresList.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#0055FE]" />
                        {feature}
                      </div>
                    ))
                    : (
                      <>
                        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#0055FE]" /> ABS Brakes</div>
                        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#0055FE]" /> Airbags</div>
                        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#0055FE]" /> Power Windows</div>
                        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#0055FE]" /> Power Steering</div>
                        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#0055FE]" /> Immobilizer Key</div>
                        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#0055FE]" /> Keyless Entry</div>
                        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#0055FE]" /> Alloy Rims</div>
                        <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#0055FE]" /> Rear Camera</div>
                      </>
                    )
                  }
                </div>
              )}
            </div>
          </div>

          {/* Seller Information */}
          <div className="mb-12 bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-[#0055FE]" /> Seller Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Seller Name</span>
                <span className="font-semibold text-gray-900">{car.seller_name || 'Individual Seller'}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Contact Phone</span>
                <span className="font-semibold text-gray-900">{car.seller_phone || 'Not specified'}</span>
              </div>
              {car.created_at && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Listed Date</span>
                  <span className="font-semibold text-gray-900">{new Date(car.created_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Similar Cars Section */}
          {similarCars.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Similar <span className="text-[#0055FE]">Cars</span></h2>
                <Link href="/buy-car">
                  <Button variant="link" className="text-[#0055FE] hover:text-blue-700 px-0">View All</Button>
                </Link>
              </div>

              <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 scrollbar-hide">
                {similarCars.map((similarCar) => (
                  <Link key={similarCar.id} href={`/buy-car/${similarCar.id}`} prefetch={false} className="min-w-[300px] sm:min-w-[350px] snap-center shrink-0 group rounded-xl overflow-hidden bg-white border border-gray-200 transition-all duration-300 hover:shadow-md hover:-translate-y-1 flex flex-col">
                    <div className="relative aspect-[16/11] overflow-hidden shrink-0">
                      <img
                        src={Array.isArray(similarCar.images) && similarCar.images.length > 0
                          ? String(similarCar.images[0])
                          : 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=600&q=80'}
                        alt={similarCar.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    </div>
                    <div className="p-4">
                      <h3 className="text-base font-semibold text-gray-900 mb-3 line-clamp-1 group-hover:text-[#0055FE] transition-colors">{similarCar.title}</h3>
                      <div className="grid grid-cols-2 gap-2 mb-4 text-gray-500">
                        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded px-2 py-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-xs font-medium text-gray-700">{similarCar.year}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded px-2 py-1">
                          <Gauge className="w-3 h-3 text-gray-400" />
                          <span className="text-xs font-medium text-gray-700">
                            {similarCar.mileage ? `${similarCar.mileage.toLocaleString()} km` : 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-lg font-bold text-[#0055FE]">
                          {formatPrice(similarCar.price)}
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#0055FE]" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* ── CONTACT SELLER MODAL ── */}
      {contactOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setContactOpen(false)}>
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-3xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <button onClick={() => setContactOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-50">
              <X className="w-5 h-5" />
            </button>

            {formSubmitted ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 className="w-16 h-16 text-[#00B67A] mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-500 text-sm">The seller will contact you shortly.</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Contact Seller</h2>
                  <p className="text-gray-500 text-sm">About: <span className="text-gray-900 font-medium">{car.title} {car.year}</span></p>
                </div>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">Your Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} placeholder="Ahmed Khan" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0055FE] text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">Email *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="email" value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} placeholder="you@email.com" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0055FE] text-sm" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">Phone (Optional)</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))} placeholder="+92 300 1234567" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0055FE] text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">Message *</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                      <textarea value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))} rows={4} placeholder={`Hi, I'm interested in your ${car.title}. Is it still available?`} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0055FE] text-sm resize-none" />
                    </div>
                  </div>
                  {formError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>}
                  <Button type="submit" size="lg" className="w-full bg-[#0055FE] hover:bg-blue-700 text-white font-bold h-12">
                    <Phone className="w-4 h-4 mr-2" /> Send Message
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── MAKE AN OFFER MODAL ── */}
      {offerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setOfferOpen(false)}>
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-3xl shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <button onClick={() => setOfferOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-50">
              <X className="w-5 h-5" />
            </button>

            {formSubmitted ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 className="w-16 h-16 text-[#0055FE] mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Offer Submitted!</h3>
                <p className="text-gray-500 text-sm">The seller will review your offer and respond soon.</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Make an Offer</h2>
                  <p className="text-gray-500 text-sm">Asking: <span className="text-[#0055FE] font-bold">{formatPrice(car.price)}</span></p>
                </div>
                <form onSubmit={handleOfferSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">Your Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input value={offerForm.name} onChange={e => setOfferForm(p => ({ ...p, name: e.target.value }))} placeholder="Ahmed Khan" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0055FE] text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">Email *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="email" value={offerForm.email} onChange={e => setOfferForm(p => ({ ...p, email: e.target.value }))} placeholder="you@email.com" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0055FE] text-sm" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">Phone (Optional)</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input value={offerForm.phone} onChange={e => setOfferForm(p => ({ ...p, phone: e.target.value }))} placeholder="+92 300 1234567" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0055FE] text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">Your Offer (PKR) *</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input value={offerForm.offerPrice} onChange={e => setOfferForm(p => ({ ...p, offerPrice: e.target.value }))} placeholder="e.g. 43 Lacs" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0055FE] text-sm" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">Note (Optional)</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                      <textarea value={offerForm.note} onChange={e => setOfferForm(p => ({ ...p, note: e.target.value }))} rows={3} placeholder="Any additional details about your offer..." className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0055FE] text-sm resize-none" />
                    </div>
                  </div>
                  {formError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>}
                  <Button type="submit" size="lg" className="w-full bg-[#0055FE] hover:bg-blue-700 text-white font-bold h-12">
                    <MessageSquare className="w-4 h-4 mr-2" /> Submit Offer
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sticky Bottom Bar for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 p-3.5 flex gap-3 shadow-lg">
        <Button
          onClick={handleContactClick}
          className="flex-1 bg-[#0055FE] hover:bg-blue-700 text-white font-bold h-12 text-sm active:scale-95 transition-transform"
        >
          <Phone className="w-4 h-4 mr-2" />
          {user ? 'Contact Seller' : 'Register'}
        </Button>
        <Button
          onClick={handleOfferClick}
          variant="outline"
          className="flex-1 border-[#0055FE] text-[#0055FE] hover:bg-blue-50 bg-white h-12 text-sm active:scale-95 transition-transform"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          {user ? 'Make Offer' : 'Register'}
        </Button>
      </div>
    </>
  );
}
