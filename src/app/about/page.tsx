import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Car,
  FileCheck2,
  Sparkles,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Building2,
  HeartHandshake,
  Headphones,
  Award,
  Globe2,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AboutHeroCarousel } from "@/components/about-hero-carousel";
import { getPublicSiteSettings } from "@/lib/site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  return {
    title: `About Us | ${settings.site_name} — ${settings.site_tagline}`,
    description: settings.about_description,
    openGraph: {
      title: `About ${settings.site_name} — UK's Premier Verified Car Marketplace`,
      description: settings.about_description,
      images: [{ url: "/carfever-logo.png", width: 1200, height: 630, alt: settings.site_name }],
    },
  };
}

export default async function AboutUsPage() {
  const settings = await getPublicSiteSettings();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.site_name,
    url: "https://carfever.uk",
    logo: "https://carfever.uk/carfever-logo.png",
    description: settings.about_description,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bristol",
      addressCountry: "United Kingdom",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: settings.contact_phone,
      contactType: "customer service",
      email: settings.contact_email,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pt-16 sm:pt-20 pb-16">
        
        {/* ── COMPACT HERO WITH AUTO-CAROUSEL BACKGROUND ── */}
        <AboutHeroCarousel
          heading={settings.about_heading}
          subheading={settings.about_description}
          phone={settings.contact_phone}
          email={settings.contact_email}
          location={settings.business_address}
        />

        {/* ── PROMINENT BUSINESS CONTACT SHOWCASE CARD ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Phone Card */}
            <a
              href={`tel:${settings.contact_phone.replace(/\s+/g, "")}`}
              className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-100 hover:border-emerald-300 transition-all flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-110 transition-transform shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest block">Direct Phone Line</span>
                <span className="text-base font-extrabold text-slate-900 block truncate mt-0.5">{settings.contact_phone}</span>
                <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">Click to Call Directly</span>
              </div>
            </a>

            {/* Email Card */}
            <a
              href={`mailto:${settings.contact_email}`}
              className="p-5 rounded-2xl bg-blue-50/70 border border-blue-100 hover:border-blue-300 transition-all flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#0055FE] text-white flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-110 transition-transform shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-widest block">Official Email</span>
                <span className="text-base font-extrabold text-slate-900 block truncate mt-0.5">{settings.contact_email}</span>
                <span className="text-[11px] text-blue-700 font-semibold block mt-0.5">Click to Send Message</span>
              </div>
            </a>

            {/* Location Card */}
            <div className="p-5 rounded-2xl bg-slate-100/80 border border-slate-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md shrink-0">
                <MapPin className="w-6 h-6 text-amber-400" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">UK Headquarters</span>
                <span className="text-base font-extrabold text-slate-900 block truncate mt-0.5">{settings.business_address}</span>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">{settings.working_hours}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS COUNTER BAR ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            <div className="pt-3 sm:pt-0">
              <div className="text-3xl sm:text-4xl font-black text-[#0055FE] tracking-tight">
                {settings.about_stat_cars}
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                Verified Vehicles Listed
              </div>
            </div>

            <div className="pt-3 sm:pt-0">
              <div className="text-3xl sm:text-4xl font-black text-[#FF6B00] tracking-tight">
                {settings.about_stat_dealers}
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                Certified UK Dealers
              </div>
            </div>

            <div className="pt-3 sm:pt-0">
              <div className="text-3xl sm:text-4xl font-black text-[#00B67A] tracking-tight">
                {settings.about_stat_inspections}
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                200+ Point Inspections
              </div>
            </div>
          </div>
        </section>

        {/* ── MISSION & VISION ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Our Mission */}
            <div className="bg-white rounded-3xl border border-slate-200 p-7 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0055FE] mb-5 group-hover:scale-110 transition-transform">
                <TargetIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-2">Our Mission</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {settings.about_mission}
              </p>
            </div>

            {/* Our Vision */}
            <div className="bg-white rounded-3xl border border-slate-200 p-7 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-[#FF6B00] mb-5 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-2">Our Vision</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {settings.about_vision}
              </p>
            </div>
          </div>
        </section>

        {/* ── CORE PILLARS ── */}
        <section className="bg-white border-y border-slate-200 py-12 px-4 sm:px-6 lg:px-8 mt-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-extrabold text-[#0055FE] uppercase tracking-widest">
                WHY CHOOSE CARFEVER
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1.5">
                Built on Uncompromising Quality & Transparency
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-4">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1">Document & VIN Verified</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Every vehicle listed undergo strict ownership and history checks before going live.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1">200+ Point Inspection</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Certified technicians evaluate mechanical condition, bodywork, and electronics.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-4">
                  <Building2 className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1">Certified Dealers</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Direct partnership with top verified automotive dealerships across the UK.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-4">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1">Zero Hidden Fees</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Transparent pricing and direct contact options with zero markup or hidden costs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CALL TO ACTION ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="rounded-3xl bg-gradient-to-r from-[#0055FE] to-blue-700 text-white p-8 sm:p-10 text-center flex flex-col items-center justify-center shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3">
              Ready to Experience the CarFever Difference?
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl mb-6">
              Explore thousands of verified vehicles or list your car for sale on the UK&apos;s fastest growing car marketplace.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/buy-car"
                className="px-5 py-3 rounded-xl bg-white text-[#0055FE] font-extrabold text-xs hover:bg-blue-50 transition-colors shadow-md flex items-center gap-2"
              >
                <span>Browse Verified Cars</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/sell-car"
                className="px-5 py-3 rounded-xl bg-blue-900/40 border border-white/20 text-white font-extrabold text-xs hover:bg-blue-900/60 transition-colors flex items-center gap-2"
              >
                <span>List Your Vehicle</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function TargetIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
