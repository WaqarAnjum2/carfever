import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { getJobById, getPublicJobs } from '@/lib/job-actions';
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  ExternalLink,
  MessageSquare,
  ChevronLeft,
  UserCheck,
  Building2,
  Share2,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Mail,
  Sparkles,
} from 'lucide-react';

export const revalidate = 60;

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const job = await getJobById(resolvedParams.id);

  if (!job) {
    return {
      title: 'Job Not Found — CarFever UK',
      description: 'The requested job vacancy is no longer available.',
    };
  }

  return {
    title: `${job.title} (${job.department}) — Careers at CarFever UK`,
    description: job.description.slice(0, 160),
    openGraph: {
      title: `${job.title} | CarFever Careers`,
      description: job.description.slice(0, 160),
      type: 'article',
    },
  };
}

export async function generateStaticParams() {
  const jobs = await getPublicJobs();
  return jobs.map((job) => ({ id: job.id }));
}

export default async function JobDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const job = await getJobById(resolvedParams.id);

  if (!job || job.status === 'closed') {
    notFound();
  }

  const postedDate = job.created_at
    ? new Date(job.created_at).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Recently';

  const whatsappMessage = `Hi CarFever HR Team, I am interested in applying for the position: ${job.title} (Ref: ${job.id}).`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-[#0055FE] selection:text-white pb-20 sm:pb-0">
      <Navbar />

      {/* Header / Hero Section */}
      <section className="relative pt-28 sm:pt-32 pb-8 sm:pb-12 bg-gradient-to-b from-blue-50/70 via-slate-50 to-slate-50 border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumb Navigation */}
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#0055FE] transition-colors mb-6 group"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to All Openings</span>
          </Link>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-100/90 border border-blue-200 text-[#0055FE] text-xs font-extrabold uppercase tracking-wider">
                {job.department}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-200/80 text-slate-800 text-xs font-bold">
                {job.type || 'Full-time'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              {job.title}
            </h1>

            {/* Quick Meta Badges */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm font-semibold text-slate-600 pt-2">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#0055FE] shrink-0" />
                <span>{job.location || 'Bristol, United Kingdom'}</span>
              </div>
              {job.salary && (
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80">
                  <DollarSign className="w-4 h-4 shrink-0" />
                  <span>{job.salary}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>Posted {postedDate}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Job Description & Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-4">
                <Briefcase className="w-5 h-5 text-[#0055FE]" />
                <span>Role Summary & Overview</span>
              </h2>

              <div className="text-xs sm:text-base text-slate-700 font-normal leading-relaxed space-y-4 whitespace-pre-line">
                {job.description}
              </div>
            </div>

            {/* Requirements Card */}
            {job.requirements && job.requirements.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 border-b border-slate-100 pb-4">
                  <UserCheck className="w-5 h-5 text-[#0055FE]" />
                  <span>Key Responsibilities & Requirements</span>
                </h2>

                <ul className="space-y-3.5">
                  {job.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                      <div className="p-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 mt-0.5 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Perks & Benefits Section */}
            <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white space-y-6 shadow-md">
              <div className="flex items-center gap-2 text-blue-300 font-extrabold text-xs uppercase tracking-widest">
                <Sparkles className="w-4 h-4" />
                <span>Why Join CarFever UK?</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black leading-tight">
                Empowering the Next Generation of Automotive Technology
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-blue-100/90 font-medium">
                <div className="flex items-center gap-2.5 bg-white/10 p-3 rounded-2xl backdrop-blur-xs">
                  <Building2 className="w-5 h-5 text-blue-400 shrink-0" />
                  <span>Modern Bristol HQ & Remote Flexibility</span>
                </div>
                <div className="flex items-center gap-2.5 bg-white/10 p-3 rounded-2xl backdrop-blur-xs">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Competitive Salaries & Career Growth</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column / Sidebar: Direct Action & Sticky Apply Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-md lg:sticky lg:top-28 space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Ready to Apply?</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Choose your preferred application method. Our recruitment team responds within 24 hours.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {job.apply_google_form_url && (
                  <a
                    href={job.apply_google_form_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 bg-[#0055FE] hover:bg-blue-700 active:scale-[0.98] text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Apply via Official Form</span>
                  </a>
                )}

                {job.apply_whatsapp_number && (
                  <a
                    href={`https://wa.me/${job.apply_whatsapp_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Quick Apply via WhatsApp</span>
                  </a>
                )}

                <a
                  href={`mailto:careers@carfever.uk?subject=${encodeURIComponent(`Application for ${job.title} (${job.id})`)}`}
                  className="w-full py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                >
                  <Mail className="w-4 h-4 text-slate-600" />
                  <span>Email CV to HR</span>
                </a>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3 text-xs text-slate-500 font-medium">
                <div className="flex items-center justify-between">
                  <span>Job ID</span>
                  <span className="font-mono text-slate-700 font-semibold">{job.id.slice(0, 8)}...</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Employment Type</span>
                  <span className="text-slate-700 font-semibold">{job.type || 'Full-time'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Location</span>
                  <span className="text-slate-700 font-semibold">{job.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Fixed Bottom Sticky Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg z-40 flex items-center gap-2">
        {job.apply_google_form_url ? (
          <a
            href={job.apply_google_form_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 bg-[#0055FE] hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Apply Now</span>
          </a>
        ) : null}

        {job.apply_whatsapp_number ? (
          <a
            href={`https://wa.me/${job.apply_whatsapp_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp</span>
          </a>
        ) : null}
      </div>

      <Footer />
    </div>
  );
}
