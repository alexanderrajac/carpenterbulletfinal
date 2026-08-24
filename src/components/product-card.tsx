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
  const toggle = useWishlist((s) => s.toggle);
  const isWishlisted = useWishlist((s) => s.has(p.id));
  const addToCart = useCart((s) => s.add);
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price_cents: p.price_cents,
      image_url: p.image_url,
      categories: p.categories,
    });
    if (isWishlisted) {
      toast.success(`Removed ${p.name} from wishlist`);
    } else {
      toast.success(`Added ${p.name} to wishlist`);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
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
    toast.success(`Added ${p.name} to cart`);
  };

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

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate({ to: `/product/${p.slug}` });
  };

  const handleWhatsAppEnquiry = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const text = `Hi CarpenterBullet! I am interested in ordering/customizing "${p.name}" (Price: ${formatPrice(p.price_cents)}). Please share details & availability. Link: https://www.carpenterbullet.com/product/${p.slug}`;
    const url = `https://wa.me/918248651695?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleVendorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (p.vendor_profiles) {
      navigate({ to: `/carpenter/${p.vendor_profiles.id}` });
    }
  };

  // Detect touch device to disable 3D tilt
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // 3D tilt effect — disabled on touch devices
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;

    cardRef.current.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    cardRef.current.style.setProperty("--mouse-x", `${(x / rect.width) * 100}%`);
    cardRef.current.style.setProperty("--mouse-y", `${(y / rect.height) * 100}%`);
  }, [isTouchDevice]);

  const handleMouseLeave = useCallback(() => {
    if (isTouchDevice || !cardRef.current) return;
    cardRef.current.style.transform =
      "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  }, [isTouchDevice]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
    >
      <Link to="/product/$slug" params={{ slug: p.slug }} className="group block relative">
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="card-3d-interactive relative rounded-2xl overflow-hidden bg-card border border-border/40 shadow-sm transition-shadow duration-300 hover:shadow-lg hover:border-primary/40"
        >
          {/* Shine overlay */}
          <div className="card-3d-shine" />

          {/* Image */}
          <div className="aspect-square overflow-hidden relative bg-muted/30">
            <img
              src={resolveImage(p.image_url, "f_auto,q_auto,w_600")}
              alt={p.name}
              loading="lazy"
              width={1024}
              height={1024}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Top-left trust badge */}
            <div className="absolute left-2 top-2 z-10">
              <span className="bg-emerald-950/85 backdrop-blur-md text-emerald-300 border border-emerald-500/30 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                ✓ 100% Solid Wood
              </span>
            </div>

            {/* Top-right actions — always visible on mobile */}
            <div className="absolute right-2 top-2 sm:right-2.5 sm:top-2.5 z-10 flex flex-col gap-1.5">
              <button
                onClick={handleWishlistToggle}
                className={`p-2.5 sm:p-2 rounded-full backdrop-blur-md border shadow-sm transition-all duration-300 cursor-pointer ${
                  isWishlisted
                    ? "bg-red-500/90 border-red-400 text-white"
                    : "bg-white/85 dark:bg-black/60 border-white/30 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-white hover:text-red-500"
                }`}
                title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart className={`h-4 w-4 sm:h-3.5 sm:w-3.5 ${isWishlisted ? "fill-current" : ""}`} />
              </button>
              <button
                onClick={handleWhatsAppEnquiry}
                className="p-2.5 sm:p-2 rounded-full bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-400/40 shadow-sm backdrop-blur-md transition-all duration-200 cursor-pointer"
                title="Direct WhatsApp Quote"
              >
                <MessageCircle className="h-4 w-4 sm:h-3.5 sm:w-3.5 fill-current" />
              </button>
            </div>

            {/* Bottom actions — always visible on mobile, hover-reveal on desktop */}
            <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-2.5 flex gap-1.5 translate-y-0 sm:translate-y-full sm:group-hover:translate-y-0 transition-transform duration-300 ease-out">
              <button
                onClick={handleBuyNow}
                className="flex-1 flex items-center justify-center gap-1 bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold py-2 rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer"
                title="Buy now with 1-click checkout"
              >
                <Zap className="h-3.5 w-3.5 fill-current" />
                <span>Buy Now</span>
              </button>
              <button
                onClick={handleAddToCart}
                className="flex items-center justify-center gap-1 bg-primary text-primary-foreground text-[11px] font-semibold px-2.5 py-2 rounded-xl shadow-lg hover:bg-primary/90 active:scale-95 transition-all cursor-pointer"
                title="Add to Cart"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Cart</span>
              </button>
              <button
                onClick={handleQuickView}
                className="flex items-center justify-center bg-white/90 dark:bg-white/10 backdrop-blur-md text-foreground text-[11px] p-2 rounded-xl shadow-lg hover:bg-white dark:hover:bg-white/20 active:scale-95 transition-all cursor-pointer border border-white/30"
                title="Quick View"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Product info */}
          <div className="p-3 sm:p-4">
            {p.categories?.name && (
              <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] text-primary font-bold">
                {p.categories.name}
              </p>
            )}
            <h3 className="mt-1 font-display text-sm sm:text-base font-medium leading-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-300">
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
            <div className="mt-2 flex items-baseline justify-between gap-1 flex-wrap">
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold tabular-nums text-sm sm:text-base font-mono text-foreground">
                  {formatPrice(p.price_cents)}
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground line-through font-mono opacity-70">
                  {formatPrice(Math.round(p.price_cents * 1.3))}
                </span>
              </div>
              <span className="text-[9px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono">
                23% OFF
              </span>
            </div>

            <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1 text-amber-500 font-semibold">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                <span className="text-foreground text-xs font-bold">4.8</span>
                <span className="text-[10px] text-muted-foreground">(94)</span>
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                Free Crated Delivery
              </span>
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
