import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/page-shell";

export const Route = createFileRoute("/products-services")({
  head: () => ({
    meta: [
      { title: "Services — KP Farm Ventures" },
      {
        name: "description",
        content:
          "Poultry farm advice, farm visits, shed design plans and shed making quotations from KP Farm Ventures.",
      },
      { property: "og:title", content: "Services — KP Farm Ventures" },
      {
        property: "og:description",
        content:
          "Four key services: farm advice, farm visit, shed design plan and shed making quotation.",
      },
    ],
  }),
  component: ProductsServices,
});

const SERVICES = [
  {
    num: "01",
    color: "kp-green",
    title: "Poultry Farm Advice and Consultation",
    desc: "Get expert guidance on starting, running and growing your poultry farm — either through an online meeting or an in-person visit. We answer all your questions and give you a clear action plan.",
    cta: "Book Consultation",
    to: "/consultation" as const,
  },
  {
    num: "02",
    color: "kp-red",
    title: "Invite for the Farm Visit to Explore Real Experience",
    desc: "We invite you to our working poultry farm so you can see real shed setup, feeding systems, water management, safety measures and day-to-day operations firsthand. Nothing beats learning on a real farm.",
    cta: "Book Farm Visit",
    to: "/farm-visit" as const,
  },
  {
    num: "03",
    color: "kp-gold",
    title: "Construction and Shed Design Plan",
    desc: "We prepare a professional shed design plan tailored to your land size, flock size and budget. The plan covers shed dimensions, ventilation, lighting, flooring and equipment placement.",
    cta: "Get a Plan",
    to: "/consultation" as const,
  },
  {
    num: "04",
    color: "kp-green",
    title: "Construction and Shed Making Quotation",
    desc: "We provide a detailed, transparent cost quotation for building your poultry shed — covering materials, labour and equipment. No hidden charges. You know exactly what you are paying for.",
    cta: "Get a Quote",
    to: "/consultation" as const,
  },
];

const colorMap: Record<string, { badge: string; ring: string; btn: string }> = {
  "kp-green": {
    badge: "text-kp-green bg-kp-green/10",
    ring: "hover:border-kp-green/40",
    btn: "bg-kp-green text-white hover:opacity-90",
  },
  "kp-red": {
    badge: "text-kp-red bg-kp-red/10",
    ring: "hover:border-kp-red/40",
    btn: "bg-kp-red text-white hover:opacity-90",
  },
  "kp-gold": {
    badge: "text-kp-gold bg-kp-gold/10",
    ring: "hover:border-kp-gold/40",
    btn: "bg-kp-gold text-white hover:opacity-90",
  },
};

function ProductsServices() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Our Services"
        title="Four ways we help you"
        accent="build a great farm"
        desc="From expert advice to hands-on farm visits and professional shed planning — everything you need to get your poultry farm started right."
      />

      <section className="px-6 py-16 md:px-10">
        <div className="mx-auto max-w-4xl space-y-6">
          {SERVICES.map((s) => {
            const c = colorMap[s.color];
            return (
              <article
                key={s.num}
                className={`flex items-start gap-5 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl md:p-8 ${c.ring}`}
              >
                <div
                  className={`mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold ${c.badge}`}
                >
                  {s.num}
                </div>
                <div className="flex-1">
                  <h2 className="mb-2 font-display text-xl font-extrabold md:text-2xl">
                    {s.title}
                  </h2>
                  <p className="mb-5 text-stone-500">{s.desc}</p>
                  <Link
                    to={s.to}
                    className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${c.btn}`}
                  >
                    {s.cta} →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}
