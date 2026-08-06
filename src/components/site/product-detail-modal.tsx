import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ShoppingBag } from "lucide-react";

export type ProductDetail = {
  id: string;
  name: string;
  price?: number | null;
  offer_price?: number | null;
  category?: string | null;
  image_url?: string | null;
  description?: string | null;
};

export function ProductDetailModal({
  product,
  onClose,
  onBuy,
}: {
  product: ProductDetail | null;
  onClose: () => void;
  onBuy: (product: ProductDetail) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (product) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [product, onClose]);

  if (!product) return null;
  if (typeof document === "undefined") return null;

  const price = product.offer_price ?? product.price ?? 0;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[90] flex items-end justify-center bg-stone-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full bg-stone-900/40 text-white backdrop-blur-md hover:bg-stone-900/60"
        >
          <X size={18} />
        </button>

        {/* Product Image */}
        <div className="relative aspect-video w-full overflow-hidden bg-stone-100">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-kp-green/10 via-kp-gold/10 to-kp-red/10 text-stone-400">
              <ShoppingBag size={48} className="text-stone-300" />
            </div>
          )}
          {product.category && (
            <div className="absolute left-4 top-4 rounded-full bg-stone-900/70 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
              {product.category}
            </div>
          )}
        </div>

        {/* Details Content */}
        <div className="p-6 sm:p-8">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-2xl font-extrabold text-stone-900 sm:text-3xl">
              {product.name}
            </h2>
            {price > 0 && (
              <div className="flex items-baseline gap-2">
                {product.offer_price != null && product.price != null && product.price > product.offer_price && (
                  <span className="text-sm font-semibold text-stone-400 line-through">
                    ₹{product.price}
                  </span>
                )}
                <span className="font-display text-2xl font-extrabold text-kp-green">
                  ₹{price}
                </span>
              </div>
            )}
          </div>

          {/* Full Description */}
          <div className="mb-8 border-t border-stone-100 pt-4">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-stone-400">
              Description & Details
            </h3>
            <p className="whitespace-pre-line text-sm leading-relaxed text-stone-600 sm:text-base">
              {product.description || "No description provided for this product."}
            </p>
          </div>

          {/* Buy Now Button */}
          <button
            onClick={() => {
              onClose();
              onBuy(product);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-kp-green py-4 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-kp-green/20 transition-all hover:bg-kp-green/90"
          >
            Buy Now {price > 0 ? `· ₹${price}` : ""}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
