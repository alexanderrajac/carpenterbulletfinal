import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { resolveImage } from "@/lib/product-images";
import { formatPrice } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { useWishlist } from "@/lib/wishlist-store";
import { useCart } from "@/lib/cart-store";
import { Heart, ShoppingBag, Eye, Zap, Star, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useRef, useCallback } from "react";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  image_url: string | null;
  categories?: { name: string } | null;
  vendor_profiles?: { id: string; business_name: string } | null;
};

export function ProductCard({ p, index = 0 }: { p: ProductCardData; index?: number }) {
  const addToCart = useCart((s) => s.add);
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price_cents: p.price_cents,
      image_url: p.image_url,
      vendor_id: p.vendor_profiles?.id || null,
      vendor_name: p.vendor_profiles?.business_name || null,
    });
    navigate({ to: "/checkout" });
  };

  const handleVendorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (p.vendor_profiles) {
      navigate({ to: `/carpenter/${p.vendor_profiles.id}` });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.25) }}
    >
      <Link to="/product/$slug" params={{ slug: p.slug }} className="group block relative h-full">
        <div
          ref={cardRef}
          className="relative rounded-2xl overflow-hidden bg-card border border-border/50 shadow-xs transition-all duration-300 hover:shadow-md hover:border-primary/40 flex flex-col h-full"
        >
          {/* Clean Unblocked Image Container */}
          <div className="aspect-square overflow-hidden relative bg-muted/40 p-2 flex items-center justify-center">
            <img
              src={resolveImage(p.image_url, "f_auto,q_auto,w_600")}
              alt={p.name}
              loading="lazy"
              width={1024}
              height={1024}
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-103"
            />

            {/* Top-left subtle trust badge */}
            <div className="absolute left-2.5 top-2.5 z-10 pointer-events-none">
              <span className="bg-emerald-950/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
                ✓ Solid Wood
              </span>
            </div>
          </div>

          {/* Product info & Clean Buy CTA */}
          <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
            <div>
              {p.categories?.name && (
                <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] text-primary font-bold">
                  {p.categories.name}
                </p>
              )}
              <h3 className="mt-1 font-display text-sm sm:text-base font-semibold leading-snug text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-200">
                {p.name}
              </h3>
              {p.vendor_profiles && (
                <div className="mt-1 text-[10px] text-muted-foreground flex items-center gap-1 flex-wrap">
                  <span>Sold by:</span>
                  <button
                    type="button"
                    onClick={handleVendorClick}
                    className="underline text-amber-700 dark:text-amber-500 hover:text-primary transition-colors font-semibold cursor-pointer"
                  >
                    {p.vendor_profiles.business_name}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-3 pt-2.5 border-t border-border/40">
              {/* Pricing row */}
              <div className="flex items-baseline justify-between gap-1 flex-wrap">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-bold tabular-nums text-sm sm:text-base font-mono text-foreground">
                    {formatPrice(p.price_cents)}
                  </span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground line-through font-mono opacity-60">
                    {formatPrice(Math.round(p.price_cents * 1.25))}
                  </span>
                </div>
                <span className="text-[9px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono">
                  20% OFF
                </span>
              </div>

              {/* Single Clean Buy Button */}
              <button
                type="button"
                onClick={handleBuyNow}
                className="mt-3 w-full flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Zap className="h-3.5 w-3.5 fill-current" />
                <span>Buy Now</span>
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="space-y-0 rounded-2xl border border-border/40 overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="p-3 sm:p-4 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-5 w-3/4" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}
