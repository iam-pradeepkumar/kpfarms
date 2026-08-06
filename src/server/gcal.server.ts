import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  type GoogleTokens,
  callGoogleCalendarAPI,
  getGoogleAuthUrl,
  exchangeGoogleCode,
} from "@/server/google-oauth.server";
import {
  getConnectionKeyForUser,
  saveConnectionKeyForUser,
  deleteConnectionKeyForUser,
} from "@/server/appUserConnections.server";

export const GCAL_CONNECTOR_ID = "google_calendar";

type AdminContext = { supabase: SupabaseClient<Database>; userId: string };

export async function requireAdminUser(context: AdminContext) {
  const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!isAdmin) throw new Error("Forbidden");
}

/** Build the redirect URI for the OAuth callback. */
export function oauthRedirectUri(origin: string): string {
  return `${origin}/oauth/google-calendar/return`;
}

/** Start the Google OAuth flow — returns the URL to redirect the admin to. */
export async function startGoogleAuth(userId: string, origin: string) {
  const redirectUri = oauthRedirectUri(origin);
  // Pass userId as state so the callback knows who initiated the flow
  const authorizationUrl = getGoogleAuthUrl(redirectUri, userId);
  return authorizationUrl;
}

/** Exchange the OAuth code and save the tokens. */
export async function completeGoogleAuth(
  userId: string,
  code: string,
  origin: string,
  client?: SupabaseClient,
) {
  const redirectUri = oauthRedirectUri(origin);
  const tokens = await exchangeGoogleCode(code, redirectUri);
  // Store the full token set (encrypted) in the database
  await saveConnectionKeyForUser(
    userId,
    GCAL_CONNECTOR_ID,
    JSON.stringify(tokens),
    client,
  );
  return tokens;
}

/** Load tokens for the admin from the database. */
async function loadTokens(
  userId: string,
  client?: SupabaseClient,
): Promise<GoogleTokens | null> {
  const stored = await getConnectionKeyForUser(userId, GCAL_CONNECTOR_ID, client);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as GoogleTokens;
  } catch {
    return null;
  }
}

/** Update tokens in the database (e.g. after a refresh). */
async function persistTokens(
  userId: string,
  tokens: GoogleTokens,
  client?: SupabaseClient,
) {
  await saveConnectionKeyForUser(
    userId,
    GCAL_CONNECTOR_ID,
    JSON.stringify(tokens),
    client,
  );
}

/** Writable calendars of the connected Google account. */
export async function adminCalendars(userId: string, client?: SupabaseClient) {
  const tokens = await loadTokens(userId, client);
  if (!tokens) {
    return {
      calendars: [] as { id: string; summary: string; primary: boolean }[],
      error: "No Google account connected.",
    };
  }
  try {
    const { response, updatedTokens } = await callGoogleCalendarAPI(
      tokens,
      "/users/me/calendarList?minAccessRole=writer",
    );
    // Persist refreshed tokens if they changed
    if (updatedTokens.access_token !== tokens.access_token) {
      await persistTokens(userId, updatedTokens, client);
    }
    if (!response.ok) {
      const text = await response.text();
      return {
        calendars: [] as { id: string; summary: string; primary: boolean }[],
        error: `Google Calendar error [${response.status}]: ${text}`,
      };
    }
    const json = (await response.json()) as {
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
  } catch (e) {
    return {
      calendars: [] as { id: string; summary: string; primary: boolean }[],
      error: e instanceof Error ? e.message : "Failed to fetch calendars.",
    };
  }
}

/** Creates the event with a Google Meet link on the admin's own calendar. */
export async function createMeetEvent(
  userId: string,
  calendarId: string,
  body: unknown,
  client?: SupabaseClient,
) {
  const tokens = await loadTokens(userId, client);
  if (!tokens) throw new Error("No Google account connected.");

  const { response, updatedTokens } = await callGoogleCalendarAPI(
    tokens,
    `/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  if (updatedTokens.access_token !== tokens.access_token) {
    await persistTokens(userId, updatedTokens, client);
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Calendar failed [${response.status}]: ${text}`);
  }
  return (await response.json()) as {
    hangoutLink?: string;
    htmlLink?: string;
    organizer?: { email?: string };
    conferenceData?: {
      entryPoints?: Array<{ entryPointType?: string; uri?: string }>;
    };
  };
}

/** Disconnect Google — just remove stored tokens. */
export async function revokeGoogle(userId: string, client?: SupabaseClient) {
  // Optionally revoke the token at Google
  const tokens = await loadTokens(userId, client);
  if (tokens) {
    try {
      await fetch(
        `https://oauth2.googleapis.com/revoke?token=${tokens.access_token}`,
        { method: "POST" },
      );
    } catch {
      /* best effort */
    }
  }
  await deleteConnectionKeyForUser(userId, GCAL_CONNECTOR_ID, client);
}
