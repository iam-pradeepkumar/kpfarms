import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Fetch public site settings safely on the server using service role client */
export const getPublicSiteSettings = createServerFn({ method: "POST" })
  .validator((keys: string[]) => keys)
  .handler(async ({ data: keys }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("site_settings")
      .select("key, value")
      .in("key", keys);
    return data ?? [];
  });

/** Save site settings from the dashboard on the server */
export const saveAdminSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((settings: Record<string, string | null>) => settings)
  .handler(async ({ data: settings }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const updates = Object.entries(settings).map(([key, value]) =>
      supabaseAdmin.from("site_settings").upsert({ key, value }, { onConflict: "key" })
    );
    await Promise.all(updates);
    return { success: true };
  });

/** Fetch approved testimonials on the server (bypasses RLS) */
export const getPublicTestimonials = createServerFn({ method: "POST" })
  .validator((opts: { limit?: number; textOnly?: boolean }) => opts)
  .handler(async ({ data: opts }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("testimonials")
      .select("id, name, place, text, rating, media_type, media_url, status, featured, created_at")
      .eq("status", "approved")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });
    if (opts.textOnly) q = q.not("text", "is", null);
    if (opts.limit) q = q.limit(opts.limit);
    const { data } = await q;
    return data ?? [];
  });

/** Fetch published blog posts on the server (bypasses RLS) */
export const getPublicBlogPosts = createServerFn({ method: "POST" })
  .validator((opts: { limit?: number }) => opts)
  .handler(async ({ data: opts }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("blog_posts")
      .select("*")
      .eq("published", true)
      .order("published_at", { ascending: false });
    if (opts.limit) q = q.limit(opts.limit);
    const { data } = await q;
    return data ?? [];
  });

/** Fetch home video URLs on the server including signed storage URLs (bypasses RLS) */
export const getPublicHomeVideos = createServerFn({ method: "POST" })
  .validator((keys: string[]) => keys)
  .handler(async ({ data: keys }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("site_settings")
      .select("key, value")
      .in("key", keys);
    const result: Record<string, string> = {};
    for (const row of data ?? []) {
      const path = (row as { key: string; value: string | null }).value;
      if (!path) continue;
      if (/^https?:\/\//i.test(path)) {
        result[(row as { key: string }).key] = path;
      } else {
        const { data: signed } = await supabaseAdmin.storage
          .from("site-assets")
          .createSignedUrl(path, 60 * 60);
        if (signed?.signedUrl) result[(row as { key: string }).key] = signed.signedUrl;
      }
    }
    return result;
  });

/** Fetch homepage aggregate counts on the server (bypasses RLS) */
export const getPublicHomeCounts = createServerFn({ method: "POST" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [c1, c2, c3, rpc] = await Promise.all([
      supabaseAdmin.from("consultation_bookings").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("farm_visit_bookings").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("training_registrations").select("id", { count: "exact", head: true }),
      supabaseAdmin.rpc("trained_farmers_count" as never),
    ]);
    return {
      consultations: c1.count ?? 0,
      farmVisits: c2.count ?? 0,
      trainingRegs: c3.count ?? 0,
      trainedFarmers: Number((rpc as any).data) || 0,
    };
  });

/** Resolve a testimonial media URL on the server (bypasses storage RLS) */
export const resolveTestimonialMedia = createServerFn({ method: "POST" })
  .validator((path: string) => path)
  .handler(async ({ data: path }) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.storage.from("testimonials").createSignedUrl(path, 60 * 60);
    return data?.signedUrl ?? null;
  });
