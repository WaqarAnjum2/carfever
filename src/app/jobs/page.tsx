import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { getPublicJobs } from '@/lib/job-actions';
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  ExternalLink,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Building2,
  UserCheck,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Careers & Job Openings — Join the CarFever UK Team',
  description:
    'Explore automotive job vacancies at CarFever UK. Join our sales, vehicle inspection, technology, and dealership management teams in Bristol, UK.',
};

export const revalidate = 60; // Revalidate public careers page every 60s

export default async function PublicJobsPage() {
  const jobs = await getPublicJobs();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-[#0055FE] selection:text-white">
      <Navbar />

      {/* Hero Header - Light Theme */}
      <section className="relative pt-32 pb-16 overflow-hidden bg-gradient-to-b from-blue-50/60 via-slate-50 to-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-[#0055FE] text-xs font-extrabold uppercase tracking-widest mb-4 shadow-xs">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Join Our Team</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Build the Future of <span className="bg-gradient-to-r from-[#0055FE] via-blue-600 to-indigo-600 bg-clip-text text-transparent">UK Automotive</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-medium max-w-2xl mx-auto mt-4 leading-relaxed">
            We are hiring passionate automotive specialists, sales executives, certified inspectors, and software engineers at CarFever Headquarters in Bristol, UK.
          </p>
        </div>
      </section>

      {/* Main Careers Board */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#0055FE]" />
              <span>Open Vacancies ({jobs.length})</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Apply directly via official Google Form or instant WhatsApp support.</p>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-slate-400 shadow-xs">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No active job openings at the moment</h3>
            <p className="text-xs text-slate-500 mt-1">Check back soon or send your CV directly to <span className="text-[#0055FE] font-bold">info@carfever.uk</span>.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs hover:shadow-md hover:border-slate-300 transition-all space-y-6"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 rounded-lg bg-blue-50 border border-blue-100 text-[#0055FE] text-xs font-extrabold uppercase tracking-wider">
                        {job.department}
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                        {job.type}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                      {job.title}
                    </h3>
                  </div>

                  {job.salary && (
                    <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl text-emerald-700 text-xs sm:text-sm font-extrabold flex items-center gap-1.5 self-start shrink-0">
                      <DollarSign className="w-4 h-4" />
                      <span>{job.salary}</span>
                    </div>
                  )}
                </div>

                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#0055FE]" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">About the Role</h4>
                  <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-line">
                    {job.description}
                  </p>
                </div>

                {/* Requirements */}
                {job.requirements && job.requirements.length > 0 && (
                  <div className="space-y-3 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-[#0055FE]" />
                      <span>Key Requirements</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {job.requirements.map((req, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{req}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Application Actions (Google Form & WhatsApp Triggers) */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                  {job.apply_google_form_url && (
                    <a
                      href={job.apply_google_form_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-[#0055FE] hover:bg-blue-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Apply via Google Form</span>
                    </a>
                  )}

                  {job.apply_whatsapp_number && (
                    <a
                      href={`https://wa.me/${job.apply_whatsapp_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Hi CarFever HR Team, I am interested in applying for the position: ${job.title} (${job.id}).`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Apply via WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
