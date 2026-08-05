import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, Loader2 } from "lucide-react";
import { submitOrder, getAdminWhatsapp, buildOrderWhatsappText } from "@/lib/submissions";

export type OrderItem = {
  id: string;
  title: string;
  price: number;
  tag?: string;
};

export function OrderModal({ item, onClose }: { item: OrderItem | null; onClose: () => void }) {
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

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Please enter your name";
    else if (form.name.trim().length > 100) e.name = "Name is too long";
    if (!/^[+\d][\d\s-]{7,15}$/.test(form.phone.trim())) e.phone = "Please enter a valid phone";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = "Please enter a valid email";
    if (!form.address.trim() || form.address.trim().length < 10)
      e.address = "Please enter a full delivery address";
    if (form.quantity < 1 || form.quantity > 50) e.quantity = "1 to 50 only";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate() || submitting) return;
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
      setSubmitError("Sorry, we couldn't send it right now. Please try again.");
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
            <h3 className="mb-2 font-display text-2xl font-extrabold">We got your order</h3>
            <p className="mb-6 text-sm text-stone-600">
              Thanks {form.name.split(" ")[0]}! Your order for <b>{item.title}</b> is saved.
              {waUrl
                ? " Please press send in WhatsApp so we get your order right away."
                : " We will message you on WhatsApp with the payment details."}
            </p>
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-3 flex w-full items-center justify-center rounded-xl bg-[#25D366] px-6 py-3 text-sm font-bold text-white hover:opacity-90"
              >
                Send order on WhatsApp
              </a>
            )}
            <button
              onClick={onClose}
              className="rounded-xl bg-kp-green px-6 py-3 text-sm font-bold text-white hover:opacity-90"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 sm:p-8">
            <div className="mb-5 pr-8">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-kp-green">
                Your order
              </div>
              <h3 id="order-modal-title" className="font-display text-2xl font-extrabold">
                {item.title}
              </h3>
              {item.tag && <div className="mt-1 text-sm text-stone-500">{item.tag}</div>}
            </div>

            <div className="grid gap-4">
              <Field label="Full name" error={errors.name}>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  maxLength={100}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm focus:border-kp-green focus:outline-none"
                  placeholder="Your name"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="WhatsApp number" error={errors.phone}>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    maxLength={16}
                    inputMode="tel"
                    className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm focus:border-kp-green focus:outline-none"
                    placeholder="+91 98xxxxxxxx"
                  />
                </Field>
                <Field label="Email (if you have one)" error={errors.email}>
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    maxLength={255}
                    type="email"
                    className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm focus:border-kp-green focus:outline-none"
                    placeholder="you@email.com"
                  />
                </Field>
              </div>

              <Field label="Address for delivery" error={errors.address}>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  maxLength={500}
                  rows={3}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm focus:border-kp-green focus:outline-none"
                  placeholder="House / street, city, state, pin code"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
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
                <Field label="Notes (not needed)">
                  <input
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    maxLength={300}
                    className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm focus:border-kp-green focus:outline-none"
                    placeholder="Anything you want to tell us?"
                  />
                </Field>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-stone-50 px-5 py-4 text-center text-xs text-stone-600">
              We will share the payment details on WhatsApp after we confirm your order.
            </div>

            {submitError && (
              <div className="mt-4 rounded-xl bg-kp-red/10 px-4 py-3 text-center text-xs font-semibold text-kp-red">
                {submitError}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-kp-green py-4 text-sm font-bold uppercase tracking-widest text-white hover:opacity-90 disabled:opacity-60"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? "Sending…" : "Send order request"}
            </button>
            <p className="mt-3 text-center text-[11px] text-stone-500">
              We will confirm and share the payment details on WhatsApp.
            </p>
          </form>
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
