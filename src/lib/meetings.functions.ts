import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { GCAL_CONNECTOR_ID, createMeetEvent } from "@/server/gcal.server";
import { getConnectionKeyForUser } from "@/server/appUserConnections.server";

import {
  GOOGLE_CALENDAR_GATEWAY as GATEWAY,
  GOOGLE_CALENDAR_SETTING_KEY,
  GOOGLE_CALENDAR_SLOT_KEY,
  type CalendarItem,
  type CalendarAccount,
} from "@/lib/calendar-settings";

type Input = {
  bookingId: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (Asia/Kolkata)
  minutes?: number;
  customerEmail?: string;
};

/** All Google accounts linked to this project (slot "1" = GOOGLE_CALENDAR_API_KEY). */
function connectionKeys(): Array<{ slot: string; key: string }> {
  const out: Array<{ slot: string; key: string }> = [];
  const first = process.env.GOOGLE_CALENDAR_API_KEY;
  if (first) out.push({ slot: "1", key: first });
  for (let i = 2; i <= 6; i++) {
    const k = process.env[`GOOGLE_CALENDAR_API_KEY_${i}`];
    if (k) out.push({ slot: String(i), key: k });
  }
  return out;
}

async function fetchCalendars(lovableKey: string, connKey: string) {
  const res = await fetch(`${GATEWAY}/users/me/calendarList?minAccessRole=writer`, {
    headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": connKey },
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Google calendarList failed [${res.status}]: ${text}`);
    return {
      calendars: [] as CalendarItem[],
      error: `Google Calendar error [${res.status}]: ${text}`,
    };
  }
  const json = (await res.json()) as {
    items?: Array<{ id: string; summary?: string; primary?: boolean }>;
  };
  const calendars: CalendarItem[] = (json.items ?? []).map((c) => ({
    id: c.id,
    summary: c.summary ?? c.id,
    primary: Boolean(c.primary),
  }));
  return { calendars, error: null as string | null };
}

type AdminContext = { supabase: SupabaseClient<Database>; userId: string };

async function requireAdmin(context: AdminContext) {
  const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!isAdmin) throw new Error("Forbidden");
}

export const scheduleGoogleMeet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Input) => {
    if (!input?.bookingId) throw new Error("bookingId required");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date ?? "")) throw new Error("Invalid date");
    if (!/^\d{2}:\d{2}$/.test(input.time ?? "")) throw new Error("Invalid time");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    await requireAdmin(context);

    const lovableKey = process.env.LOVABLE_API_KEY;
    const accounts = connectionKeys();

    const { data: settings } = await supabase
      .from("site_settings")
      .select("key,value")
      .in("key", [GOOGLE_CALENDAR_SETTING_KEY, GOOGLE_CALENDAR_SLOT_KEY]);
    const get = (k: string) =>
      (settings as Array<{ key: string; value: string }> | null)?.find((s) => s.key === k)?.value;

    const slot = get(GOOGLE_CALENDAR_SLOT_KEY);
    const calendarPlain = get(GOOGLE_CALENDAR_SETTING_KEY) || "primary";
    const calendarId = encodeURIComponent(calendarPlain);

    const minutes = data.minutes ?? 45;
    const start = `${data.date}T${data.time}:00`;
    const [h, m] = data.time.split(":").map((n) => parseInt(n, 10));
    const endMs = new Date(`${data.date}T00:00:00Z`).getTime() + (h * 60 + m + minutes) * 60000;
    const endDate = new Date(endMs);
    const pad = (n: number) => String(n).padStart(2, "0");
    const end = `${endDate.getUTCFullYear()}-${pad(endDate.getUTCMonth() + 1)}-${pad(
      endDate.getUTCDate(),
    )}T${pad(endDate.getUTCHours())}:${pad(endDate.getUTCMinutes())}:00`;

    const body = {
      summary: data.title,
      description: data.description ?? "",
      start: { dateTime: start, timeZone: "Asia/Kolkata" },
      end: { dateTime: end, timeZone: "Asia/Kolkata" },
      attendees: data.customerEmail ? [{ email: data.customerEmail }] : [],
      conferenceData: {
        createRequest: {
          requestId: `kp-${data.bookingId}-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    // The single shared Google account connection for this project.
    const myKey = await getConnectionKeyForUser(context.userId, GCAL_CONNECTOR_ID);
    let meetLink = "";
    let eventLink = "";
    let organizerEmail = "";

    if (myKey) {
      try {
        const event = await createMeetEvent(myKey, calendarPlain, body);
        meetLink =
          event.hangoutLink ??
          event.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri ??
          "";
        eventLink = event.htmlLink ?? "";
        organizerEmail = event.organizer?.email ?? "";
      } catch (err) {
        console.error("Google Meet creation error:", err);
        throw err instanceof Error ? err : new Error(String(err));
      }
    } else if (lovableKey && accounts.length) {
      const chosen = accounts.find((a) => a.slot === slot) ?? accounts[0];
      const connKey = chosen.key;

      const res = await fetch(
        `${GATEWAY}/calendars/${calendarId}/events?conferenceDataVersion=1&sendUpdates=all`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "X-Connection-Api-Key": connKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        console.error(`Google Calendar create event failed [${res.status}]: ${text}`);
        throw new Error(`Google Calendar failed [${res.status}]: ${text}`);
      }

      const event = (await res.json()) as {
        hangoutLink?: string;
        htmlLink?: string;
        organizer?: { email?: string };
        conferenceData?: { entryPoints?: Array<{ entryPointType?: string; uri?: string }> };
      };

      meetLink =
        event.hangoutLink ??
        event.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri ??
        "";
      eventLink = event.htmlLink ?? "";
      organizerEmail = event.organizer?.email ?? "";
    } else {
      throw new Error("Google Calendar is not connected yet. Connect Google Calendar in Settings.");
    }

    // Persist meeting_link onto the consultation_bookings row in database
    if (meetLink && data.bookingId) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error: dbErr } = await supabaseAdmin
          .from("consultation_bookings")
          .update({
            meeting_link: meetLink,
          })
          .eq("id", data.bookingId);
        if (dbErr) {
          console.error(
            `Failed to persist meeting_link to consultation_bookings (${data.bookingId}):`,
            dbErr,
          );
        }
      } catch (dbErr) {
        console.error(
          `Error persisting meeting_link to consultation_bookings (${data.bookingId}):`,
          dbErr,
        );
      }
    }

    return {
      meetLink,
      eventLink,
      organizerEmail,
    };
  });

