import { supabase } from "@/integrations/supabase/client";

export type BlogPost = {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string | null;
  content: string | null;
  category: string | null;
  cover_url: string | null;
  video_url: string | null;
  published: boolean;
  published_at: string;
  created_at: string;
};

export const BLOG_BUCKET = "blog-media";

export async function listBlogPosts(opts?: { includeDrafts?: boolean }): Promise<BlogPost[]> {
  let q = supabase.from("blog_posts").select("*").order("published_at", { ascending: false });
  if (!opts?.includeDrafts) q = q.eq("published", true);
  const { data } = await q;
  return (data as BlogPost[]) ?? [];
}

/** Storage paths are stored as-is; full http(s) URLs are passed through. */
export async function resolveBlogMediaUrl(value: string | null): Promise<string | null> {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const { data } = await supabase.storage.from(BLOG_BUCKET).createSignedUrl(value, 60 * 60);
  return data?.signedUrl ?? null;
}

export async function uploadBlogMedia(
  file: File,
): Promise<{ path: string | null; error: Error | null }> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(BLOG_BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (error) return { path: null, error: error as unknown as Error };
  return { path, error: null };
}

export function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}
