/*
 * Background alert dispatcher.
 * Called every minute by a scheduled job. Finds new orders/bookings and
 * upcoming confirmed slots, then sends Web Push messages to admin devices so
 * the notification appears even when the admin app is closed.
 */
import { createFileRoute } from "@tanstack/react-router";
import { buildPushPayload } from "@block65/webcrypto-web-push";

type Row = Record<string, unknown>;

/* Only one alert per customer: bookings alert when the customer has finished
   all steps and uploaded the payment screenshot (booking_step = 'paid'),
   orders alert as soon as the order is placed. */
const NEW_SOURCES = [
  {
    table: "consultation_bookings",
    label: "Online meeting booking — payment submitted",
    nameField: "name",
    dateField: "preferred_date",
    timeField: "preferred_time",
    extraField: "topic",
    extraLabel: "Topic",
    tsField: "paid_at",
    paidOnly: true,
  },
  {
    table: "farm_visit_bookings",
    label: "Farm visit booking — payment submitted",
    nameField: "name",
    dateField: "visit_date",
    timeField: null,
    extraField: "group_size",
    extraLabel: "People",
    tsField: "paid_at",
    paidOnly: true,
  },
  {
    table: "training_bookings",
    label: "Training registration — payment submitted",
    nameField: "name",
    dateField: "cohort_date",
    timeField: null,
    extraField: "program",
    extraLabel: "Program",
    tsField: "paid_at",
    paidOnly: true,
  },
  {
    table: "orders",
    label: "New product order",
    nameField: "customer_name",
    dateField: null,
    timeField: null,
    extraField: "product_name",
    extraLabel: "Product",
    tsField: "created_at",
    paidOnly: false,
  },
] as const;

/* Countdown reminders (1 hour / 5 minutes) apply only to online meetings. */
const MEETING_SOURCES = [
  {
    table: "consultation_bookings",
    dateField: "preferred_date",
    timeField: "preferred_time",
    label: "Online meeting",
  },
] as const;

/* Slots are always saved in India time. The server clock is UTC, so the
   +05:30 offset must be written explicitly or reminders fire hours late. */
function meetingDateTime(date?: string | null, time?: string | null): Date | null {
  if (!date) return null;
  const m = String(time ?? "").match(/^(\d{1,2}):(\d{2})/);
  const hh = String(m ? parseInt(m[1], 10) : 10).padStart(2, "0");
  const mm = m ? m[2] : "00";
  const ms = Date.parse(`${date}T${hh}:${mm}:00+05:30`);
  return Number.isNaN(ms) ? null : new Date(ms);
}

