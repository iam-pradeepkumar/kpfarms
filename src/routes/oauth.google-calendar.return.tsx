import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  const [message, setMessage] = useState("Connecting your Google Calendar…");
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const started = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const errorParam = params.get("error");

    if (errorParam) {
      const reason =
        errorParam === "access_denied"
          ? "You denied the Google Calendar permission."
          : `Google sign-in error: ${errorParam}`;
      setMessage(reason);
      setError(true);
      setDone(true);
      return;
    }

    if (!code) {
      setMessage("Google sign-in finished without a code.");
      setError(true);
      setDone(true);
      return;
    }

    void completeGoogleCalendarConnect({
      data: { code, origin: window.location.origin },
    })
      .then(() => {
        setMessage("Google Calendar connected! Redirecting to dashboard…");
        setDone(true);
        setTimeout(() => navigate({ to: "/admin", search: { tab: "settings" } as any }), 1200);
      })
      .catch(async (e: unknown) => {
        // The code may already have been used — if the account is linked, treat as done.
        try {
          const status = await getMyGoogleCalendar();
          if (status.connected) {
            setMessage("Google Calendar connected! Redirecting to dashboard…");
            setDone(true);
            setTimeout(() => navigate({ to: "/admin", search: { tab: "settings" } as any }), 1200);
            return;
          }
        } catch {
          /* fall through to error */
        }
        const reason = e instanceof Error ? e.message : "Could not finish the Google sign-in.";
        setMessage(reason);
        setError(true);
        setDone(true);
      });
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 p-6 text-center">
      <div className="w-full max-w-sm rounded-3xl border border-stone-200 bg-white p-8 shadow-lg">
        {!done && (
          <div className="mb-4 flex justify-center">
            <div className="size-8 animate-spin rounded-full border-4 border-stone-200 border-t-emerald-600" />
          </div>
        )}
        {done && !error && (
          <div className="mb-4 flex justify-center text-3xl">✅</div>
        )}
        {done && error && (
          <div className="mb-4 flex justify-center text-3xl">❌</div>
        )}
        <h1 className="text-sm font-semibold text-stone-700">{message}</h1>
        {done && error && (
          <button
            onClick={() => navigate({ to: "/admin", search: { tab: "settings" } as any })}
            className="mt-4 rounded-full bg-stone-900 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-stone-800"
          >
            Back to Settings
          </button>
        )}
      </div>
    </main>
  );
}
