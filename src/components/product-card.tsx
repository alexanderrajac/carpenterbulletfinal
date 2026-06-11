import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { resolveImage } from "@/lib/product-images";
import { formatPrice } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { useWishlist } from "@/lib/wishlist-store";
import { Heart } from "lucide-react";
import { toast } from "sonner";

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Link
        to="/product/$slug"
        params={{ slug: p.slug }}
        className="group block relative"
      >
        <div className="aspect-square overflow-hidden rounded-2xl bg-muted relative">
          <img
            src={resolveImage(p.image_url)}
            alt={p.name}
            loading="lazy"
            width={1024}
            height={1024}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <button
            onClick={handleWishlistToggle}
            className="absolute right-3 top-3 z-10 p-2 rounded-full bg-background/80 backdrop-blur-md border border-border/60 shadow-sm hover:bg-background transition-colors cursor-pointer"
            title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-foreground"}`} />
          </button>
        </div>
        <div className="mt-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4">
          <div>
            {p.categories?.name && (
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">{p.categories.name}</p>
            )}
            <h3 className="mt-0.5 font-display text-sm sm:text-lg font-medium leading-tight text-foreground line-clamp-2">{p.name}</h3>
          </div>
          <p className="font-semibold tabular-nums text-sm sm:text-base font-mono shrink-0">{formatPrice(p.price_cents)}</p>
        </div>
      </Link>
    </motion.div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-5 w-3/4" />
        </div>
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  );
}
