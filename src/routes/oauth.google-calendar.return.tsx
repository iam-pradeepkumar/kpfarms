import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { completeGoogleCalendarConnect, getMyGoogleCalendar } from "@/lib/gcal.functions";

export const Route = createFileRoute("/oauth/google-calendar/return")({
  component: OAuthReturn,
  head: () => ({
    meta: [
      { title: "Finishing Google sign-in — KP Farm Ventures" },
      {
        name: "description",
        content: "Completing the Google Calendar sign-in for the KP Farm Ventures admin dashboard.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function OAuthReturn() {
  const [message, setMessage] = useState("Finishing Google sign-in…");
  const started = useRef(false);

  useEffect(() => {
    // The one-time code can only be used once, so never run this twice.
    if (started.current) return;
    started.current = true;
    const params = new URLSearchParams(window.location.search);
    const notify = (
      type: "appUserConnectorOAuthComplete" | "appUserConnectorOAuthFailed",
      reason?: string,
    ) => {
      window.opener?.postMessage(
        { type, connectorId: "google_calendar", reason },
        window.location.origin,
      );
      // Give the opener a moment to receive the message before closing.
      setTimeout(() => window.close(), 300);
    };

    const code = params.get("code");
    const errorParam = params.get("error");

    if (errorParam) {
      const reason = errorParam === "access_denied"
        ? "You denied the Google Calendar permission."
        : `Google sign-in error: ${errorParam}`;
      setMessage(reason);
      notify("appUserConnectorOAuthFailed", reason);
      return;
    }

    if (!code) {
      const reason = "Google sign-in finished without a code.";
      setMessage(reason);
      notify("appUserConnectorOAuthFailed", reason);
      return;
    }

    void completeGoogleCalendarConnect({
      data: { code, origin: window.location.origin },
    })
      .then(() => notify("appUserConnectorOAuthComplete"))
      .catch(async (e: unknown) => {
        // The code may already have been used successfully — if the account is
        // linked, treat this as done instead of showing a scary error.
        try {
          const status = await getMyGoogleCalendar();
          if (status.connected) {
            notify("appUserConnectorOAuthComplete");
            return;
          }
        } catch {
          /* fall through to the real error below */
        }
        const reason = e instanceof Error ? e.message : "Could not finish the Google sign-in.";
        setMessage(reason);
        notify("appUserConnectorOAuthFailed", reason);
      });
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center p-6 text-center">
      <h1 className="max-w-md text-sm font-semibold text-stone-600">{message}</h1>
    </main>
  );
}
