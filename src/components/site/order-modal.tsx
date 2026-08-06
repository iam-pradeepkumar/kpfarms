import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, Loader2, ArrowLeft, ArrowRight, QrCode, MessageSquare, Upload, ShieldCheck } from "lucide-react";
import { submitOrder, getAdminWhatsapp, buildOrderWhatsappText } from "@/lib/submissions";
import { supabase } from "@/integrations/supabase/client";

export type OrderItem = {
  id: string;
  title: string;
  price: number;
  tag?: string;
  image_url?: string | null;
};

export function OrderModal({ item, onClose }: { item: OrderItem | null; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [payMethod, setPayMethod] = useState<"upi" | "whatsapp">("whatsapp");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    quantity: 1,
    paymentRef: "",
    notes: "",
  });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

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
      setPayMethod("whatsapp");
      setSubmitted(false);
      setErrors({});
      setWaUrl(null);
      setProofFile(null);
      setProofPreview(null);
      setForm({ name: "", phone: "", email: "", address: "", quantity: 1, paymentRef: "", notes: "" });
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    let proofUrl = "";
    if (payMethod === "upi" && proofFile) {
      setUploadingProof(true);
      try {
        const ext = proofFile.name.split(".").pop() || "jpg";
        const fileName = `order_proof_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("site-assets")
          .upload(fileName, proofFile, { upsert: true });

        if (!upErr) {
          const { data: pData } = supabase.storage.from("site-assets").getPublicUrl(fileName);
          proofUrl = pData.publicUrl;
        }
      } catch {
        // Continue if proof upload fails
      }
      setUploadingProof(false);
    }

    const noteLines = [
      `Method: ${payMethod === "upi" ? "UPI QR Payment" : "WhatsApp Direct Order"}`,
      form.paymentRef.trim() ? `Transaction UTR/Ref: ${form.paymentRef.trim()}` : "",
      proofUrl ? `Payment Screenshot: ${proofUrl}` : "",
      form.notes.trim(),
    ].filter(Boolean);

    const fullNotes = noteLines.join("\n");

    const { error } = await submitOrder({
      product_id: item.id,
      quantity: form.quantity,
      customer_name: form.name.trim(),
      whatsapp: form.phone.trim(),
      email: form.email.trim() || undefined,
      address: form.address.trim(),
      notes: fullNotes || undefined,
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
        notes: fullNotes || undefined,
      });
      const url = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
      setWaUrl(url);
      if (payMethod === "whatsapp") {
        window.open(url, "_blank", "noopener,noreferrer");
      }
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
            <h3 className="mb-2 font-display text-2xl font-extrabold">
              {payMethod === "upi" ? "Payment Proof Received!" : "Order Submitted!"}
            </h3>
            <p className="mb-6 text-sm text-stone-600">
              Thanks {form.name.split(" ")[0]}! Your order for <b>{item.title}</b> has been received.
              {payMethod === "upi"
                ? " Our admin will review your payment and send your order confirmation on WhatsApp shortly."
                : " Please press send in WhatsApp so we get your order details right away."}
            </p>
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3.5 text-sm font-bold text-white shadow-md hover:opacity-90"
              >
                <MessageSquare size={18} /> Chat with Admin on WhatsApp
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
                { s: 3, label: "Payment / Confirm" },
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
                    <span>Next: Payment Method</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Payment Method Dual-Choice */}
            {step === 3 && (
              <form onSubmit={submit} className="space-y-4">
                {/* Method selector tabs */}
                <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-stone-100 p-1">
                  <button
                    type="button"
                    onClick={() => setPayMethod("whatsapp")}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition ${
                      payMethod === "whatsapp"
                        ? "bg-white text-[#25D366] shadow-sm"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    <MessageSquare size={15} /> Continue WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod("upi")}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition ${
                      payMethod === "upi"
                        ? "bg-white text-kp-green shadow-sm"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    <QrCode size={15} /> Continue Payment
                  </button>
                </div>

                {payMethod === "upi" ? (
                  <div className="space-y-4">
                    {/* Amount & UPI Details */}
                    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-center">
                      <div className="text-xs font-bold uppercase tracking-widest text-stone-500">
                        Total Amount Payable
                      </div>
                      <div className="my-1 font-display text-3xl font-extrabold text-kp-green">
                        ₹{total}
                      </div>
                      <div className="text-xs text-stone-600">
                        UPI ID: <b className="font-mono text-stone-900">kpfarms@upi</b>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-dashed border-kp-green/40 bg-kp-green/5 p-4 space-y-3">
                      <div className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-widest text-kp-green">
                        <QrCode size={16} /> Scan QR / Pay via GPay / PhonePe / Paytm
                      </div>
                      <p className="text-xs text-stone-600">
                        Pay <b>₹{total}</b> to UPI ID <b>kpfarms@upi</b> and upload your payment screenshot below so admin can verify your order right away.
                      </p>

                      <Field label="Upload Payment Screenshot">
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 bg-white px-4 py-3 text-xs font-bold text-stone-600 hover:border-kp-green">
                          <Upload size={16} className="text-kp-green" />
                          <span>{proofFile ? proofFile.name : "Choose screenshot file"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                        {proofPreview && (
                          <div className="mt-2 aspect-video w-full overflow-hidden rounded-xl bg-stone-100">
                            <img src={proofPreview} alt="Payment proof" className="h-full w-full object-contain" />
                          </div>
                        )}
                      </Field>

                      <Field label="Transaction Ref / UTR Number (Optional)">
                        <input
                          value={form.paymentRef}
                          onChange={(e) => setForm({ ...form, paymentRef: e.target.value })}
                          maxLength={100}
                          className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-xs focus:border-kp-green focus:outline-none"
                          placeholder="e.g. 320984719283"
                        />
                      </Field>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
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

                    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-1 text-xs text-stone-600">
                      <div className="font-bold text-stone-900 uppercase text-[10px] tracking-widest mb-1 text-stone-500">
                        Delivery Details
                      </div>
                      <div><b>Name:</b> {form.name}</div>
                      <div><b>WhatsApp:</b> {form.phone}</div>
                      <div><b>Address:</b> {form.address}</div>
                    </div>

                    <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
                      <MessageSquare size={18} className="shrink-0 text-[#25D366] mt-0.5" />
                      <div>
                        <b>WhatsApp Direct Order:</b> Clicking submit will save your order and launch WhatsApp to message our team directly.
                      </div>
                    </div>
                  </div>
                )}

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
                    disabled={submitting || uploadingProof}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold uppercase tracking-widest text-white shadow-md hover:opacity-90 disabled:opacity-60 ${
                      payMethod === "whatsapp" ? "bg-[#25D366]" : "bg-kp-green"
                    }`}
                  >
                    {submitting || uploadingProof ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : payMethod === "whatsapp" ? (
                      <MessageSquare size={16} />
                    ) : (
                      <ShieldCheck size={16} />
                    )}
                    {submitting
                      ? "Submitting Order…"
                      : payMethod === "whatsapp"
                        ? "Send on WhatsApp"
                        : "Submit Order & Proof"}
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
