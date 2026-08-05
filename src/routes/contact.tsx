import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, CheckCircle2, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageShell, PageHero } from "@/components/site/page-shell";
import { submitContact } from "@/lib/submissions";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact KP Farm Ventures" },
      {
        name: "description",
        content:
          "Contact KP Farm Ventures for advice, training, farm visits, and products — reach us on WhatsApp, phone or email.",
      },
      { property: "og:title", content: "Contact — KP Farm Ventures" },
      { property: "og:description", content: "Get in touch with the KP Farm Ventures team." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", subject: "", message: "" });
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      setErrMsg("Please fill in your name and message.");
      setState("error");
      return;
    }
    setState("loading");
    const { error } = await submitContact({
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      subject: form.subject.trim() || undefined,
      message: form.message.trim(),
    });
    if (error) {
      setErrMsg("Sorry, we couldn't send it. Please try again.");
      setState("error");
      return;
    }
    setState("success");
  };

  return (
    <PageShell>
      <PageHero
        eyebrow="Contact Us"
        title="Let's talk about your"
        accent="poultry farm"
        desc="WhatsApp is the fastest way to reach us. We reply to all messages within one working day."
      />

      <section className="px-6 pb-24 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr,1.2fr]">
          <div className="space-y-4">
            <ContactCard
              icon={<MessageCircle />}
              title="WhatsApp"
              val="+91 00000 00000"
              href="https://wa.me/910000000000"
            />
            <ContactCard
              icon={<Phone />}
              title="Call"
              val="+91 00000 00000"
              href="tel:+910000000000"
            />
            <ContactCard
              icon={<Mail />}
              title="Email"
              val="hello@kpfarmventures.in"
              href="mailto:hello@kpfarmventures.in"
            />
            <ContactCard icon={<MapPin />} title="Address" val="KP Main Farm, Tamil Nadu, India" />
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
            {state === "success" ? (
              <div className="py-6 text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-kp-green/10">
                  <CheckCircle2 className="text-kp-green" size={36} />
                </div>
                <h2 className="mb-2 font-display text-2xl font-extrabold">Message sent</h2>
                <p className="text-sm text-stone-600">
                  Thanks {form.name.split(" ")[0]}! We will reply to you soon.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit}>
                <h2 className="mb-6 font-display text-2xl font-extrabold">Send us a message</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <CField
                    label="Name"
                    required
                    value={form.name}
                    onChange={(v) => setForm({ ...form, name: v })}
                  />
                  <CField
                    label="Mobile"
                    type="tel"
                    value={form.phone}
                    onChange={(v) => setForm({ ...form, phone: v })}
                  />
                  <CField
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(v) => setForm({ ...form, email: v })}
                  />
                  <CField
                    label="Subject"
                    value={form.subject}
                    onChange={(v) => setForm({ ...form, subject: v })}
                  />
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-stone-600">
                      Message <span className="text-kp-red">*</span>
                    </label>
                    <textarea
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none focus:border-kp-green focus:bg-white"
                    />
                  </div>
                  {state === "error" && (
                    <div className="sm:col-span-2 rounded-xl bg-kp-red/10 px-4 py-3 text-center text-xs font-semibold text-kp-red">
                      {errMsg}
                    </div>
                  )}
                  <button
                    disabled={state === "loading"}
                    className="sm:col-span-2 flex items-center justify-center gap-2 rounded-xl bg-kp-green py-4 text-sm font-bold uppercase tracking-widest text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {state === "loading" && <Loader2 className="size-4 animate-spin" />}
                    Send Message
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function CField({
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

function ContactCard({
  icon,
  title,
  val,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  val: string;
  href?: string;
}) {
  const inner = (
    <>
      <div className="flex size-12 items-center justify-center rounded-2xl bg-kp-green/10 text-kp-green">
        {icon}
      </div>
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-stone-500">{title}</div>
        <div className="font-display text-lg font-bold text-stone-900">{val}</div>
      </div>
    </>
  );
  const cls =
    "flex items-center gap-4 rounded-3xl border border-stone-200 bg-white p-5 transition hover:shadow-lg";
  if (href)
    return (
      <a href={href} className={cls}>
        {inner}
      </a>
    );
  return <div className={cls}>{inner}</div>;
}
