/* Helpers that stop anyone picking a date or time that has already passed.
   All bookings run on India time, so "today" is always the IST day. */

const IST = "Asia/Kolkata";

/** Today's date in India, as YYYY-MM-DD. */
export function todayIso(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return parts; // en-CA already formats as YYYY-MM-DD
}

/** Current India time as HH:MM (24h). */
export function nowHhMm(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: IST,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

/** True when the given YYYY-MM-DD is before today (India time). */
export function isPastDate(date?: string | null): boolean {
  if (!date) return false;
  return date < todayIso();
}

/** True when date+time (HH:MM) is already in the past. */
export function isPastDateTime(date?: string | null, time?: string | null): boolean {
  if (!date) return false;
  const today = todayIso();
  if (date < today) return true;
  if (date > today) return false;
  if (!time) return false;
  return time <= nowHhMm();
}

/** Minutes since midnight for a slot label such as "3:00 PM – 3:30 PM". */
export function slotStartMinutes(label: string): number | null {
  const m = label.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;
  let h = parseInt(m[1], 10) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  return h * 60 + parseInt(m[2], 10);
}

/** Keeps only the slots that have not started yet when the date is today. */
export function futureSlots(slots: string[], date?: string | null): string[] {
  if (!date || date !== todayIso()) return slots;
  const [h, m] = nowHhMm()
    .split(":")
    .map((n) => parseInt(n, 10));
  const nowMins = h * 60 + m;
  return slots.filter((s) => {
    const start = slotStartMinutes(s);
    return start === null || start > nowMins;
  });
}
