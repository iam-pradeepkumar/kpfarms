import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Fetch public site settings safely on the server using service role client to bypass client RLS issues */
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

/** Save site settings from the dashboard on the server using admin bypass to ensure updates commit perfectly */
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
