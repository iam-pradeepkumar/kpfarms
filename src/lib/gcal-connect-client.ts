/* Opens the Google sign-in popup and waits for it to finish. Client-safe. */
export function waitForOAuthCompletion(popup: Window) {
  return new Promise<void>((resolve, reject) => {
    let poll: number | undefined = undefined;
    let finished = false;
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      if (poll !== undefined) window.clearInterval(poll);
    };
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; connectorId?: string; reason?: string } | null;
      const type = data?.type;
      if (
        event.origin !== window.location.origin ||
        data?.connectorId !== "google_calendar" ||
        (type !== "appUserConnectorOAuthComplete" && type !== "appUserConnectorOAuthFailed")
      )
        return;
      finished = true;
      cleanup();
      if (type === "appUserConnectorOAuthComplete") {
        resolve();
        return;
      }
      try {
        popup.close();
      } catch {
        /* already closed */
      }
      reject(new Error(data?.reason || "Google sign-in failed."));
    };
    window.addEventListener("message", onMessage);
    poll = window.setInterval(() => {
      if (!popup.closed || finished) return;
      cleanup();
      reject(new Error("The Google window was closed before sign-in finished."));
    }, 700);
  });
}

export async function runGoogleSignIn(getUrl: () => Promise<string>) {
  const popup = window.open("", "kp-google-signin", "width=520,height=680");
  if (!popup) throw new Error("Please allow pop-ups for this site and try again.");
  try {
    const url = await getUrl();
    const done = waitForOAuthCompletion(popup);
    popup.location.href = url;
    await done;
  } catch (e) {
    try {
      popup.close();
    } catch {
      /* ignore */
    }
    throw e;
  }
}
