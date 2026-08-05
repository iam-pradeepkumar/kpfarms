import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell, PageHero } from "@/components/site/page-shell";
import { OrderModal, type OrderItem } from "@/components/site/order-modal";
import { Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/digital-products")({
  head: () => ({
    meta: [
      { title: "Digital Products — E-books, Excel Sheets & Farm Records | KP Farm Ventures" },
      {
        name: "description",
        content:
          "Download e-books, Excel sheets, stock lists, batch reports, money trackers and farm record files for poultry farmers.",
      },
      { property: "og:title", content: "Digital Products — KP Farm Ventures" },
      {
        property: "og:description",
        content: "Ready-to-use farm sheets and e-books made by real poultry farmers.",
      },
    ],
  }),
  component: DigitalProducts,
});

type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number | null;
  offer_price: number | null;
  image_url: string | null;
};

async function resolveImage(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const { data } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

function DigitalProducts() {
  const [order, setOrder] = useState<OrderItem | null>(null);
  const [products, setProducts] = useState<(Product & { _img: string | null })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, description, category, price, offer_price, image_url")
        .eq("type", "digital")
        .eq("active", true)
        .order("created_at", { ascending: false });
      const rows = (data as Product[]) ?? [];
      const withImg = await Promise.all(
        rows.map(async (p) => ({ ...p, _img: await resolveImage(p.image_url) })),
      );
      setProducts(withImg);
      setLoading(false);
    })();
  }, []);

  return (
    <PageShell>
      <PageHero
        eyebrow="Digital Products"
        title="Ready-to-use tools for"
        accent="modern farm owners"
        desc="Simple sheets, forms, and e-books that work well with your daily farm work. Sent on WhatsApp after we check your payment."
      />

      <section className="px-6 py-16 md:px-10">
        <div className="mx-auto max-w-6xl">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-6 animate-spin text-kp-green" />
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-16 text-center text-sm text-stone-500">
              No products yet. Please check back soon.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <article
                  key={p.id}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-kp-gold/15 via-kp-green/10 to-kp-red/10">
                    {p._img ? (
                      <img src={p._img} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex size-16 items-center justify-center rounded-2xl bg-white shadow-md">
                        <Download className="text-kp-green" />
                      </div>
                    )}
                    {p.category && (
                      <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-kp-green shadow">
                        {p.category}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="mb-2 font-display text-lg font-bold">{p.name}</h3>
                    {p.description && (
                      <p className="mb-3 line-clamp-2 text-sm text-stone-500">{p.description}</p>
                    )}
                    {(p.offer_price != null || p.price != null) && (
                      <div className="mb-4 flex items-baseline gap-2">
                        {p.offer_price != null && (
                          <span className="font-display text-2xl font-extrabold text-kp-green">
                            ₹{p.offer_price}
                          </span>
                        )}
                        {p.price != null && p.offer_price != null && p.price !== p.offer_price ? (
                          <span className="text-sm text-stone-400 line-through">₹{p.price}</span>
                        ) : p.offer_price == null && p.price != null ? (
                          <span className="font-display text-2xl font-extrabold text-kp-green">
                            ₹{p.price}
                          </span>
                        ) : null}
                      </div>
                    )}
                    <button
                      onClick={() =>
                        setOrder({
                          id: p.id,
                          title: p.name,
                          price: p.offer_price ?? p.price ?? 0,
                          tag: p.category ?? "Digital",
                        })
                      }
                      className="mt-auto rounded-xl bg-kp-green py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:opacity-90"
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
