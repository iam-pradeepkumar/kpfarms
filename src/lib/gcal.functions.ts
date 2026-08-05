import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { exchangeAppUserOAuthCode } from "@/integrations/lovable/appUserConnector";
import {
  GCAL_CONNECTOR_ID,
  adminCalendars,
  requireAdminUser,
  revokeGoogle,
  startGoogleAuth,
} from "@/server/gcal.server";
import {
  deleteConnectionKeyForUser,
  getConnectionKeyForUser,
  saveConnectionKeyForUser,
} from "@/server/appUserConnections.server";

/** Step 1 — gives the browser the Google sign-in URL to open in a popup. */
export const startGoogleCalendarConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { origin?: string } | undefined) => ({ origin: input?.origin ?? "" }))
  .handler(async ({ data, context }) => {
    await requireAdminUser(context);
    // Prefer the browser's own address so the popup comes back to the same site.
    let base = "";
    if (data.origin) {
      try {
        const u = new URL(data.origin);
        if (u.protocol === "https:" || u.hostname === "localhost") base = u.origin;
      } catch {
        base = "";
      }
    }
    if (!base) {
      const request = getRequest();
      if (!request) throw new Error("Sign-in must start from the dashboard.");
      base = new URL(request.url).origin;
    }
    const returnUrl = `${base}/oauth/google-calendar/return`;
    const authorizationUrl = await startGoogleAuth(context.userId, returnUrl);
    return { authorizationUrl };
  });

/** Step 2 — turns the one-time code from the popup into a saved connection. */
export const completeGoogleCalendarConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string }) => {
    if (!input?.code) throw new Error("code required");
    return input;
  })
  .handler(async ({ data, context }) => {
    await requireAdminUser(context);
    const { connectionAPIKey, connectorId } = await exchangeAppUserOAuthCode(
      "https://connector-gateway.lovable.dev",
      data.code,
    );
    if (connectorId !== GCAL_CONNECTOR_ID) {
      throw new Error("Sign-in returned the wrong Google service.");
    }
    await saveConnectionKeyForUser(context.userId, connectorId, connectionAPIKey);
    return { ok: true };
  });

/** Which Google account this admin signed in with, plus its calendars. */
export const getMyGoogleCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdminUser(context);
    const connectionAPIKey = await getConnectionKeyForUser(context.userId, GCAL_CONNECTOR_ID);
    if (!connectionAPIKey) {
      return { connected: false, account: "", calendars: [], error: null as string | null };
    }
    const { calendars, error } = await adminCalendars(connectionAPIKey);
    return {
      connected: !error,
      account: calendars.find((c) => c.primary)?.id ?? "",
      calendars,
      error,
    };
  });

export const disconnectGoogleCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdminUser(context);
    const connectionAPIKey = await getConnectionKeyForUser(context.userId, GCAL_CONNECTOR_ID);
    if (connectionAPIKey) {
      try {
        await revokeGoogle(connectionAPIKey);
      } catch {
        /* remove it locally even if Google already forgot it */
      }
      await deleteConnectionKeyForUser(context.userId, GCAL_CONNECTOR_ID);
    }
    return { ok: true };
  });
