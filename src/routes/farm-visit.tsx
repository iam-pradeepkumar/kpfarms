import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { PageShell, PageHero } from "@/components/site/page-shell";
import { StepIndicator } from "@/components/site/step-indicator";
import { PaymentStep } from "@/components/site/payment-step";
import {
  registerFarmVisit,
  saveFarmVisitSlot,
  resumeBooking,
  rememberBookingWhatsapp,
  getRememberedBookingWhatsapp,
  clearBookingWhatsapp,
} from "@/lib/submissions";
import { isPastDate, todayIso } from "@/lib/dates";

export const Route = createFileRoute("/farm-visit")({
  head: () => ({
    meta: [
      { title: "Book a Farm Visit — KP Farm Ventures" },
      {
        name: "description",
        content:
          "Spend 4 hours on a real, working poultry farm. See the shed setup, safety steps, feeding, and ask questions to the founder.",
      },
      { property: "og:title", content: "Farm Visit — KP Farm Ventures" },
      {
        property: "og:description",
        content: "A 4-hour guided tour of our main poultry farm. Small groups. Book early.",
      },
    ],
  }),
  component: FarmVisit,
});

function FarmVisit() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [form, setForm] = useState({
    name: "",
    whatsapp: "",
    email: "",
    visit_date: "",
    group_size: "1",
    notes: "",
    payment_reference: "",
  });

  useEffect(() => {
    const wa = getRememberedBookingWhatsapp("farm_visit");
    if (!wa) return;
    (async () => {
      const existing = await resumeBooking("farm_visit", wa);
      if (!existing?.id) {
        clearBookingWhatsapp("farm_visit");
        return;
      }
      setBookingId(existing.id);
      setForm((f) => ({
        ...f,
        whatsapp: existing.whatsapp || wa,
        name: existing.name || f.name,
        email: existing.email || f.email,
        visit_date: existing.visit_date || f.visit_date,
        group_size: existing.group_size != null ? String(existing.group_size) : f.group_size,
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
    setErrMsg("");
    setLoading(true);
    rememberBookingWhatsapp("farm_visit", form.whatsapp);

    const existing = await resumeBooking("farm_visit", form.whatsapp);
    if (existing?.id) {
      setBookingId(existing.id);
      setForm((f) => ({
        ...f,
        name: existing.name || f.name,
        email: existing.email || f.email,
        visit_date: existing.visit_date || f.visit_date,
        group_size: existing.group_size != null ? String(existing.group_size) : f.group_size,
        notes: existing.notes || f.notes,
        payment_reference: existing.payment_reference || f.payment_reference,
      }));
      setLoading(false);
      setStep(existing.booking_step === "slot_booked" ? 3 : 2);
      return;
    }

    const { id, error } = await registerFarmVisit({
      name: form.name.trim(),
      whatsapp: form.whatsapp.trim(),
      email: form.email.trim() || undefined,
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
    if (!form.visit_date) {
      setErrMsg("Please choose a visit date.");
      return;
    }
    if (isPastDate(form.visit_date)) {
      setErrMsg("That date has already passed. Please pick today or a later date.");
      return;
    }
    setErrMsg("");
    setLoading(true);
    const { error } = await saveFarmVisitSlot(bookingId, form.whatsapp, {
      visit_date: form.visit_date,
      group_size: Math.max(1, Number(form.group_size) || 1),
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
    clearBookingWhatsapp("farm_visit");
  };

  return (
    <PageShell>
      <PageHero
        eyebrow="Farm Visit Booking"
        title="Spend"
        accent="4 hours on our farm"
        desc="Three quick steps: your details, your visit date, and payment. Stop anytime — we'll follow up on WhatsApp."
      />

      <section className="px-6 pb-24 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
            <StepIndicator step={step} labels={["Your details", "Pick a date", "Payment"]} />

            {step === 1 && (
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={submitStep1}>
                <FVField
                  label="Full Name"
                  required
                  value={form.name}
                  onChange={(v) => setForm({ ...form, name: v })}
                />
                <FVField
                  label="WhatsApp Number"
                  type="tel"
                  required
                  value={form.whatsapp}
                  onChange={(v) => setForm({ ...form, whatsapp: v })}
                />
                <FVField
                  label="Email (if you have one)"
                  type="email"
                  value={form.email}
                  onChange={(v) => setForm({ ...form, email: v })}
                />
                {errMsg && <ErrorBox>{errMsg}</ErrorBox>}
                <PrimaryBtn loading={loading}>Save & Continue</PrimaryBtn>
              </form>
            )}

            {step === 2 && (
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={submitStep2}>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-stone-600">
                    Which date do you want to come?
                  </label>
                  <input
                    type="date"
                    required
                    min={todayIso()}
                    value={form.visit_date}
                    onChange={(e) => setForm({ ...form, visit_date: e.target.value })}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-stone-600">
                    How many people?
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 2"
                    value={form.group_size}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        group_size: e.target.value.replace(/[^0-9]/g, "").slice(0, 3),
                      })
                    }
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-stone-600">
                    What do you want to learn on the visit?
                  </label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm"
                  />
                </div>
                {errMsg && <ErrorBox>{errMsg}</ErrorBox>}
                <div className="sm:col-span-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-xl border border-stone-200 bg-white px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    ← Back to Step 1
                  </button>
                  <PrimaryBtn loading={loading}>Confirm Slot</PrimaryBtn>
                </div>
              </form>
            )}

            {step === 3 && bookingId && (
              <PaymentStep
                kind="farm_visit"
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
                  Thanks {form.name.split(" ")[0]}! Our team will check your payment screenshot and
                  confirm your visit on WhatsApp at <b>{form.whatsapp}</b>.
                </p>
              </div>
            )}
          </div>

          <aside className="rounded-3xl bg-stone-900 p-8 text-white">
            <div className="text-xs font-bold uppercase tracking-widest text-kp-gold">
              Farm Visit
            </div>
            <div className="mt-2 font-display text-3xl font-extrabold">Half-day on the farm</div>
            <div className="mt-2 text-sm text-stone-400">
              We share the price on WhatsApp after step 2
            </div>
            <ul className="mt-6 space-y-2 text-sm text-stone-300">
              <li>✔ See the poultry sheds up close</li>
              <li>✔ See how we feed and give water</li>
              <li>✔ See the farm safety steps</li>
              <li>✔ Ask questions to the founder</li>
            </ul>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}

function FVField({
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
      className="sm:col-span-2 flex items-center justify-center gap-2 rounded-xl bg-kp-red py-4 text-sm font-bold uppercase tracking-widest text-white hover:opacity-90 disabled:opacity-60"
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
