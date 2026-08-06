/* Server-only storage for the Google connection tokens using site_settings. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { encryptConnectionKey, decryptConnectionKey } from "@/server/connectionKeyCrypto";

export const SHARED_OWNER_ID = "00000000-0000-0000-0000-000000000000";
const SITE_SETTINGS_FALLBACK_KEY = "gcal_tokens_encrypted";

export async function saveConnectionKeyForUser(
  _userId: string,
  _connectorId: string,
  connectionAPIKey: string,
  client?: SupabaseClient,
) {
  const ciphertext = encryptConnectionKey(connectionAPIKey);
  const db = client || supabase;

  const { error } = await db
    .from("site_settings")
    .upsert({ key: SITE_SETTINGS_FALLBACK_KEY, value: ciphertext }, { onConflict: "key" });

  if (error) {
    console.error("site_settings token save error:", error);
    throw new Error(`Database save error: ${error.message || JSON.stringify(error)}`);
  }
}

export async function getConnectionKeyForUser(
  _userId: string,
  _connectorId: string,
  client?: SupabaseClient,
): Promise<string | null> {
  try {
    const db = client || supabase;
    const { data } = await db
      .from("site_settings")
      .select("value")
      .eq("key", SITE_SETTINGS_FALLBACK_KEY)
      .maybeSingle();

    if (!data?.value) return null;
    return decryptConnectionKey(data.value);
  } catch (e) {
    console.error("getConnectionKeyForUser error:", e);
    return null;
  }
}

export async function deleteConnectionKeyForUser(
  _userId: string,
  _connectorId: string,
  client?: SupabaseClient,
) {
  try {
    const db = client || supabase;
    await db.from("site_settings").delete().eq("key", SITE_SETTINGS_FALLBACK_KEY);
  } catch (e) {
    console.error("deleteConnectionKeyForUser error:", e);
  }
}
