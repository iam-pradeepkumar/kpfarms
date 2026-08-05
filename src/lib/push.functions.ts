import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Exposes the public VAPID key so the browser can subscribe to background push. */
export const getVapidPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  return { publicKey: process.env.VAPID_PUBLIC_KEY ?? "" };
});

/**
 * Sends a test notification to every device signed in as admin, so the admin can
 * confirm alerts arrive in the phone notification bar with the app fully closed.
 */
export const sendAdminTestPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { buildPushPayload } = await import("@block65/webcrypto-web-push");
    const { data } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("audience", "admin");
    const devices =
      (data as { id: string; endpoint: string; p256dh: string; auth: string }[]) ?? [];
    const vapid = {
      subject: process.env.VAPID_SUBJECT,
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    };

    let sent = 0;
    for (const device of devices) {
      try {
        const payload = await buildPushPayload(
          {
            data: {
              title: "KP test alert",
              body: "Phone alerts are working. You will get these even when the app is closed.",
              url: "/admin",
              tag: `test-${Date.now()}`,
            },
            options: { ttl: 600 },
          },
          {
            endpoint: device.endpoint,
            expirationTime: null,
            keys: { p256dh: device.p256dh, auth: device.auth },
          },
          vapid,
        );
        const res = await fetch(device.endpoint, {
          ...payload,
          body: payload.body as unknown as BodyInit,
        });
        if (res.status === 404 || res.status === 410 || res.status === 403) {
          await supabaseAdmin.from("push_subscriptions").delete().eq("id", device.id);
        } else if (res.ok) {
          sent += 1;
        }
      } catch {
        /* try the next device */
      }
    }
    return { sent, devices: devices.length };
  });
