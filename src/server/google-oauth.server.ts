/**
 * Direct Google OAuth2 helpers — server-only.
 *
 * Replaces the Lovable connector-gateway with standard Google OAuth2.
 * Stores a JSON blob (encrypted) containing access_token, refresh_token,
 * expiry_date so we can call the Calendar API directly.
 */

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

export const GCAL_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set.`);
  return v;
}

export function googleClientId(): string {
  return (
    process.env["GOOGLE_CLIENT_ID"] ||
    "583596411664-jtaibdgh0cu1lnn9v9ek565lb4bp0ujh.apps.googleusercontent.com"
  );
}
function googleClientSecret(): string {
  return requireEnv("GOOGLE_CLIENT_SECRET");
}

/** Build the Google consent-screen URL the admin will be redirected to. */
export function getGoogleAuthUrl(redirectUri: string, state?: string): string {
  const params = new URLSearchParams({
    client_id: googleClientId(),
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GCAL_SCOPES.join(" "),
    access_type: "offline",       // gives us a refresh_token
    prompt: "consent",            // always show consent so we get refresh_token
  });
  if (state) params.set("state", state);
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;  // epoch ms
}

/** Exchange the one-time authorization code for tokens. */
export async function exchangeGoogleCode(
  code: string,
  redirectUri: string,
): Promise<GoogleTokens> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: googleClientId(),
      client_secret: googleClientSecret(),
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(
      `Google token exchange failed (${res.status}): ${JSON.stringify(json)}`,
    );
  }
  return {
    access_token: json.access_token as string,
    refresh_token: json.refresh_token as string,
    expiry_date: Date.now() + ((json.expires_in as number) ?? 3600) * 1000,
  };
}

/** Refresh an expired access token using the stored refresh token. */
export async function refreshGoogleToken(
  refreshToken: string,
): Promise<{ access_token: string; expiry_date: number }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: googleClientId(),
      client_secret: googleClientSecret(),
      grant_type: "refresh_token",
    }),
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(
      `Google token refresh failed (${res.status}): ${JSON.stringify(json)}`,
    );
  }
  return {
    access_token: json.access_token as string,
    expiry_date: Date.now() + ((json.expires_in as number) ?? 3600) * 1000,
  };
}

/**
 * Get a valid access token — refreshes automatically if expired.
 * Returns updated tokens so the caller can persist them.
 */
export async function getValidAccessToken(
  tokens: GoogleTokens,
): Promise<GoogleTokens> {
  // Refresh 60s before actual expiry to be safe
  if (Date.now() < tokens.expiry_date - 60_000) return tokens;
  const refreshed = await refreshGoogleToken(tokens.refresh_token);
  return {
    ...tokens,
    access_token: refreshed.access_token,
    expiry_date: refreshed.expiry_date,
  };
}

/** Make an authenticated request to the Google Calendar API. */
export async function callGoogleCalendarAPI(
  tokens: GoogleTokens,
  path: string,
  init?: RequestInit,
): Promise<{ response: Response; updatedTokens: GoogleTokens }> {
  const updatedTokens = await getValidAccessToken(tokens);
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${updatedTokens.access_token}`);
  if (!headers.has("Content-Type") && init?.method === "POST") {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3${path}`,
    { ...init, headers },
  );
  return { response, updatedTokens };
}
