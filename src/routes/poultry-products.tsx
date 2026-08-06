import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageShell, PageHero } from "@/components/site/page-shell";
import { OrderModal, type OrderItem } from "@/components/site/order-modal";
import { ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/poultry-products")({
  head: () => ({
    meta: [
      { title: "Farm Products — Equipment, Safety Gear & Feed Add-ons | KP Farm Ventures" },
      {
        name: "description",
        content:
          "Our own feeders, drinkers, brooders and picked Amazon links for safety gear, masks, medicines and feed add-ons.",
      },
      { property: "og:title", content: "Farm Products — KP Farm Ventures" },
      {
        property: "og:description",
        content: "Our own products and trusted Amazon picks for every part of your poultry farm.",
      },
    ],
  }),
  component: PoultryProducts,
});

type Product = {
  id: string;
  type: "poultry" | "affiliate";
  name: string;
  description: string | null;
  category: string | null;
  price: number | null;
  offer_price: number | null;
  image_url: string | null;
  external_url: string | null;
};

async function resolveImage(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const { data } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

function PoultryProducts() {
  const [tab, setTab] = useState<"affiliate" | "own">("affiliate");
  const [order, setOrder] = useState<OrderItem | null>(null);
  const [rows, setRows] = useState<(Product & { _img: string | null })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("products")
        .select(
          "id, type, name, description, category, price, offer_price, image_url, external_url",
        )
        .in("type", ["poultry", "affiliate"])
        .eq("active", true)
        .order("created_at", { ascending: false });
      const list = (data as Product[]) ?? [];
      const withImg = await Promise.all(
        list.map(async (p) => ({ ...p, _img: await resolveImage(p.image_url) })),
      );
      setRows(withImg);
      setLoading(false);
    })();
  }, []);

  const affiliate = useMemo(() => rows.filter((r) => r.type === "affiliate"), [rows]);
  const own = useMemo(() => rows.filter((r) => r.type === "poultry"), [rows]);

  return (
    <PageShell>
      <PageHero
        eyebrow="Farm Products"
        title="Trusted gear from"
        accent="Amazon and our own farm"
        desc="One place for the equipment we use on our farm, plus safe Amazon links for other trusted brands."
      />

      <section className="px-6 pb-24 md:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 inline-flex rounded-full border border-stone-200 bg-white p-1">
            <button
              onClick={() => setTab("affiliate")}
              className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                tab === "affiliate" ? "bg-kp-green text-white" : "text-stone-600"
              }`}
            >
              Amazon Picks
            </button>
            <button
              onClick={() => setTab("own")}
              className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                tab === "own" ? "bg-kp-green text-white" : "text-stone-600"
              }`}
            >
              Our Own Products
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-6 animate-spin text-kp-green" />
            </div>
          ) : tab === "affiliate" ? (
            affiliate.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {affiliate.map((p) => (
                  <article
                    key={p.id}
                    className="group overflow-hidden rounded-3xl border border-stone-200 bg-white transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-amber-100 via-orange-50 to-red-50">
                      {p._img && (
                        <img src={p._img} alt={p.name} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="p-6">
                      <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-kp-gold">
                        Amazon Pick
                      </div>
                      <h3 className="mb-3 font-display text-lg font-bold">{p.name}</h3>
                      {(p.offer_price != null || p.price != null) && (
                        <div className="mb-4 flex items-baseline gap-2">
                          <span className="font-display text-2xl font-extrabold text-kp-red">
                            ₹{p.offer_price ?? p.price}
                          </span>
                          {p.price != null &&
                            p.offer_price != null &&
                            p.price !== p.offer_price && (
                              <span className="text-sm text-stone-400 line-through">
                                ₹{p.price}
                              </span>
                            )}
                        </div>
                      )}
                      <a
                        href={p.external_url || "https://amazon.in"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF9900] py-2.5 text-sm font-bold text-stone-900 transition hover:brightness-95"
                      >
                        Buy from Amazon <ExternalLink size={14} />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )
          ) : own.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {own.map((p) => (
                <article
                  key={p.id}
                  className="group overflow-hidden rounded-3xl border border-stone-200 bg-white transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-kp-green/10 via-emerald-50 to-lime-50">
                    {p._img ? (
                      <img src={p._img} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center font-display text-4xl font-extrabold text-kp-green">
                        {p.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    {p.category && (
                      <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-kp-green">
                        {p.category}
                      </div>
                    )}
                    <h3 className="mb-3 font-display text-lg font-bold">{p.name}</h3>
                    {p.description && <ExpandableDescription text={p.description} />}
                    <button
                      onClick={() =>
                        setOrder({
                          id: p.id,
                          title: p.name,
                          price: p.offer_price ?? p.price ?? 0,
                          tag: p.category ?? "Farm",
                        })
                      }
                      className="w-full rounded-xl bg-kp-green py-2.5 text-sm font-bold uppercase tracking-widest text-white hover:opacity-90"
                    >
                      Buy Now
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
      <OrderModal item={order} onClose={() => setOrder(null)} />
    </PageShell>
  );
}

function ExpandableDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const maxLen = 75;

  if (text.length <= maxLen) {
    return <p className="mb-3 text-sm leading-relaxed text-stone-500">{text}</p>;
  }

  return (
    <div className="mb-3">
      <p className="text-sm leading-relaxed text-stone-500">
        {expanded ? text : `${text.slice(0, maxLen)}... `}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="ml-1 text-xs font-bold text-kp-green hover:underline focus:outline-none"
        >
          {expanded ? "read less" : "read more"}
        </button>
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-16 text-center text-sm text-stone-500">
      No products in this section yet. Please check back soon.
    </div>
  );
}
