import { useState } from "react";
import { Loader2, CheckCircle2, MessageSquareText } from "lucide-react";
import { submitContact } from "@/lib/submissions";

export function MessageCard() {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.message.trim()) {
      setErrMsg("Please fill in your name, phone number and message.");
      setState("error");
      return;
    }
    setState("loading");
    const { error } = await submitContact({
      name: form.name.trim(),
      phone: form.phone.trim(),
      subject: "Message from home page",
      message: form.message.trim(),
    });
    if (error) {
      setErrMsg("Sorry, we couldn't send it. Please try again.");
      setState("error");
      return;
    }
    setState("success");
    setForm({ name: "", phone: "", message: "" });
  };

  return (
    <section id="message" className="relative bg-stone-50 px-6 py-16 md:px-10 md:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-xl shadow-stone-200/60 md:p-10">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-kp-green">
            <MessageSquareText className="size-4" />
            Send a Message
          </div>
          <h2 className="mb-3 font-display text-3xl font-extrabold md:text-4xl">
            Have a question? <span className="text-kp-red">Write to us</span>
          </h2>
          <p className="mb-7 text-stone-600">
            Leave your name, phone number and message — our team will get back to you shortly.
          </p>

          {state === "success" ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <CheckCircle2 className="mx-auto mb-3 size-10 text-kp-green" />
              <p className="font-display text-xl font-extrabold">Message sent!</p>
              <p className="mt-1 text-sm text-stone-600">Thank you — we'll be in touch soon.</p>
              <button
                type="button"
                onClick={() => setState("idle")}
                className="mt-5 rounded-full border border-stone-200 bg-white px-5 py-2 text-xs font-bold uppercase tracking-widest text-stone-700 transition-colors hover:border-kp-green hover:text-kp-green"
              >
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Your name"
                  value={form.name}
                  onChange={(v) => setForm({ ...form, name: v })}
                  placeholder="Full name"
                  maxLength={100}
                />
                <Field
                  label="Phone number"
                  value={form.phone}
                  onChange={(v) => setForm({ ...form, phone: v })}
                  placeholder="+91 00000 00000"
                  type="tel"
                  maxLength={20}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-stone-500">
                  Message
                </label>
                <textarea
                  rows={4}
                  value={form.message}
                  maxLength={1000}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="How can we help?"
                  className="w-full resize-none rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition-colors focus:border-kp-green focus:bg-white"
                />
              </div>

              {state === "error" && <p className="text-sm font-medium text-red-600">{errMsg}</p>}

              <button
                type="submit"
                disabled={state === "loading"}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-kp-green px-7 py-3 text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 disabled:opacity-60"
              >
                {state === "loading" && <Loader2 className="size-4 animate-spin" />}
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-stone-500">
        {label}
      </label>
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition-colors focus:border-kp-green focus:bg-white"
      />
    </div>
  );
}
