/* Browser helpers for background (closed-app) push notifications. */
import { supabase } from "@/integrations/supabase/client";
import { getVapidPublicKey } from "@/lib/push.functions";
import { ensureNotificationWorker } from "@/lib/reminders";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

function b64(buf: ArrayBuffer | null) {
  if (!buf) return "";
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

/**
 * Subscribes this device for push messages so alerts arrive even when the
 * admin app is fully closed. Safe to call repeatedly.
 */
export async function subscribeToPush(): Promise<boolean> {
  try {
    if (typeof window === "undefined" || !("PushManager" in window)) return false;
    if (Notification.permission !== "granted") return false;

    const reg = await ensureNotificationWorker();
    if (!reg) return false;

    const { publicKey } = await getVapidPublicKey();
    if (!publicKey) return false;

    let sub = await reg.pushManager.getSubscription();
    if (sub) {
      const current = b64(sub.options.applicationServerKey ?? null);
      const wanted = b64(urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer);
      if (current !== wanted) {
        await sub.unsubscribe();
        sub = null;
      }
    }
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
    }

    const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId || !json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: userId,
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
        audience: "admin",
      },
      { onConflict: "endpoint" },
    );
    return !error;
  } catch {
    return false;
  }
}
