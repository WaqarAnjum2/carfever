'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { getBlogBySlug, incrementBlogViews } from '@/lib/blog-actions';
import type { DbBlog } from '@/lib/supabase/types';
import {
  Calendar,
  User,
  Eye,
  ArrowLeft,
  Share2,
  Sparkles,
  Clock,
  Check,
  BookOpen,
  Tag,
  ChevronRight,
} from 'lucide-react';

interface BlogDetailProps {
  params: Promise<{ slug: string }>;
}

export default function BlogDetailPage({ params }: BlogDetailProps) {
  const unwrappedParams = React.use(params);
  const { slug } = unwrappedParams;

  const [blog, setBlog] = React.useState<DbBlog | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await getBlogBySlug(slug);
        if (isMounted) {
          setBlog(data);
          if (data?.id) {
            incrementBlogViews(data.id);
          }
        }
      } catch (e) {
        console.error('Failed to load blog:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      if (navigator.share) {
        navigator
          .share({
            title: blog?.title || 'CarFever Journal',
            url: window.location.href,
          })
          .catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  // Estimate reading time based on word count
  const readingTime = React.useMemo(() => {
    if (!blog?.content) return '2 min read';
    const words = blog.content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  }, [blog?.content]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <Navbar />
        <main className="flex-1 pt-28 pb-16 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#0055FE] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-600">Loading article details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <Navbar />
        <main className="flex-1 pt-32 pb-16 px-4">
          <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-lg space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-[#0055FE] rounded-2xl flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Article Not Found</h1>
            <p className="text-sm text-slate-600">
              The article you are looking for might have been moved or removed.
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-[#0055FE] text-white font-bold rounded-2xl shadow-md hover:bg-blue-700 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Journal</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-[#0055FE] selection:text-white">
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-16">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
          {/* Top Breadcrumb & Action bar */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-[#0055FE] transition-colors bg-white px-3.5 sm:px-4 py-2 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-200"
            >
              <ArrowLeft className="w-4 h-4 text-[#0055FE]" />
              <span>Back to Journal</span>
            </Link>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-[#0055FE] hover:border-blue-200 text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-[#0055FE]" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>

          {/* Article Header */}
          <header className="space-y-4 sm:space-y-6">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-600 font-semibold">
              <span className="inline-flex items-center gap-1.5 text-[#0055FE] font-bold bg-blue-50 px-3 py-1 rounded-full border border-blue-200/80">
                <User className="w-3.5 h-3.5" />
                {blog.author_name || 'CarFever Specialist'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date(blog.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {readingTime}
              </span>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-[#0055FE]" />
                {(blog.views || 0) + 1} views
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight tracking-tight">
              {blog.title}
            </h1>

            {blog.excerpt && (
              <div className="relative pl-4 sm:pl-5 py-2 border-l-4 border-[#0055FE] bg-gradient-to-r from-blue-50/50 to-transparent rounded-r-2xl">
                <p className="text-sm sm:text-lg text-slate-700 font-medium leading-relaxed italic">
                  "{blog.excerpt}"
                </p>
              </div>
            )}
          </header>

          {/* Cover Image */}
          {blog.cover_image && (
            <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-md bg-slate-100 aspect-video sm:max-h-[500px]">
              <img
                src={blog.cover_image}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Main Content Body */}
          <section className="bg-white p-5 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            {blog.content ? (
              blog.content.split('\n\n').map((paragraph, idx) => {
                const trimmed = paragraph.trim();
                if (!trimmed) return null;

                // Check if line looks like a subheader
                if (trimmed.startsWith('#') || (trimmed.length < 60 && !trimmed.endsWith('.'))) {
                  const cleanHeading = trimmed.replace(/^#+\s*/, '');
                  return (
                    <h3
                      key={idx}
                      className="text-lg sm:text-2xl font-extrabold text-slate-900 pt-4 pb-1 border-b border-slate-100 flex items-center gap-2"
                    >
                      <ChevronRight className="w-5 h-5 text-[#0055FE] shrink-0" />
                      <span>{cleanHeading}</span>
                    </h3>
                  );
                }

                return (
                  <p
                    key={idx}
                    className="text-sm sm:text-base font-normal leading-relaxed text-slate-700 sm:text-slate-800"
                  >
                    {trimmed}
                  </p>
                );
              })
            ) : (
              <p className="text-slate-500 italic text-sm">No text content in this blog post.</p>
            )}
          </section>

          {/* Article Photo Gallery */}
          {blog.images && blog.images.length > 0 && (
            <section className="space-y-4 pt-2">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#0055FE]" />
                <span>Gallery</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {blog.images.map((imgUrl, i) => (
                  <div
                    key={i}
                    className="rounded-2xl overflow-hidden border border-slate-200 bg-white h-56 sm:h-64 shadow-xs"
                  >
                    <img
                      src={imgUrl}
                      alt={`Gallery Image ${i + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tags & Bottom Share */}
          <footer className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Tag className="w-4 h-4 text-slate-400 shrink-0" />
              {blog.keywords && blog.keywords.length > 0 ? (
                blog.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold shadow-2xs"
                  >
                    #{kw}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">CarFever, Journal, Vehicles</span>
              )}
            </div>

            <button
              onClick={handleShare}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0055FE] text-white hover:bg-blue-700 transition-all text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Share Article</span>
                </>
              )}
            </button>
          </footer>
        </article>
      </main>

      <Footer />
    </div>
  );
}
