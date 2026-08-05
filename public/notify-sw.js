/*
 * Notification-only service worker for KP Farm Ventures.
 * It does NOT cache pages or intercept requests — it only lets the app show
 * system notifications (required on Android/Chrome) and handles taps on them.
 */

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type !== "KP_SHOW_NOTIFICATION") return;
  const title = data.title || "KP Farm Ventures";
  const options = data.options || {};
  event.waitUntil(self.registration.showNotification(title, options));
});

/* Web Push: works even when the app is fully closed. */
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "KP Farm Ventures", body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "KP Farm Ventures";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "",
      tag: payload.tag || String(Date.now()),
      renotify: true,
      requireInteraction: true,
      icon: "/app-icon.png",
      badge: "/app-icon.png",
      vibrate: [200, 100, 200],
      timestamp: Date.now(),
      data: { url: payload.url || "/admin" },
    }),
  );
});

/* Browsers sometimes rotate a device's push endpoint. Re-subscribe with the
   same server key so the device keeps receiving pushes; the app saves the new
   endpoint the next time it is opened. */
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const key =
          (event.oldSubscription &&
            event.oldSubscription.options &&
            event.oldSubscription.options.applicationServerKey) ||
          null;
        if (!key) return;
        await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key,
        });
      } catch {
        /* ignore */
      }
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  const target =
    (event.notification && event.notification.data && event.notification.data.url) || "/";
  event.notification.close();
  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clientList) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client && target) {
            try {
              await client.navigate(target);
            } catch {
              /* ignore */
            }
          }
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
