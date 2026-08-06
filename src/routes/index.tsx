import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Play } from "lucide-react";

import { Chick, Hen, Feather } from "@/components/site/decor";
import { FounderCarousel } from "@/components/site/founder-carousel";
import { MessageCard } from "@/components/site/message-card";
import { PageShell } from "@/components/site/page-shell";
import { listBlogPosts, type BlogPost } from "@/lib/blog";
import { PostCard, PostModal } from "@/routes/blog";

import { supabase } from "@/integrations/supabase/client";
import type { TestimonialRow } from "@/lib/submissions";
import { getHomeVideoUrls, isVideoMediaUrl, type HomeVideoKey } from "@/lib/home-videos";

import founderFamily from "@/assets/founder-family.jpg.asset.json";
import founderFormal from "@/assets/founder-formal.png.asset.json";
import founderYellow from "@/assets/founder-yellow.jpg.asset.json";
import founderTea from "@/assets/founder-tea-estate.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KP Farm Ventures — Poultry Farming Help, Training & Farm Visits" },
      {
        name: "description",
        content:
          "KP Farm Ventures helps new poultry farmers in India with online meeting, useful products, farm training, and farm visits.",
      },
      {
        property: "og:title",
        content: "KP Farm Ventures — Poultry Farming Help, Training & Farm Visits",
      },
      {
        property: "og:description",
        content:
          "KP Farm Ventures helps new poultry farmers in India with online meeting, useful products, farm training, and farm visits.",
      },
    ],
  }),
  component: Index,
});

// ============================================================
// FOUNDER + FAMILY PHOTOS — edit these to update home + about.
// Add photos of the founder and family to the `photos` array.
// Each entry: { url: "/family-1.jpg" or "https://…", caption?: "Optional line under photo" }
// Leave the array empty to show the "KP" initials placeholder.
// ============================================================
export const FOUNDER = {
  name: "Selva Ananth",
  role: "Founder, KP Farm Ventures",
  initials: "SA",
  bio: "I started KP Farm Ventures with one simple vision — to help farmers build profitable, modern, and sustainable poultry businesses through practical knowledge and real-world experience.",
  photos: [
    { url: founderFamily.url },
    { url: founderFormal.url, zoom: 1.25 },
    { url: founderTea.url },
    { url: founderYellow.url },
    { url: "/media/founder-white-shirt.jpg" },
  ] as { url: string; caption?: string }[],
};

