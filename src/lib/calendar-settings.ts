export type CalendarItem = { id: string; summary: string; primary: boolean };

export type CalendarAccount = {
  slot: string; // "1", "2", ...
  account: string; // primary calendar / e-mail of that Google account
  calendars: CalendarItem[];
  error: string | null;
};

export const GOOGLE_CALENDAR_SETTING_KEY = "google_calendar_id";
/** Which connected Google account (slot) is used for meetings. */
export const GOOGLE_CALENDAR_SLOT_KEY = "google_calendar_slot";

export const GOOGLE_CALENDAR_GATEWAY =
  "https://connector-gateway.lovable.dev/google_calendar/calendar/v3";
