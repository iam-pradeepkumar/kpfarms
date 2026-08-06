import { useEffect, useRef, useState } from "react";
import { Loader2, QrCode, Upload, CheckCircle2 } from "lucide-react";
import { getPaymentQrUrl, uploadPaymentProof, type BookingKind } from "@/lib/submissions";

export function PaymentStep({
  kind,
  bookingId,
  whatsapp,
  amountNote,
  onDone,
  onBack,
}: {
  kind: BookingKind;
  bookingId: string;
  whatsapp: string;
  amountNote?: string;
  onDone: () => void;
  onBack?: () => void;
}) {
  const [qr, setQr] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const url = await getPaymentQrUrl();
      if (!cancelled) {
        setQr(url);
        setQrLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrMsg("Please upload the screenshot of your payment.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setErrMsg("That image is too big. Please upload a photo under 8 MB.");
      return;
    }
    setErrMsg("");
    setLoading(true);
    const { error } = await uploadPaymentProof(kind, bookingId, whatsapp, file);
    setLoading(false);
    if (error) {
      setErrMsg("Sorry, we couldn't upload your screenshot. Please try again.");
      return;
    }
    onDone();
  };

  return (
    <form className="grid gap-5" onSubmit={submit}>
      <div className="grid gap-5 sm:grid-cols-[auto,1fr] sm:items-center">
        <div className="mx-auto flex size-52 items-center justify-center overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
          {qrLoading ? (
            <Loader2 className="size-6 animate-spin text-kp-green" />
          ) : qr ? (
            <img src={qr} alt="Payment QR code" className="size-full object-contain" />
          ) : (
            <div className="p-4 text-center text-xs text-stone-500">
              <QrCode className="mx-auto mb-2 text-stone-400" size={28} />
              QR code will be shared on WhatsApp at <b>{whatsapp}</b>
            </div>
          )}
        </div>
        <div className="text-sm text-stone-700">
          <div className="font-display text-lg font-extrabold">Scan and pay</div>
          <p className="mt-1 text-stone-600">
            Scan this QR with Google Pay, PhonePe, Paytm or any UPI app
            {amountNote ? ` and pay ${amountNote}` : ""}. After paying, upload the payment
            screenshot below and submit.
          </p>
          <p className="mt-2 text-xs text-stone-500">
            Our team will check your screenshot and confirm your slot on WhatsApp at{" "}
            <b>{whatsapp}</b>.
          </p>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-stone-600">
          Upload payment screenshot <span className="text-kp-red">*</span>
        </label>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm font-semibold text-stone-600 hover:border-kp-green hover:text-kp-green"
        >
          {file ? <CheckCircle2 size={16} /> : <Upload size={16} />}
          {file ? file.name : "Choose screenshot from your phone"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Payment screenshot preview"
            className="mt-3 max-h-56 rounded-xl border border-stone-200 object-contain"
          />
        )}
      </div>

      {errMsg && (
        <div className="rounded-xl bg-kp-red/10 px-4 py-3 text-center text-xs font-semibold text-kp-red">
          {errMsg}
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-stone-200 bg-white px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-stone-700 hover:bg-stone-50 transition-colors"
          >
            ← Back to Step 2
          </button>
        )}
        <button
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-kp-green py-4 text-sm font-bold uppercase tracking-widest text-white hover:opacity-90 disabled:opacity-60"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          Submit payment screenshot
        </button>
      </div>
    </form>
  );
}
