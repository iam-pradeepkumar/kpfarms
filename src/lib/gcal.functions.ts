import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  GCAL_CONNECTOR_ID,
  adminCalendars,
  requireAdminUser,
  revokeGoogle,
  startGoogleAuth,
  completeGoogleAuth,
} from "@/server/gcal.server";
import {
  deleteConnectionKeyForUser,
  getConnectionKeyForUser,
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
    const authorizationUrl = await startGoogleAuth(context.userId, base);
    return { authorizationUrl };
  });

/** Step 2 — turns the one-time code from the Google redirect into saved tokens. */
export const completeGoogleCalendarConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string; origin?: string }) => {
    if (!input?.code) throw new Error("code required");
    return input;
  })
  .handler(async ({ data, context }) => {
    await requireAdminUser(context);
    let origin = "";
    if (data.origin) {
      try {
        origin = new URL(data.origin).origin;
      } catch {
        /* fall through */
      }
    }
    if (!origin) {
      const request = getRequest();
      if (!request) throw new Error("Missing origin.");
      origin = new URL(request.url).origin;
    }
    await completeGoogleAuth(context.userId, data.code, origin, context.supabase);
    return { ok: true };
  });

/** Which Google account this admin signed in with, plus its calendars. */
export const getMyGoogleCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdminUser(context);
    const connectionKey = await getConnectionKeyForUser(context.userId, GCAL_CONNECTOR_ID, context.supabase);
    if (!connectionKey) {
      return { connected: false, account: "", calendars: [], error: null as string | null };
    }
    const { calendars, error } = await adminCalendars(context.userId, context.supabase);
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
    await revokeGoogle(context.userId, context.supabase);
    return { ok: true };
  });
