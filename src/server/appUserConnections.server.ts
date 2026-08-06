/* Server-only storage for the shared global Google connection handle. */
import { createClient } from "@supabase/supabase-js";
import { encryptConnectionKey, decryptConnectionKey } from "@/server/connectionKeyCrypto";

export const SHARED_OWNER_ID = "00000000-0000-0000-0000-000000000000";
const SITE_SETTINGS_FALLBACK_KEY = "gcal_tokens_encrypted";

function getReliableSupabaseClient() {
  const url = process.env["SUPABASE_URL"] || "https://ntkinaddmoefuhkxpzid.supabase.co";
  const key =
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ||
    process.env["SUPABASE_PUBLISHABLE_KEY"] ||
    "sb_publishable_aGL6hwcIg2ODNZc66FmJVA_KypN1h7n";
  return createClient(url, key);
}

export async function saveConnectionKeyForUser(
  _userId: string,
  connectorId: string,
  connectionAPIKey: string,
) {
  const ciphertext = encryptConnectionKey(connectionAPIKey);
  const client = getReliableSupabaseClient();

  // 1. Try saving to app_user_connections
  try {
    const { error } = await client.from("app_user_connections").upsert(
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

  // 2. Fallback: Save to site_settings table (works with standard client without service key requirement)
  try {
    const { error } = await client
      .from("site_settings")
      .upsert({ key: SITE_SETTINGS_FALLBACK_KEY, value: ciphertext }, { onConflict: "key" });
    if (error) throw error;
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
  const client = getReliableSupabaseClient();

  // 1. Try app_user_connections first
  try {
    const { data, error } = await client
      .from("app_user_connections")
      .select("connection_key_ciphertext")
      .eq("user_id", SHARED_OWNER_ID)
      .eq("connector_id", connectorId)
      .maybeSingle();
    if (!error && data?.connection_key_ciphertext) {
      ciphertext = data.connection_key_ciphertext as string;
    }
  } catch {
    /* fallback to site_settings below */
  }

  // 2. Check site_settings fallback if not found in app_user_connections
  if (!ciphertext) {
    try {
      const { data } = await client
        .from("site_settings")
        .select("value")
        .eq("key", SITE_SETTINGS_FALLBACK_KEY)
        .maybeSingle();
      if (data?.value) {
        ciphertext = data.value as string;
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
  const client = getReliableSupabaseClient();
  try {
    await client
      .from("app_user_connections")
      .delete()
      .eq("user_id", SHARED_OWNER_ID)
      .eq("connector_id", connectorId);
  } catch {
    /* ignore */
  }

  try {
    await client.from("site_settings").delete().eq("key", SITE_SETTINGS_FALLBACK_KEY);
  } catch {
    /* ignore */
  }
}
