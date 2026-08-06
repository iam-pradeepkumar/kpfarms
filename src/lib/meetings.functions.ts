import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { GCAL_CONNECTOR_ID, createMeetEvent, adminCalendars } from "@/server/gcal.server";
import { getConnectionKeyForUser } from "@/server/appUserConnections.server";

import {
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

    const { data: settings } = await supabase
      .from("site_settings")
      .select("key,value")
      .in("key", [GOOGLE_CALENDAR_SETTING_KEY, GOOGLE_CALENDAR_SLOT_KEY]);
    const get = (k: string) =>
      (settings as Array<{ key: string; value: string }> | null)?.find((s) => s.key === k)?.value;

    const calendarPlain = get(GOOGLE_CALENDAR_SETTING_KEY) || "primary";

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

    // Check if Google Calendar is connected
    const myKey = await getConnectionKeyForUser(context.userId, GCAL_CONNECTOR_ID, context.supabase);
    if (!myKey) {
      throw new Error("Google Calendar is not connected yet. Connect Google Calendar in Settings.");
    }

    let meetLink = "";
    let eventLink = "";
    let organizerEmail = "";

    try {
      const event = await createMeetEvent(context.userId, calendarPlain, body, context.supabase);
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

    // Persist meeting_link onto the consultation_bookings row in database
    if (meetLink && data.bookingId) {
      try {
        const { error: dbErr } = await context.supabase
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

    const myKey = await getConnectionKeyForUser(context.userId, GCAL_CONNECTOR_ID, context.supabase);
    if (!myKey) {
      return {
        connected: false,
        error: "Google Calendar is not connected yet.",
        accounts: [] as CalendarAccount[],
        calendars: [] as CalendarItem[],
        account: "",
      };
    }

    const { calendars, error } = await adminCalendars(context.userId, context.supabase);
    if (error || calendars.length === 0) {
      return {
        connected: false,
        error: error ?? "No writable calendars found.",
        accounts: [] as CalendarAccount[],
        calendars: [] as CalendarItem[],
        account: "",
      };
    }

    const primary = calendars.find((c) => c.primary)?.id ?? calendars[0].id;
    return {
      connected: true,
      error: null,
      accounts: [
        {
          slot: "me",
          account: primary,
          calendars,
          error: null,
        },
      ] as CalendarAccount[],
      calendars,
      account: primary,
    };
  });
