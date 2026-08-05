/* Shared helpers for browser (web-app) notifications and meeting reminders. */

export type ReminderLead = "1h" | "5m";

export const REMINDER_LEADS: { key: ReminderLead; minutes: number; label: string }[] = [
  { key: "1h", minutes: 60, label: "in 1 hour" },
  { key: "5m", minutes: 5, label: "in 5 minutes" },
];

export function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

const SW_URL = "/notify-sw.js";
let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Registers the notification-only service worker. Android / Chrome refuses
 * `new Notification()` and only shows notifications in the phone's notification
 * bar when they come from a service worker registration.
 */
export async function ensureNotificationWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  if (swRegistration) return swRegistration;
  try {
    swRegistration = await navigator.serviceWorker.register(SW_URL, { updateViaCache: "none" });
    await swRegistration.update();
    swRegistration = await navigator.serviceWorker.ready;
  } catch {
    swRegistration = null;
  }
  return swRegistration;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  if (Notification.permission === "denied") return false;
  if (Notification.permission !== "granted") {
    const res = await Notification.requestPermission();
    if (res !== "granted") return false;
  }
  await ensureNotificationWorker();
  return true;
}

export async function showNotification(title: string, body: string, tag: string, url?: string) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  const options: NotificationOptions & {
    vibrate?: number[];
    renotify?: boolean;
    timestamp?: number;
  } = {
    body,
    tag,
    renotify: true,
    requireInteraction: true,
    icon: "/app-icon.png",
    badge: "/app-icon.png",
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
    data: { url: url ?? (typeof window !== "undefined" ? window.location.pathname : "/") },
  };
  try {
    const reg = await ensureNotificationWorker();
    if (reg) {
      const worker = reg.active ?? reg.waiting ?? reg.installing;
      if (worker) {
        worker.postMessage({ type: "KP_SHOW_NOTIFICATION", title, options });
        return;
      }
      await reg.showNotification(title, options);
      return;
    }
  } catch {
    /* fall through to the plain Notification API */
  }
  try {
    new Notification(title, options);
  } catch {
    /* ignore */
  }
}

/** Combine a `YYYY-MM-DD` date and an optional `HH:MM` time into a Date. */
export function meetingDateTime(date?: string | null, time?: string | null): Date | null {
  if (!date) return null;
  const m = String(time ?? "").match(/^(\d{1,2}):(\d{2})/);
  const d = new Date(`${date}T00:00:00`);
  if (isNaN(d.getTime())) return null;
  d.setHours(m ? parseInt(m[1], 10) : 10, m ? parseInt(m[2], 10) : 0, 0, 0);
  return d;
}

/** Fire-once guard so a reminder is not repeated on every poll / reload. */
const FIRED_KEY = "kp_reminders_fired";

function readFired(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(FIRED_KEY) || "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

export function alreadyFired(key: string) {
  return Boolean(readFired()[key]);
}

export function markFired(key: string) {
  try {
    const all = readFired();
    all[key] = Date.now();
    const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 14;
    for (const k of Object.keys(all)) if (all[k] < cutoff) delete all[k];
    localStorage.setItem(FIRED_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

/**
 * Returns the reminder lead that is due right now for a meeting, or null.
 * A lead is due inside a small window so a poll can't miss it.
 */
export function dueReminder(when: Date, now = new Date()): ReminderLead | null {
  const minsAway = (when.getTime() - now.getTime()) / 60000;
  if (minsAway <= 5.5 && minsAway > 0) return "5m";
  if (minsAway <= 61 && minsAway > 55) return "1h";
  return null;
}

export function leadLabel(lead: ReminderLead) {
  return REMINDER_LEADS.find((l) => l.key === lead)?.label ?? "";
}

export function formatWhen(when: Date) {
  return when.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}
