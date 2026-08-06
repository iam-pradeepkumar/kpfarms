import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Star,
  Loader2,
  Send,
  CheckCircle2,
  Image as ImageIcon,
  Video,
  Mic,
  Plus,
  X,
} from "lucide-react";
import { PageShell, PageHero } from "@/components/site/page-shell";
import { supabase } from "@/integrations/supabase/client";
import {
  submitTestimonial,
  resolveTestimonialMediaUrl,
  type TestimonialRow,
} from "@/lib/submissions";

export const Route = createFileRoute("/testimonials")({
  head: () => ({
    meta: [
      { title: "Reviews — What KP Farmers Say" },
      {
        name: "description",
        content:
          "Real stories from farmers who joined our training, got advice, and grew their poultry farm with KP Farm Ventures — you can share yours too.",
      },
      { property: "og:title", content: "Reviews — KP Farm Ventures" },
      {
        property: "og:description",
        content: "Reviews and stories from farmers who worked with KP Farm Ventures.",
      },
    ],
  }),
  component: TestimonialsPage,
});

type ResolvedTestimonial = TestimonialRow & { resolvedMedia: string | null };

function TestimonialsPage() {
  const [rows, setRows] = useState<ResolvedTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("testimonials")
      .select("*")
      .eq("status", "approved")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });
    const list = (data as TestimonialRow[] | null) ?? [];
    const resolved = await Promise.all(
      list.map(async (r) => ({
        ...r,
        resolvedMedia: await resolveTestimonialMediaUrl(r.media_url),
      })),
    );
    setRows(resolved);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // Duplicate the list so the marquee loops seamlessly.
  const marqueeRows = rows.length > 0 ? [...rows, ...rows] : [];

  return (
    <PageShell>
      <PageHero
        eyebrow="Reviews"
        title="Farmers who chose"
        accent="KP Farm Ventures"
        desc="More than 500 farmers have trained and got advice from us. Read their stories — and share yours below."
      />

      <section className="px-6 pb-8 md:px-10">
        <div className="mx-auto max-w-6xl">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-6 animate-spin text-kp-green" />
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-16 text-center text-sm text-stone-500">
              Be the first to share your story — click the button below.
            </div>
          ) : (
            <div className="marquee-mask group relative overflow-hidden">
              <div className="flex w-max gap-6 animate-[marquee-x_60s_linear_infinite] group-hover:[animation-play-state:paused]">
                {marqueeRows.map((r, i) => (
                  <div key={`${r.id}-${i}`} className="w-[320px] shrink-0 md:w-[360px]">
                    <TestimonialCard r={r} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="px-6 pb-16 md:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center">
          <p className="text-sm text-stone-600">
            Did you train with us or buy a product? We'd love to hear about it.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="https://maps.app.goo.gl/p8MTR1emjPhzFgTw5?g_st=iwb"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-kp-gold/50 bg-kp-gold/10 px-6 py-3 text-xs font-bold uppercase tracking-widest text-stone-800 transition hover:bg-kp-gold/20"
            >
              ⭐ Read & Rate us on Google Reviews ↗
            </a>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-full bg-kp-green px-6 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-green-900/10 transition hover:opacity-90"
            >
              <Plus size={14} /> Add your review
            </button>
          </div>
        </div>
      </section>

      {showForm && (
        <ReviewModal
          onClose={() => setShowForm(false)}
          onSubmitted={() => {
            load();
            setShowForm(false);
          }}
        />
      )}
    </PageShell>
  );
}

function ReviewModal({ onClose, onSubmitted }: { onClose: () => void; onSubmitted: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-end justify-center bg-stone-900/60 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[92vh] sm:max-w-lg sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-stone-100 bg-white px-5 pb-3 pt-2 sm:px-8 sm:pb-4 sm:pt-6">
          <div className="min-w-0 flex-1 pt-1 sm:pt-0">
            <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-stone-200 sm:hidden" />
            <div className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-kp-green">
              Share your story
            </div>
            <h3 className="font-display text-lg font-extrabold sm:text-2xl">Add your review</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600 transition hover:bg-stone-200 active:scale-95"
          >
            <X size={18} />
          </button>
        </div>
        <div
          className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-8 sm:pb-8"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <SubmitForm onSubmitted={onSubmitted} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

function TestimonialCard({ r }: { r: ResolvedTestimonial }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white transition hover:shadow-xl">
      {r.media_type !== "text" && r.resolvedMedia && (
        <div className="bg-stone-100">
          {r.media_type === "photo" && (
            <img
              src={r.resolvedMedia}
              alt={`${r.name} testimonial`}
              className="aspect-video w-full object-cover"
            />
          )}
          {r.media_type === "video" && (
            <video
              src={r.resolvedMedia}
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full bg-black object-cover"
            />
          )}
          {r.media_type === "audio" && (
            <div className="flex items-center gap-3 bg-gradient-to-br from-kp-green/10 to-kp-gold/10 p-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-kp-green shadow-sm">
                <Mic size={18} />
              </div>
              <audio src={r.resolvedMedia} controls className="w-full" />
            </div>
          )}
        </div>
      )}
      <div className="flex flex-1 flex-col p-6">
        {r.featured && (
          <span className="mb-3 w-fit rounded-full bg-kp-gold/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-kp-gold">
            Top Pick
          </span>
        )}
        <div className="mb-3 flex gap-1 text-kp-gold">
          {Array.from({ length: r.rating }).map((_, i) => (
            <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
          ))}
        </div>
        {r.text && <p className="mb-5 flex-1 text-sm leading-relaxed text-stone-700">"{r.text}"</p>}
        <div className="flex items-center gap-3 border-t border-stone-100 pt-4">
          <div className="flex size-10 items-center justify-center rounded-full bg-kp-green/10 font-display font-extrabold text-kp-green">
            {r.name[0]?.toUpperCase()}
          </div>
          <div>
            <div className="font-display text-sm font-bold">{r.name}</div>
            {r.place && <div className="text-xs text-stone-500">{r.place}</div>}
          </div>
        </div>
      </div>
    </article>
  );
}

/* ---------- submit form ---------- */

function SubmitForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [form, setForm] = useState({ name: "", place: "", rating: 5, text: "" });
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!form.name.trim()) {
      setErr("Please tell us your name.");
      return;
    }
    setState("loading");
    const { error } = await submitTestimonial({
      name: form.name.trim(),
      place: form.place.trim() || undefined,
      rating: form.rating,
      text: form.text.trim() || undefined,
    });
    if (error) {
      setState("idle");
      setErr(error.message);
      return;
    }
    setState("done");
    setForm({ name: "", place: "", rating: 5, text: "" });
    setTimeout(() => onSubmitted(), 1200);
  };

  if (state === "done") {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-kp-green/10 text-kp-green">
          <CheckCircle2 size={28} />
        </div>
        <h3 className="mb-2 font-display text-xl font-extrabold">Thank you!</h3>
        <p className="text-sm text-stone-600">
          We got your review. We will check it and put it up soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="pb-1">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Your name *"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
        />
        <Field
          label="Place (not needed)"
          value={form.place}
          onChange={(v) => setForm({ ...form, place: v })}
          placeholder="e.g. Coimbatore, TN"
        />
      </div>

      <div className="mt-3">
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-stone-600">
          Rating
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setForm({ ...form, rating: n })}
              className="p-1 text-kp-gold transition hover:scale-110"
              aria-label={`${n} stars`}
            >
              <Star size={22} fill={n <= form.rating ? "currentColor" : "none"} strokeWidth={2} />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-stone-600">
          Write your review <span className="text-stone-400">(not needed)</span>
        </label>
        <textarea
          value={form.text}
          onChange={(e) => setForm({ ...form, text: e.target.value })}
          rows={3}
          maxLength={1000}
          placeholder="Write about your experience here..."
          className="block w-full resize-y rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base leading-relaxed text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-kp-green focus:ring-4 focus:ring-kp-green/10 sm:text-sm"
        />
      </div>

      {err && (
        <div className="mt-3 rounded-xl bg-kp-red/10 px-4 py-3 text-xs font-semibold text-kp-red">
          {err}
        </div>
      )}

      <button
        disabled={state === "loading"}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-kp-green py-3.5 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-green-900/10 transition hover:opacity-90 disabled:opacity-60"
      >
        {state === "loading" ? <Loader2 className="size-4 animate-spin" /> : <Send size={14} />}
        Send Review
      </button>

      <p className="mt-3 text-center text-[11px] text-stone-400">
        Photos, videos and voice reviews can be added by the admin later.
      </p>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-stone-600">
        {label}
      </label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-kp-green focus:bg-white sm:text-sm"
      />
    </div>
  );
}
