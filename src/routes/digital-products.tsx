import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell, PageHero } from "@/components/site/page-shell";
import { OrderModal, type OrderItem } from "@/components/site/order-modal";
import { ProductDetailModal, type ProductDetail } from "@/components/site/product-detail-modal";
import { Download, Loader2, Eye } from "lucide-react";
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
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
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

  const openOrder = (p: { id: string; name: string; price?: number | null; offer_price?: number | null; category?: string | null; _img?: string | null; image_url?: string | null }) => {
    setOrder({
      id: p.id,
      title: p.name,
      price: p.offer_price ?? p.price ?? 0,
      tag: p.category ?? "Digital",
      image_url: p._img ?? p.image_url ?? null,
    });
  };

  return (
    <PageShell>
      <PageHero
        eyebrow="Digital Products"
        title="Ready-to-use tools for"
        accent="modern farm owners"
        desc="Simple sheets, forms, and e-books that work well with your daily farm work. Click any product to view details or buy now."
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
                  {/* Clickable Image -> Opens Details Modal */}
                  <div
                    onClick={() =>
                      setSelectedProduct({
                        id: p.id,
                        name: p.name,
                        price: p.price,
                        offer_price: p.offer_price,
                        category: p.category,
                        image_url: p._img,
                        description: p.description,
                      })
                    }
                    className="relative flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden bg-gradient-to-br from-kp-gold/15 via-kp-green/10 to-kp-red/10"
                  >
                    {p._img ? (
                      <img src={p._img} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
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
                    <div className="absolute inset-0 flex items-center justify-center bg-stone-900/20 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 text-xs font-bold text-stone-900 shadow-md backdrop-blur-sm">
                        <Eye size={14} /> View Details
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h3
                      onClick={() =>
                        setSelectedProduct({
                          id: p.id,
                          name: p.name,
                          price: p.price,
                          offer_price: p.offer_price,
                          category: p.category,
                          image_url: p._img,
                          description: p.description,
                        })
                      }
                      className="mb-2 cursor-pointer font-display text-lg font-bold hover:text-kp-green"
                    >
                      {p.name}
                    </h3>
                    
                    {p.description && (
                      <p
                        onClick={() =>
                          setSelectedProduct({
                            id: p.id,
                            name: p.name,
                            price: p.price,
                            offer_price: p.offer_price,
                            category: p.category,
                            image_url: p._img,
                            description: p.description,
                          })
                        }
                        className="mb-4 cursor-pointer text-xs leading-relaxed text-stone-500 line-clamp-2 hover:text-stone-700"
                      >
                        {p.description}
                      </p>
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

                    <div className="mt-auto flex gap-2">
                      <button
                        onClick={() =>
                          setSelectedProduct({
                            id: p.id,
                            name: p.name,
                            price: p.price,
                            offer_price: p.offer_price,
                            category: p.category,
                            image_url: p._img,
                            description: p.description,
                          })
                        }
                        className="flex-1 rounded-xl border border-stone-200 bg-stone-50 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-100"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => openOrder(p)}
                        className="flex-1 rounded-xl bg-kp-green py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:opacity-90"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onBuy={(prod) => openOrder(prod)}
      />

      {/* Multi-step Order Modal */}
      <OrderModal item={order} onClose={() => setOrder(null)} />
    </PageShell>
  );
}
