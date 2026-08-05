import { useCallback, useEffect, useState } from "react";
import { BellRing, X } from "lucide-react";
import {
  getBookingStatus,
  getRememberedBookingWhatsapp,
  type BookingKind,
} from "@/lib/submissions";
import {
  alreadyFired,
  dueReminder,
  formatWhen,
  leadLabel,
  markFired,
  meetingDateTime,
  notificationPermission,
  requestNotificationPermission,
  showNotification,
} from "@/lib/reminders";

type Upcoming = {
  kind: BookingKind;
  label: string;
  when: Date;
  link: string | null;
  id: string;
  detail: string | null;
};

/* Reminders for every confirmed slot. Only online meetings carry a meeting link;
   farm visits and training are in person. */
const KINDS: { kind: BookingKind; label: string; dateField: string; timeField?: string }[] = [
  {
    kind: "consultation",
    label: "Online meeting",
    dateField: "preferred_date",
    timeField: "preferred_time",
  },
  { kind: "farm_visit", label: "Farm visit", dateField: "visit_date" },
  { kind: "training", label: "Training session", dateField: "cohort_date" },
];

/** Reminds a visitor about their confirmed booking 1 hour and 5 minutes before it starts. */
export function MeetingReminder() {
  const [items, setItems] = useState<Upcoming[]>([]);
  const [perm, setPerm] = useState<string>("default");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setPerm(notificationPermission());
  }, []);

  const load = useCallback(async () => {
    const found: Upcoming[] = [];
    for (const k of KINDS) {
      const wa = getRememberedBookingWhatsapp(k.kind);
      if (!wa) continue;
      const status = (await getBookingStatus(k.kind, wa)) as unknown as Record<
        string,
        unknown
      > | null;
      if (!status || !status.confirmed_at) continue;
      const date = status[k.dateField] as string | null;

      const when = meetingDateTime(
        date,
        k.timeField ? ((status[k.timeField] as string | null) ?? null) : null,
      );
      if (!when || when.getTime() < Date.now() - 60 * 60 * 1000) continue;
      found.push({
        kind: k.kind,
        label: k.label,
        when,
        link: k.kind === "consultation" ? ((status.meeting_link as string | null) ?? null) : null,
        detail:
          k.kind === "training"
            ? ((status.program as string | null) ?? null)
            : k.kind === "farm_visit" && status.group_size
              ? `${String(status.group_size)} people`
              : null,
        id: String(status.id),
      });
    }
    setItems(found);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!items.length) return;
    const tick = () => {
      /* Only booked online meetings get the 1 hour / 5 minute countdown alerts. */
      for (const it of items.filter((i) => i.kind === "consultation")) {
        const lead = dueReminder(it.when);
        if (!lead) continue;
        const key = `user:${it.kind}:${it.id}:${lead}`;
        if (alreadyFired(key)) continue;
        markFired(key);
        showNotification(
          `Your online meeting is ${leadLabel(lead)}`,
          [formatWhen(it.when), it.link ? `Join: ${it.link}` : null].filter(Boolean).join("\n"),
          key,
        );
      }
    };
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, [items]);

  if (!items.length || dismissed) return null;
  const next = items.slice().sort((a, b) => a.when.getTime() - b.when.getTime())[0];

  return (
    <div className="fixed bottom-24 left-4 right-4 z-40 rounded-2xl border border-stone-200 bg-white/95 p-4 pr-9 shadow-xl backdrop-blur sm:right-auto sm:max-w-xs sm:pr-4">
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-2 rounded-full p-1 text-stone-400 hover:bg-stone-100"
        aria-label="Close"
      >
        <X size={13} />
      </button>
      <div className="flex items-start gap-2">
        <BellRing size={16} className="mt-0.5 shrink-0 text-kp-gold" />
        <div className="min-w-0">
          <div className="text-sm font-bold text-stone-800">
            Your {next.label.toLowerCase()} is booked
          </div>
          <div className="text-xs text-stone-500">{formatWhen(next.when)}</div>
          {perm !== "granted" ? (
            <button
              onClick={async () =>
                setPerm(
                  (await requestNotificationPermission()) ? "granted" : notificationPermission(),
                )
              }
              className="mt-2 rounded-full bg-kp-green px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white"
            >
              Remind me before it starts
            </button>
          ) : (
            <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-kp-green">
              Reminders on — 1 hour & 5 minutes before
            </div>
          )}
          {next.link && (
            <a
              href={next.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-[11px] font-bold text-kp-green underline"
            >
              Open meeting link
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
