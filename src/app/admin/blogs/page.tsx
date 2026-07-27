'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Check,
  X,
  Upload,
  Image as ImageIcon,
  Loader2,
  Globe,
  Tag,
  User,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  getAllBlogsAdmin,
  createBlog,
  updateBlog,
  deleteBlog,
  uploadBlogImageAction,
  type BlogInput,
} from '@/lib/blog-actions';
import type { DbBlog } from '@/lib/supabase/types';

/** Compress image file client-side to lightweight WebP base64 before upload */
function compressImageToWebP(file: File, maxWidth = 1400, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = (err) => reject(err);
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = (err) => reject(err);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const webpDataUrl = canvas.toDataURL('image/webp', quality);
        resolve(webpDataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<DbBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<DbBlog | null>(null);
  const [deleteModalBlog, setDeleteModalBlog] = useState<DbBlog | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [formData, setFormData] = useState<BlogInput>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    cover_image: '',
    images: [],
    author_name: 'CarFever Team',
    meta_title: '',
    meta_description: '',
    keywords: [],
    status: 'published',
  });

  const [keywordInput, setKeywordInput] = useState('');

  const loadBlogs = async () => {
    setLoading(true);
    try {
      const data = await getAllBlogsAdmin();
      setBlogs(data);
    } catch (err: any) {
      toast.error(`Failed to load blog posts: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  const openCreateModal = () => {
    setEditingBlog(null);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      cover_image: '',
      images: [],
      author_name: 'CarFever Team',
      meta_title: '',
      meta_description: '',
      keywords: ['CarFever', 'Car Marketplace', 'UK Cars'],
      status: 'published',
    });
    setKeywordInput('');
    setModalOpen(true);
  };

  const openEditModal = (blog: DbBlog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt || '',
      content: blog.content,
      cover_image: blog.cover_image || '',
      images: blog.images || [],
      author_name: blog.author_name || 'CarFever Team',
      meta_title: blog.meta_title || '',
      meta_description: blog.meta_description || '',
      keywords: blog.keywords || [],
      status: blog.status,
    });
    setKeywordInput('');
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCover: boolean = true) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const file = files[0];
      // Convert & compress to lightweight WebP client-side to prevent HTTP 500 payload limits
      const compressedBase64 = await compressImageToWebP(file);
      const url = await uploadBlogImageAction(compressedBase64, file.name);

      if (isCover) {
        setFormData(prev => ({ ...prev, cover_image: url }));
        toast.success('Cover image uploaded & optimized as WebP!');
      } else {
        setFormData(prev => ({ ...prev, images: [...(prev.images || []), url] }));
        toast.success('Gallery image uploaded & optimized as WebP!');
      }
    } catch (err: any) {
      toast.error(`Image upload failed: ${err.message || 'Error processing image'}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddKeyword = () => {
    if (!keywordInput.trim()) return;
    if (!formData.keywords?.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...(prev.keywords || []), keywordInput.trim()],
      }));
    }
    setKeywordInput('');
  };

  const handleRemoveKeyword = (kw: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords?.filter(k => k !== kw) || [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and Blog Content are required.');
      return;
    }

    setActionLoading(true);
    try {
      if (editingBlog) {
        await updateBlog(editingBlog.id, formData);
        toast.success('Blog post updated successfully!');
      } else {
        await createBlog(formData);
        toast.success('New blog post published successfully!');
      }
      setModalOpen(false);
      loadBlogs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save blog post.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModalBlog) return;
    setActionLoading(true);
    try {
      await deleteBlog(deleteModalBlog.id);
      toast.success('Blog post deleted successfully!');
      setDeleteModalBlog(null);
      loadBlogs();
    } catch (err: any) {
      toast.error(`Failed to delete blog: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch =
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (blog.author_name && blog.author_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || blog.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#0055FE] uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Content Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Blog Posts</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Create, publish, and optimize automotive news & buyer guides with automated WebP compression.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-5 py-3 bg-[#0055FE] hover:bg-blue-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Blog</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, slug, author…"
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0055FE]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(['all', 'published', 'draft'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-50 text-[#0055FE] border border-blue-200 shadow-xs'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Blog Cards Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 text-[#0055FE] animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-semibold">Loading blog posts…</p>
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-slate-400">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No blog posts found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">Create your first automotive news or review article.</p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#0055FE] text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-md shadow-blue-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Article</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map(blog => (
            <div
              key={blog.id}
              className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
            >
              {/* Cover Photo */}
              <div className="relative h-48 bg-slate-900 overflow-hidden">
                {blog.cover_image ? (
                  <img
                    src={blog.cover_image}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900">
                    <ImageIcon className="w-10 h-10 stroke-1" />
                  </div>
                )}
                <span
                  className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    blog.status === 'published'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {blog.status}
                </span>
                <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1">
                  <Eye className="w-3 h-3 text-blue-400" />
                  {blog.views} views
                </span>
              </div>

              {/* Content Details */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-semibold mb-1">
                    <User className="w-3 h-3 text-[#0055FE]" />
                    <span>{blog.author_name}</span>
                    <span>•</span>
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 line-clamp-2 leading-snug">
                    {blog.title}
                  </h3>
                  {blog.excerpt && (
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 font-medium leading-relaxed">
                      {blog.excerpt}
                    </p>
                  )}
                </div>

                {/* Keywords & Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 overflow-hidden">
                    {blog.keywords?.slice(0, 2).map((kw, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold truncate max-w-[90px]">
                        #{kw}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      href={`/blog/${blog.slug}`}
                      target="_blank"
                      className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                      title="View Public Post"
                    >
                      <Globe className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => openEditModal(blog)}
                      className="p-2 rounded-xl bg-blue-50 text-[#0055FE] hover:bg-blue-100 transition-colors cursor-pointer"
                      title="Edit Post"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteModalBlog(blog)}
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                      title="Delete Post"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Blog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col relative">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {editingBlog ? 'Edit Blog Article' : 'Create & Publish New Blog'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">Auto WebP compression enabled for images.</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Article Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Top 10 Luxury Supercars to Buy in UK in 2026"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#0055FE]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Custom URL Slug (Optional)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="top-10-luxury-supercars-uk"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0055FE]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Author Name</label>
                  <input
                    type="text"
                    value={formData.author_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, author_name: e.target.value }))}
                    placeholder="CarFever Editorial Team"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0055FE]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Short Excerpt / Summary</label>
                <textarea
                  rows={2}
                  value={formData.excerpt || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Brief preview sentence displayed on search engine results and blog cards…"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#0055FE]"
                />
              </div>

              {/* Cover Photo Upload & URL */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Cover Photo (Auto Upload to Supabase Storage)</label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {formData.cover_image && (
                    <img
                      src={formData.cover_image}
                      alt="Cover Preview"
                      className="w-24 h-16 object-cover rounded-xl border border-slate-200 shrink-0"
                    />
                  )}
                  <label className="flex-1 border-2 border-dashed border-slate-200 hover:border-[#0055FE] rounded-2xl p-3 text-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2">
                    {uploadingImage ? (
                      <Loader2 className="w-4 h-4 text-[#0055FE] animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-xs font-bold text-slate-700">
                      {uploadingImage ? 'Uploading image…' : 'Upload Cover Photo'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, true)}
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={formData.cover_image || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, cover_image: e.target.value }))}
                  placeholder="Or paste direct image URL (e.g. https://...)"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#0055FE]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Article Content *</label>
                <textarea
                  rows={8}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Write full article here. Supports paragraphs and standard markdown text format…"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#0055FE]"
                />
              </div>

              {/* SEO Settings */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                  <Sparkles className="w-4 h-4 text-[#0055FE]" />
                  <span>Search Engine Optimization (SEO)</span>
                </div>
                <div>
                  <input
                    type="text"
                    value={formData.meta_title || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                    placeholder="Meta Title Tag"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <textarea
                    rows={2}
                    value={formData.meta_description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                    placeholder="Meta Description Tag"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
                
                {/* Keywords Tagging */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Keywords</label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                      placeholder="Add keyword & press Enter"
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={handleAddKeyword}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.keywords?.map((kw, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-blue-100 text-[#0055FE] rounded-lg text-xs font-bold flex items-center gap-1">
                        #{kw}
                        <button type="button" onClick={() => handleRemoveKeyword(kw)} className="hover:text-rose-600">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status Select */}
              <div className="flex items-center justify-between pt-2">
                <label className="text-xs font-bold text-slate-700">Publishing Status:</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                >
                  <option value="published">Published (Visible on site)</option>
                  <option value="draft">Draft (Private)</option>
                </select>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-[#0055FE] hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{editingBlog ? 'Update Post' : 'Publish Article'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalBlog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-rose-200 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Delete Blog Article?</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Are you sure you want to delete <span className="font-bold text-slate-900">"{deleteModalBlog.title}"</span>?
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteModalBlog(null)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Delete Article'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}