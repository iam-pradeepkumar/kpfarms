import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PageShell, PageHero } from "@/components/site/page-shell";
import { Play } from "lucide-react";
import { getHomeVideoUrls, isVideoMediaUrl, type HomeVideoKey } from "@/lib/home-videos";

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

const SERVICES: {
  videoKey: HomeVideoKey;
  title: string;
  desc: string;
  to: "/consultation" | "/farm-visit";
  bookable: boolean;
}[] = [
  {
    videoKey: "service_video_advice",
    title: "Poultry Farm Advice and Consultation",
    desc: "Get expert guidance on starting, running and growing your poultry farm — either through an online meeting or an in-person visit. We answer all your questions and give you a clear action plan.",
    to: "/consultation",
    bookable: true,
  },
  {
    videoKey: "service_video_farm_visit",
    title: "Invite for the Farm Visit to Explore Real Experience",
    desc: "We invite you to our working poultry farm so you can see real shed setup, feeding systems, water management, safety measures and day-to-day operations firsthand. Nothing beats learning on a real farm.",
    to: "/farm-visit",
    bookable: true,
  },
  {
    videoKey: "service_video_shed_plan",
    title: "Construction and Shed Design Plan",
    desc: "We prepare a professional shed design plan tailored to your land size, flock size and budget. The plan covers shed dimensions, ventilation, lighting, flooring and equipment placement.",
    to: "/consultation",
    bookable: true,
  },
  {
    videoKey: "service_video_shed_quote",
    title: "Construction and Shed Making Quotation",
    desc: "We provide a detailed, transparent cost quotation for building your poultry shed — covering materials, labour and equipment. No hidden charges. You know exactly what you are paying for.",
    to: "/consultation",
    bookable: true,
  },
];

function ProductsServices() {
  const [videos, setVideos] = useState<Partial<Record<HomeVideoKey, string>>>({});
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getHomeVideoUrls()
      .then(setVideos)
      .catch(() => {});
  }, []);

  /* IntersectionObserver: animate cards when they scroll into view */
  useEffect(() => {
    const root = listRef.current;
    if (!root) return;

    const cards = root.querySelectorAll<HTMLElement>("[data-slide-from]");
    if (!cards.length) return;

    /* respect reduced-motion */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cards.forEach((c) => c.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [videos]); /* re-run once videos load so refs are stable */

  return (
    <PageShell>
      <PageHero
        eyebrow="Services"
        title="Everything you need for a"
        accent="strong poultry farm"
        desc="Four simple services that cover your full farm journey. Each card has a short video to help you understand."
      />

      <section className="overflow-hidden px-6 py-16 md:px-10">
        <div ref={listRef} className="mx-auto max-w-6xl space-y-14">
          {SERVICES.map((s, i) => {
            const videoUrl = videos[s.videoKey];
            const fromDir = i % 2 === 0 ? "right" : "left";
            return (
              <article
                key={s.title}
                data-slide-from={fromDir}
                style={{ transitionDelay: `${i * 0.08}s` }}
                className={`grid gap-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-xl md:grid-cols-2 md:p-10 ${
                  i % 2 ? "md:[&>div:first-child]:order-2" : ""
                }`}
              >
                <div className="flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-kp-green/10 via-kp-gold/10 to-kp-red/10">
                  {videoUrl ? (
                    isVideoMediaUrl(videoUrl) ? (
                      <video
                        src={videoUrl}
                        controls
                        playsInline
                        preload="metadata"
                        className="h-full w-full rounded-2xl object-cover"
                      />
                    ) : (
                      <img
                        src={videoUrl}
                        alt={s.title}
                        className="h-full w-full rounded-2xl object-cover"
                      />
                    )
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-kp-green">
                      <div className="flex size-16 items-center justify-center rounded-full bg-white shadow-lg">
                        <Play className="ml-1" />
                      </div>
                      <div className="text-xs font-bold uppercase tracking-widest">
                        Video coming soon
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <div className="mb-2 text-xs font-bold uppercase tracking-widest text-kp-gold">
                    Service · {String(i + 1).padStart(2, "0")}
                  </div>
                  <h2 className="mb-3 font-display text-2xl font-extrabold md:text-3xl">
                    {s.title}
                  </h2>
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
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}
