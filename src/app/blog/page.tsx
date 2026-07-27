import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { getPublicBlogs } from '@/lib/blog-actions';
import {
  FileText,
  User,
  Calendar,
  Eye,
  ArrowRight,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'CarFever Blog — Automotive News, Buying Guides & Dealer Insights',
  description:
    'Stay ahead with expert UK car buying advice, verified vehicle inspection tips, dealership news, and electric vehicle market reviews.',
};

export const revalidate = 60; // Revalidate public blog catalog every 60s

export default async function PublicBlogPage() {
  const blogs = await getPublicBlogs();
  const featuredBlog = blogs[0] || null;
  const remainingBlogs = blogs.slice(1);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-[#0055FE] selection:text-white">
      <Navbar />

      {/* Hero Section - Light Modern Theme */}
      <section className="relative pt-32 pb-16 overflow-hidden bg-gradient-to-b from-blue-50/60 via-slate-50 to-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-[#0055FE] text-xs font-extrabold uppercase tracking-widest mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Automotive Journal</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            CarFever <span className="bg-gradient-to-r from-[#0055FE] via-blue-600 to-indigo-600 bg-clip-text text-transparent">News & Buying Guides</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-medium max-w-2xl mx-auto mt-4 leading-relaxed">
            Expert UK vehicle reviews, price trends, inspection checklists, and dealership news curated by industry specialists.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Featured Hero Article */}
        {featuredBlog && (
          <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200/90 group shadow-lg hover:shadow-xl transition-all duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-7 relative min-h-[280px] lg:min-h-[400px] overflow-hidden bg-slate-100">
                {featuredBlog.cover_image ? (
                  <img
                    src={featuredBlog.cover_image}
                    alt={featuredBlog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center text-slate-400">
                    <FileText className="w-20 h-20 stroke-1" />
                  </div>
                )}
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#0055FE] text-white text-xs font-extrabold tracking-wider shadow-md">
                  FEATURED ARTICLE
                </span>
              </div>

              <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6 bg-white">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                    <span className="flex items-center gap-1.5 text-[#0055FE] font-bold">
                      <User className="w-3.5 h-3.5" />
                      {featuredBlog.author_name}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(featuredBlog.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 leading-tight group-hover:text-[#0055FE] transition-colors">
                    <Link href={`/blog/${featuredBlog.slug}`}>
                      {featuredBlog.title}
                    </Link>
                  </h2>

                  {featuredBlog.excerpt && (
                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed line-clamp-3">
                      {featuredBlog.excerpt}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex flex-wrap gap-1.5">
                    {featuredBlog.keywords?.slice(0, 3).map((kw, i) => (
                      <span key={i} className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold">
                        #{kw}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={`/blog/${featuredBlog.slug}`}
                    className="inline-flex items-center gap-2 text-xs font-extrabold text-[#0055FE] hover:text-blue-700 transition-colors"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Articles Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#0055FE]" />
              <span>Latest Articles ({blogs.length})</span>
            </h2>
          </div>

          {blogs.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-slate-400 shadow-xs">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No blog posts available</h3>
              <p className="text-xs text-slate-500 mt-1">Check back soon for latest UK car reviews and marketplace news.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {remainingBlogs.map((blog) => (
                <article
                  key={blog.id}
                  className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col group"
                >
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    {blog.cover_image ? (
                      <img
                        src={blog.cover_image}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                        <FileText className="w-12 h-12 stroke-1" />
                      </div>
                    )}
                    <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-xs text-slate-700 border border-slate-200 text-[10px] font-bold flex items-center gap-1 shadow-xs">
                      <Eye className="w-3 h-3 text-[#0055FE]" />
                      {blog.views} views
                    </span>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                        <span>{blog.author_name}</span>
                        <span>•</span>
                        <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                      </div>

                      <h3 className="text-base font-extrabold text-slate-900 line-clamp-2 leading-snug group-hover:text-[#0055FE] transition-colors">
                        <Link href={`/blog/${blog.slug}`}>{blog.title}</Link>
                      </h3>

                      {blog.excerpt && (
                        <p className="text-xs text-slate-600 line-clamp-3 font-medium leading-relaxed">
                          {blog.excerpt}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1 overflow-hidden">
                        {blog.keywords?.slice(0, 2).map((kw, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                            #{kw}
                          </span>
                        ))}
                      </div>

                      <Link
                        href={`/blog/${blog.slug}`}
                        className="text-xs font-bold text-[#0055FE] hover:text-blue-700 inline-flex items-center gap-1 shrink-0"
                      >
                        Read <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}