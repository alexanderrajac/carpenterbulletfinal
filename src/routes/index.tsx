import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { listProducts, listCategories } from "@/lib/products.functions";
import { ProductCard } from "@/components/product-card";
import { heroImage, resolveImage } from "@/lib/product-images";

const featuredQO = queryOptions({
  queryKey: ["products", { featured: true }],
  queryFn: () => listProducts({ data: { featured: true } }),
});
const categoriesQO = queryOptions({ queryKey: ["categories"], queryFn: () => listCategories() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Woodverse — Handcrafted Carpentry & Wood Goods" },
      { name: "description", content: "Heirloom-grade furniture, kitchenware and tools by master carpenters. Built to last generations." },
      { property: "og:title", content: "Woodverse — Handcrafted Carpentry" },
      { property: "og:description", content: "Heirloom-grade furniture, kitchenware and tools." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(featuredQO);
    context.queryClient.ensureQueryData(categoriesQO);
  },
  component: Home,
  errorComponent: ({ error }) => <div className="p-12 text-center">{error.message}</div>,
});

function Home() {
  const { data: featured } = useSuspenseQuery(featuredQO);
  const { data: categories } = useSuspenseQuery(categoriesQO);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex flex-col justify-center"
          >
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              New: Walnut Collection
            </span>
            <h1 className="mt-6 font-display text-5xl font-medium leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-7xl">
              Carpentry,
              <br />
              <span className="text-primary italic">refined.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground text-balance">
              Hand-built furniture and tools from sustainably sourced hardwoods. Made in small batches, designed for a lifetime.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90">
                Shop the collection <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/shop" search={{ category: "furniture" }} className="inline-flex items-center rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition hover:bg-accent">
                Browse furniture
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9 }}
            className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-muted shadow-2xl lg:aspect-[5/6]"
          >
            <img src={heroImage} alt="Workshop with handcrafted walnut chair" width={1920} height={1080} className="h-full w-full object-cover" />
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">Shop by category</h2>
          <Link to="/shop" className="text-sm text-primary hover:underline">All products →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
            >
              <Link to="/shop" search={{ category: c.slug }} className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
                <img src={resolveImage(c.image_url)} alt={c.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5">
                  <h3 className="font-display text-2xl font-medium text-white">{c.name}</h3>
                  <p className="mt-1 text-sm text-white/80">{c.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">Featured pieces</h2>
          <p className="mt-2 text-muted-foreground">Hand-picked from our newest work.</p>
        </div>
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p, i) => <ProductCard key={p.id} p={p as any} index={i} />)}
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-3xl gradient-wood px-8 py-16 text-center sm:px-16 sm:py-24">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-medium leading-tight text-cream text-balance sm:text-5xl">
            "Every joint, every grain, every breath of finish — done by hand."
          </h2>
          <p className="mt-6 text-sm uppercase tracking-[0.2em] text-cream/70">— The Woodverse Workshop</p>
        </div>
      </section>
    </div>
  );
}
