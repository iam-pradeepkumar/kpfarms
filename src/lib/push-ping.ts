/**
 * Asks the server to send admin phone notifications right away instead of
 * waiting for the next scheduled run. Safe to call from any form: the server
 * de-duplicates alerts, so extra calls never send the same alert twice.
 */
export function pingAdminPush() {
  if (typeof window === "undefined") return;
  try {
    void fetch("/api/public/push-dispatch?trigger=1", { method: "POST", keepalive: true }).catch(
      () => {},
    );
  } catch {
    /* ignore */
  }
}
