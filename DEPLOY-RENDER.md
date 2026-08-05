# Host KP Farm Ventures on Render — complete beginner guide

Follow this top to bottom. Nothing is assumed.

---

## Part 1 — Put the code on GitHub (2 minutes)

You do NOT need to know git.

1. In the Lovable editor, click the **+** button in the chat box (bottom left).
2. Choose **GitHub → Connect project**.
3. Approve the Lovable GitHub app, pick your GitHub account.
4. Click **Create Repository**.

Done. Your code is now on GitHub, and every future change in Lovable is pushed
automatically.

---

## Part 2 — Collect the values you will paste into Render

Open a notepad and write these down before you start. There are 8 of them.

### A. Backend (database, login, storage, uploads)

These 4 are already public and safe — copy exactly:

| Name                            | Value                                            |
| ------------------------------- | ------------------------------------------------ |
| `VITE_SUPABASE_URL`             | `https://jzgusjdkhrnejmhyidcm.supabase.co`       |
| `SUPABASE_URL`                  | `https://jzgusjdkhrnejmhyidcm.supabase.co`       |
| `VITE_SUPABASE_PROJECT_ID`      | `jzgusjdkhrnejmhyidcm`                           |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_yDxq0N4HWghNclORn-1O9w_lvMWhT8q` |

### B. `SUPABASE_SERVICE_ROLE_KEY` — needed for phone notifications + admin writes

**Important:** this key belongs to the Lovable-managed database and I cannot
read it or export it for you. You have two choices:

- **Choice 1 (recommended, keeps everything working):** don't move the app —
  keep it published on Lovable and just point your own domain at it
  (Publish → Add custom domain). Then you skip Render entirely and everything
  below is unnecessary: Google sign-in, meeting scheduling, and phone push
  already work.
- **Choice 2 (you really want Render):** create your own free Supabase project
  at supabase.com, and use _its_ URL / publishable key / service role key in
  place of the values above. Your existing products, bookings and blog posts
  will **not** come along automatically — ask Lovable Cloud for a data export
  (Cloud → Advanced settings → Export data) and import it into the new project.

### C. `LOVABLE_API_KEY` + `GOOGLE_CALENDAR_APP_USER_CONNECTOR_CLIENT_API_KEY`

These power the "Sign in with Google" + auto-scheduled Google Meet links.
They are also Lovable-managed and cannot be exported. On Render, Google Meet
scheduling will not work unless you keep the app on Lovable (Choice 1).
Everything else (site, admin dashboard, bookings, orders, WhatsApp
confirmations, uploads) works fine on Render without them.

### D. Values you create yourself

Run these on any computer (or use any password generator):

```
openssl rand -base64 32     -> APP_USER_CONNECTION_KEY_SECRET
openssl rand -hex 32        -> PUSH_CRON_SECRET
npx web-push generate-vapid-keys   -> VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY
```

And `VAPID_SUBJECT` = `mailto:youremail@example.com`.

> If you generate **new** VAPID keys, every admin phone must open the dashboard
> and press "Enable phone alerts" again.

---

## Part 3 — Create the Render service

1. Go to https://dashboard.render.com → **New → Web Service**.
2. Click **Build and deploy from a Git repository**, connect GitHub, pick the
   repo Lovable created.
3. Render detects `render.yaml` in the repo and fills everything in. If it asks
   manually, use:
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node .output/server/index.mjs`
   - **Health Check Path:** `/`
4. **Plan: Starter ($7/mo) — not Free.** Free instances go to sleep, which kills
   the 1-hour and 5-minute meeting reminders.
5. Region: Singapore (closest to India).

---

## Part 4 — Add the environment variables

In Render: your service → **Environment** → **Add Environment Variable**, one
row per line below.

```
NITRO_PRESET=node-server
NODE_VERSION=22
NODE_ENV=production
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
APP_USER_CONNECTION_KEY_SECRET=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:you@example.com
PUSH_CRON_SECRET=...
LOVABLE_API_KEY=...                                    (only if you have one)
GOOGLE_CALENDAR_APP_USER_CONNECTOR_CLIENT_API_KEY=...  (only if you have one)
```

Click **Save, rebuild and deploy**. Wait ~4 minutes. You get a URL like
`https://kp-farm-ventures.onrender.com`.

---

## Part 5 — Make phone notifications fire on Render

The alerts are sent by a background job that calls one URL every minute.
Point it at your new address:

1. Render → **New → Cron Job**
2. Schedule: `* * * * *` (every minute)
3. Command:
   ```
   curl -s -X POST "https://YOUR-APP.onrender.com/api/public/push-dispatch" -H "x-cron-secret: YOUR_PUSH_CRON_SECRET"
   ```
4. Save.

Then on your phone: open `https://YOUR-APP.onrender.com/admin` in Chrome,
log in as admin, **Settings → Enable phone alerts**, and use Chrome's
"Add to Home screen" so it installs as an app.

---

## Part 6 — Custom domain

Render → your service → **Settings → Custom Domains → Add**. Render shows you
one CNAME record; paste it into your domain provider's DNS page. HTTPS is
automatic. For the admin panel on a subdomain, point
`admin.yourdomain.com` at the same service — `/admin` works on any domain.

---

## Quick checks after deploy

Open these in a browser; all should load:

- `https://YOUR-APP.onrender.com/` — home page with logo and videos
- `https://YOUR-APP.onrender.com/media/kp-logo.png` — the logo image
- `https://YOUR-APP.onrender.com/admin` — admin login
- Book a test meeting on the site → it should appear in the dashboard

## If something breaks

| Symptom                             | Cause / fix                                                              |
| ----------------------------------- | ------------------------------------------------------------------------ |
| Build fails                         | Check `NODE_VERSION=22` is set                                           |
| Site loads but no products/bookings | `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` wrong              |
| Admin actions fail                  | `SUPABASE_SERVICE_ROLE_KEY` missing or wrong                             |
| No phone alerts                     | Cron job not created, wrong `PUSH_CRON_SECRET`, or on the Free plan      |
| Google sign-in fails                | Needs `LOVABLE_API_KEY` + the Google connector key (Lovable-only)        |
| Images 404                          | They live in `public/media/` — confirm the folder is in your GitHub repo |
