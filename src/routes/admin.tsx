import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { scheduleGoogleMeet } from "@/lib/meetings.functions";
import { useEffect, useMemo, useState } from "react";

import type { Session } from "@supabase/supabase-js";
import {
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Pencil,
  Check,
  X,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import {
  getPaymentQrUrl,
  PAYMENT_QR_KEY,
  resolvePaymentProofUrl,
  ADMIN_WHATSAPP_KEY,
} from "@/lib/submissions";
import {
  listBlogPosts,
  resolveBlogMediaUrl,
  uploadBlogMedia,
  slugify,
  type BlogPost,
} from "@/lib/blog";

import { supabase } from "@/integrations/supabase/client";
import { toWaDigits } from "@/lib/site-contact";
import { sendAdminTestPush } from "@/lib/push.functions";
import { subscribeToPush } from "@/lib/push-client";
import { notificationPermission, requestNotificationPermission } from "@/lib/reminders";
import { todayIso, nowHhMm, isPastDate, isPastDateTime } from "@/lib/dates";
import {
  HOME_VIDEOS,
  getHomeVideoUrls,
  uploadHomeVideo,
  removeHomeVideo,
  type HomeVideoKey,
} from "@/lib/home-videos";

import { KpMark } from "@/components/site/kp-mark";
import { FeatherBackdrop } from "@/components/site/decor";
import { AdminNotificationBell } from "@/components/site/admin-notification-bell";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — KP Farm Ventures" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "theme-color", content: "#1f7a3f" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "KP Admin" },
    ],
    links: [
      { rel: "manifest", href: "/admin-app.webmanifest" },
      { rel: "apple-touch-icon", href: "/app-icon.png" },
    ],
  }),
  component: AdminPage,
});

type ProductType = "digital" | "poultry" | "affiliate" | "training";
type Product = {
  id: string;
  type: ProductType;
  name: string;
  description: string | null;
  category: string | null;
  price: number | null;
  offer_price: number | null;
  image_url: string | null;
  external_url: string | null;
  active: boolean;
  created_at: string;
};

type TabKey =
  | "dashboard"
  | "products"
  | "training"
  | "consultations"
  | "visits"
  | "orders"
  | "messages"
  | "testimonials"
  | "blog"
  | "videos"
  | "settings";

type TrainingProgram = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  cohort_date: string | null;
  session_time: string | null;
  venue: string | null;
  seats: number | null;
  image_url: string | null;
  active: boolean;
  created_at: string;
};

type MediaType = "text" | "photo" | "video" | "audio";
type TStatus = "pending" | "approved" | "rejected";
type Testimonial = {
  id: string;
  name: string;
  place: string | null;
  rating: number;
  text: string | null;
  media_type: MediaType;
  media_url: string | null;
  status: TStatus;
  featured: boolean;
  created_at: string;
};

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setIsAdmin(null);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
    })();
  }, [session]);

  if (checking) return <FullPageLoader />;
  if (!session) return <AuthScreen />;
  if (isAdmin === null) return <FullPageLoader />;
  if (!isAdmin) return <NoAccessScreen onGranted={() => setIsAdmin(true)} />;

  return <Dashboard email={session.user.email ?? ""} />;
}

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 text-kp-green">
      <Loader2 className="size-6 animate-spin" />
    </div>
  );
}

/* -------- Auth -------- */

function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "loading">("idle");
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setState("loading");
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setState("idle");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-stone-50 px-4 font-sans text-stone-900">
      <FeatherBackdrop />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <KpMark size={48} />
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-kp-gold">KP Admin</div>
            <div className="font-display text-xl font-extrabold">
              {mode === "signin" ? "Sign in" : "Create admin account"}
            </div>
          </div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <AdminField label="Email" type="email" value={email} onChange={setEmail} required />
          <AdminField
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            required
            minLength={8}
          />
          {err && (
            <div className="rounded-xl bg-kp-red/10 px-4 py-3 text-xs font-semibold text-kp-red">
              {err}
            </div>
          )}
          <button
            disabled={state === "loading"}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-kp-green py-3.5 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-green-900/10 transition hover:opacity-90 disabled:opacity-60"
          >
            {state === "loading" && <Loader2 className="size-4 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-5 w-full text-center text-xs font-medium text-stone-500 hover:text-kp-green"
        >
          {mode === "signin"
            ? "First time here? Create the admin account →"
            : "Have an account? Sign in →"}
        </button>
      </div>
    </div>
  );
}

