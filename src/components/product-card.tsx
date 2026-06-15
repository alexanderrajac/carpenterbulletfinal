import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { resolveImage } from "@/lib/product-images";
import { formatPrice } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { useWishlist } from "@/lib/wishlist-store";
import { useCart } from "@/lib/cart-store";
import { Heart, ShoppingBag, Eye } from "lucide-react";
import { toast } from "sonner";
import { useRef, useCallback } from "react";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  image_url: string | null;
  categories?: { name: string } | null;
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
    });
    toast.success(`Added ${p.name} to cart`);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate({ to: `/product/${p.slug}` });
  };

  // 3D tilt effect
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
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
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        to="/product/$slug"
        params={{ slug: p.slug }}
        className="group block relative"
      >
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="card-3d-interactive relative rounded-2xl overflow-hidden bg-card border border-border/40 shadow-sm"
        >
          {/* Shine overlay */}
          <div className="card-3d-shine" />

          {/* Image */}
          <div className="aspect-square overflow-hidden relative">
            <img
              src={resolveImage(p.image_url)}
              alt={p.name}
              loading="lazy"
              width={1024}
              height={1024}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />

            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Top-right actions */}
            <div className="absolute right-2.5 top-2.5 z-10 flex flex-col gap-2">
              <button
                onClick={handleWishlistToggle}
                className={`p-2 rounded-full backdrop-blur-md border shadow-sm transition-all duration-300 cursor-pointer ${
                  isWishlisted
                    ? "bg-red-500/90 border-red-400 text-white"
                    : "bg-white/80 dark:bg-black/50 border-white/30 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-white hover:text-red-500"
                }`}
                title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart className={`h-3.5 w-3.5 ${isWishlisted ? "fill-current" : ""}`} />
              </button>
            </div>

            {/* Bottom hover actions */}
            <div className="absolute bottom-0 left-0 right-0 p-3 flex gap-2 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
              <button
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold py-2.5 rounded-xl shadow-lg hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                Add to Cart
              </button>
              <button
                onClick={handleQuickView}
                className="flex items-center justify-center gap-1.5 bg-white/90 dark:bg-white/10 backdrop-blur-md text-foreground text-xs font-semibold px-3 py-2.5 rounded-xl shadow-lg hover:bg-white dark:hover:bg-white/20 transition-colors cursor-pointer border border-white/30"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Product info */}
          <div className="p-3 sm:p-4">
            {p.categories?.name && (
              <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] text-primary font-bold">{p.categories.name}</p>
            )}
            <h3 className="mt-1 font-display text-sm sm:text-base font-medium leading-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-300">{p.name}</h3>
            <div className="mt-2 flex items-center justify-between">
              <p className="font-semibold tabular-nums text-sm sm:text-base font-mono text-foreground">{formatPrice(p.price_cents)}</p>
              <div className="flex items-center gap-0.5 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className={`h-3 w-3 ${i < 4 ? "fill-current" : "opacity-30 fill-current"}`} viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
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
