import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/page-shell";
import { FounderCarousel } from "@/components/site/founder-carousel";
import founderFamily from "@/assets/founder-family.jpg.asset.json";
import founderFormal from "@/assets/founder-formal.png.asset.json";
import founderYellow from "@/assets/founder-yellow.jpg.asset.json";
import founderTea from "@/assets/founder-tea-estate.jpg.asset.json";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About KP Farm Ventures — Our Story" },
      {
        name: "description",
        content:
          "KP Farm Ventures is a real poultry farm helping new farmers plan, build, and grow a poultry farm that makes money across South India.",
      },
      { property: "og:title", content: "About — KP Farm Ventures" },
      {
        property: "og:description",
        content: "The team, story and farm behind KP Farm Ventures.",
      },
    ],
  }),
  component: About,
});

// ============================================================
// FOUNDER + FAMILY PHOTOS — edit these to update the About page.
// Add family photos to the `photos` array below. Each entry:
//   { url: "/family-1.jpg", caption: "Optional short line" }
// Photos placed in /public can be referenced as "/family-1.jpg".
// Leave the array empty to show the "KP" initials placeholder.
// ============================================================
const FOUNDER = {
  name: "Selva Ananth",
  role: "Founder, KP Farm Ventures",
  initials: "SA",
  photos: [
    { url: founderFamily.url },
    { url: founderFormal.url, zoom: 1.25 },
    { url: founderTea.url },
    { url: founderYellow.url },
  ] as { url: string; caption?: string }[],
};

function About() {
  return (
    <PageShell>
      <PageHero
        eyebrow="About Us"
        title="Building Better Farmers."
        accent="Growing Together."
        desc="A family-driven business helping new and existing poultry farmers succeed with practical knowledge and real-world experience."
      />

      <section className="px-6 pb-24 md:px-10">
        <div className="mx-auto max-w-4xl space-y-10 text-lg leading-relaxed text-stone-700">
          {/* ---------- Founder card (top) ---------- */}
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-kp-green/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-kp-green">
              <span className="size-1.5 rounded-full bg-kp-green" />
              Meet the Founder
            </div>
            <div className="grid gap-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:grid-cols-[300px_1fr] md:p-10">
              <div className="mx-auto w-full max-w-[300px] md:mx-0">
                <FounderCarousel
                  photos={FOUNDER.photos}
                  initials={FOUNDER.initials}
                  altBase={`${FOUNDER.name} — ${FOUNDER.role}`}
                />
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="font-display text-2xl font-extrabold text-stone-900 md:text-3xl">
                  {FOUNDER.name}
                </h3>
                <p className="mt-1 text-sm font-semibold uppercase tracking-widest text-kp-gold">
                  {FOUNDER.role}
                </p>
              </div>
            </div>
          </div>

          <p>
            My name is Selva Ananth, founder of KP Farm Ventures. I started this journey with one
            simple vision — to help farmers build profitable, modern, and sustainable poultry
            businesses through practical knowledge and real-world experience.
          </p>

          <p>
            Poultry farming is not just my profession; it is my passion. Every lesson I share comes
            from hands-on experience, continuous learning, and the challenges I've faced while
            building my own poultry farm.
          </p>

          <div>
            <p>
              Today, KP Farm Ventures is more than just a farm. It is a platform dedicated to
              supporting new and existing poultry farmers through:
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>Expert poultry farm consultation</li>
              <li>Modern EC poultry farm guidance</li>
              <li>Farm visit and practical training programs</li>
              <li>Online and offline poultry courses</li>
              <li>Digital products, guides, and farm management resources</li>
              <li>Quality poultry equipment and related product recommendations</li>
            </ul>
          </div>

          <p>
            Behind this journey is my family's constant support. Their encouragement, belief, and
            sacrifices have been the foundation of everything we have built. KP Farm Ventures is a
            family-driven business with a mission to create value for every farmer who trusts us.
          </p>

          <p>
            Our goal is simple: to make poultry farming easier, smarter, and more profitable for
            everyone. Whether you are planning your first poultry shed or looking to improve an
            existing farm, we are here to guide you with practical solutions and honest advice.
          </p>

          <p>
            Thank you for being part of our journey. We look forward to helping you achieve success
            in poultry farming.
          </p>

          <div className="border-t border-stone-200 pt-6">
            <p className="font-display text-xl font-extrabold text-stone-900">KP Farm Ventures</p>
            <p className="mt-1 italic text-stone-600">
              "Building Better Farmers. Growing Together."
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
