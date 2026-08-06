import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, Loader2, MapPin, Users } from "lucide-react";
import { PageShell, PageHero } from "@/components/site/page-shell";
import { StepIndicator } from "@/components/site/step-indicator";
import { supabase } from "@/integrations/supabase/client";
import { PaymentStep } from "@/components/site/payment-step";
import { todayIso } from "@/lib/dates";
import {
  registerTraining,
  saveTrainingSlot,
  resumeBooking,
  rememberBookingWhatsapp,
  getRememberedBookingWhatsapp,
  clearBookingWhatsapp,
} from "@/lib/submissions";

export const Route = createFileRoute("/training")({
  head: () => ({
    meta: [
      { title: "Poultry Farm Training — KP Farm Ventures" },
      {
        name: "description",
        content:
          "Hands-on poultry farm training on our farm. Small batches. Learn chick care, feed, farm safety and how to sell your birds.",
      },
      { property: "og:title", content: "Training Programs — KP Farm Ventures" },
      {
        property: "og:description",
        content: "Hands-on poultry farm training for new and existing farmers.",
      },
    ],
  }),
  component: Training,
});

type Program = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  cohort_date: string | null;
  session_time: string | null;
  venue: string | null;
  seats: number | null;
  image_url: string | null;
};

function formatDate(d: string | null) {
  if (!d) return "TBD";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function Training() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [form, setForm] = useState({
    name: "",
    whatsapp: "",
    email: "",
    notes: "",
    payment_reference: "",
  });

  const EVENT = programs.find((p) => p.id === selectedId) ?? programs[0];

  const [bookingCounts, setBookingCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const { data: progData } = await supabase
        .from("training_programs")
        .select("id,name,description,price,cohort_date,session_time,venue,seats,image_url")
        .eq("active", true)
        .order("cohort_date", { ascending: true });
      
      const { data: bookData } = await supabase
        .from("training_bookings")
        .select("program");

      const counts: Record<string, number> = {};
      ((bookData as { program: string | null }[]) ?? []).forEach((b) => {
        if (b.program) counts[b.program] = (counts[b.program] || 0) + 1;
      });
      setBookingCounts(counts);

      // Batches whose date has already passed are not shown any more.
      const list = ((progData as Program[]) ?? []).filter(
        (p) => !p.cohort_date || p.cohort_date >= todayIso(),
      );
      setPrograms(list);
      if (list.length && !selectedId) setSelectedId(list[0].id);
      setProgramsLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const wa = getRememberedBookingWhatsapp("training");
    if (!wa) return;
    (async () => {
      const existing = await resumeBooking("training", wa);
      if (!existing?.id) {
        clearBookingWhatsapp("training");
        return;
      }
      setBookingId(existing.id);
      setForm((f) => ({
        ...f,
        whatsapp: existing.whatsapp || wa,
        name: existing.name || f.name,
        email: existing.email || f.email,
        notes: existing.notes || f.notes,
        payment_reference: existing.payment_reference || f.payment_reference,
      }));
      setStep(existing.booking_step === "slot_booked" ? 3 : 2);
    })();
  }, []);

  const submitStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EVENT) return;
    if (!form.name.trim() || !form.whatsapp.trim()) {
      setErrMsg("Please fill in your name and WhatsApp number.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setErrMsg("Please enter a valid email so we can send your training details.");
      return;
    }
    setErrMsg("");
    setLoading(true);
    rememberBookingWhatsapp("training", form.whatsapp);

    const existing = await resumeBooking("training", form.whatsapp);
    if (existing?.id) {
      setBookingId(existing.id);
      setForm((f) => ({
        ...f,
        name: existing.name || f.name,
        email: existing.email || f.email,
        notes: existing.notes || f.notes,
        payment_reference: existing.payment_reference || f.payment_reference,
      }));
      setLoading(false);
      setStep(existing.booking_step === "slot_booked" ? 3 : 2);
      return;
    }

    const { id, error } = await registerTraining({
      name: form.name.trim(),
      whatsapp: form.whatsapp.trim(),
      email: form.email.trim(),
      program: EVENT.name,
    });
    setLoading(false);
    if (error || !id) {
      setErrMsg("Sorry, we couldn't save your details. Please try again.");
      return;
    }
    setBookingId(id);
    setStep(2);
  };

  const submitStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId || !EVENT) return;
    setErrMsg("");
    setLoading(true);
    const { error } = await saveTrainingSlot(bookingId, form.whatsapp, {
      cohort_date: EVENT.cohort_date ?? undefined,
      notes: form.notes.trim() || undefined,
    });
    setLoading(false);
    if (error) {
      setErrMsg("Sorry, we couldn't save your slot. Please try again.");
      return;
    }
    setStep(3);
  };

  const finishPayment = () => {
    setStep(4);
    clearBookingWhatsapp("training");
  };

  return (
    <PageShell>
      <PageHero
        eyebrow="Training Programs"
        title="Learn poultry farming"
        accent="on a real farm"
        desc="Small batches. Sign up in three quick steps: details, slot, and payment."
      />

      <section className="px-6 pb-24 md:px-10">
        {programsLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-8 animate-spin text-kp-green" />
          </div>
        ) : programs.length === 0 ? (
          <div className="mx-auto max-w-2xl rounded-3xl border border-dashed border-stone-300 bg-white p-12 text-center text-sm text-stone-500">
            No training programs available right now. Please check back soon.
          </div>
        ) : step === 0 ? (
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-6 font-display text-2xl font-extrabold text-stone-900 sm:text-3xl">
              Choose your training program
            </h2>
            <div className="grid gap-6">
              {programs.map((p) => {
                const active = selectedId === p.id;
                const totalSeats = p.seats ?? 20;
                const booked = bookingCounts[p.name] ?? 0;
                const available = Math.max(0, totalSeats - booked);
                const isFull = available <= 0;

                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isFull}
                    onClick={() => setSelectedId(p.id)}
                    className={`text-left rounded-3xl border p-6 shadow-sm transition sm:p-8 ${
                      isFull
                        ? "border-stone-200 bg-stone-100/70 opacity-60 cursor-not-allowed"
                        : active
                          ? "border-kp-green ring-2 ring-kp-green/30 bg-kp-green/5"
                          : "border-stone-200 bg-white hover:border-kp-green/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-widest text-kp-gold">
                            Master Class
                          </span>
                          {isFull ? (
                            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-red-600">
                              Seats Full
                            </span>
                          ) : available <= 5 ? (
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-700 animate-pulse">
                              🔥 Only {available} seats left!
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 font-display text-xl font-extrabold sm:text-2xl">
                          {p.name}
                        </div>
                        {p.description && (
                          <p className="mt-2 text-sm text-stone-600">{p.description}</p>
                        )}
                      </div>
                      {p.price != null && (
                        <div className="shrink-0 rounded-xl bg-kp-green/10 px-4 py-2 text-lg font-extrabold text-kp-green">
                          ₹{p.price}
                        </div>
                      )}
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-stone-700 sm:grid-cols-3">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-kp-green" />{" "}
                        {formatDate(p.cohort_date)}
                      </div>
                      {p.venue && (
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-kp-green" /> {p.venue}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users size={16} className={isFull ? "text-red-500" : "text-kp-green"} />{" "}
                        <span className="font-semibold">
                          {isFull ? "Full" : `${available} Available`}
                        </span>{" "}
                        <span className="text-stone-400">({booked}/{totalSeats} booked)</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex justify-end">
              <button
                type="button"
                disabled={!selectedId}
                onClick={() => setStep(1)}
                className="rounded-xl bg-kp-green px-8 py-4 text-sm font-bold uppercase tracking-widest text-white hover:opacity-90 disabled:opacity-50"
              >
                Join Program
              </button>
            </div>
          </div>
        ) : EVENT ? (
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
              <StepIndicator
                step={step as 1 | 2 | 3 | 4}
                labels={["Your details", "Confirm slot", "Payment"]}
              />

              {step === 1 && (
                <form className="grid gap-4 sm:grid-cols-2" onSubmit={submitStep1}>
                  <TField
                    label="Full Name"
                    required
                    value={form.name}
                    onChange={(v) => setForm({ ...form, name: v })}
                  />
                  <TField
                    label="WhatsApp Number"
                    type="tel"
                    required
                    value={form.whatsapp}
                    onChange={(v) => setForm({ ...form, whatsapp: v })}
                  />
                  <TField
                    label="Email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(v) => setForm({ ...form, email: v })}
                  />
                  {errMsg && <ErrorBox>{errMsg}</ErrorBox>}
                  <div className="sm:col-span-2 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(0 as never)}
                      className="w-full rounded-xl border border-stone-200 bg-white py-3.5 text-xs font-bold uppercase tracking-widest text-stone-700 hover:bg-stone-50 transition-colors"
                    >
                      ← Back
                    </button>
                    <PrimaryBtn loading={loading}>Save &amp; Continue</PrimaryBtn>
                  </div>
                </form>
              )}

              {step === 2 && (
                <form className="grid gap-4" onSubmit={submitStep2}>
                  <div className="rounded-2xl bg-kp-gold/10 border border-kp-gold/30 p-5 text-sm text-stone-700">
                    <div className="mb-1 text-xs font-bold uppercase tracking-widest text-kp-gold">
                      Next Batch
                    </div>
                    <div className="font-display text-xl font-extrabold">{EVENT.name}</div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-kp-green" />{" "}
                        {formatDate(EVENT.cohort_date)}
                      </div>
                      {EVENT.venue && (
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-kp-green" /> {EVENT.venue}
                        </div>
                      )}
                      {EVENT.seats != null && (
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-kp-green" /> {EVENT.seats} seats
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-stone-600">
                      Anything to add? (optional)
                    </label>
                    <textarea
                      rows={4}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                      placeholder="Tell us about your farm experience or what you want to learn…"
                    />
                  </div>
                  {errMsg && <ErrorBox>{errMsg}</ErrorBox>}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-full rounded-xl border border-stone-200 bg-white py-3.5 text-xs font-bold uppercase tracking-widest text-stone-700 hover:bg-stone-50 transition-colors"
                    >
                      ← Back
                    </button>
                    <PrimaryBtn loading={loading}>Confirm Slot</PrimaryBtn>
                  </div>
                </form>
              )}

              {step === 3 && bookingId && (
                <PaymentStep
                  kind="training"
                  bookingId={bookingId}
                  whatsapp={form.whatsapp}
                  onDone={finishPayment}
                  onBack={() => setStep(2)}
                />
              )}

              {step === 4 && (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-kp-green/10">
                    <CheckCircle2 className="text-kp-green" size={36} />
                  </div>
                  <h2 className="mb-2 font-display text-2xl font-extrabold">
                    Payment sent for checking
                  </h2>
                  <p className="text-sm text-stone-600">
                    Thanks {form.name.split(" ")[0]}! Our team will check your payment screenshot
                    and confirm your seat for <b>{EVENT.name}</b> on WhatsApp at{" "}
                    <b>{form.whatsapp}</b>.
                  </p>
                </div>
              )}
            </div>

            <aside className="rounded-3xl bg-stone-900 p-8 text-white">
              <div className="text-xs font-bold uppercase tracking-widest text-kp-gold">
                Next Batch
              </div>
              <div className="mt-2 font-display text-3xl font-extrabold">{EVENT.name}</div>
              {EVENT.price != null && (
                <div className="mt-2 text-sm text-stone-400">
                  Price: <span className="font-bold text-white">₹{EVENT.price}</span>
                </div>
              )}
              <ul className="mt-6 space-y-3 text-sm text-stone-300">
                <li className="flex items-center gap-2">
                  <CalendarDays size={16} className="text-kp-gold" />{" "}
                  {formatDate(EVENT.cohort_date)}
                </li>
                {EVENT.session_time && (
                  <li className="flex items-center gap-2">
                    <MapPin size={16} className="text-kp-gold" /> {EVENT.session_time}
                  </li>
                )}
                {EVENT.venue && (
                  <li className="flex items-center gap-2">
                    <MapPin size={16} className="text-kp-gold" /> {EVENT.venue}
                  </li>
                )}
                {EVENT.seats != null && (
                  <li className="flex items-center gap-2">
                    <Users size={16} className="text-kp-gold" /> Only {EVENT.seats} seats
                  </li>
                )}
              </ul>
            </aside>
          </div>
        ) : null}
      </section>
    </PageShell>
  );
}

function TField({
  label,
  type = "text",
  required,
  value,
  onChange,
}: {
  label: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-stone-600">
        {label}
        {required && <span className="text-kp-red"> *</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-kp-green focus:bg-white"
      />
    </div>
  );
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="sm:col-span-2 rounded-xl bg-kp-red/10 px-4 py-3 text-center text-xs font-semibold text-kp-red">
      {children}
    </div>
  );
}

function PrimaryBtn({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      disabled={loading}
      className="sm:col-span-2 flex items-center justify-center gap-2 rounded-xl bg-kp-green py-4 text-sm font-bold uppercase tracking-widest text-white hover:opacity-90 disabled:opacity-60"
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
