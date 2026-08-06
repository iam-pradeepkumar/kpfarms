import { createServerFn } from "@tanstack/react-start";

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
