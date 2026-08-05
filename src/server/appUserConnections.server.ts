/* Server-only storage for the shared global Google connection handle. */
import { encryptConnectionKey, decryptConnectionKey } from "@/server/connectionKeyCrypto";

export const SHARED_OWNER_ID = "00000000-0000-0000-0000-000000000000";

export async function saveConnectionKeyForUser(
  _userId: string,
  connectorId: string,
  connectionAPIKey: string,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("app_user_connections").upsert(
    {
      user_id: SHARED_OWNER_ID,
      connector_id: connectorId,
      connection_key_ciphertext: encryptConnectionKey(connectionAPIKey),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,connector_id" },
  );
  if (error) throw error;
}

export async function getConnectionKeyForUser(
  _userId: string,
  connectorId: string,
): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("app_user_connections")
    .select("connection_key_ciphertext")
    .eq("user_id", SHARED_OWNER_ID)
    .eq("connector_id", connectorId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  try {
    return decryptConnectionKey(data.connection_key_ciphertext as string);
  } catch {
    return null;
  }
}

export async function deleteConnectionKeyForUser(_userId: string, connectorId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("app_user_connections")
    .delete()
    .eq("user_id", SHARED_OWNER_ID)
    .eq("connector_id", connectorId);
}
