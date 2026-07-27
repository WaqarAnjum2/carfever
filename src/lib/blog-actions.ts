'use server';

import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { verifyAdminSession } from '@/lib/admin-actions';
import type { DbBlog } from '@/lib/supabase/types';

export type BlogInput = {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  cover_image?: string;
  images?: string[];
  author_name?: string;
  meta_title?: string;
  meta_description?: string;
  keywords?: string[];
  status?: 'draft' | 'published';
};

/** Generate URL-safe slug from title */
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

// ── Public Actions ───────────────────────────────────────────────────────────

export async function getPublicBlogs(): Promise<DbBlog[]> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('getPublicBlogs warning:', error.message);
      return [];
    }
    return (data as DbBlog[]) || [];
  } catch (err: any) {
    console.error('getPublicBlogs error:', err?.message);
    return [];
  }
}

export async function getBlogBySlug(slug: string): Promise<DbBlog | null> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) return null;
    return data as DbBlog;
  } catch (err: any) {
    console.error('getBlogBySlug error:', err?.message);
    return null;
  }
}

export async function incrementBlogViews(blogId: string): Promise<void> {
  try {
    const supabase = createServiceRoleClient();
    const { data } = await supabase.from('blogs').select('views').eq('id', blogId).maybeSingle();
    if (data) {
      await supabase.from('blogs').update({ views: (data.views || 0) + 1 }).eq('id', blogId);
    }
  } catch {}
}

// ── Admin Actions ────────────────────────────────────────────────────────────

export async function getAllBlogsAdmin(): Promise<DbBlog[]> {
  await verifyAdminSession();
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data as DbBlog[]) || [];
  } catch (err: any) {
    console.error('getAllBlogsAdmin error:', err?.message);
    return [];
  }
}

export async function createBlog(input: BlogInput): Promise<DbBlog> {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();

  const slug = input.slug?.trim() ? slugify(input.slug) : slugify(input.title);

  const payload = {
    title: input.title.trim(),
    slug: slug || `blog-${Date.now()}`,
    excerpt: input.excerpt?.trim() || null,
    content: input.content,
    cover_image: input.cover_image || null,
    images: input.images || [],
    author_name: input.author_name?.trim() || 'CarFever Team',
    meta_title: input.meta_title?.trim() || input.title.trim(),
    meta_description: input.meta_description?.trim() || input.excerpt?.trim() || null,
    keywords: input.keywords || [],
    status: input.status || 'published',
    views: 0,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('blogs')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create blog post: ${error.message}`);
  }

  revalidatePath('/blog');
  revalidatePath(`/blog/${slug}`);
  revalidatePath('/admin/blogs');
  return data as DbBlog;
}

export async function updateBlog(id: string, input: Partial<BlogInput>): Promise<DbBlog> {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();

  const payload: any = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) payload.title = input.title.trim();
  if (input.slug !== undefined && input.slug.trim()) payload.slug = slugify(input.slug);
  if (input.excerpt !== undefined) payload.excerpt = input.excerpt ? input.excerpt.trim() : null;
  if (input.content !== undefined) payload.content = input.content;
  if (input.cover_image !== undefined) payload.cover_image = input.cover_image || null;
  if (input.images !== undefined) payload.images = input.images;
  if (input.author_name !== undefined) payload.author_name = input.author_name.trim();
  if (input.meta_title !== undefined) payload.meta_title = input.meta_title.trim();
  if (input.meta_description !== undefined) payload.meta_description = input.meta_description ? input.meta_description.trim() : null;
  if (input.keywords !== undefined) payload.keywords = input.keywords;
  if (input.status !== undefined) payload.status = input.status;

  const { data, error } = await supabase
    .from('blogs')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update blog post: ${error.message}`);
  }

  revalidatePath('/blog');
  if (data?.slug) revalidatePath(`/blog/${data.slug}`);
  revalidatePath('/admin/blogs');
  return data as DbBlog;
}

export async function deleteBlog(id: string): Promise<{ success: boolean }> {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('blogs')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete blog post: ${error.message}`);
  }

  revalidatePath('/blog');
  revalidatePath('/admin/blogs');
  return { success: true };
}

/** Upload blog image base64 data to blog-images storage bucket with auto bucket creation */
export async function uploadBlogImageAction(base64Data: string, filename: string): Promise<string> {
  await verifyAdminSession();
  const supabase = createServiceRoleClient();

  // Handle URL string if already a HTTP/S link
  if (base64Data.startsWith('http://') || base64Data.startsWith('https://')) {
    return base64Data;
  }

  // Strip data URL prefix safely regardless of mime type format
  const base64Clean = base64Data.includes(';base64,')
    ? base64Data.split(';base64,')[1]
    : base64Data;

  const buffer = Buffer.from(base64Clean, 'base64');

  // Parse MIME type
  const mimeMatch = base64Data.match(/^data:(image\/[a-zA-Z0-9+\-]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/webp';
  const ext = mimeType.split('/')[1]?.replace('+xml', '') || 'webp';

  const cleanFilename = filename.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const path = `blog-${Date.now()}-${cleanFilename}.${ext}`;

  // 1. Ensure blog-images bucket exists & is public
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const hasBucket = buckets?.some(b => b.name === 'blog-images');
    if (!hasBucket) {
      await supabase.storage.createBucket('blog-images', {
        public: true,
        fileSizeLimit: 10485760, // 10MB limit
      });
    }
  } catch (err: any) {
    console.warn('Notice ensuring blog-images bucket:', err?.message);
  }

  // 2. Upload to blog-images bucket
  const { error: uploadError } = await supabase.storage
    .from('blog-images')
    .upload(path, buffer, {
      contentType: mimeType,
      cacheControl: '31536000',
      upsert: true,
    });

  if (!uploadError) {
    const { data: publicUrlData } = supabase.storage.from('blog-images').getPublicUrl(path);
    if (publicUrlData?.publicUrl) {
      return publicUrlData.publicUrl;
    }
  } else {
    console.warn('blog-images upload error, attempting car-images fallback:', uploadError.message);
  }

  // 3. Fallback: Upload to car-images bucket
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const hasCarBucket = buckets?.some(b => b.name === 'car-images');
    if (!hasCarBucket) {
      await supabase.storage.createBucket('car-images', { public: true });
    }

    const fallbackPath = `blogs/${path}`;
    const { error: fallbackError } = await supabase.storage
      .from('car-images')
      .upload(fallbackPath, buffer, {
        contentType: mimeType,
        cacheControl: '31536000',
        upsert: true,
      });

    if (!fallbackError) {
      const { data: publicUrlData } = supabase.storage.from('car-images').getPublicUrl(fallbackPath);
      if (publicUrlData?.publicUrl) {
        return publicUrlData.publicUrl;
      }
    }
  } catch (fbErr: any) {
    console.error('Fallback bucket error:', fbErr?.message);
  }

  // 4. Last-resort fallback: return formatted base64 Data URL so upload never crashes UI
  if (base64Data.startsWith('data:image')) {
    return base64Data;
  }
  return `data:${mimeType};base64,${base64Clean}`;
}
