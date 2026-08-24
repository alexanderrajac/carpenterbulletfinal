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
          {/* Full-display Image Container — tall ratio on mobile so full product is visible */}
          <div className="relative overflow-hidden bg-muted/30" style={{ paddingBottom: '100%', position: 'relative' }}>
            <div className="absolute inset-0 flex items-center justify-center p-1.5 sm:p-2">
              <img
                src={resolveImage(p.image_url, "f_auto,q_auto,w_700")}
                alt={p.name}
                loading="lazy"
                width={700}
                height={700}
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                style={{ maxHeight: '100%', maxWidth: '100%' }}
              />
            </div>

            {/* Top-left solid wood trust badge */}
            <div className="absolute left-2 top-2 z-10 pointer-events-none">
              <span className="bg-emerald-950/85 backdrop-blur-sm text-emerald-300 border border-emerald-500/30 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full shadow-sm">
                ✓ Solid Wood
              </span>
            </div>

            {/* Discount badge top-right */}
            <div className="absolute right-2 top-2 z-10 pointer-events-none">
              <span className="bg-amber-500 text-white text-[8px] sm:text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm">
                20% OFF
              </span>
            </div>
          </div>

          {/* Product info & Buy CTA — compact for mobile */}
          <div className="px-2.5 pt-2 pb-2.5 sm:px-3.5 sm:pt-2.5 sm:pb-3 flex-1 flex flex-col justify-between">
            <div>
              {p.categories?.name && (
                <p className="text-[8px] sm:text-[10px] uppercase tracking-[0.12em] text-primary font-bold truncate">
                  {p.categories.name}
                </p>
              )}
              <h3 className="mt-0.5 font-display text-[11px] sm:text-sm font-semibold leading-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-200">
                {p.name}
              </h3>
              {p.vendor_profiles && (
                <div className="mt-0.5 text-[9px] sm:text-[10px] text-muted-foreground flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleVendorClick}
                    className="underline text-amber-700 dark:text-amber-500 hover:text-primary transition-colors font-medium cursor-pointer truncate max-w-full"
                  >
                    {p.vendor_profiles.business_name}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-2 pt-1.5 border-t border-border/40">
              {/* Price row — clean and tight */}
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold tabular-nums text-xs sm:text-sm font-mono text-foreground">
                  {formatPrice(p.price_cents)}
                </span>
                <span className="text-[9px] sm:text-xs text-muted-foreground line-through font-mono opacity-50">
                  {formatPrice(Math.round(p.price_cents * 1.25))}
                </span>
              </div>

              {/* Buy Now button — full width, compact height on mobile */}
              <button
                type="button"
                onClick={handleBuyNow}
                className="mt-2 w-full flex items-center justify-center gap-1 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-[10px] sm:text-xs py-2 sm:py-2.5 px-2 rounded-lg sm:rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current shrink-0" />
                <span>⚡ Buy Now</span>
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
