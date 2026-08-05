/* Server-only environment variable check on startup. */
export function checkServerEnvironment() {
  if (typeof window !== "undefined") return;

  const requiredPublic = [
    "VITE_SUPABASE_URL",
    "SUPABASE_URL",
    "VITE_SUPABASE_PROJECT_ID",
    "SUPABASE_PROJECT_ID",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_PUBLISHABLE_KEY",
  ];

  const requiredSecrets = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "APP_USER_CONNECTION_KEY_SECRET",
    "VAPID_PUBLIC_KEY",
    "VAPID_PRIVATE_KEY",
    "VAPID_SUBJECT",
    "PUSH_CRON_SECRET",
  ];

  const optionalSecrets = ["LOVABLE_API_KEY", "GOOGLE_CALENDAR_APP_USER_CONNECTOR_CLIENT_API_KEY"];

  const missingRequired: string[] = [];
  const missingSecrets: string[] = [];
  const missingOptional: string[] = [];

  for (const key of requiredPublic) {
    if (!process.env[key]) {
      missingRequired.push(key);
    }
  }

  for (const key of requiredSecrets) {
    if (!process.env[key]) {
      missingSecrets.push(key);
    }
  }

  for (const key of optionalSecrets) {
    if (!process.env[key]) {
      missingOptional.push(key);
    }
  }

  if (missingRequired.length > 0) {
    console.warn(
      `[ENV CHECK] Missing public environment variable(s): ${missingRequired.join(", ")}`,
    );
  }
  if (missingSecrets.length > 0) {
    console.warn(
      `[ENV CHECK] Missing required server secret(s): ${missingSecrets.join(", ")}. Some server features (admin DB writes, push dispatch, connection encryption) require these in production.`,
    );
  }
  if (missingOptional.length > 0) {
    console.info(`[ENV CHECK] Optional server secret(s) not set: ${missingOptional.join(", ")}.`);
  }

  if (missingRequired.length === 0 && missingSecrets.length === 0) {
    console.log("[ENV CHECK] Server environment variables check passed.");
  }
}
