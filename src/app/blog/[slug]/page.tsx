import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { getBlogBySlug, incrementBlogViews } from '@/lib/blog-actions';
import {
  Calendar,
  User,
  Eye,
  ArrowLeft,
  Share2,
  Sparkles,
} from 'lucide-react';

interface BlogDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);
  if (!blog) return { title: 'Blog Post Not Found — CarFever' };

  return {
    title: `${blog.meta_title || blog.title} — CarFever Journal`,
    description: blog.meta_description || blog.excerpt || blog.title,
    keywords: blog.keywords,
    openGraph: {
      title: blog.title,
      description: blog.excerpt || blog.title,
      images: blog.cover_image ? [{ url: blog.cover_image }] : [],
    },
  };
}

export default async function BlogDetailPage({ params }: BlogDetailProps) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    notFound();
  }

  // Increment view counter asynchronously
  incrementBlogViews(blog.id);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-[#0055FE] selection:text-white">
      <Navbar />

      <main className="flex-1 pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Back button */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-[#0055FE]" />
            <span>Back to Journal</span>
          </Link>

          {/* Article Header */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-semibold">
              <span className="flex items-center gap-1.5 text-[#0055FE] font-bold bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                <User className="w-3.5 h-3.5" />
                {blog.author_name}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(blog.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-[#0055FE]" />
                {(blog.views || 0) + 1} views
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight tracking-tight">
              {blog.title}
            </h1>

            {blog.excerpt && (
              <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed italic border-l-4 border-[#0055FE] pl-4 py-1">
                {blog.excerpt}
              </p>
            )}
          </div>

          {/* Cover Hero Image */}
          {blog.cover_image && (
            <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-lg max-h-[500px] bg-slate-100">
              <img
                src={blog.cover_image}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Main Article Body Content */}
          <div className="prose max-w-none prose-p:text-slate-700 prose-p:leading-relaxed prose-headings:text-slate-900 prose-strong:text-slate-900 prose-a:text-[#0055FE] bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            {blog.content.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="text-sm sm:text-base font-medium leading-relaxed text-slate-700">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Gallery Images (if any) */}
          {blog.images && blog.images.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0055FE]" />
                <span>Article Photo Gallery</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {blog.images.map((imgUrl, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-slate-200 bg-white h-64 shadow-xs">
                    <img src={imgUrl} alt={`Gallery Image ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Tags & Share */}
          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {blog.keywords?.map((kw, i) => (
                <span key={i} className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold shadow-xs">
                  #{kw}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-bold">Share Article:</span>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Article link copied to clipboard!');
                  }
                }}
                className="p-2.5 rounded-xl bg-blue-50 text-[#0055FE] border border-blue-200 hover:bg-blue-100 transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
