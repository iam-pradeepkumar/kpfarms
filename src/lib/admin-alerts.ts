import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  alreadyFired,
  dueReminder,
  formatWhen,
  leadLabel,
  markFired,
  meetingDateTime,
  showNotification,
} from "@/lib/reminders";

export type AdminAlert = {
  id: string;
  kind: "new" | "reminder";
  title: string;
  body: string;
  at: number;
  read?: boolean;
};

const SEEN_KEY = "kp_admin_last_seen";
const LIST_KEY = "kp_admin_alerts";
const POLL_MS = 30000;

function readSeen(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}
function writeSeen(v: Record<string, string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}
function readList(): AdminAlert[] {
  try {
    return JSON.parse(localStorage.getItem(LIST_KEY) || "[]") as AdminAlert[];
  } catch {
    return [];
  }
}

type NewSource = {
  table: string;
  label: string;
  nameField: string;
  dateField?: string;
  timeField?: string;
  extraField?: string;
  extraLabel?: string;
  tsField: string;
  paidOnly?: boolean;
};

/* One alert per customer only: bookings alert once the customer finished every
   step and uploaded the payment screenshot. Orders alert when placed. */
const NEW_SOURCES: NewSource[] = [
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
    extraField: "program",
    extraLabel: "Program",
    tsField: "paid_at",
    paidOnly: true,
  },
  {
    table: "orders",
    label: "New product order",
    nameField: "customer_name",
    extraField: "product_name",
    extraLabel: "Product",
    tsField: "created_at",
  },
];

/* 1 hour / 5 minute reminders are only for booked online meetings.
   Farm visits and training happen in person and get no countdown alerts. */
const MEETING_SOURCES = [
  {
    table: "consultation_bookings",
    dateField: "preferred_date",
    timeField: "preferred_time",
    label: "Online meeting",
  },
] as const;

function detailLines(src: NewSource, r: Record<string, unknown>): string {
  const lines: string[] = [];
  const who = String(r[src.nameField] ?? "Someone");
  lines.push(r.whatsapp ? `${who} — ${String(r.whatsapp)}` : who);
  if (src.dateField) {
    const when = meetingDateTime(
      r[src.dateField] as string | null,
      src.timeField ? (r[src.timeField] as string | null) : null,
    );
    if (when)
      lines.push(
        src.timeField
          ? formatWhen(when)
          : when.toLocaleDateString(undefined, {
              weekday: "short",
              day: "numeric",
              month: "short",
            }),
      );
  }
  if (src.extraField && r[src.extraField])
    lines.push(`${src.extraLabel}: ${String(r[src.extraField])}`);
  return lines.join("\n");
}

export function useAdminAlerts() {
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const busy = useRef(false);

  useEffect(() => {
    setAlerts(readList());
  }, []);

  const push = useCallback((items: AdminAlert[]) => {
    if (!items.length) return;
    setAlerts((prev) => {
      const known = new Set(prev.map((a) => a.id));
      const merged = [...items.filter((i) => !known.has(i.id)), ...prev].slice(0, 60);
      try {
        localStorage.setItem(LIST_KEY, JSON.stringify(merged));
      } catch {
        /* ignore */
      }
      return merged;
    });
    /* If this device is subscribed to background push, the server already
       sends the phone notification — showing it here too would double it. */
    void (async () => {
      let hasPush = false;
      try {
        const reg = await navigator.serviceWorker?.ready;
        hasPush = Boolean(await reg?.pushManager.getSubscription());
      } catch {
        hasPush = false;
      }
      if (hasPush) return;
      for (const i of items) showNotification(i.title, i.body, i.id);
    })();
  }, []);

  const poll = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    const found: AdminAlert[] = [];
    const seen = readSeen();
    const firstRun = Object.keys(seen).length === 0;
    const nowIso = new Date().toISOString();

    try {
      for (const src of NEW_SOURCES) {
        const since = seen[src.table];
        if (!since) {
          seen[src.table] = nowIso;
          continue;
        }
        let q = supabase
          .from(src.table as never)
          .select("*")
          .gt(src.tsField, since)
          .order(src.tsField, { ascending: false })
          .limit(20);
        if (src.paidOnly) q = q.eq("booking_step", "paid");
        const { data } = await q;
        const rows = (data as unknown as Record<string, unknown>[]) ?? [];
        for (const r of rows) {
          found.push({
            id: `new:${src.table}:${String(r.id)}`,
            kind: "new",
            title: src.label,
            body: detailLines(src, r),
            at: Date.parse(String(r[src.tsField] ?? nowIso)),
          });
        }
        if (rows.length) seen[src.table] = String(rows[0][src.tsField] ?? nowIso);
      }

      const today = new Date().toISOString().slice(0, 10);
      for (const src of MEETING_SOURCES) {
        const { data } = await supabase
          .from(src.table as never)
          .select("*")
          .not("confirmed_at", "is", null)
          .gte(src.dateField, today)
          .limit(50);
        const rows = (data as unknown as Record<string, unknown>[]) ?? [];
        for (const r of rows) {
          const when = meetingDateTime(
            r[src.dateField] as string | null,
            src.timeField ? (r[src.timeField] as string | null) : null,
          );
          if (!when) continue;
          const lead = dueReminder(when);
          if (!lead) continue;
          const key = `rem:${src.table}:${String(r.id)}:${lead}`;
          if (alreadyFired(key)) continue;
          markFired(key);
          const parts = [
            `${String(r.name ?? "")}${r.whatsapp ? ` — ${String(r.whatsapp)}` : ""}`,
            formatWhen(when),
          ];
          if (r.program) parts.push(`Program: ${String(r.program)}`);
          if (r.group_size) parts.push(`People: ${String(r.group_size)}`);
          if (src.table === "consultation_bookings" && r.meeting_link)
            parts.push(`Join: ${String(r.meeting_link)}`);
          found.push({
            id: key,
            kind: "reminder",
            title: `${src.label} ${leadLabel(lead)}`,
            body: parts.join("\n"),
            at: Date.now(),
          });
        }
      }

      writeSeen(seen);
      if (!firstRun) push(found);
    } catch {
      /* ignore polling errors */
    } finally {
      busy.current = false;
    }
  }, [push]);

  useEffect(() => {
    poll();
    const t = setInterval(poll, POLL_MS);
    return () => clearInterval(t);
  }, [poll]);

  const markAllRead = useCallback(() => {
    setAlerts((prev) => {
      const next = prev.map((a) => ({ ...a, read: true }));
      try {
        localStorage.setItem(LIST_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setAlerts([]);
    try {
      localStorage.setItem(LIST_KEY, "[]");
    } catch {
      /* ignore */
    }
  }, []);

  const unread = alerts.filter((a) => !a.read).length;
  return { alerts, unread, markAllRead, clear, refresh: poll };
}
