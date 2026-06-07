import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { resolveImage } from "@/lib/product-images";
import { formatPrice } from "@/lib/format";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  image_url: string | null;
  categories?: { name: string } | null;
};

export function ProductCard({ p, index = 0 }: { p: ProductCardData; index?: number }) {
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
        className="group block"
      >
        <div className="aspect-square overflow-hidden rounded-2xl bg-muted">
          <img
            src={resolveImage(p.image_url)}
            alt={p.name}
            loading="lazy"
            width={1024}
            height={1024}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </div>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            {p.categories?.name && (
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{p.categories.name}</p>
            )}
            <h3 className="mt-1 font-display text-lg font-medium leading-tight">{p.name}</h3>
          </div>
          <p className="font-medium tabular-nums">{formatPrice(p.price_cents)}</p>
        </div>
      </Link>
    </motion.div>
  );
}