function NoAccessScreen({ onGranted }: { onGranted: () => void }) {
  const [claiming, setClaiming] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const claim = async () => {
    setClaiming(true);
    setMsg(null);
    const { data, error } = await supabase.rpc("claim_admin_if_first");
    setClaiming(false);
    if (error) return setMsg(error.message);
    if (data) onGranted();
    else setMsg("Admin already exists. Ask the existing admin to grant you access.");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-stone-50 px-4 font-sans text-stone-900">
      <FeatherBackdrop />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-kp-gold/15 text-kp-gold">
          <ShieldCheck size={28} />
        </div>
        <h1 className="mb-2 font-display text-2xl font-extrabold">No admin access</h1>
        <p className="mb-6 text-sm text-stone-600">
          Your account isn't linked to an admin role. If this is a fresh setup, claim the first
          admin seat below.
        </p>
        <button
          onClick={claim}
          disabled={claiming}
          className="inline-flex items-center gap-2 rounded-xl bg-kp-green px-6 py-3 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-green-900/10 hover:opacity-90 disabled:opacity-60"
        >
          {claiming && <Loader2 className="size-4 animate-spin" />}
          Claim admin access
        </button>
        {msg && <div className="mt-4 text-xs text-stone-500">{msg}</div>}
        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-6 block w-full text-xs font-medium text-stone-400 hover:text-kp-red"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

/* -------- Dashboard -------- */

const TABS: { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Overview" },
  { key: "products", label: "Products" },
  { key: "training", label: "Training" },
  { key: "consultations", label: "Consultations" },
  { key: "visits", label: "Farm Visits" },
  { key: "orders", label: "Orders" },
  { key: "messages", label: "Messages" },
  { key: "testimonials", label: "Testimonials" },
  { key: "blog", label: "Blog" },
  { key: "videos", label: "Home Videos" },
  { key: "settings", label: "Settings" },
];

function Dashboard({ email }: { email: string }) {
  const [tab, setTab] = useState<TabKey>("dashboard");

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-stone-50 pb-[env(safe-area-inset-bottom)] font-sans text-stone-900">
      <FeatherBackdrop />
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 md:px-6 md:py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="shrink-0">
              <KpMark size={36} />
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-widest text-kp-gold">
                KP Farm Ventures
              </div>
              <div className="truncate font-display text-base font-extrabold uppercase tracking-tight md:text-lg">
                Admin Dashboard
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-xs">
            <span className="hidden font-medium text-stone-500 lg:inline">{email}</span>
            <AdminNotificationBell />
            <button
              onClick={() => supabase.auth.signOut()}
              aria-label="Sign out"
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white p-2.5 font-bold uppercase tracking-widest text-stone-700 hover:border-kp-red hover:text-kp-red sm:px-4 sm:py-2"
            >
              <LogOut size={14} /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-3 text-sm [-ms-overflow-style:none] [scrollbar-width:none]">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 font-semibold transition sm:px-4 ${
                tab === t.key
                  ? "bg-kp-green text-white shadow-md shadow-green-900/10"
                  : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
        {tab === "dashboard" && <Overview />}
        {tab === "products" && <ProductsTab />}
        {tab === "training" && <TrainingProgramsTab />}
        {tab === "consultations" && (
          <SubmissionsTab
            table="consultation_bookings"
            bookingKind="consultation"
            title="Consultation bookings"
            columns={[
              { key: "booking_step", label: "Progress" },
              { key: "name", label: "Name" },
              { key: "whatsapp", label: "WhatsApp" },
              { key: "email", label: "Email" },
              { key: "preferred_date", label: "Date" },
              { key: "preferred_time", label: "Slot" },
              { key: "topic", label: "Topic" },
              { key: "meeting_link", label: "Meet link" },
              { key: "notes", label: "Notes" },
            ]}
          />
        )}
        {tab === "visits" && (
          <SubmissionsTab
            table="farm_visit_bookings"
            bookingKind="farm_visit"
            title="Farm visit bookings"
            columns={[
              { key: "booking_step", label: "Progress" },
              { key: "name", label: "Name" },
              { key: "whatsapp", label: "WhatsApp" },
              { key: "email", label: "Email" },
              { key: "visit_date", label: "Visit Date" },
              { key: "group_size", label: "Group" },
              { key: "confirmed_at", label: "Confirmed" },

              { key: "notes", label: "Notes" },
            ]}
          />
        )}

        {tab === "orders" && (
          <SubmissionsTab
            table="orders"
            title="Product orders"
            columns={[
              { key: "customer_name", label: "Customer" },
              { key: "whatsapp", label: "WhatsApp" },
              { key: "product_name", label: "Product" },
              { key: "product_type", label: "Type" },
              { key: "quantity", label: "Qty" },
              { key: "total", label: "Total ₹" },
              { key: "address", label: "Address" },
            ]}
          />
        )}
        {tab === "messages" && (
          <SubmissionsTab
            table="contact_messages"
            title="Contact messages"
            columns={[
              { key: "name", label: "Name" },
              { key: "phone", label: "Phone" },
              { key: "email", label: "Email" },
              { key: "subject", label: "Subject" },
              { key: "message", label: "Message" },
            ]}
          />
        )}
        {tab === "testimonials" && <TestimonialsTab />}
        {tab === "blog" && <BlogTab />}
        {tab === "videos" && <HomeVideosTab />}
        {tab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
}

/* -------- Overview tiles -------- */

const TILE_STYLES: Record<string, string> = {
  consultation_bookings: "from-kp-green/10 to-emerald-50 text-kp-green",
  farm_visit_bookings: "from-kp-gold/15 to-amber-50 text-amber-700",
  training_bookings: "from-sky-100 to-sky-50 text-sky-700",
  orders: "from-kp-red/10 to-rose-50 text-kp-red",
  contact_messages: "from-violet-100 to-violet-50 text-violet-700",
  products: "from-lime-100 to-lime-50 text-lime-700",
};

function Overview() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const tables = [
      "products",
      "consultation_bookings",
      "farm_visit_bookings",
      "training_bookings",
      "orders",
      "contact_messages",
    ] as const;
    const results = await Promise.all(
      tables.map((t) => supabase.from(t).select("*", { count: "exact", head: true })),
    );
    const next: Record<string, number> = {};
    tables.forEach((t, i) => (next[t] = results[i].count ?? 0));
    setCounts(next);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const tiles = [
    { key: "consultation_bookings", label: "Consultations" },
    { key: "farm_visit_bookings", label: "Farm Visits" },
    { key: "training_bookings", label: "Training Signups" },
    { key: "orders", label: "Product Orders" },
    { key: "contact_messages", label: "Messages" },
    { key: "products", label: "Products Listed" },
  ];

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-widest text-kp-gold">
            Live snapshot
          </div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl md:text-4xl">Overview</h1>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-stone-700 hover:border-kp-green hover:text-kp-green"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <div
            key={t.key}
            className={`rounded-3xl border border-stone-200 bg-gradient-to-br ${TILE_STYLES[t.key]} p-6 shadow-sm transition hover:shadow-lg`}
          >
            <div className="text-[11px] font-bold uppercase tracking-widest opacity-80">
              {t.label}
            </div>
            <div className="mt-2 font-display text-4xl font-extrabold text-stone-900">
              {loading ? <Loader2 className="size-6 animate-spin" /> : (counts[t.key] ?? 0)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------- Submissions -------- */

type Column = { key: string; label: string };

function SubmissionsTab({
  table,
  title,
  columns,
  bookingKind,
}: {
  table: string;
  title: string;
  columns: Column[];
  bookingKind?: "consultation" | "farm_visit" | "training";
}) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase
      // @ts-expect-error dynamic table name is intentional for admin
      .from(table)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setErr(error.message);
    else setRows((data as Record<string, unknown>[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [table]);

  const del = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    // @ts-expect-error dynamic table name is intentional for admin
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) alert(error.message);
    else load();
  };

  const setStatus = async (id: string, status: string) => {
    // @ts-expect-error dynamic table name is intentional for admin
    const { error } = await supabase.from(table).update({ status }).eq("id", id);
    if (error) alert(error.message);
    else load();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-widest text-kp-gold">
            Registrations
          </div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl md:text-4xl">{title}</h1>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-stone-700 hover:border-kp-green hover:text-kp-green"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-kp-green" />
        </div>
      ) : err ? (
        <div className="rounded-2xl bg-kp-red/10 p-4 text-sm text-kp-red">{err}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-16 text-center text-sm text-stone-500">
          No records yet.
        </div>
      ) : (
        <div className="overflow-x-auto [-webkit-overflow-scrolling:touch] rounded-3xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-stone-50 text-[11px] uppercase tracking-widest text-stone-500">
              <tr>
                <th className="px-4 py-3 font-bold">Received</th>
                {columns.map((c) => (
                  <th key={c.key} className="px-4 py-3 font-bold">
                    {c.label}
                  </th>
                ))}
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={String(r.id)}
                  className="border-t border-stone-100 transition hover:bg-stone-50/60"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-stone-500">
                    {r.created_at ? new Date(String(r.created_at)).toLocaleString() : "—"}
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className="max-w-[220px] truncate px-4 py-3 text-stone-800">
                      {c.key === "booking_step" ? (
                        <StepPill value={String(r[c.key] ?? "registered")} />
                      ) : r[c.key] == null || r[c.key] === "" ? (
                        <span className="text-stone-400">—</span>
                      ) : (
                        String(r[c.key])
                      )}
                    </td>
                  ))}

                  <td className="px-4 py-3">
                    <StatusPill
                      value={String(r.status ?? "new")}
                      onChange={(v) => setStatus(String(r.id), v)}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {r.whatsapp ? (
                        <WhatsAppChatButton
                          whatsapp={String(r.whatsapp)}
                          name={String(r.name ?? "")}
                        />
                      ) : null}
                      {bookingKind && <BookingActions table={table} row={r} onChanged={load} />}

                      <button
                        onClick={() => del(String(r.id))}
                        className="rounded-full p-2 text-stone-400 transition hover:bg-kp-red/10 hover:text-kp-red"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const STEP_STYLES: Record<string, { label: string; cls: string }> = {
  registered: { label: "Registered", cls: "bg-stone-100 text-stone-700 border-stone-200" },
  slot_booked: { label: "Slot booked", cls: "bg-sky-50 text-sky-700 border-sky-200" },
  paid: { label: "Paid", cls: "bg-kp-green/10 text-kp-green border-emerald-200" },
};

function StepPill({ value }: { value: string }) {
  const s = STEP_STYLES[value] ?? STEP_STYLES.registered;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  new: "bg-stone-100 text-stone-700 border-stone-200",
  contacted: "bg-sky-50 text-sky-700 border-sky-200",
  confirmed: "bg-kp-gold/15 text-amber-700 border-amber-200",
  completed: "bg-kp-green/10 text-kp-green border-emerald-200",
  cancelled: "bg-kp-red/10 text-kp-red border-red-200",
  paid: "bg-kp-green/10 text-kp-green border-emerald-200",
};

function StatusPill({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const cls = STATUS_STYLES[value] ?? STATUS_STYLES.new;
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest focus:outline-none ${cls}`}
    >
      <option value="new">new</option>
      <option value="contacted">contacted</option>
      <option value="confirmed">confirmed</option>
      <option value="completed">completed</option>
      <option value="cancelled">cancelled</option>
    </select>
  );
}

/* -------- Products -------- */

const EMPTY_PRODUCT = {
  type: "digital" as ProductType,
  name: "",
  description: "",
  category: "",
  price: "",
  offer_price: "",
  image_url: "",
  external_url: "",
  active: true,
};

function ProductsTab() {
  const [rows, setRows] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | ProductType>("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setRows((data as Product[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const shown = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.type === filter)),
    [rows, filter],
  );

  const del = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) alert(error.message);
    else load();
  };

  const toggleActive = async (p: Product) => {
    const { error } = await supabase.from("products").update({ active: !p.active }).eq("id", p.id);
    if (error) alert(error.message);
    else load();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-widest text-kp-gold">
            Catalog
          </div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl md:text-4xl">Products</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700"
          >
            <option value="all">All types</option>
            <option value="digital">Digital</option>
            <option value="poultry">Poultry (own)</option>
            <option value="affiliate">Affiliate</option>
            <option value="training">Training</option>
          </select>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-stone-700 hover:border-kp-green hover:text-kp-green"
          >
            <RefreshCw size={12} /> Refresh
          </button>
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-kp-green px-5 py-2 text-xs font-bold uppercase tracking-widest text-white shadow-md shadow-green-900/10 hover:opacity-90"
          >
            <Plus size={14} /> Add product
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-kp-green" />
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-16 text-center text-sm text-stone-500">
          No products yet. Click "Add product" to create one.
        </div>
      ) : (
        <div className="overflow-x-auto [-webkit-overflow-scrolling:touch] rounded-3xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-stone-50 text-[11px] uppercase tracking-widest text-stone-500">
              <tr>
                <th className="px-4 py-3 font-bold">Name</th>
                <th className="px-4 py-3 font-bold">Type</th>
                <th className="px-4 py-3 font-bold">Category</th>
                <th className="px-4 py-3 font-bold">Price</th>
                <th className="px-4 py-3 font-bold">Offer</th>
                <th className="px-4 py-3 font-bold">Active</th>
                <th className="px-4 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-stone-100 transition hover:bg-stone-50/60"
                >
                  <td className="px-4 py-3 font-semibold text-stone-900">{p.name}</td>
                  <td className="px-4 py-3 text-stone-500 capitalize">{p.type}</td>
                  <td className="px-4 py-3 text-stone-500">{p.category ?? "—"}</td>
                  <td className="px-4 py-3 text-stone-800">
                    {p.price != null ? `₹${p.price}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-kp-red font-semibold">
                    {p.offer_price != null ? `₹${p.offer_price}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(p)}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest ${
                        p.active
                          ? "border-emerald-200 bg-kp-green/10 text-kp-green"
                          : "border-stone-200 bg-stone-100 text-stone-500"
                      }`}
                    >
                      {p.active ? <Check size={12} /> : <X size={12} />}
                      {p.active ? "Active" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditing(p)}
                      className="mr-1 rounded-full p-2 text-stone-500 transition hover:bg-stone-100 hover:text-kp-green"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => del(p.id)}
                      className="rounded-full p-2 text-stone-400 transition hover:bg-kp-red/10 hover:text-kp-red"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(adding || editing) && (
        <ProductForm
          initial={editing ?? undefined}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
          onSaved={() => {
            setAdding(false);
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function ProductForm({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Product;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    ...EMPTY_PRODUCT,
    ...(initial
      ? {
          type: initial.type,
          name: initial.name,
          description: initial.description ?? "",
          category: initial.category ?? "",
          price: initial.price != null ? String(initial.price) : "",
          offer_price: initial.offer_price != null ? String(initial.offer_price) : "",
          image_url: initial.image_url ?? "",
          external_url: initial.external_url ?? "",
          active: initial.active,
        }
      : {}),
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const path = form.image_url;
      if (!path) return setPreview(null);
      if (/^https?:\/\//i.test(path)) return setPreview(path);
      const { data } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60);
      if (!cancelled) setPreview(data?.signedUrl ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [form.image_url]);

  const onFile = async (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return setErr("Image must be under 10 MB");
    setErr(null);
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    setUploading(false);
    if (error) return setErr(error.message);
    setForm((f) => ({ ...f, image_url: path }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setErr("Name is required");
    setSaving(true);
    setErr(null);
    const payload = {
      type: form.type,
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category.trim() || null,
      price: form.price ? Number(form.price) : null,
      offer_price: form.offer_price ? Number(form.offer_price) : null,
      image_url: form.image_url.trim() || null,
      external_url: form.external_url.trim() || null,
      active: form.active,
    };
    const { error } = initial
      ? await supabase.from("products").update(payload).eq("id", initial.id)
      : await supabase.from("products").insert(payload);
    setSaving(false);
    if (error) return setErr(error.message);
    onSaved();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto overscroll-contain bg-stone-900/50 p-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="my-4 w-full max-w-2xl rounded-3xl border border-stone-200 bg-white p-5 text-stone-900 shadow-2xl sm:my-8 sm:max-h-[85vh] sm:overflow-y-auto sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-1 text-xs font-bold uppercase tracking-widest text-kp-gold">
              {initial ? "Editing" : "New product"}
            </div>
            <h2 className="font-display text-2xl font-extrabold">
              {initial ? initial.name : "Add product"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition hover:bg-stone-200 hover:text-kp-red"
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={save} className="grid gap-5 sm:grid-cols-2">
          <div>
            <AdminLabel>Type</AdminLabel>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as ProductType })}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:border-kp-green focus:bg-white focus:outline-none"
            >
              <option value="digital">Digital product</option>
              <option value="poultry">Poultry product (own)</option>
              <option value="affiliate">Affiliate product</option>
              <option value="training">Training program</option>
            </select>
          </div>
          <AdminField
            label="Name"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            required
          />
          <AdminField
            label="Category"
            value={form.category}
            onChange={(v) => setForm({ ...form, category: v })}
          />
          <div className="sm:col-span-2">
            <AdminLabel>Description</AdminLabel>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:border-kp-green focus:bg-white focus:outline-none"
            />
          </div>
          <AdminField
            label="Price ₹"
            type="number"
            value={form.price}
            onChange={(v) => setForm({ ...form, price: v })}
          />
          <AdminField
            label="Offer price ₹"
            type="number"
            value={form.offer_price}
            onChange={(v) => setForm({ ...form, offer_price: v })}
          />
          <div className="sm:col-span-2">
            <AdminLabel>Product image</AdminLabel>
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
              {preview ? (
                <img src={preview} alt="" className="size-24 rounded-xl object-cover" />
              ) : (
                <div className="flex size-24 items-center justify-center rounded-xl border border-dashed border-stone-300 text-xs text-stone-400">
                  No image
                </div>
              )}
              <div className="flex-1">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-kp-green px-4 py-2 text-xs font-bold uppercase tracking-widest text-white hover:opacity-90">
                  {uploading && <Loader2 className="size-4 animate-spin" />}
                  {uploading ? "Uploading…" : form.image_url ? "Replace image" : "Upload image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onFile(f);
                    }}
                  />
                </label>
                {form.image_url && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, image_url: "" })}
                    className="ml-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-500 hover:text-kp-red"
                  >
                    Remove
                  </button>
                )}
                <div className="mt-2 text-[11px] text-stone-500">PNG / JPG up to 10 MB.</div>
              </div>
            </div>
          </div>
          <AdminField
            label="External / Buy link"
            value={form.external_url}
            onChange={(v) => setForm({ ...form, external_url: v })}
            placeholder="Amazon link, download URL…"
          />
          <label className="sm:col-span-2 mt-1 flex items-center gap-3 rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="size-4 accent-kp-green"
            />
            Visible on public site
          </label>

          {err && (
            <div className="sm:col-span-2 rounded-xl bg-kp-red/10 px-4 py-3 text-xs font-semibold text-kp-red">
              {err}
            </div>
          )}

          <div className="sm:col-span-2 mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-stone-200 px-5 py-2.5 text-sm font-bold uppercase tracking-widest text-stone-600 hover:border-stone-400"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-kp-green px-6 py-2.5 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-green-900/10 hover:opacity-90 disabled:opacity-60"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {initial ? "Save changes" : "Create product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------- Training Programs -------- */

type TrainingBooking = {
  id: string;
  name: string;
  whatsapp: string;
  email: string | null;
  program: string | null;
  cohort_date: string | null;
  booking_step: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
};

function TrainingProgramsTab() {
  const [rows, setRows] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TrainingProgram | null>(null);
  const [adding, setAdding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bookingsByProgram, setBookingsByProgram] = useState<Record<string, TrainingBooking[]>>({});
  const [bookingsLoading, setBookingsLoading] = useState<string | null>(null);
  const [orphans, setOrphans] = useState<TrainingBooking[]>([]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("training_programs")
      .select("*")
      .order("cohort_date", { ascending: true });
    const programs = error ? [] : ((data as TrainingProgram[]) ?? []);
    if (!error) setRows(programs);

    // Signups whose program was deleted or renamed would otherwise be invisible
    // even though they are counted on the Overview tiles.
    const names = new Set(programs.map((p) => p.name));
    const { data: allBookings } = await supabase
      .from("training_bookings")
      .select("*")
      .order("created_at", { ascending: false });
    setOrphans(
      ((allBookings as TrainingBooking[]) ?? []).filter((b) => !b.program || !names.has(b.program)),
    );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const deleteOrphans = async () => {
    if (!confirm(`Delete all ${orphans.length} signups with no matching program?`)) return;
    const { error } = await supabase
      .from("training_bookings")
      .delete()
      .in(
        "id",
        orphans.map((o) => o.id),
      );
    if (error) alert(error.message);
    else load();
  };

  const deleteOrphan = async (id: string) => {
    if (!confirm("Delete this signup?")) return;
    const { error } = await supabase.from("training_bookings").delete().eq("id", id);
    if (error) alert(error.message);
    else load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this training program?")) return;
    const { error } = await supabase.from("training_programs").delete().eq("id", id);
    if (error) alert(error.message);
    else load();
  };

  const toggleActive = async (p: TrainingProgram) => {
    const { error } = await supabase
      .from("training_programs")
      .update({ active: !p.active })
      .eq("id", p.id);
    if (error) alert(error.message);
    else load();
  };

  const openRegistrations = async (p: TrainingProgram) => {
    if (expandedId === p.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(p.id);
    setBookingsLoading(p.id);
    const { data } = await supabase
      .from("training_bookings")
      .select("*")
      .eq("program", p.name)
      .order("created_at", { ascending: false });
    setBookingsByProgram((m) => ({ ...m, [p.id]: (data as TrainingBooking[]) ?? [] }));
    setBookingsLoading(null);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-widest text-kp-gold">
            Training
          </div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl md:text-4xl">
            Training Programs
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            Create programs and view who has registered for each.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-stone-700 hover:border-kp-green hover:text-kp-green"
          >
            <RefreshCw size={12} /> Refresh
          </button>
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-kp-green px-5 py-2 text-xs font-bold uppercase tracking-widest text-white shadow-md shadow-green-900/10 hover:opacity-90"
          >
            <Plus size={14} /> Add program
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-kp-green" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-16 text-center text-sm text-stone-500">
          No training programs yet. Click "Add program" to create one.
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((p) => {
            const expanded = expandedId === p.id;
            const bookings = bookingsByProgram[p.id] ?? [];
            return (
              <div
                key={p.id}
                className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm"
              >
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:p-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-display text-lg font-extrabold text-stone-900">
                        {p.name}
                      </div>
                      <button
                        onClick={() => toggleActive(p)}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                          p.active
                            ? "border-emerald-200 bg-kp-green/10 text-kp-green"
                            : "border-stone-200 bg-stone-100 text-stone-500"
                        }`}
                      >
                        {p.active ? <Check size={10} /> : <X size={10} />}
                        {p.active ? "Active" : "Hidden"}
                      </button>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
                      <span>
                        Date: <b className="text-stone-700">{p.cohort_date ?? "—"}</b>
                      </span>
                      <span>
                        Venue: <b className="text-stone-700">{p.venue ?? "—"}</b>
                      </span>
                      <span>
                        Price:{" "}
                        <b className="text-stone-700">{p.price != null ? `₹${p.price}` : "—"}</b>
                      </span>
                      <span>
                        Seats: <b className="text-stone-700">{p.seats ?? "—"}</b>
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => openRegistrations(p)}
                      className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-stone-700 hover:border-kp-green hover:text-kp-green"
                    >
                      {expanded ? "Hide" : "View"} registrations
                    </button>
                    <button
                      onClick={() => setEditing(p)}
                      className="rounded-full p-2 text-stone-500 transition hover:bg-stone-100 hover:text-kp-green"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => del(p.id)}
                      className="rounded-full p-2 text-stone-400 transition hover:bg-kp-red/10 hover:text-kp-red"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-stone-100 bg-stone-50/60 p-5">
                    {bookingsLoading === p.id ? (
                      <div className="flex justify-center py-6">
                        <Loader2 className="size-5 animate-spin text-kp-green" />
                      </div>
                    ) : bookings.length === 0 ? (
                      <div className="py-6 text-center text-sm text-stone-500">
                        No registrations yet for this program.
                      </div>
                    ) : (
                      <div className="overflow-x-auto [-webkit-overflow-scrolling:touch] rounded-2xl border border-stone-200 bg-white">
                        <table className="w-full min-w-[800px] text-left text-sm">
                          <thead className="bg-stone-50 text-[11px] uppercase tracking-widest text-stone-500">
                            <tr>
                              <th className="px-4 py-2 font-bold">Progress</th>
                              <th className="px-4 py-2 font-bold">Name</th>
                              <th className="px-4 py-2 font-bold">WhatsApp</th>
                              <th className="px-4 py-2 font-bold">Email</th>
                              <th className="px-4 py-2 font-bold">Notes</th>
                              <th className="px-4 py-2 font-bold">Registered</th>
                              <th className="px-4 py-2 font-bold text-right">Payment</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bookings.map((b) => (
                              <tr key={b.id} className="border-t border-stone-100">
                                <td className="px-4 py-2">
                                  <StepPill value={b.booking_step ?? "registered"} />
                                </td>
                                <td className="px-4 py-2 font-semibold text-stone-900">{b.name}</td>
                                <td className="px-4 py-2 text-stone-700">{b.whatsapp}</td>
                                <td className="px-4 py-2 text-stone-500">{b.email ?? "—"}</td>
                                <td className="px-4 py-2 text-stone-500 max-w-[240px] truncate">
                                  {b.notes ?? "—"}
                                </td>
                                <td className="px-4 py-2 text-stone-500">
                                  {new Date(b.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <WhatsAppChatButton whatsapp={b.whatsapp} name={b.name} />
                                    <BookingActions
                                      table="training_bookings"
                                      row={b as unknown as Record<string, unknown>}
                                      onChanged={() => openRegistrations(p)}
                                    />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && orphans.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-3xl border border-amber-200 bg-amber-50/60 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-amber-200 p-5">
            <div>
              <h3 className="font-display text-lg font-extrabold text-stone-900">
                Other signups ({orphans.length})
              </h3>
              <p className="mt-1 text-xs text-stone-600">
                These people registered for a program that no longer exists (or was renamed). They
                are still counted in “Training Signups” on the Overview tab.
              </p>
            </div>
            <button
              onClick={deleteOrphans}
              className="rounded-full border border-kp-red/30 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-kp-red hover:bg-kp-red/10"
            >
              Delete all
            </button>
          </div>
          <div className="overflow-x-auto bg-white">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-stone-50 text-[11px] uppercase tracking-widest text-stone-500">
                <tr>
                  <th className="px-4 py-2 font-bold">Progress</th>
                  <th className="px-4 py-2 font-bold">Name</th>
                  <th className="px-4 py-2 font-bold">WhatsApp</th>
                  <th className="px-4 py-2 font-bold">Program</th>
                  <th className="px-4 py-2 font-bold">Registered</th>
                  <th className="px-4 py-2 font-bold text-right">Payment</th>
                </tr>
              </thead>
              <tbody>
                {orphans.map((b) => (
                  <tr key={b.id} className="border-t border-stone-100">
                    <td className="px-4 py-2">
                      <StepPill value={b.booking_step ?? "registered"} />
                    </td>
                    <td className="px-4 py-2 font-semibold text-stone-900">{b.name}</td>
                    <td className="px-4 py-2 text-stone-700">{b.whatsapp}</td>
                    <td className="px-4 py-2 text-stone-500">{b.program ?? "—"}</td>
                    <td className="px-4 py-2 text-stone-500">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <WhatsAppChatButton whatsapp={b.whatsapp} name={b.name} />
                        <BookingActions
                          table="training_bookings"
                          row={b as unknown as Record<string, unknown>}
                          onChanged={load}
                        />
                        <button
                          onClick={() => deleteOrphan(b.id)}
                          title="Delete signup"
                          className="rounded-full p-2 text-stone-400 transition hover:bg-kp-red/10 hover:text-kp-red"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(adding || editing) && (
        <TrainingProgramForm
          initial={editing ?? undefined}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
          onSaved={() => {
            setAdding(false);
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function TrainingProgramForm({
  initial,
  onClose,
  onSaved,
}: {
  initial?: TrainingProgram;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    price: initial?.price != null ? String(initial.price) : "",
    cohort_date: initial?.cohort_date ?? "",
    session_time: initial?.session_time ?? "",
    venue: initial?.venue ?? "",
    seats: initial?.seats != null ? String(initial.seats) : "",
    image_url: initial?.image_url ?? "",
    active: initial?.active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setErr("Name is required");
    setSaving(true);
    setErr(null);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: form.price ? Number(form.price) : null,
      cohort_date: form.cohort_date || null,
      session_time: form.session_time.trim() || null,
      venue: form.venue.trim() || null,
      seats: form.seats ? Number(form.seats) : null,
      image_url: form.image_url.trim() || null,
      active: form.active,
    };
    const { error } = initial
      ? await supabase.from("training_programs").update(payload).eq("id", initial.id)
      : await supabase.from("training_programs").insert(payload);
    setSaving(false);
    if (error) return setErr(error.message);
    onSaved();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto overscroll-contain bg-stone-900/50 p-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="my-4 w-full max-w-2xl rounded-3xl border border-stone-200 bg-white p-5 text-stone-900 shadow-2xl sm:my-8 sm:max-h-[85vh] sm:overflow-y-auto sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-1 text-xs font-bold uppercase tracking-widest text-kp-gold">
              {initial ? "Editing" : "New program"}
            </div>
            <h2 className="font-display text-2xl font-extrabold">
              {initial ? initial.name : "Add training program"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition hover:bg-stone-200 hover:text-kp-red"
          >
            <X size={16} />
          </button>
        </div>
        <form onSubmit={save} className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <AdminField
              label="Program name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <AdminLabel>Description</AdminLabel>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:border-kp-green focus:bg-white focus:outline-none"
            />
          </div>
          <AdminField
            label="Price ₹"
            type="number"
            value={form.price}
            onChange={(v) => setForm({ ...form, price: v })}
          />
          <AdminField
            label="Cohort date"
            type="date"
            min={todayIso()}
            value={form.cohort_date}
            onChange={(v) => setForm({ ...form, cohort_date: v })}
          />
          <AdminField
            label="Session time"
            value={form.session_time}
            onChange={(v) => setForm({ ...form, session_time: v })}
            placeholder="9:00 AM – 5:00 PM"
          />
          <AdminField
            label="Seats"
            type="number"
            value={form.seats}
            onChange={(v) => setForm({ ...form, seats: v })}
          />
          <div className="sm:col-span-2">
            <AdminField
              label="Venue"
              value={form.venue}
              onChange={(v) => setForm({ ...form, venue: v })}
              placeholder="KP Main Farm, Tamil Nadu"
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <input
              id="tp-active"
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="size-4 rounded border-stone-300 text-kp-green focus:ring-kp-green"
            />
            <label htmlFor="tp-active" className="text-sm font-semibold text-stone-700">
              Show on website
            </label>
          </div>
          {err && (
            <div className="sm:col-span-2 rounded-xl bg-kp-red/10 px-4 py-3 text-center text-xs font-semibold text-kp-red">
              {err}
            </div>
          )}
          <div className="sm:col-span-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-300 px-6 py-3 text-xs font-bold uppercase tracking-widest text-stone-600 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-kp-green px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {initial ? "Save changes" : "Create program"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WhatsAppChatButton({ whatsapp, name }: { whatsapp: string; name?: string }) {
  const num = toWaDigits(whatsapp);
  if (!num) return null;
  const text = encodeURIComponent(`Hi ${name ?? ""}, this is KP Farm Ventures.`);
  return (
    <a
      href={`https://wa.me/${num}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      title="Message on WhatsApp"
      className="rounded-full p-2 text-[#25D366] transition hover:bg-[#25D366]/10"
    >
      <MessageCircle size={15} />
    </a>
  );
}

function AdminLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-stone-600">
      {children}
    </div>
  );
}

function AdminField({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  minLength,
  min,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  minLength?: number;
  min?: string;
}) {
  return (
    <div>
      <AdminLabel>{label}</AdminLabel>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        minLength={minLength}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-kp-green focus:bg-white"
      />
    </div>
  );
}

/* -------- Testimonials -------- */

function TestimonialsTab() {
  const [rows, setRows] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | TStatus>("all");
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false });
    setRows((data as Testimonial[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const shown = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter],
  );

  const del = async (r: Testimonial) => {
    if (!confirm("Delete this testimonial?")) return;
    if (r.media_url && !/^https?:\/\//i.test(r.media_url)) {
      await supabase.storage.from("testimonials").remove([r.media_url]);
    }
    const { error } = await supabase.from("testimonials").delete().eq("id", r.id);
    if (error) alert(error.message);
    else load();
  };

  const setStatus = async (id: string, status: TStatus) => {
    const { error } = await supabase.from("testimonials").update({ status }).eq("id", id);
    if (error) alert(error.message);
    else load();
  };

  const toggleFeatured = async (r: Testimonial) => {
    const { error } = await supabase
      .from("testimonials")
      .update({ featured: !r.featured })
      .eq("id", r.id);
    if (error) alert(error.message);
    else load();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-widest text-kp-gold">
            Reviews
          </div>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl md:text-4xl">
            Testimonials
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-stone-700 hover:border-kp-green hover:text-kp-green"
          >
            <RefreshCw size={12} /> Refresh
          </button>
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-kp-green px-5 py-2 text-xs font-bold uppercase tracking-widest text-white shadow-md shadow-green-900/10 hover:opacity-90"
          >
            <Plus size={14} /> Add testimonial
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-kp-green" />
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-16 text-center text-sm text-stone-500">
          No testimonials {filter !== "all" ? `with status "${filter}"` : "yet"}.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((r) => (
            <article
              key={r.id}
              className="flex flex-col rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <div className="font-display text-base font-bold">{r.name}</div>
                  <div className="text-xs text-stone-500">
                    {r.place ?? "—"} · {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                    r.status === "approved"
                      ? "border-emerald-200 bg-kp-green/10 text-kp-green"
                      : r.status === "rejected"
                        ? "border-red-200 bg-kp-red/10 text-kp-red"
                        : "border-amber-200 bg-kp-gold/15 text-amber-700"
                  }`}
                >
                  {r.status}
                </span>
              </div>
              <div className="mb-2 flex gap-0.5 text-kp-gold">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Check key={i} size={0} />
                ))}
                <span className="text-sm" aria-hidden>
                  {"★".repeat(r.rating)}
                  <span className="text-stone-300">{"★".repeat(5 - r.rating)}</span>
                </span>
              </div>
              {r.text && <p className="mb-3 line-clamp-4 text-sm text-stone-700">"{r.text}"</p>}
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-stone-500">
                Media: {r.media_type}
                {r.media_url ? " · attached" : ""}
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
                {r.status !== "approved" && (
                  <button
                    onClick={() => setStatus(r.id, "approved")}
                    className="rounded-full bg-kp-green px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white hover:opacity-90"
                  >
                    Approve
                  </button>
                )}
                {r.status !== "rejected" && (
                  <button
                    onClick={() => setStatus(r.id, "rejected")}
                    className="rounded-full border border-stone-200 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-stone-600 hover:border-kp-red hover:text-kp-red"
                  >
                    Reject
                  </button>
                )}
                <button
                  onClick={() => toggleFeatured(r)}
                  className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                    r.featured
                      ? "border-amber-200 bg-kp-gold/15 text-amber-700"
                      : "border-stone-200 text-stone-500 hover:border-kp-gold hover:text-kp-gold"
                  }`}
                >
                  {r.featured ? "Featured" : "Feature"}
                </button>
                <div className="ml-auto flex items-center gap-1">
                  <button
                    onClick={() => setEditing(r)}
                    className="rounded-full p-2 text-stone-500 hover:bg-stone-100 hover:text-kp-green"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => del(r)}
                    className="rounded-full p-2 text-stone-400 hover:bg-kp-red/10 hover:text-kp-red"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {(adding || editing) && (
        <TestimonialForm
          initial={editing ?? undefined}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
          onSaved={() => {
            setAdding(false);
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function TestimonialForm({
  initial,
  onClose,
  onSaved,
}: {
  initial?: Testimonial;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    place: initial?.place ?? "",
    rating: initial?.rating ?? 5,
    text: initial?.text ?? "",
    media_type: (initial?.media_type ?? "text") as MediaType,
    media_url: initial?.media_url ?? "",
    status: (initial?.status ?? "approved") as TStatus,
    featured: initial?.featured ?? false,
  });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setErr("Name is required");
    if (form.media_type !== "text" && !file && !form.media_url.trim() && !initial?.media_url) {
      return setErr(`Please attach a ${form.media_type} file or paste a URL.`);
    }
    if (file) {
      const MAX = 25 * 1024 * 1024; // 25 MB
      if (file.size > MAX) {
        return setErr(
          `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 25 MB — compress it or paste an external URL.`,
        );
      }
    }
    setSaving(true);
    setErr(null);

    try {
      let mediaUrl: string | null = form.media_url.trim() || null;

      if (file && form.media_type !== "text") {
        const ext = file.name.split(".").pop() || "bin";
        const path = `${form.media_type}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("testimonials").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "application/octet-stream",
        });
        if (upErr) {
          setSaving(false);
          setErr(`Upload failed: ${upErr.message}`);
          return;
        }
        if (initial?.media_url && !/^https?:\/\//i.test(initial.media_url)) {
          await supabase.storage.from("testimonials").remove([initial.media_url]);
        }
        mediaUrl = path;
      }

      const payload = {
        name: form.name.trim(),
        place: form.place.trim() || null,
        rating: form.rating,
        text: form.text.trim() || null,
        media_type: form.media_type,
        media_url: form.media_type === "text" ? null : mediaUrl,
        status: form.status,
        featured: form.featured,
      };

      const { error } = initial
        ? await supabase.from("testimonials").update(payload).eq("id", initial.id)
        : await supabase.from("testimonials").insert(payload);

      setSaving(false);
      if (error) return setErr(error.message);
      onSaved();
    } catch (err: unknown) {
      setSaving(false);
      setErr(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  const acceptByType: Record<MediaType, string> = {
    text: "",
    photo: "image/*",
    video: "video/*",
    audio: "audio/*",
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto overscroll-contain bg-stone-900/50 p-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="my-4 w-full max-w-2xl rounded-3xl border border-stone-200 bg-white p-5 text-stone-900 shadow-2xl sm:my-8 sm:max-h-[85vh] sm:overflow-y-auto sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-1 text-xs font-bold uppercase tracking-widest text-kp-gold">
              {initial ? "Editing" : "New testimonial"}
            </div>
            <h2 className="font-display text-2xl font-extrabold">
              {initial ? initial.name : "Add testimonial"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-kp-red"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={save} className="grid gap-5 sm:grid-cols-2">
          <AdminField
            label="Name"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            required
          />
          <AdminField
            label="Place"
            value={form.place}
            onChange={(v) => setForm({ ...form, place: v })}
          />

          <div>
            <AdminLabel>Rating</AdminLabel>
            <select
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:border-kp-green focus:bg-white focus:outline-none"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} star{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <AdminLabel>Status</AdminLabel>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as TStatus })}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:border-kp-green focus:bg-white focus:outline-none"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <AdminLabel>Review text</AdminLabel>
            <textarea
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:border-kp-green focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <AdminLabel>Media type</AdminLabel>
            <select
              value={form.media_type}
              onChange={(e) => setForm({ ...form, media_type: e.target.value as MediaType })}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:border-kp-green focus:bg-white focus:outline-none"
            >
              <option value="text">Text only</option>
              <option value="photo">Photo</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
            </select>
          </div>

          <div className="sm:col-span-1">
            <AdminLabel>Featured</AdminLabel>
            <label className="flex items-center gap-3 rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="size-4 accent-kp-green"
              />
              Show first on the site
            </label>
          </div>

          {form.media_type !== "text" && (
            <>
              <div className="sm:col-span-2">
                <AdminLabel>Upload {form.media_type}</AdminLabel>
                <input
                  type="file"
                  accept={acceptByType[form.media_type]}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-kp-green file:px-3 file:py-1.5 file:text-xs file:font-bold file:uppercase file:tracking-widest file:text-white hover:file:opacity-90"
                />
                <div className="mt-2 text-xs text-stone-500">
                  {file
                    ? `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
                    : initial?.media_url
                      ? "Current file will be kept unless replaced."
                      : "Max 25 MB. For larger videos, upload to YouTube and paste the URL below."}
                </div>
              </div>
              <div className="sm:col-span-2">
                <AdminField
                  label="Or paste an external URL (YouTube, direct link…)"
                  value={form.media_url}
                  onChange={(v) => setForm({ ...form, media_url: v })}
                  placeholder="https://…"
                />
              </div>
            </>
          )}

          {err && (
            <div className="sm:col-span-2 rounded-xl bg-kp-red/10 px-4 py-3 text-xs font-semibold text-kp-red">
              {err}
            </div>
          )}

          <div className="sm:col-span-2 mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-stone-200 px-5 py-2.5 text-sm font-bold uppercase tracking-widest text-stone-600 hover:border-stone-400"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-kp-green px-6 py-2.5 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-green-900/10 hover:opacity-90 disabled:opacity-60"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {initial ? "Save changes" : "Create testimonial"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------- Booking actions: view payment proof + confirm booking -------- */

const DATE_FIELD: Record<string, string> = {
  consultation_bookings: "preferred_date",
  farm_visit_bookings: "visit_date",
  training_bookings: "cohort_date",
};

function normalizeTime(value: string) {
  const v = value.trim();
  const m = v.match(/^(\d{1,2}):(\d{2})/);
  if (m) return `${String(m[1]).padStart(2, "0")}:${m[2]}`;
  return "";
}

function BookingActions({
  table,
  row,
  onChanged,
}: {
  table: string;
  row: Record<string, unknown>;
  onChanged: () => void;
}) {
  const dateField = DATE_FIELD[table] ?? "preferred_date";
  /* Online meeting links (and meeting reminders) apply only to meeting calls.
     Farm visits and training sessions happen in person. */
  const isOnlineMeeting = table === "consultation_bookings";
  const whenLabel = isOnlineMeeting
    ? "Meeting"
    : table === "farm_visit_bookings"
      ? "Visit"
      : "Training";
  const [open, setOpen] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [link, setLink] = useState(String(row.meeting_link ?? ""));
  const [date, setDate] = useState(String(row[dateField] ?? ""));
  const [time, setTime] = useState(normalizeTime(String(row.preferred_time ?? "")));
  const [saving, setSaving] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState("");
  const scheduleMeet = useServerFn(scheduleGoogleMeet);
  const proofPath = row.payment_screenshot_path ? String(row.payment_screenshot_path) : null;
  const confirmed = Boolean(row.confirmed_at);
  const customerEmail = String(row.email ?? "").trim();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    if (proofPath) {
      (async () => {
        const url = await resolvePaymentProofUrl(proofPath);
        if (!cancelled) setProofUrl(url);
      })();
    }
    if (isOnlineMeeting && !row.meeting_link) {
      (async () => {
        const { data } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "default_meet_link")
          .maybeSingle();
        if (!cancelled && data?.value) {
          setLink(data.value);
        }
      })();
    }
    return () => {
      cancelled = true;
    };
  }, [open, proofPath, isOnlineMeeting, row.meeting_link]);

  const confirmSlot = async () => {
    if (isOnlineMeeting && !time) {
      alert("Please pick the meeting time first.");
      return false;
    }

    if (!date) {
      alert(`Please pick the ${whenLabel.toLowerCase()} date.`);
      return false;
    }
    setSaving(true);
    const payload: Record<string, unknown> = {
      [dateField]: date,
      confirmed_at: new Date().toISOString(),
      status: "confirmed",
    };
    if (isOnlineMeeting) {
      payload.meeting_link = link.trim();
      payload.preferred_time = time || null;
    } else {
      payload.meeting_link = null;
    }
    const { error } = await (
      supabase.from(table as never) as unknown as {
        update: (v: Record<string, unknown>) => {
          eq: (c: string, v: string) => Promise<{ error: { message: string } | null }>;
        };
      }
    )
      .update(payload)
      .eq("id", String(row.id));
    setSaving(false);
    if (error) {
      alert(error.message);
      return false;
    }
    onChanged();
    return true;
  };

  /* One tap: save the confirmed slot, then hand the ready message to WhatsApp. */
  const confirmAndSend = async () => {
    if (isOnlineMeeting ? isPastDateTime(date, time) : isPastDate(date)) {
      alert("That date/time has already passed. Please choose a future slot.");
      return;
    }
    const waWindow = waNumber ? window.open("", "_blank") : null;
    const ok = await confirmSlot();
    if (!ok) {
      waWindow?.close();
      return;
    }
    if (waWindow) waWindow.location.href = `https://wa.me/${waNumber}?text=${waText}`;
    setOpen(false);
  };

  const prettyWhen = date
    ? `${new Date(`${date}T00:00:00`).toLocaleDateString()}${isOnlineMeeting && time ? ` at ${time}` : ""}`
    : "";
  const whenTextLabel = isOnlineMeeting ? "Date & time" : "Date";

  const waText = encodeURIComponent(
    `Hi ${String(row.name ?? "")}, your ${
      isOnlineMeeting ? "online meeting" : whenLabel.toLowerCase()
    } with KP Farm Ventures is confirmed.` +
      (prettyWhen ? `\n${whenTextLabel}: ${prettyWhen}` : "") +
      (isOnlineMeeting && link.trim() ? `\nMeeting link: ${link.trim()}` : "") +
      (isOnlineMeeting
        ? `\n\nPlease join 5 minutes early. — KP Farm Ventures`
        : `\n\nPlease reach 10 minutes early. — KP Farm Ventures`),
  );
  const waNumber = toWaDigits(row.whatsapp as string | null);

  const canSchedule = isOnlineMeeting && Boolean(date) && Boolean(time);

  const doSchedule = async () => {
    if (!canSchedule) return;
    setScheduling(true);
    setScheduleMsg("");
    try {
      const res = await scheduleMeet({
        data: {
          bookingId: String(row.id),
          title: `Online meeting — KP Farm Ventures (${String(row.name ?? "")})`,
          description: [
            `Online meeting with ${String(row.name ?? "")}`,
            row.whatsapp ? `WhatsApp: ${String(row.whatsapp)}` : "",
            row.topic ? `Topic: ${String(row.topic)}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
          date,
          time,
          customerEmail: customerEmail || undefined,
        },
      });
      if (res.meetLink) setLink(res.meetLink);
      setScheduleMsg(
        res.meetLink
          ? `Meeting created by ${res.organizerEmail || "your Google account"}${
              customerEmail ? ` and invite sent to ${customerEmail}` : ""
            }.`
          : "Event created, but Google did not return a Meet link.",
      );
    } catch (e) {
      setScheduleMsg(e instanceof Error ? e.message : "Could not schedule the meeting.");
    } finally {
      setScheduling(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition ${
          confirmed
            ? "border-emerald-200 bg-kp-green/10 text-kp-green"
            : "border-stone-200 text-stone-600 hover:border-kp-green hover:text-kp-green"
        }`}
      >
        {confirmed ? "Confirmed" : "Review"}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto overscroll-contain bg-stone-900/60 p-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] backdrop-blur-sm sm:p-4">
          <div className="my-6 w-full max-w-lg rounded-3xl bg-white p-5 text-left shadow-2xl sm:my-10 sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-kp-gold">
                  Booking review
                </div>
                <h3 className="font-display text-xl font-extrabold">{String(row.name ?? "—")}</h3>
                <div className="text-xs text-stone-500">{String(row.whatsapp ?? "")}</div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-stone-400 hover:bg-stone-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-4">
              <AdminLabel>Payment screenshot</AdminLabel>
              {proofPath ? (
                proofUrl ? (
                  <a href={proofUrl} target="_blank" rel="noopener noreferrer">
                    <img
                      src={proofUrl}
                      alt="Payment screenshot"
                      className="max-h-80 w-full rounded-xl border border-stone-200 object-contain"
                    />
                  </a>
                ) : (
                  <div className="flex justify-center py-8">
                    <Loader2 className="size-5 animate-spin text-kp-green" />
                  </div>
                )
              ) : (
                <div className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-xs text-stone-500">
                  No payment screenshot uploaded yet.
                </div>
              )}
            </div>

            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div>
                <AdminLabel>{whenLabel} date</AdminLabel>
                <input
                  type="date"
                  min={todayIso()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                />
                <p className="mt-1 text-[11px] text-stone-500">
                  Customer asked for: {String(row[dateField] ?? "—")}
                </p>
              </div>
              {isOnlineMeeting && (
                <div>
                  <AdminLabel>Meeting time</AdminLabel>
                  <input
                    type="time"
                    min={date === todayIso() ? nowHhMm() : undefined}
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                  />
                  <p className="mt-1 text-[11px] text-stone-500">
                    Customer asked for: {String(row.preferred_time ?? "—")}
                  </p>
                </div>
              )}
            </div>

            {isOnlineMeeting ? (
              <div className="mb-4">
                <AdminLabel>Schedule the Google Meet</AdminLabel>
                {canSchedule ? (
                  <button
                    type="button"
                    onClick={doSchedule}
                    disabled={scheduling}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-widest text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {scheduling && <Loader2 className="size-4 animate-spin" />}
                    Schedule meeting on {prettyWhen}
                  </button>
                ) : (
                  <div className="rounded-xl border border-dashed border-stone-300 p-3 text-[11px] text-stone-500">
                    Pick the final date and time above to schedule the meeting.
                  </div>
                )}
                {scheduleMsg && (
                  <p className="mt-2 rounded-xl bg-stone-100 p-2 text-[11px] text-stone-700">
                    {scheduleMsg}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-stone-500">
                  Creates the event on your connected Google Calendar, adds a Google Meet link and
                  invites {customerEmail ? customerEmail : "the customer"} automatically.
                  {!customerEmail &&
                    " This customer did not share an e-mail, so send them the link on WhatsApp."}
                </p>

                <div className="mt-3">
                  <AdminLabel>Meeting link</AdminLabel>
                  <input
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    className="w-full min-w-0 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                  />
                </div>
              </div>
            ) : (
              <p className="mb-4 rounded-xl border border-dashed border-stone-300 p-4 text-[11px] text-stone-500">
                Review the payment screenshot, choose the final {whenLabel.toLowerCase()} date, then
                send the confirmation on WhatsApp.
              </p>
            )}

            <button
              onClick={confirmAndSend}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-kp-green px-5 py-3 text-xs font-bold uppercase tracking-widest text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {waNumber ? "Confirm & send on WhatsApp" : `Confirm ${whenLabel.toLowerCase()}`}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* -------- Settings: payment QR code -------- */

function SettingsTab() {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    setQrUrl(await getPaymentQrUrl());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const upload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `payment-qr-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("site-assets")
      .upload(path, file, { contentType: file.type || undefined, upsert: true });
    if (upErr) {
      setUploading(false);
      alert(upErr.message);
      return;
    }
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: PAYMENT_QR_KEY, value: path }, { onConflict: "key" });
    setUploading(false);
    if (error) alert(error.message);
    else load();
  };

  return (
    <div>
      <div className="mb-6">
        <div className="mb-1 text-xs font-bold uppercase tracking-widest text-kp-gold">
          Settings
        </div>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl md:text-4xl">Settings</h1>
        <p className="mt-2 max-w-xl text-sm text-stone-600">
          Payment QR code and the Google Calendar used to create meeting links.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-display text-lg font-extrabold">Payment QR code</h2>
          <p className="mb-4 mt-1 text-xs text-stone-500">
            Shown to customers on the payment step of every booking.
          </p>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-6 animate-spin text-kp-green" />
            </div>
          ) : qrUrl ? (
            <img
              src={qrUrl}
              alt="Payment QR code"
              className="mx-auto max-h-64 rounded-xl border border-stone-200 object-contain"
            />
          ) : (
            <div className="rounded-xl border border-dashed border-stone-300 p-10 text-center text-sm text-stone-500">
              No QR code uploaded yet.
            </div>
          )}

          <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-kp-green py-3 text-xs font-bold uppercase tracking-widest text-white hover:opacity-90">
            {uploading && <Loader2 className="size-4 animate-spin" />}
            {qrUrl ? "Replace QR code" : "Upload QR code"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
              }}
            />
          </label>
        </div>

        <AdminWhatsappCard />
        <PhoneAlertsCard />
        <GoogleMeetSettingsCard />
      </div>
    </div>
  );
}

/* -------- Home videos tab -------- */

function HomeVideosTab() {
  return (
    <div>
      <div className="mb-6">
        <div className="mb-1 text-xs font-bold uppercase tracking-widest text-kp-gold">
          Home page
        </div>
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl md:text-4xl">
          Home Videos
        </h1>
        <p className="mt-2 max-w-xl text-sm text-stone-600">
          Upload or change the preview videos shown on the home page cards.
        </p>
      </div>
      <HomeVideosCard />
    </div>
  );
}

/* -------- Settings: home page preview videos -------- */

function HomeVideosCard() {
  const [urls, setUrls] = useState<Partial<Record<HomeVideoKey, string>>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<HomeVideoKey | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setUrls(await getHomeVideoUrls());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pick = async (key: HomeVideoKey, file: File) => {
    setBusy(key);
    try {
      await uploadHomeVideo(key, file);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  };

  const clear = async (key: HomeVideoKey) => {
    if (!confirm("Remove this video from the home page?")) return;
    setBusy(key);
    try {
      await removeHomeVideo(key);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not remove");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-2">
      <h2 className="font-display text-lg font-extrabold">Home page videos</h2>
      <p className="mb-4 mt-1 text-xs text-stone-500">
        Upload or change the preview videos shown on the home page cards.
      </p>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-6 animate-spin text-kp-green" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {HOME_VIDEOS.map((v) => {
            const url = urls[v.key];
            return (
              <div key={v.key} className="rounded-2xl border border-stone-200 p-3">
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-stone-600">
                  {v.label}
                </div>
                <div className="mb-3 aspect-video w-full overflow-hidden rounded-xl bg-stone-100">
                  {url ? (
                    <video
                      src={url}
                      controls
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[11px] text-stone-500">
                      No video yet
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-kp-green px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-white hover:opacity-90">
                    {busy === v.key && <Loader2 className="size-3.5 animate-spin" />}
                    {url ? "Change video" : "Upload video"}
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (f) pick(v.key, f);
                      }}
                    />
                  </label>
                  {url && (
                    <button
                      onClick={() => clear(v.key)}
                      className="rounded-xl border border-stone-200 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-stone-600 hover:border-kp-red hover:text-kp-red"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* -------- Settings: phone alerts test -------- */

function PhoneAlertsCard() {
  const test = useServerFn(sendAdminTestPush);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const run = async () => {
    setBusy(true);
    setMsg("");
    try {
      const granted =
        (await requestNotificationPermission()) || notificationPermission() === "granted";
      if (!granted) {
        setMsg("Allow notifications for this app first, then try again.");
        return;
      }
      const ok = await subscribeToPush();
      if (!ok) {
        setMsg(
          "This device could not register for background alerts. Open the installed app and try again.",
        );
        return;
      }
      const res = await test({});
      setMsg(
        res.sent > 0
          ? `Test alert sent to ${res.sent} device${res.sent === 1 ? "" : "s"}. You can close the app — new orders and bookings will arrive the same way.`
          : "No devices are registered yet. Turn on alerts from the bell icon on each phone.",
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not send the test alert.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-display text-lg font-extrabold">Phone alerts</h2>
      <p className="mb-4 mt-1 text-xs text-stone-500">
        Register this phone and send a test alert. Once registered, new orders, meetings, farm
        visits and training sign-ups arrive in the notification bar even when this app is fully
        closed.
      </p>
      <button
        onClick={run}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-kp-green py-3 text-xs font-bold uppercase tracking-widest text-white hover:opacity-90 disabled:opacity-60"
      >
        {busy && <Loader2 className="size-4 animate-spin" />} Send test alert to my phone
      </button>
      {msg && <p className="mt-3 rounded-xl bg-stone-100 p-3 text-[11px] text-stone-700">{msg}</p>}
    </div>
  );
}

/* -------- Settings: admin WhatsApp number -------- */

function AdminWhatsappCard() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", ADMIN_WHATSAPP_KEY)
        .maybeSingle();
      setValue(data?.value ?? "");
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    const num = value.replace(/[^0-9]/g, "");
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: ADMIN_WHATSAPP_KEY, value: num }, { onConflict: "key" });
    setSaving(false);
    if (error) alert(error.message);
    else {
      setValue(num);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-display text-lg font-extrabold">Admin WhatsApp number</h2>
      <p className="mb-4 mt-1 text-xs text-stone-500">
        Every product order is sent straight to this number on WhatsApp (and saved in Orders). Use
        the country code with no + or spaces, like 919876543210.
      </p>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="size-6 animate-spin text-kp-green" />
        </div>
      ) : (
        <>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="tel"
            maxLength={16}
            placeholder="919876543210"
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:border-kp-green focus:bg-white focus:outline-none"
          />
          <button
            onClick={save}
            disabled={saving}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-kp-green py-3 text-xs font-bold uppercase tracking-widest text-white hover:opacity-90 disabled:opacity-60"
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            {saved ? "Saved" : "Save number"}
          </button>
        </>
      )}
    </div>
  );
}

/* -------- Settings: Google Meet Link -------- */

function GoogleMeetSettingsCard() {
  const [defaultLink, setDefaultLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "default_meet_link")
      .maybeSingle();
    if (data?.value) {
      setDefaultLink(data.value);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const saveSetting = async () => {
    setSaving(true);
    const { error: err } = await supabase
      .from("site_settings")
      .upsert({ key: "default_meet_link", value: defaultLink.trim() }, { onConflict: "key" });
    setSaving(false);
    if (err) alert(err.message);
    else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-lg font-extrabold">Google Meet Link</h2>
        <span className="rounded-full border border-emerald-200 bg-kp-green/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-kp-green">
          Direct Connect
        </span>
      </div>
      <p className="mb-4 mt-1 text-xs text-stone-500">
        Set a default Google Meet link to automatically attach to online consultation bookings, or paste/edit a custom meeting link when confirming any booking.
      </p>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="size-6 animate-spin text-kp-green" />
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-stone-600">
              Default Google Meet Room Link
            </label>
            <input
              type="url"
              placeholder="e.g. https://meet.google.com/xyz-abc-def"
              value={defaultLink}
              onChange={(e) => setDefaultLink(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm focus:border-kp-green focus:bg-white focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-stone-400">
              This link will auto-fill whenever you open an online consultation booking to confirm it.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={saveSetting}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-kp-green px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-kp-green/90 disabled:opacity-60"
            >
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              {saved ? "Saved!" : "Save Default Link"}
            </button>

            <a
              href="https://meet.google.com/new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-stone-700 hover:border-kp-green hover:text-kp-green"
            >
              <ExternalLink size={13} /> Create Instant Meet Room
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------- Blog / Articles -------- */

type BlogForm = {
  title: string;
  category: string;
  excerpt: string;
  content: string;
  video_url: string;
  published: boolean;
  cover_url: string | null;
};

const EMPTY_BLOG: BlogForm = {
  title: "",
  category: "",
  excerpt: "",
  content: "",
  video_url: "",
  published: true,
  cover_url: null,
};

function BlogTab() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    setPosts(await listBlogPosts({ includeDrafts: true }));
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const del = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    await supabase.from("blog_posts").delete().eq("id", id);
    load();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold">Blog & Articles</h2>
          <p className="text-sm text-stone-500">
            Write posts with photos or videos. Published posts show on the website.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-stone-700 hover:border-kp-green hover:text-kp-green"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-kp-green px-4 py-2 text-xs font-bold uppercase tracking-widest text-white hover:opacity-90"
          >
            <Plus size={14} /> New post
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-kp-green" />
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-14 text-center text-sm text-stone-500">
          No posts yet. Click “New post” to write your first article.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <div key={p.id} className="rounded-2xl border border-stone-200 bg-white p-5">
              <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                <span className="text-kp-gold">{p.category || "Farm Tips"}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 ${
                    p.published
                      ? "border-emerald-200 bg-kp-green/10 text-kp-green"
                      : "border-stone-200 text-stone-500"
                  }`}
                >
                  {p.published ? "Published" : "Draft"}
                </span>
              </div>
              <h3 className="mb-1 font-display text-base font-bold">{p.title}</h3>
              <p className="mb-4 line-clamp-2 text-xs text-stone-500">{p.excerpt}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(p)}
                  className="inline-flex items-center gap-1 rounded-full border border-stone-200 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-stone-600 hover:border-kp-green hover:text-kp-green"
                >
                  <Pencil size={12} /> Edit
                </button>
                <button
                  onClick={() => del(p.id)}
                  className="rounded-full p-2 text-stone-400 hover:bg-kp-red/10 hover:text-kp-red"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <BlogEditor
          post={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function BlogEditor({
  post,
  onClose,
  onSaved,
}: {
  post: BlogPost | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<BlogForm>(
    post
      ? {
          title: post.title,
          category: post.category ?? "",
          excerpt: post.excerpt ?? "",
          content: post.content ?? "",
          video_url: post.video_url ?? "",
          published: post.published,
          cover_url: post.cover_url,
        }
      : EMPTY_BLOG,
  );
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    resolveBlogMediaUrl(form.cover_url).then(setCoverPreview);
  }, [form.cover_url]);

  const onFile = async (file: File | undefined, key: "cover_url" | "video_url") => {
    if (!file) return;
    setBusy(true);
    const { path, error } = await uploadBlogMedia(file);
    setBusy(false);
    if (error || !path) {
      alert(error?.message ?? "Upload failed");
      return;
    }
    setForm((f) => ({ ...f, [key]: path }));
  };

  const save = async () => {
    if (!form.title.trim()) {
      alert("Please add a title.");
      return;
    }
    setBusy(true);
    const payload = {
      title: form.title.trim(),
      slug: slugify(form.title),
      category: form.category.trim() || null,
      excerpt: form.excerpt.trim() || null,
      content: form.content.trim() || null,
      video_url: form.video_url.trim() || null,
      cover_url: form.cover_url,
      published: form.published,
    };
    const { error } = post
      ? await supabase.from("blog_posts").update(payload).eq("id", post.id)
      : await supabase.from("blog_posts").insert(payload);
    setBusy(false);
    if (error) {
      alert(error.message);
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto overscroll-contain bg-stone-900/60 p-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] backdrop-blur-sm sm:p-4">
      <div className="my-6 w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl sm:my-10 sm:p-6 md:p-8">
        <div className="mb-5 flex items-start justify-between">
          <h3 className="font-display text-xl font-extrabold">{post ? "Edit post" : "New post"}</h3>
          <button onClick={onClose} className="rounded-full p-2 text-stone-400 hover:bg-stone-100">
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-4">
          <div>
            <AdminLabel>Title</AdminLabel>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
            />
          </div>
          <div>
            <AdminLabel>Category</AdminLabel>
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Farm Work, Business, Feed…"
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
            />
          </div>
          <div>
            <AdminLabel>Short summary</AdminLabel>
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              rows={2}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
            />
          </div>
          <div>
            <AdminLabel>Full article</AdminLabel>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={8}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <AdminLabel>Cover photo</AdminLabel>
            {coverPreview && (
              <img
                src={coverPreview}
                alt="Cover"
                className="mb-2 max-h-52 w-full rounded-xl object-cover"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onFile(e.target.files?.[0], "cover_url")}
              className="w-full text-xs"
            />
          </div>

          <div>
            <AdminLabel>Video (upload a file or paste a YouTube link)</AdminLabel>
            <input
              value={form.video_url}
              onChange={(e) => setForm({ ...form, video_url: e.target.value })}
              placeholder="https://youtu.be/…"
              className="mb-2 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
            />
            <input
              type="file"
              accept="video/*"
              onChange={(e) => onFile(e.target.files?.[0], "video_url")}
              className="w-full text-xs"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            Show this post on the website
          </label>

          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-kp-green px-5 py-3 text-xs font-bold uppercase tracking-widest text-white hover:opacity-90 disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" />} Save post
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border border-stone-200 px-5 py-3 text-xs font-bold uppercase tracking-widest text-stone-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