/** Reads the connected Google account and its writable calendars. */
export const getCalendarStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);

    // 1) Check shared Google connection first
    const myKey = await getConnectionKeyForUser(context.userId, GCAL_CONNECTOR_ID);
    if (myKey) {
      const { adminCalendars } = await import("@/server/gcal.server");
      const { calendars, error } = await adminCalendars(myKey);
      if (!error && calendars.length > 0) {
        const primary = calendars.find((c) => c.primary)?.id ?? calendars[0].id;
        return {
          connected: true,
          error: null,
          accounts: [
            {
              slot: "shared",
              account: primary,
              calendars,
              error: null,
            },
          ],
          calendars,
          account: primary,
        };
      }
    }

    // 2) Fallback to project API keys
    const lovableKey = process.env.LOVABLE_API_KEY;
    const keys = connectionKeys();
    if (!lovableKey || !keys.length) {
      return {
        connected: false,
        error: "Google Calendar is not connected yet.",
        accounts: [] as CalendarAccount[],
        calendars: [] as CalendarItem[],
        account: "",
      };
    }

    const accounts: CalendarAccount[] = [];
    for (const k of keys) {
      const { calendars, error } = await fetchCalendars(lovableKey, k.key);
      accounts.push({
        slot: k.slot,
        account: calendars.find((c) => c.primary)?.id ?? "",
        calendars,
        error,
      });
    }

    const usable = accounts.filter((a) => !a.error);
    return {
      connected: usable.length > 0,
      error: usable.length ? null : (accounts[0]?.error ?? null),
      accounts,
      calendars: usable[0]?.calendars ?? [],
      account: usable[0]?.account ?? "",
    };
  });