function formatWhen(when: Date) {
  return when.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function dueReminder(when: Date, now: Date): "1h" | "5m" | null {
  const minsAway = (when.getTime() - now.getTime()) / 60000;
  if (minsAway <= 6 && minsAway > 0) return "5m";
  if (minsAway <= 62 && minsAway > 54) return "1h";
  return null;
}

type Alert = { key: string; title: string; body: string; url: string };

export const Route = createFileRoute("/api/public/push-dispatch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.PUSH_CRON_SECRET;
        const providedSecret =
          request.headers.get("x-cron-secret") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

        if (!secret || providedSecret !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const now = new Date();
        const alerts: Alert[] = [];

        // 1) Newly created orders and bookings (last 30 minutes, de-duplicated by log).
        const since = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
        for (const src of NEW_SOURCES) {
          let q = supabaseAdmin
            .from(src.table as never)
            .select("*")
            .gt(src.tsField, since)
            .order(src.tsField, { ascending: false })
            .limit(20);
          if (src.paidOnly) q = q.eq("booking_step", "paid");
          const { data } = await q;
          for (const r of (data as unknown as Row[]) ?? []) {
            const lines: string[] = [];
            const who = String(r[src.nameField] ?? "Someone");
            lines.push(r.whatsapp ? `${who} — ${String(r.whatsapp)}` : who);
            if (src.dateField) {
              const when = meetingDateTime(
                r[src.dateField] as string | null,
                src.timeField ? (r[src.timeField] as string | null) : null,
              );
              if (when) {
                lines.push(
                  src.timeField
                    ? formatWhen(when)
                    : when.toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      }),
                );
              }
            }
            if (r[src.extraField]) lines.push(`${src.extraLabel}: ${String(r[src.extraField])}`);
            alerts.push({
              key: `push:new:${src.table}:${String(r.id)}`,
              title: src.label,
              body: lines.join("\n"),
              url: "/admin",
            });
          }
        }

        // 2) Reminders 1 hour and 5 minutes before every confirmed slot.
        // Look back one day so India-time slots are never skipped by the UTC clock.
        const today = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

        for (const src of MEETING_SOURCES) {
          const { data } = await supabaseAdmin
            .from(src.table as never)
            .select("*")
            .not("confirmed_at", "is", null)
            .gte(src.dateField, today)
            .limit(100);
          for (const r of (data as unknown as Row[]) ?? []) {
            const when = meetingDateTime(
              r[src.dateField] as string | null,
              src.timeField ? (r[src.timeField] as string | null) : null,
            );
            if (!when) continue;
            const lead = dueReminder(when, now);
            if (!lead) continue;
            const parts = [
              `${String(r.name ?? "")}${r.whatsapp ? ` — ${String(r.whatsapp)}` : ""}`,
              formatWhen(when),
            ];
            if (r.program) parts.push(`Program: ${String(r.program)}`);
            if (r.group_size) parts.push(`People: ${String(r.group_size)}`);
            if (src.table === "consultation_bookings" && r.meeting_link)
              parts.push(`Join: ${String(r.meeting_link)}`);
            alerts.push({
              key: `push:rem:${src.table}:${String(r.id)}:${lead}`,
              title: `${src.label} ${lead === "1h" ? "in 1 hour" : "in 5 minutes"}`,
              body: parts.join("\n"),
              url: "/admin",
            });
          }
        }

        if (!alerts.length) return Response.json({ sent: 0, alerts: 0 });

        const { data: subs } = await supabaseAdmin
          .from("push_subscriptions")
          .select("id, endpoint, p256dh, auth")
          .eq("audience", "admin");
        const devices =
          (subs as { id: string; endpoint: string; p256dh: string; auth: string }[]) ?? [];
        if (!devices.length) return Response.json({ sent: 0, alerts: alerts.length, devices: 0 });

        // Claim one key per alert *per device*, so a phone that was offline or
        // registered later still gets the alert on the next run, and a phone
        // that already received it never gets it twice.
        const jobs = alerts.flatMap((alert) =>
          devices.map((device) => ({ alert, device, key: `${alert.key}|${device.id}` })),
        );
        const { data: claimed } = await supabaseAdmin
          .from("push_sent_log")
          .upsert(
            jobs.map((j) => ({ key: j.key })),
            { onConflict: "key", ignoreDuplicates: true },
          )
          .select("key");
        const fresh = new Set(((claimed as { key: string }[]) ?? []).map((l) => l.key));
        const pending = jobs.filter((j) => fresh.has(j.key));
        if (!pending.length)
          return Response.json({ sent: 0, alerts: alerts.length, devices: devices.length });

        const vapid = {
          subject: process.env.VAPID_SUBJECT,
          publicKey: process.env.VAPID_PUBLIC_KEY,
          privateKey: process.env.VAPID_PRIVATE_KEY,
        };

        let sent = 0;
        const failedKeys: string[] = [];
        for (const job of pending) {
          const { alert, device } = job;
          const subscription = {
            endpoint: device.endpoint,
            expirationTime: null,
            keys: { p256dh: device.p256dh, auth: device.auth },
          };
          try {
            const payload = await buildPushPayload(
              {
                data: { title: alert.title, body: alert.body, url: alert.url, tag: alert.key },
                options: { ttl: 3600 },
              },
              subscription,
              vapid,
            );
            const res = await fetch(device.endpoint, {
              ...payload,
              body: payload.body as unknown as BodyInit,
            });
            if (res.status === 404 || res.status === 410 || res.status === 403) {
              // Device is gone or its keys no longer match: drop it so that
              // phone registers again the next time the dashboard is opened.
              await supabaseAdmin.from("push_subscriptions").delete().eq("id", device.id);
            } else if (res.ok) {
              sent += 1;
            } else {
              failedKeys.push(job.key);
            }
          } catch {
            failedKeys.push(job.key);
          }
        }

        // Release only the claims that failed, so the next run retries that
        // one device without re-alerting the phones that already got it.
        if (failedKeys.length) {
          await supabaseAdmin.from("push_sent_log").delete().in("key", failedKeys);
        }

        return Response.json({
          sent,
          alerts: alerts.length,
          pending: pending.length,
          retry: failedKeys.length,
          devices: devices.length,
        });
      },
    },
  },
});