function Index() {
  const [testimonials, setTestimonials] = useState<
    Pick<TestimonialRow, "id" | "name" | "place" | "text" | "rating">[]
  >([]);
  const [videos, setVideos] = useState<Partial<Record<HomeVideoKey, string>>>({});
  const [trainedCount, setTrainedCount] = useState(500);
  const [consultCount, setConsultCount] = useState(500);
  const [visitCount, setVisitCount] = useState(200);
  const [trainingCount, setTrainingCount] = useState(150);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [openPost, setOpenPost] = useState<BlogPost | null>(null);

  const [chickenProdCount, setChickenProdCount] = useState(10000);
  const [batchRunCount, setBatchRunCount] = useState(50);

  useEffect(() => {
    (async () => {
      try {
        const results = await Promise.all([
          listBlogPosts().then((p) => setPosts(p.slice(0, 3))).catch(() => {}),
          getHomeVideoUrls().then(setVideos).catch(() => {}),
          supabase.rpc("trained_farmers_count" as never).then(({ data, error }) => {
            const n = Number(data);
            if (!error && Number.isFinite(n) && n > 0) setTrainedCount(n);
          }).catch(() => {}),
          supabase.from("consultation_bookings" as never).select("id", { count: "exact", head: true }).catch(() => null),
          supabase.from("farm_visit_bookings" as never).select("id", { count: "exact", head: true }).catch(() => null),
          supabase.from("training_registrations" as never).select("id", { count: "exact", head: true }).catch(() => null),
          supabase.from("testimonials")
            .select("id, name, place, text, rating")
            .eq("status", "approved")
            .not("text", "is", null)
            .order("featured", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(12)
            .then(({ data }) => {
              const rows = (data as any) ?? [];
              setTestimonials(rows.length ? rows : FALLBACK_TESTIMONIALS);
            }).catch(() => {}),
          supabase
            .from("site_settings")
            .select("key, value")
            .in("key", ["stat_consultations", "stat_farm_visits", "stat_training", "stat_chicken_production", "stat_batch_counts"])
            .then(({ data }) => {
              data?.forEach((row) => {
                if (row.key === "stat_consultations" && row.value) setConsultCount(Number(row.value) || 507);
                if (row.key === "stat_farm_visits" && row.value) setVisitCount(Number(row.value) || 203);
                if (row.key === "stat_training" && row.value) setTrainingCount(Number(row.value) || 150);
                if (row.key === "stat_chicken_production" && row.value) setChickenProdCount(Number(row.value) || 10000);
                if (row.key === "stat_batch_counts" && row.value) setBatchRunCount(Number(row.value) || 50);
              });
            }).catch(() => {})
        ]);

        const animate = (base: number, extra: number, setter: (n: number) => void) => {
          const target = base + (extra || 0);
          let current = base;
          const step = Math.ceil((target - base) / 30);
          const id = setInterval(() => {
            current = Math.min(current + step, target);
            setter(current);
            if (current >= target) clearInterval(id);
          }, 40);
        };
        
        const c1 = results[3];
        const c2 = results[4];
        const c3 = results[5];
        animate(500, (c1 as any)?.count ?? 0, setConsultCount);
        animate(200, (c2 as any)?.count ?? 0, setVisitCount);
        animate(150, (c3 as any)?.count ?? 0, setTrainingCount);
      } catch (err) {
        console.error(err);
      } finally {
        window.dispatchEvent(new Event("page-data-loaded"));
      }
    })();
  }, []);

  // Gentle lift/fade for cards as they scroll into view
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((n) => n.classList.add("is-revealed"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-revealed");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  return (
    <PageShell>
      {/* Hero */}
      <header className="relative overflow-hidden px-6 pb-16 pt-32 md:px-10 md:pb-20 md:pt-40 lg:pt-44">
        {/* Full-bleed farm background */}
        <img
          src="/media/hero-farm-bg.jpg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right"
        />

        {/* Mobile readability gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white/80 md:from-white/40 md:via-transparent md:to-white/30" />


        {/* Floating hero decor */}
        <Chick
          className="absolute right-[6%] top-24 hidden md:block animate-float-y"
          size={64}
          delay={0.2}
        />
        <Chick className="absolute right-[22%] top-56 hidden lg:block" size={44} delay={0.9} />
        <Feather className="absolute left-[10%] top-20 hidden md:block animate-drift-x" delay={0} />
        <Feather className="absolute right-[40%] top-4 hidden md:block animate-drift-x" delay={3} />
        <Hen
          className="absolute right-[10%] bottom-6 hidden lg:block animate-float-y opacity-90"
          size={96}
          delay={1}
        />

        <div className="mx-auto max-w-6xl">
          <div className="relative z-10 anim-fade-up">
            <h1 className="mb-8 font-display text-5xl font-extrabold leading-[1.05] md:text-6xl lg:text-7xl">
              Helping You Start a{" "}
              <span className="relative inline-block text-kp-green">
                Poultry
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path
                    d="M2 8 Q 50 2, 100 6 T 198 5"
                    stroke="oklch(0.78 0.16 70)"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <br />
              Farm
            </h1>
            <p className="mb-10 max-w-lg text-lg leading-relaxed text-stone-700">
              From online meeting to hands-on training and farm visits — KP Farm Ventures gives you
              a simple, clear plan to run a poultry farm that makes money.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/farm-visit"
                className="flex items-center gap-2 rounded-xl bg-kp-red px-8 py-4 font-bold text-white shadow-xl shadow-red-900/20 transition-all hover:scale-105 hover:opacity-90"
              >
                Book a Farm Visit <span aria-hidden>→</span>
              </Link>
              <a
                href="#message"
                className="rounded-xl border-2 border-stone-200 bg-white px-8 py-4 font-bold transition-all hover:scale-105 hover:bg-stone-50"
              >
                Message Us
              </a>
            </div>

            <div className="mt-12 grid grid-cols-2 sm:flex sm:flex-wrap gap-x-8 gap-y-6 text-sm max-w-2xl">
              <div>
                <div className="font-display text-xl sm:text-2xl font-extrabold text-kp-green">
                  {consultCount.toLocaleString("en-IN")}+
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-stone-800">
                  Online Consultations
                </div>
              </div>
              <div>
                <div className="font-display text-xl sm:text-2xl font-extrabold text-kp-red">
                  {visitCount.toLocaleString("en-IN")}+
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-stone-800">
                  Farm Visits
                </div>
              </div>
              <div>
                <div className="font-display text-xl sm:text-2xl font-extrabold text-kp-gold">
                  {trainingCount.toLocaleString("en-IN")}+
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-stone-800">
                  Training Programs
                </div>
              </div>
              <div>
                <div className="font-display text-xl sm:text-2xl font-extrabold text-kp-green">
                  {chickenProdCount.toLocaleString("en-IN")}+
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-stone-800">
                  Total Chicken Production
                </div>
              </div>
              <div>
                <div className="font-display text-xl sm:text-2xl font-extrabold text-kp-red">
                  {batchRunCount.toLocaleString("en-IN")}+
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-stone-800">
                  Successful Run Batches
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Services */}
      <section id="services" className="relative overflow-hidden bg-white px-6 py-16 md:px-10 md:py-20">
        <div className="mx-auto max-w-6xl mb-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-xl">
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-kp-green">
                What we do
              </div>
              <h2 className="mb-4 font-display text-4xl font-extrabold md:text-5xl">
                What We Offer
              </h2>
              <p className="text-stone-500">
                Simple help for every step of your poultry farm — scroll through our services below and click any card to view full details.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/products-services"
                className="inline-flex items-center gap-2 rounded-full border border-kp-green bg-kp-green/10 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-kp-green transition-colors hover:bg-kp-green hover:text-white"
              >
                View All Services →
              </Link>
              <Chick size={56} delay={0.2} />
            </div>
          </div>
        </div>

        {/* Auto-scrolling horizontal Services Marquee */}
        <div className="marquee-mask group relative overflow-hidden py-4">
          <div className="flex w-max gap-6 animate-[marquee-x_35s_linear_infinite] group-hover:[animation-play-state:paused]">
            {[
              {
                n: "01",
                color: "text-kp-green",
                title: "Poultry Farm Advice and Consultation",
                desc: "Get expert guidance on starting, running and growing your poultry farm — online or in person.",
                videoKey: "service_video_advice" as const,
              },
              {
                n: "02",
                color: "text-kp-red",
                title: "Invite for the Farm Visit to Explore Real Experience",
                desc: "We invite you to our farm to see real shed setup, feeding, water, safety and day-to-day management firsthand.",
                videoKey: "service_video_farm_visit" as const,
              },
              {
                n: "03",
                color: "text-kp-gold",
                title: "Construction and Shed Design Plan",
                desc: "Get a professional shed design plan tailored to your land, flock size and budget.",
                videoKey: "service_video_shed_plan" as const,
              },
              {
                n: "04",
                color: "text-kp-green",
                title: "Construction and Shed Making Quotation",
                desc: "We provide a detailed cost quotation for building your poultry shed — no hidden charges.",
                videoKey: "service_video_shed_quote" as const,
              },
              {
                n: "01",
                color: "text-kp-green",
                title: "Poultry Farm Advice and Consultation",
                desc: "Get expert guidance on starting, running and growing your poultry farm — online or in person.",
                videoKey: "service_video_advice" as const,
              },
              {
                n: "02",
                color: "text-kp-red",
                title: "Invite for the Farm Visit to Explore Real Experience",
                desc: "We invite you to our farm to see real shed setup, feeding, water, safety and day-to-day management firsthand.",
                videoKey: "service_video_farm_visit" as const,
              },
              {
                n: "03",
                color: "text-kp-gold",
                title: "Construction and Shed Design Plan",
                desc: "Get a professional shed design plan tailored to your land, flock size and budget.",
                videoKey: "service_video_shed_plan" as const,
              },
              {
                n: "04",
                color: "text-kp-green",
                title: "Construction and Shed Making Quotation",
                desc: "We provide a detailed cost quotation for building your poultry shed — no hidden charges.",
                videoKey: "service_video_shed_quote" as const,
              },
              {
                n: "01",
                color: "text-kp-green",
                title: "Poultry Farm Advice and Consultation",
                desc: "Get expert guidance on starting, running and growing your poultry farm — online or in person.",
                videoKey: "service_video_advice" as const,
              },
              {
                n: "02",
                color: "text-kp-red",
                title: "Invite for the Farm Visit to Explore Real Experience",
                desc: "We invite you to our farm to see real shed setup, feeding, water, safety and day-to-day management firsthand.",
                videoKey: "service_video_farm_visit" as const,
              },
              {
                n: "03",
                color: "text-kp-gold",
                title: "Construction and Shed Design Plan",
                desc: "Get a professional shed design plan tailored to your land, flock size and budget.",
                videoKey: "service_video_shed_plan" as const,
              },
              {
                n: "04",
                color: "text-kp-green",
                title: "Construction and Shed Making Quotation",
                desc: "We provide a detailed cost quotation for building your poultry shed — no hidden charges.",
                videoKey: "service_video_shed_quote" as const,
              },
            ].map((s, idx) => {
              const videoUrl = videos[s.videoKey];
              return (
                <Link
                  key={`${s.n}-${idx}`}
                  to="/products-services"
                  className="group/card flex w-[300px] sm:w-[360px] shrink-0 flex-col overflow-hidden rounded-3xl border border-stone-200 bg-stone-50 p-5 transition-all hover:-translate-y-1.5 hover:border-kp-green hover:bg-white hover:shadow-xl"
                >
                  <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-2xl bg-stone-100">
                    {videoUrl ? (
                      isVideoMediaUrl(videoUrl) ? (
                        <video
                          src={videoUrl}
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <img src={videoUrl} alt={s.title} className="h-full w-full object-cover" />
                      )
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-kp-green/10 via-kp-gold/10 to-kp-red/10 text-kp-green">
                        <div className="flex size-12 items-center justify-center rounded-full bg-white shadow-md">
                          <Play className="ml-1 text-kp-green" size={20} />
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest">
                          Video coming soon
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className={`font-display text-xs font-extrabold ${s.color}`}>
                          Service · {s.n}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 group-hover/card:text-kp-green">
                          View Service →
                        </span>
                      </div>
                      <h3 className="mb-2 font-display text-base font-bold text-stone-900 line-clamp-2">
                        {s.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-stone-500 line-clamp-3">
                        {s.desc}
                      </p>
                    </div>
                    <div className="mt-4 border-t border-stone-200/60 pt-3 flex items-center justify-between text-xs font-bold text-kp-green">
                      <span>Learn More</span>
                      <span>→</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-6 text-center md:hidden">
          <Link
            to="/products-services"
            className="inline-flex items-center gap-2 rounded-full border border-kp-green bg-kp-green/10 px-6 py-3 text-xs font-bold uppercase tracking-widest text-kp-green"
          >
            View All Services →
          </Link>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="relative bg-white px-6 py-16 md:px-10 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 flex items-end justify-between gap-6">
            <div className="max-w-xl">
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-kp-gold">
                Products
              </div>
              <h2 className="mb-4 font-display text-4xl font-extrabold md:text-5xl">
                Our Products
              </h2>
              <p className="text-stone-500">
                E-books and Excel sheets you can download, plus farm equipment we use on our own
                farm.
              </p>
            </div>
            <div className="hidden md:block animate-float-y">
              <Hen size={80} delay={0.3} />
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div
              data-reveal
              className="group flex flex-col justify-between rounded-3xl border border-stone-100 bg-stone-50 p-8 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-kp-gold"
            >
              <div>
                <VideoSlot
                  accent="gold"
                  label="Digital Products preview"
                  src={videos.home_video_digital}
                />
                <div className="mb-4 inline-flex rounded-2xl bg-kp-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-kp-gold">
                  Digital
                </div>
                <h3 className="mb-3 font-display text-2xl font-bold">Digital Products</h3>
                <p className="mb-6 text-sm leading-relaxed text-stone-600">
                  E-books, feed calculators, and easy Excel sheets to run your farm — download right
                  after payment.
                </p>
              </div>
              <Link
                to="/digital-products"
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-kp-gold px-6 py-3 text-sm font-bold text-stone-900 transition-all hover:opacity-90"
              >
                Order Now <span aria-hidden>→</span>
              </Link>
            </div>
            <div
              data-reveal
              className="group flex flex-col justify-between rounded-3xl border border-stone-100 bg-stone-50 p-8 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-kp-green"
            >
              <div>
                <VideoSlot
                  accent="green"
                  label="Poultry Products preview"
                  src={videos.home_video_poultry}
                />
                <div className="mb-4 inline-flex rounded-2xl bg-kp-green/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-kp-green">
                  Farm
                </div>
                <h3 className="mb-3 font-display text-2xl font-bold">Farm Products</h3>
                <p className="mb-6 text-sm leading-relaxed text-stone-600">
                  Feeders, drinkers, brooders, curtains and foggers — plus safe, trusted Amazon
                  picks.
                </p>
              </div>
              <Link
                to="/poultry-products"
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-kp-green px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90"
              >
                Order Now <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Consultation & Farm Visit */}
      <section id="consultation" className="relative bg-stone-50 px-6 py-16 md:px-10 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 flex items-end justify-between gap-6">
            <div className="max-w-xl">
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-kp-green">
                Meeting &amp; Farm Visit
              </div>
              <h2 className="mb-4 font-display text-4xl font-extrabold md:text-5xl">
                Talk to us. Visit the farm.
              </h2>
              <p className="text-stone-500">
                Get help from our expert on a video call, or come to our farm and spend a day
                learning with us.
              </p>
            </div>
            <div className="hidden md:block">
              <Chick size={56} delay={0.6} />
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div
              data-reveal
              className="group flex flex-col justify-between rounded-3xl border border-stone-100 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:border-kp-green"
            >
              <div>
                <VideoSlot
                  accent="green"
                  label="Online meeting preview"
                  src={videos.home_video_meeting}
                />
                <div className="mb-4 inline-flex rounded-2xl bg-kp-green/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-kp-green">
                  30-min call
                </div>
                <h3 className="mb-3 font-display text-2xl font-bold">Online Meeting</h3>
                <p className="mb-6 text-sm leading-relaxed text-stone-600">
                  A one-on-one video call to check your chicks' health, keep the farm safe, and help
                  them grow better.
                </p>
              </div>
              <Link
                to="/consultation"
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-kp-green px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90"
              >
                Book Now <span aria-hidden>→</span>
              </Link>
            </div>
            <div
              data-reveal
              className="group flex flex-col justify-between rounded-3xl border border-stone-100 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:border-kp-red"
            >
              <div>
                <VideoSlot
                  accent="red"
                  label="Farm Visit preview"
                  src={videos.home_video_farm_visit}
                />
                <div className="mb-4 inline-flex rounded-2xl bg-kp-red/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-kp-red">
                  Half-day visit
                </div>
                <h3 className="mb-3 font-display text-2xl font-bold">Farm Visit</h3>
                <p className="mb-6 text-sm leading-relaxed text-stone-600">
                  Come see our main farm — shed setup, safety steps, feeding plan, and ask questions
                  to the founder.
                </p>
              </div>
              <Link
                to="/farm-visit"
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-kp-red px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90"
              >
                Book Now <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Training Programs section anchor (see CTA above) */}
      <section id="training" className="relative bg-white px-6 py-16 md:px-10 md:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-kp-red">
              Training Programs
            </div>
            <h2 className="mb-4 font-display text-4xl font-extrabold md:text-5xl">
              KP Pro-Grower Training
            </h2>
            <p className="mb-6 text-stone-600">
              A 3-day training on our own farm — chick care, feed, farm safety, and how to sell your
              birds. Only 25 seats per batch.
            </p>
            <Link
              to="/training"
              className="inline-flex items-center gap-2 rounded-xl bg-kp-red px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90"
            >
              Join Now <span aria-hidden>→</span>
            </Link>
          </div>
          <div>
            <VideoSlot
              accent="red"
              label="Training Programs preview"
              src={videos.home_video_training}
            />
          </div>
        </div>
      </section>

      {/* Send us a message */}
      <MessageCard />

      {/* Blog & Articles */}
      {posts.length > 0 && (
        <section className="relative bg-white px-6 py-16 md:px-10 md:py-20 border-b border-stone-100">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <div>
                <div className="mb-3 text-xs font-bold uppercase tracking-widest text-kp-green">
                  Blog &amp; Articles
                </div>
                <h2 className="font-display text-4xl font-extrabold md:text-5xl">
                  Poultry Tips &amp; Guides
                </h2>
              </div>
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-stone-700 hover:border-kp-green hover:text-kp-green transition-all"
              >
                All Articles <span aria-hidden>→</span>
              </Link>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <PostCard key={p.id} post={p} onOpen={() => setOpenPost(p)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About Us */}
      <section id="about" className="relative bg-stone-50 px-6 py-16 md:px-10 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-3 text-xs font-bold uppercase tracking-widest text-kp-green">
            About Us
          </div>
          <h2 className="mb-8 font-display text-4xl font-extrabold md:text-5xl">
            Building Better Farmers. <span className="text-kp-green">Growing Together.</span>
          </h2>

          {/* Founder photo card — only the photo is in a card */}
          <div className="mb-10 grid gap-8 md:grid-cols-[280px_1fr] md:items-center">
            <div className="mx-auto w-full max-w-[280px] rounded-3xl border border-stone-200 bg-white p-3 shadow-sm md:mx-0">
              <FounderCarousel
                photos={FOUNDER.photos}
                initials={FOUNDER.initials}
                altBase={`${FOUNDER.name} — ${FOUNDER.role}`}
                className="!ring-0"
              />
            </div>
            <div>
              <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-kp-green/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-kp-green">
                <span className="size-1.5 rounded-full bg-kp-green" />
                Meet the Founder
              </div>
              <h3 className="font-display text-2xl font-extrabold text-stone-900 md:text-3xl">
                {FOUNDER.name}
              </h3>
              <p className="mt-1 text-sm font-semibold uppercase tracking-widest text-kp-gold">
                {FOUNDER.role}
              </p>
            </div>
          </div>

          <div className="max-w-3xl space-y-5 text-base leading-relaxed text-stone-600 md:text-lg">
            <p>
              My name is Selva Ananth, founder of KP Farm Ventures. I started this journey with one
              simple vision — to help farmers build profitable, modern, and sustainable poultry
              businesses through practical knowledge and real-world experience.
            </p>
            <p>
              Poultry farming is not just my profession; it is my passion. Every lesson I share
              comes from hands-on experience, continuous learning, and the challenges I've faced
              while building my own poultry farm.
            </p>
            <p>
              Today, KP Farm Ventures is more than just a farm. It is a platform dedicated to
              supporting new and existing poultry farmers through expert consultation, modern EC
              farm guidance, farm visits, training programs, digital resources, and quality
              equipment.
            </p>
            <p className="italic text-stone-700">"Building Better Farmers. Growing Together."</p>
          </div>

          <div className="mt-8 flex justify-center md:justify-start">
            <Link
              to="/about"
              className="inline-flex items-center gap-2 rounded-xl bg-kp-green px-6 py-3 text-sm font-bold text-white transition-all hover:opacity-90"
            >
              Read our story <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative bg-white px-6 py-16 md:px-10 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-3 text-xs font-bold uppercase tracking-widest text-kp-green">
                Reviews
              </div>
              <h2 className="font-display text-3xl font-extrabold md:text-4xl">What farmers say</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://maps.app.goo.gl/p8MTR1emjPhzFgTw5?g_st=iwb"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-bold text-stone-700 transition hover:border-kp-gold hover:bg-white hover:shadow-sm"
              >
                <span className="text-kp-gold font-bold">★★★★★</span>
                <span>Google Reviews</span>
                <span className="text-stone-400">↗</span>
              </a>
              <Link to="/testimonials" className="text-sm font-bold text-kp-green hover:underline">
                See all →
              </Link>
            </div>
          </div>
          <div className="marquee-mask group relative overflow-hidden">
            <div className="animate-marquee-x flex w-max gap-4 group-hover:[animation-play-state:paused]">
              {[...testimonials, ...testimonials].map((t, i) => {
                const isGoogle = t.place?.toLowerCase().includes("google");
                return (
                  <figure
                    key={`${t.id}-${i}`}
                    className="w-64 shrink-0 rounded-2xl border border-stone-200 bg-stone-50 p-5"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-sm text-kp-gold" aria-hidden>
                        {"★".repeat(t.rating)}
                        <span className="text-stone-300">{"★".repeat(5 - t.rating)}</span>
                      </div>
                      {isGoogle && (
                        <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[9px] font-bold text-blue-700">
                          G Google
                        </span>
                      )}
                    </div>
                    <blockquote className="mb-3 text-sm leading-relaxed text-stone-700">
                      "{t.text}"
                    </blockquote>
                    <figcaption className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      {t.name}
                      {t.place ? ` · ${t.place}` : ""}
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-center">
            <a
              href="https://maps.app.goo.gl/p8MTR1emjPhzFgTw5?g_st=iwb"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-kp-gold/40 bg-kp-gold/10 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-stone-800 hover:bg-kp-gold/20 transition-colors"
            >
              ⭐ Read & Rate us on Google Reviews ↗
            </a>
            <Link
              to="/testimonials"
              className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-stone-700 hover:border-kp-green hover:text-kp-green"
            >
              Share your story →
            </Link>
          </div>
        </div>
      </section>

      {openPost && (
        <PostModal post={openPost} onClose={() => setOpenPost(null)} />
      )}
    </PageShell>
  );
}

const FALLBACK_TESTIMONIALS: Pick<TestimonialRow, "id" | "name" | "place" | "text" | "rating">[] = [
  {
    id: "s1",
    name: "Ravi K.",
    place: "Google Review · Coimbatore",
    rating: 5,
    text: "Joined their poultry training program. Practical, simple and honest advice. Selva sir guided us step by step on shed design and feed.",
  },
  {
    id: "s2",
    name: "Murugan P.",
    place: "Google Review · Madurai",
    rating: 5,
    text: "Booked a farm visit. Seeing the live shed, water management and feeding setup gave us complete confidence to start our farm.",
  },
  {
    id: "s3",
    name: "Suresh Kumar",
    place: "Google Review · Salem",
    rating: 5,
    text: "Got consultation call for our 5000 bird shed setup. Very detailed cost estimation and equipment guidance. Worth every rupee!",
  },
];

function ServiceCard({
  index,
  color,
  title,
  desc,
  cta,
  to,
  hash,
}: {
  index: string;
  color: "red" | "green" | "gold" | "sky";
  title: string;
  desc: string;
  cta: string;
  to?: "/consultation" | "/training" | "/digital-products" | "/farm-visit";
  hash?: string;
}) {
  const colorMap = {
    red: {
      text: "text-kp-red",
      bg: "bg-kp-red/10",
      border: "hover:border-kp-red active:border-kp-red",
    },
    green: {
      text: "text-kp-green",
      bg: "bg-kp-green/10",
      border: "hover:border-kp-green active:border-kp-green",
    },
    gold: {
      text: "text-kp-gold",
      bg: "bg-kp-gold/10",
      border: "hover:border-kp-gold active:border-kp-gold",
    },
    sky: {
      text: "text-kp-sky",
      bg: "bg-kp-sky/10",
      border: "hover:border-kp-sky active:border-kp-sky",
    },
  }[color];

  const ctaClasses = `inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest transition-all group-hover:gap-2 group-active:gap-2 ${colorMap.text}`;

  return (
    <div
      data-reveal
      className={`group rounded-2xl border border-stone-100 bg-stone-50 p-5 transition-all hover:-translate-y-1 hover:shadow-lg active:-translate-y-1 active:shadow-lg ${colorMap.border}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className={`flex size-9 items-center justify-center rounded-xl ${colorMap.bg}`}>
          <span className={`font-display text-xs font-extrabold ${colorMap.text}`}>{index}</span>
        </div>
        <div className={`text-[9px] font-bold uppercase tracking-widest ${colorMap.text}`}>
          KP · {index}
        </div>
      </div>
      <h3 className="mb-2 font-display text-base font-bold">{title}</h3>
      <p className="mb-4 text-xs leading-relaxed text-stone-600">{desc}</p>
      {hash ? (
        <a href={`#${hash}`} className={ctaClasses}>
          {cta} <span aria-hidden>→</span>
        </a>
      ) : to ? (
        <Link to={to} className={ctaClasses}>
          {cta} <span aria-hidden>→</span>
        </Link>
      ) : null}
    </div>
  );
}

function VideoSlot({
  accent,
  label,
  src,
}: {
  accent: "red" | "green" | "gold" | "sky";
  label: string;
  src?: string;
}) {
  const ring = {
    red: "ring-kp-red/20 bg-kp-red/5 text-kp-red",
    green: "ring-kp-green/20 bg-kp-green/5 text-kp-green",
    gold: "ring-kp-gold/20 bg-kp-gold/5 text-kp-gold",
    sky: "ring-kp-sky/20 bg-kp-sky/5 text-kp-sky",
  }[accent];

  return (
    <div className={`relative mb-5 aspect-video w-full overflow-hidden rounded-2xl ring-1 ${ring}`}>
      {src ? (
        isVideoMediaUrl(src) ? (
          <video
            src={src}
            autoPlay
            muted
            loop
            controls
            playsInline
            preload="auto"
            className="h-full w-full object-cover"
            aria-label={label}
          />
        ) : (
          <img src={src} alt={label} className="h-full w-full object-cover" />
        )
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-white/60 to-transparent">
          <div className="flex size-12 items-center justify-center rounded-full bg-white shadow-md">
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">{label}</div>
          <div className="text-[10px] text-stone-500">Video coming soon</div>
        </div>
      )}
    </div>
  );
}
