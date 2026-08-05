import { useEffect, useRef, useState } from "react";
import { Bell, BellRing, Check } from "lucide-react";
import { useAdminAlerts } from "@/lib/admin-alerts";
import { subscribeToPush } from "@/lib/push-client";
import {
  ensureNotificationWorker,
  notificationPermission,
  requestNotificationPermission,
  showNotification,
} from "@/lib/reminders";

export function AdminNotificationBell() {
  const { alerts, unread, markAllRead, clear } = useAdminAlerts();
  const [open, setOpen] = useState(false);
  const [perm, setPerm] = useState<string>("default");
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setPerm(notificationPermission());
    const register = () => {
      if (notificationPermission() !== "granted") return;
      void ensureNotificationWorker().then(() => subscribeToPush());
    };
    register();
    // Phones rotate push endpoints. Re-register whenever the app is brought
    // back to the front so every admin device stays subscribed.
    const onVisible = () => {
      if (document.visibilityState === "visible") register();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const enable = async () => {
    const ok = await requestNotificationPermission();
    setPerm(ok ? "granted" : notificationPermission());
    if (ok) {
      await subscribeToPush();
      await showNotification(
        "KP phone alerts are on",
        "New orders and bookings will show in your phone notification bar, even when this app is closed.",
        "admin-alerts-enabled",
        "/admin",
      );
    }
  };

  return (
    <div ref={boxRef} className="relative">
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open) markAllRead();
        }}
        className="relative rounded-full border border-stone-200 bg-white p-2.5 text-stone-600 transition hover:border-kp-green hover:text-kp-green"
        aria-label="Notifications"
      >
        {unread > 0 ? <BellRing size={16} className="text-kp-red" /> : <Bell size={16} />}
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-kp-red text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed right-3 top-[calc(env(safe-area-inset-top)+4.25rem)] z-[120] w-[calc(100vw-1.5rem)] max-w-sm overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl sm:absolute sm:right-0 sm:top-auto sm:mt-2 sm:w-80">
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-kp-gold">
              Alerts
            </span>
            <button
              onClick={clear}
              className="text-[11px] font-semibold text-stone-400 hover:text-kp-red"
            >
              Clear
            </button>
          </div>

          {perm !== "granted" && (
            <div className="border-b border-stone-100 bg-amber-50 px-4 py-3 text-xs text-stone-600">
              {perm === "denied" ? (
                <span>
                  Pop-up alerts are blocked in this browser. Allow notifications in site settings.
                </span>
              ) : (
                <button onClick={enable} className="font-bold text-kp-green underline">
                  Turn on pop-up alerts on this device
                </button>
              )}
            </div>
          )}

          <div className="max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-stone-400">No alerts yet.</div>
            ) : (
              alerts.map((a) => (
                <div key={a.id} className="border-b border-stone-100 px-4 py-3 last:border-0">
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1 size-2 shrink-0 rounded-full ${
                        a.kind === "reminder" ? "bg-kp-gold" : "bg-kp-green"
                      }`}
                    />
                    <div>
                      <div className="text-sm font-bold text-stone-800">{a.title}</div>
                      <div className="text-xs text-stone-500">{a.body}</div>
                      <div className="mt-0.5 text-[10px] uppercase tracking-widest text-stone-400">
                        {new Date(a.at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {alerts.length > 0 && (
            <div className="flex items-center gap-1.5 border-t border-stone-100 px-4 py-2 text-[11px] text-stone-400">
              <Check size={12} /> Marked as read
            </div>
          )}
        </div>
      )}
    </div>
  );
}
