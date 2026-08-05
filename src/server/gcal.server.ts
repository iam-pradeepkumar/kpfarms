import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
/* Server-only helpers for the admin's own Google Calendar sign-in. */
import {
  authorizeAppUserOAuth,
  callAsAppUser,
  disconnectAppUser,
} from "@/integrations/lovable/appUserConnector";
import { getConnectionKeyForUser } from "@/server/appUserConnections.server";

export const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";
export const GCAL_CONNECTOR_ID = "google_calendar";

export const GCAL_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

type AdminContext = { supabase: SupabaseClient<Database>; userId: string };

export async function requireAdminUser(context: AdminContext) {
  const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!isAdmin) throw new Error("Forbidden");
}

export function clientApiKey(): string {
  const key = process.env["GOOGLE_CALENDAR_APP_USER_CONNECTOR_CLIENT_API_KEY"];
  if (!key) throw new Error("Google sign-in is not set up for this project yet.");
  return key;
}

export async function startGoogleAuth(userId: string, returnUrl: string) {
  const existing = await getConnectionKeyForUser(userId, GCAL_CONNECTOR_ID);
  const { authorizationUrl } = await authorizeAppUserOAuth({
    gatewayBaseUrl: GATEWAY_BASE_URL,
    connectorId: GCAL_CONNECTOR_ID,
    appUserId: userId,
    clientAPIKey: clientApiKey(),
    returnUrl,
    connectionAPIKey: existing ?? undefined,
    credentialsConfiguration: { scopes: GCAL_SCOPES },
  });
  return authorizationUrl;
}

/** Writable calendars of the Google account this admin signed in with. */
export async function adminCalendars(connectionAPIKey: string) {
  const res = await callAsAppUser({
    gatewayBaseUrl: GATEWAY_BASE_URL,
    connectionAPIKey,
    connectorId: GCAL_CONNECTOR_ID,
    path: "/calendar/v3/users/me/calendarList?minAccessRole=writer",
  });
  if (!res.ok) {
    const text = await res.text();
    return {
      calendars: [] as { id: string; summary: string; primary: boolean }[],
      error: `Google Calendar error [${res.status}]: ${text}`,
    };
  }
  const json = (await res.json()) as {
    items?: Array<{ id: string; summary?: string; primary?: boolean }>;
  };
  return {
    calendars: (json.items ?? []).map((c) => ({
      id: c.id,
      summary: c.summary ?? c.id,
      primary: Boolean(c.primary),
    })),
    error: null as string | null,
  };
}

/** Creates the event with a Google Meet link on the admin's own calendar. */
export async function createMeetEvent(connectionAPIKey: string, calendarId: string, body: unknown) {
  const res = await callAsAppUser({
    gatewayBaseUrl: GATEWAY_BASE_URL,
    connectionAPIKey,
    connectorId: GCAL_CONNECTOR_ID,
    path: `/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`,
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Calendar failed [${res.status}]: ${text}`);
  }
  return (await res.json()) as {
    hangoutLink?: string;
    htmlLink?: string;
    organizer?: { email?: string };
    conferenceData?: { entryPoints?: Array<{ entryPointType?: string; uri?: string }> };
  };
}

export async function revokeGoogle(connectionAPIKey: string) {
  await disconnectAppUser({
    gatewayBaseUrl: GATEWAY_BASE_URL,
    connectionAPIKey,
    connectorId: GCAL_CONNECTOR_ID,
  });
}
