import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { PageShell, PageHero } from "@/components/site/page-shell";
import { StepIndicator } from "@/components/site/step-indicator";
import { PaymentStep } from "@/components/site/payment-step";
import {
  registerConsultation,
  saveConsultationSlot,
  resumeBooking,
  rememberBookingWhatsapp,
  getRememberedBookingWhatsapp,
  clearBookingWhatsapp,
} from "@/lib/submissions";
import { futureSlots, isPastDate, todayIso } from "@/lib/dates";

const TIME_SLOTS = [
  "10:00 AM – 10:30 AM",
  "11:00 AM – 11:30 AM",
  "3:00 PM – 3:30 PM",
  "5:00 PM – 5:30 PM",
];

export const Route = createFileRoute("/consultation")({
  head: () => ({
    meta: [
      { title: "Book an Online Meeting Call — KP Farm Ventures" },
      {
        name: "description",
        content:
          "Book a 30-minute online meeting call with KP Farm Ventures. Fix chick problems, plan your shed, and get a simple plan for your farm.",
      },
      { property: "og:title", content: "Book an Meeting Call — KP Farm Ventures" },
      {
        property: "og:description",
        content: "30-minute expert meeting call for poultry farmers on Google Meet or Zoom.",
      },
    ],
  }),
  component: Consultation,
});

