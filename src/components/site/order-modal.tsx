import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, Loader2, ArrowLeft, ArrowRight, ShoppingBag, MessageSquare } from "lucide-react";
import { submitOrder, getAdminWhatsapp, buildOrderWhatsappText } from "@/lib/submissions";

export type OrderItem = {
  id: string;
  title: string;
  price: number;
  tag?: string;
  image_url?: string | null;
};

export function OrderModal({ item, onClose }: { item: OrderItem | null; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    quantity: 1,
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [adminWa, setAdminWa] = useState<string | null>(null);
  const [waUrl, setWaUrl] = useState<string | null>(null);

  useEffect(() => {
    void getAdminWhatsapp().then(setAdminWa);
  }, []);

  useEffect(() => {
    if (item) {
      setStep(1);
      setSubmitted(false);
      setErrors({});
      setWaUrl(null);
      setForm({ name: "", phone: "", email: "", address: "", quantity: 1, notes: "" });
    }
  }, [item]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (item) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [item, onClose]);

  if (!item) return null;
  if (typeof document === "undefined") return null;

  const total = item.price * form.quantity;

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Please enter your full name";
    else if (form.name.trim().length > 100) e.name = "Name is too long";
    if (!/^[+\d][\d\s-]{7,15}$/.test(form.phone.trim())) e.phone = "Please enter a valid phone/WhatsApp number";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = "Please enter a valid email address";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!form.address.trim() || form.address.trim().length < 5)
      e.address = "Please enter your full delivery address";
    if (form.quantity < 1 || form.quantity > 50) e.quantity = "1 to 50 only";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep2()) setStep(3);
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const { error } = await submitOrder({
      product_id: item.id,
      quantity: form.quantity,
      customer_name: form.name.trim(),
      whatsapp: form.phone.trim(),
      email: form.email.trim() || undefined,
      address: form.address.trim(),
      notes: form.notes.trim() || undefined,
    });
    setSubmitting(false);

    if (error) {
      setSubmitError("Sorry, we couldn't save your order. Please try again.");
      return;
    }

    const number = adminWa ?? (await getAdminWhatsapp());
    if (number) {
      const text = buildOrderWhatsappText({
        product: item.title,
        quantity: form.quantity,
        total: total || null,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        address: form.address.trim(),
        notes: form.notes.trim() || undefined,
      });
      const url = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
      setWaUrl(url);
      window.open(url, "_blank", "noopener,noreferrer");
    }
    setSubmitted(true);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-modal-title"
      className="fixed inset-0 z-[100] flex items-end justify-center bg-stone-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200"
        >
          <X size={18} />
        </button>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-kp-green/10">
              <CheckCircle2 className="text-kp-green" size={36} />
            </div>
            <h3 className="mb-2 font-display text-2xl font-extrabold">Order Placed!</h3>
            <p className="mb-6 text-sm text-stone-600">
              Thanks {form.name.split(" ")[0]}! Your order for <b>{item.title}</b> has been received.
              {waUrl
                ? " Please press send in WhatsApp so we get your order details right away."
                : " We will contact you on WhatsApp shortly."}
            </p>
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3.5 text-sm font-bold text-white shadow-md hover:opacity-90"
              >
                <MessageSquare size={18} /> Send Details on WhatsApp
              </a>
            )}
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-kp-green py-3 text-sm font-bold text-white hover:opacity-90"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="p-6 sm:p-8">
            {/* Top Product Header */}
            <div className="mb-6 pr-8">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-kp-green">
                Ordering Item
              </div>
              <h3 id="order-modal-title" className="font-display text-xl font-extrabold text-stone-900 sm:text-2xl">
                {item.title}
              </h3>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <span className="font-bold text-kp-green">₹{total}</span>
                {item.tag && <span className="text-stone-400">· {item.tag}</span>}
              </div>
            </div>

            {/* Step Wizard Indicator */}
            <div className="mb-8 flex items-center justify-between gap-2 border-b border-stone-100 pb-4">
              {[
                { s: 1, label: "Your Info" },
                { s: 2, label: "Address & Qty" },
                { s: 3, label: "Confirm Order" },
              ].map(({ s, label }) => {
                const active = step === s;
                const done = step > s;
                return (
                  <div key={s} className="flex flex-1 items-center gap-2">
                    <div
                      className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                        done
                          ? "bg-kp-green text-white"
                          : active
                            ? "bg-kp-green text-white ring-4 ring-kp-green/20"
                            : "bg-stone-100 text-stone-400"
                      }`}
                    >
                      {done ? "✓" : s}
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        active ? "text-stone-900" : done ? "text-kp-green" : "text-stone-400"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* STEP 1: Contact Details */}
            {step === 1 && (
              <form onSubmit={handleNextStep1} className="space-y-4">
                <Field label="Full Name *" error={errors.name}>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    maxLength={100}
                    className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm focus:border-kp-green focus:outline-none"
                    placeholder="Enter your full name"
                    autoFocus
                  />
                </Field>

                <Field label="WhatsApp Phone Number *" error={errors.phone}>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    maxLength={16}
                    inputMode="tel"
                    className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm focus:border-kp-green focus:outline-none"
                    placeholder="+91 98765 43210"
                  />
                </Field>

                <Field label="Email Address (Optional)" error={errors.email}>
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    maxLength={255}
                    type="email"
                    className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm focus:border-kp-green focus:outline-none"
                    placeholder="you@example.com"
                  />
                </Field>

                <button
                  type="submit"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-kp-green py-3.5 text-sm font-bold uppercase tracking-widest text-white shadow-md hover:opacity-90"
                >
                  <span>Next: Delivery Details</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* STEP 2: Address & Quantity */}
            {step === 2 && (
              <form onSubmit={handleNextStep2} className="space-y-4">
                <Field label="Delivery Address *" error={errors.address}>
                  <textarea
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    maxLength={500}
                    rows={3}
                    className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm focus:border-kp-green focus:outline-none"
                    placeholder="House / street, city, state, pin code"
                    autoFocus
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Quantity" error={errors.quantity}>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={form.quantity}
                      onChange={(e) =>
                        setForm({ ...form, quantity: Math.max(1, Number(e.target.value) || 1) })
                      }
                      className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm focus:border-kp-green focus:outline-none"
                    />
                  </Field>
                  <Field label="Notes (Optional)">
                    <input
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      maxLength={300}
                      className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm focus:border-kp-green focus:outline-none"
                      placeholder="Any notes for us?"
                    />
                  </Field>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1 rounded-xl border border-stone-200 px-4 py-3 text-xs font-bold uppercase tracking-widest text-stone-600 hover:bg-stone-50"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
                    type="submit"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-kp-green py-3.5 text-sm font-bold uppercase tracking-widest text-white shadow-md hover:opacity-90"
                  >
                    <span>Next: Confirm Order</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Order Summary & WhatsApp Direct Order (No payment proof) */}
            {step === 3 && (
              <form onSubmit={submit} className="space-y-4">
                {/* Summary Box */}
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="mb-2 text-xs font-bold uppercase tracking-widest text-kp-green">
                    Order Summary
                  </div>
                  <div className="flex items-center justify-between text-sm font-bold text-stone-900">
                    <span>{item.title}</span>
                    <span className="text-kp-green">₹{total}</span>
                  </div>
                  <div className="mt-1 text-xs text-stone-500">
                    Quantity: {form.quantity} · Price: ₹{item.price} each
                  </div>
                </div>

                {/* Customer Details Box */}
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-1.5 text-xs text-stone-600">
                  <div className="font-bold text-stone-900 uppercase text-[10px] tracking-widest mb-1 text-stone-500">
                    Customer & Delivery Info
                  </div>
                  <div><b>Name:</b> {form.name}</div>
                  <div><b>WhatsApp:</b> {form.phone}</div>
                  {form.email && <div><b>Email:</b> {form.email}</div>}
                  <div><b>Address:</b> {form.address}</div>
                </div>

                {/* WhatsApp Notice Box */}
                <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
                  <MessageSquare size={18} className="shrink-0 text-[#25D366] mt-0.5" />
                  <div>
                    <b>Direct WhatsApp Order:</b> Clicking submit will save your order and open WhatsApp to send your order details directly to KP Farm Ventures.
                  </div>
                </div>

                {submitError && (
                  <div className="rounded-xl bg-kp-red/10 px-4 py-3 text-center text-xs font-semibold text-kp-red">
                    {submitError}
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex items-center gap-1 rounded-xl border border-stone-200 px-4 py-3 text-xs font-bold uppercase tracking-widest text-stone-600 hover:bg-stone-50"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3.5 text-sm font-bold uppercase tracking-widest text-white shadow-md hover:opacity-90 disabled:opacity-60"
                  >
                    {submitting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <MessageSquare size={16} />
                    )}
                    {submitting ? "Sending Order…" : "Send Order to WhatsApp"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-bold uppercase tracking-widest text-stone-600">
        {label}
      </div>
      {children}
      {error && <div className="mt-1 text-xs font-medium text-kp-red">{error}</div>}
    </label>
  );
}
