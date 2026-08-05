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
          "Advice, shed planning, building work, equipment picking, feed help, business plans and online marketing for poultry farms from KP Farm Ventures.",
      },
      { property: "og:title", content: "Services — KP Farm Ventures" },
      {
        property: "og:description",
        content:
          "All the services we offer, from planning a shed to feed help and business advice.",
      },
    ],
  }),
  component: ProductsServices,
});

const SERVICES = [
  {
    title: "Poultry Farm Advice",
    desc: "Farm check-ups, safety planning, and full help with your daily farm work.",
    bookable: true,
  },
  {
    title: "Shed Planning",
    desc: "Shed designs made for your land, with good airflow, light and space for your birds.",
  },
  {
    title: "Shed Building Service",
    desc: "Full shed building with trusted builders and good-quality materials.",
  },
  {
    title: "Shed Cost Estimate",
    desc: "Clear cost list for your shed, showing each material and labour charge.",
  },
  {
    title: "Equipment Picking",
    desc: "Feeders, drinkers, chick warmers and foggers — the right gear for your weather and size.",
  },
  {
    title: "Farm Layout Plan",
    desc: "A full plan for your sheds, storage rooms, safety areas and waste handling.",
  },
  {
    title: "Feed Help",
    desc: "Feed making, storage tips, and feeding plans for every age of your birds.",
  },
  {
    title: "New Farm Help",
    desc: "Licences, loans, and day-one steps — we help you from the very start.",
  },
  {
    title: "Business Planning",
    desc: "Money plans, break-even numbers, and how to enter your local market.",
  },
  {
    title: "Online Marketing Help",
    desc: "Local Google search tips, WhatsApp selling, and social media help for farm owners.",
  },
];

function ProductsServices() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Services"
        title="Everything you need for a"
        accent="strong poultry farm"
        desc="Ten simple services that cover your full farm journey. Each card has a short video to help you understand."
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
                  <button className="rounded-xl border-2 border-stone-200 bg-white px-5 py-2.5 text-sm font-bold hover:bg-stone-50">
                    Learn More
                  </button>
                  {s.bookable && (
                    <Link
                      to="/consultation"
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