function Consultation() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const [form, setForm] = useState({
    name: "",
    whatsapp: "",
    email: "",
    topic: "",
    preferred_date: "",
    preferred_time: "10:00 AM – 10:30 AM",
    notes: "",
    payment_reference: "",
  });

  /* If the chosen date is today, keep the time box on a slot that is still open. */
  useEffect(() => {
    if (!form.preferred_date) return;
    const open = futureSlots(TIME_SLOTS, form.preferred_date);
    if (open.length && !open.includes(form.preferred_time)) {
      setForm((f) => ({ ...f, preferred_time: open[0] }));
    }
  }, [form.preferred_date, form.preferred_time]);

  useEffect(() => {
    const wa = getRememberedBookingWhatsapp("consultation");
    if (!wa) return;
    (async () => {
      const existing = await resumeBooking("consultation", wa);
      if (!existing?.id) {
        clearBookingWhatsapp("consultation");
        return;
      }
      setBookingId(existing.id);
      setForm((f) => ({
        ...f,
        whatsapp: existing.whatsapp || wa,
        name: existing.name || f.name,
        email: existing.email || f.email,
        topic: existing.topic || f.topic,
        preferred_date: existing.preferred_date || f.preferred_date,
        preferred_time: existing.preferred_time || f.preferred_time,
        notes: existing.notes || f.notes,
        payment_reference: existing.payment_reference || f.payment_reference,
      }));
      setStep(existing.booking_step === "slot_booked" ? 3 : 2);
    })();
  }, []);

  const submitStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.whatsapp.trim()) {
      setErrMsg("Please fill in your name and WhatsApp number.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setErrMsg("Please enter a valid email — we need it to send the meeting invite.");
      return;
    }
    setErrMsg("");
    setLoading(true);
    rememberBookingWhatsapp("consultation", form.whatsapp);

    // Resume if this WhatsApp has an unfinished booking
    const existing = await resumeBooking("consultation", form.whatsapp);
    if (existing?.id) {
      setBookingId(existing.id);
      setForm((f) => ({
        ...f,
        name: existing.name || f.name,
        email: existing.email || f.email,
        topic: existing.topic || f.topic,
        preferred_date: existing.preferred_date || f.preferred_date,
        preferred_time: existing.preferred_time || f.preferred_time,
        notes: existing.notes || f.notes,
        payment_reference: existing.payment_reference || f.payment_reference,
      }));
      setLoading(false);
      setStep(existing.booking_step === "slot_booked" ? 3 : 2);
      return;
    }

    const { id, error } = await registerConsultation({
      name: form.name.trim(),
      whatsapp: form.whatsapp.trim(),
      email: form.email.trim(),
      topic: form.topic.trim() || undefined,
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
    if (!bookingId) return;
    if (!form.preferred_date) {
      setErrMsg("Please choose a date.");
      return;
    }
    if (isPastDate(form.preferred_date)) {
      setErrMsg("That date has already passed. Please pick today or a later date.");
      return;
    }
    const openSlots = futureSlots(TIME_SLOTS, form.preferred_date);
    if (!openSlots.includes(form.preferred_time)) {
      setErrMsg("That time has already passed. Please pick a later time.");
      return;
    }
    setErrMsg("");
    setLoading(true);
    const { error } = await saveConsultationSlot(bookingId, form.whatsapp, {
      preferred_date: form.preferred_date,
      preferred_time: form.preferred_time,
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
    clearBookingWhatsapp("consultation");
  };

  return (
    <PageShell>
      <PageHero
        eyebrow="Book an Meeting Call"
        title="Talk to a poultry farm expert in"
        accent="30 minutes"
        desc="Three quick steps: your details, your slot, and payment. You can stop after any step — we'll follow up on WhatsApp."
      />

      <section className="px-6 pb-24 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
            <StepIndicator step={step} labels={["Your details", "Pick a slot", "Payment"]} />

            {step === 1 && (
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={submitStep1}>
                <Field
                  label="Full Name"
                  required
                  value={form.name}
                  onChange={(v) => setForm({ ...form, name: v })}
                />
                <Field
                  label="WhatsApp Number"
                  type="tel"
                  required
                  value={form.whatsapp}
                  onChange={(v) => setForm({ ...form, whatsapp: v })}
                />
                <Field
                  label="Email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(v) => setForm({ ...form, email: v })}
                />
                <Field
                  label="Your problem or question"
                  value={form.topic}
                  onChange={(v) => setForm({ ...form, topic: v })}
                />
                {errMsg && <ErrorBox>{errMsg}</ErrorBox>}
                <PrimaryBtn loading={loading}>Save & Continue</PrimaryBtn>
              </form>
            )}

            {step === 2 && (
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={submitStep2}>
                <Field
                  label="Choose a Date"
                  type="date"
                  required
                  min={todayIso()}
                  value={form.preferred_date}
                  onChange={(v) => setForm({ ...form, preferred_date: v })}
                />
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-stone-600">
                    Time
                  </label>
                  <select
                    value={form.preferred_time}
                    onChange={(e) => setForm({ ...form, preferred_time: e.target.value })}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                  >
                    {futureSlots(TIME_SLOTS, form.preferred_date).map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  {form.preferred_date === todayIso() &&
                    futureSlots(TIME_SLOTS, form.preferred_date).length === 0 && (
                      <p className="mt-1 text-[11px] text-kp-red">
                        No slots left today — please pick another date.
                      </p>
                    )}
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-stone-600">
                    Notes
                  </label>
                  <textarea
                    rows={4}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                    placeholder="Tell us about your farm and what you want to talk about…"
                  />
                </div>
                {errMsg && <ErrorBox>{errMsg}</ErrorBox>}
                <PrimaryBtn loading={loading}>Confirm Slot</PrimaryBtn>
              </form>
            )}

            {step === 3 && bookingId && (
              <PaymentStep
                kind="consultation"
                bookingId={bookingId}
                whatsapp={form.whatsapp}
                onDone={finishPayment}
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
                  Thanks {form.name.split(" ")[0]}! Our team will check your payment screenshot and
                  confirm your slot. You will get the Google Meet link on WhatsApp at{" "}
                  <b>{form.whatsapp}</b>.
                </p>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-stone-900 p-8 text-white">
              <div className="text-xs font-bold uppercase tracking-widest text-kp-gold">
                Meeting Call
              </div>
              <div className="mt-2 font-display text-3xl font-extrabold">30-minute call</div>
              <div className="mt-2 text-sm text-stone-400">
                We share the price on WhatsApp after step 2
              </div>
              <ul className="mt-6 space-y-2 text-sm text-stone-300">
                <li>✔ Pay by UPI QR, Google Pay or PhonePe</li>
                <li>✔ Payment details on WhatsApp</li>
                <li>✔ Meeting link sent on WhatsApp</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}

function Field({
  label,
  type = "text",
  required,
  value,
  onChange,
  min,
}: {
  label: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  min?: string;
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
        min={min}
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
      className="sm:col-span-2 mt-2 flex items-center justify-center gap-2 rounded-xl bg-kp-green py-4 text-sm font-bold uppercase tracking-widest text-white hover:opacity-90 disabled:opacity-60"
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
