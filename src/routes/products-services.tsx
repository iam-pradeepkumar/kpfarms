import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/page-shell";
import { Play } from "lucide-react";

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
    title: "Poultry Farm Advice and Consultation",
    desc: "Get expert guidance on starting, running and growing your poultry farm — either through an online meeting or an in-person visit. We answer all your questions and give you a clear action plan.",
    to: "/consultation" as const,
    bookable: true,
  },
  {
    title: "Invite for the Farm Visit to Explore Real Experience",
    desc: "We invite you to our working poultry farm so you can see real shed setup, feeding systems, water management, safety measures and day-to-day operations firsthand. Nothing beats learning on a real farm.",
    to: "/farm-visit" as const,
    bookable: true,
  },
  {
    title: "Construction and Shed Design Plan",
    desc: "We prepare a professional shed design plan tailored to your land size, flock size and budget. The plan covers shed dimensions, ventilation, lighting, flooring and equipment placement.",
    to: "/consultation" as const,
    bookable: true,
  },
  {
    title: "Construction and Shed Making Quotation",
    desc: "We provide a detailed, transparent cost quotation for building your poultry shed — covering materials, labour and equipment. No hidden charges. You know exactly what you are paying for.",
    to: "/consultation" as const,
    bookable: true,
  },
];

function ProductsServices() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Services"
        title="Everything you need for a"
        accent="strong poultry farm"
        desc="Four simple services that cover your full farm journey. Each card has a short video to help you understand."
      />

      <section className="px-6 py-16 md:px-10">
        <div className="mx-auto max-w-6xl space-y-10">
          {SERVICES.map((s, i) => (
            <article
              key={s.title}
              className={`grid gap-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm transition hover:shadow-xl md:grid-cols-2 md:p-10 ${
                i % 2 ? "md:[&>div:first-child]:order-2" : ""
              }`}
            >
              <div className="flex aspect-video items-center justify-center rounded-2xl bg-gradient-to-br from-kp-green/10 via-kp-gold/10 to-kp-red/10">
                <div className="flex flex-col items-center gap-3 text-kp-green">
                  <div className="flex size-16 items-center justify-center rounded-full bg-white shadow-lg">
                    <Play className="ml-1" />
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest">
                    Video coming soon
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <div className="mb-2 text-xs font-bold uppercase tracking-widest text-kp-gold">
                  Service · {String(i + 1).padStart(2, "0")}
                </div>
                <h2 className="mb-3 font-display text-2xl font-extrabold md:text-3xl">{s.title}</h2>
                <p className="mb-6 text-stone-600">{s.desc}</p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to={s.to}
                    className="rounded-xl border-2 border-stone-200 bg-white px-5 py-2.5 text-sm font-bold hover:bg-stone-50"
                  >
                    Learn More
                  </Link>
                  {s.bookable && (
                    <Link
                      to={s.to}
                      className="rounded-xl bg-kp-green px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
                    >
                      Book Now
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
