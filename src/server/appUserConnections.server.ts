/* Server-only storage for the shared global Google connection handle. */
import { encryptConnectionKey, decryptConnectionKey } from "@/server/connectionKeyCrypto";

export const SHARED_OWNER_ID = "00000000-0000-0000-0000-000000000000";
const SITE_SETTINGS_FALLBACK_KEY = "gcal_tokens_encrypted";

export async function saveConnectionKeyForUser(
  _userId: string,
  connectorId: string,
  connectionAPIKey: string,
) {
  const ciphertext = encryptConnectionKey(connectionAPIKey);

  // 1. Try saving to app_user_connections via supabaseAdmin
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("app_user_connections").upsert(
      {
        user_id: SHARED_OWNER_ID,
        connector_id: connectorId,
        connection_key_ciphertext: ciphertext,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,connector_id" },
    );
    if (!error) return;
    console.warn("app_user_connections save warning:", error.message);
  } catch (e) {
    console.warn("app_user_connections save failed, falling back to site_settings:", e);
  }

  // 2. Fallback: Save to site_settings table (which uses standard client without service key requirement)
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("site_settings")
      .upsert({ key: SITE_SETTINGS_FALLBACK_KEY, value: ciphertext }, { onConflict: "key" });
  } catch (e) {
    console.error("site_settings fallback save error:", e);
    throw new Error(
      "Failed to save Google Calendar credentials to database. Please check your Supabase setup.",
    );
  }
}

export async function getConnectionKeyForUser(
  _userId: string,
  connectorId: string,
): Promise<string | null> {
  let ciphertext: string | null = null;

  // 1. Try app_user_connections first
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("app_user_connections")
      .select("connection_key_ciphertext")
      .eq("user_id", SHARED_OWNER_ID)
      .eq("connector_id", connectorId)
      .maybeSingle();
    if (data?.connection_key_ciphertext) {
      ciphertext = data.connection_key_ciphertext as string;
    }
  } catch {
    /* fallback to site_settings below */
  }

  // 2. Check site_settings fallback if not found in app_user_connections
  if (!ciphertext) {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data } = await supabaseAdmin
        .from("site_settings")
        .select("value")
        .eq("key", SITE_SETTINGS_FALLBACK_KEY)
        .maybeSingle();
      if (data?.value) {
        ciphertext = data.value;
      }
    } catch {
      /* ignore */
    }
  }

  if (!ciphertext) return null;
  try {
    return decryptConnectionKey(ciphertext);
  } catch {
    return null;
  }
}

export async function deleteConnectionKeyForUser(_userId: string, connectorId: string) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("app_user_connections")
      .delete()
      .eq("user_id", SHARED_OWNER_ID)
      .eq("connector_id", connectorId);
  } catch {
    /* ignore */
  }

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("site_settings").delete().eq("key", SITE_SETTINGS_FALLBACK_KEY);
  } catch {
    /* ignore */
  }
}
