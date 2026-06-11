import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowRight, Sparkles, ShieldCheck, Leaf, Search } from "lucide-react";
import { motion } from "framer-motion";
import { listProducts, listCategories } from "@/lib/products.functions";
import { ProductCard } from "@/components/product-card";
import { heroImage, resolveImage } from "@/lib/product-images";
import { useState } from "react";

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
  const navigate = useNavigate();
  const [heroSearch, setHeroSearch] = useState("");

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate({ to: "/shop", search: { q: heroSearch.trim(), category: "all" } });
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-muted/20 to-background border-b border-border/40">
        {/* Decorative Glowing Orbs */}
        <div className="absolute top-0 left-1/4 h-[350px] w-[350px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 h-[400px] w-[400px] translate-x-1/2 rounded-full bg-amber-500/5 blur-[140px] pointer-events-none" />

        {/* Dynamic Grid Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col justify-center"
          >
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary tracking-wide uppercase">
              <Sparkles className="h-3 w-3 animate-pulse" />
              New: Premium Hardwoods Seeding
            </span>
            <h1 className="mt-8 font-display text-5xl font-medium leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-7xl">
              Carpentry,
              <br />
              <span className="bg-gradient-to-r from-primary via-primary/95 to-amber-600 dark:to-amber-500 bg-clip-text text-transparent italic font-serif">refined.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground text-balance leading-relaxed">
              Hand-built furniture, doors, windows, raw timber and professional services. Made in small batches, designed to endure for a lifetime.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/shop" className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/10 transition duration-300 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 cursor-pointer">
                Shop the collection <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/shop" search={{ category: "wooden-furniture" }} className="inline-flex items-center rounded-full border border-border bg-card px-7 py-3.5 text-sm font-semibold text-foreground transition duration-300 hover:bg-accent cursor-pointer">
                Browse furniture
              </Link>
            </div>

            {/* Prominent Hero Search Bar */}
            <div className="mt-8 w-full max-w-lg">
              <form onSubmit={handleHeroSearch} className="flex items-center relative w-full shadow-lg shadow-primary/5 rounded-full">
                <input
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder="What can we build or supply for you today?"
                  className="w-full rounded-full border border-border bg-card py-3.5 pl-5 pr-12 text-sm outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                />
                <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-amber-500 hover:bg-amber-600 text-white rounded-full p-2.5 transition-colors cursor-pointer" aria-label="Search">
                  <Search className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Quality Badges */}
            <div className="mt-12 grid grid-cols-3 gap-4 border-t border-border/60 pt-8 text-xs text-muted-foreground font-medium">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span>Lifetime Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Leaf className="h-4 w-4" />
                </div>
                <span>Sustainably Sourced</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span>Handcrafted Excellence</span>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-muted shadow-2xl border border-border/80 group lg:aspect-[5/6]"
          >
            <img src={heroImage} alt="Workshop with handcrafted walnut chair" width={1920} height={1080} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-102" />
            
            {/* Elegant Image Tag overlay */}
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-black/60 backdrop-blur-md p-4 text-white border border-white/10 flex items-center justify-between shadow-xl">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-amber-500 font-semibold">Featured Piece</p>
                <h4 className="font-display text-lg font-medium mt-0.5">The Walnut Lounge Chair</h4>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white font-mono">Series 01</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories Grid (Amazon-like Asymmetrical Layout) */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl text-foreground">Explore Our Departments</h2>
            <p className="mt-2 text-muted-foreground text-sm">Select a category to browse products and professional services.</p>
          </div>
          <Link to="/shop" className="text-sm font-semibold text-primary hover:underline hover:text-primary/80 shrink-0">All products →</Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c, i) => {
            const isFirst = i === 0;
            const colSpanClass = isFirst ? "lg:col-span-2" : "lg:col-span-1";
            const aspectClass = isFirst ? "aspect-[16/10] sm:aspect-[2/1] lg:aspect-[2/1.08]" : "aspect-[4/5]";
            
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className={colSpanClass}
              >
                <Link to="/shop" search={{ category: c.slug }} className={`group relative block w-full ${aspectClass} overflow-hidden rounded-3xl bg-muted border border-border/50 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-amber-500/30`}>
                  <img src={resolveImage(c.image_url)} alt={c.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-103" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <span className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold mb-1 block">Department</span>
                    <h3 className="font-display text-2xl font-medium text-white group-hover:text-amber-300 transition-colors">{c.name}</h3>
                    <p className="mt-1.5 text-xs text-white/80 line-clamp-2 leading-relaxed">{c.description}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-white/90 group-hover:text-white group-hover:translate-x-1 transition-all">
                      Browse Shop <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">Featured pieces</h2>
          <p className="mt-2 text-muted-foreground">Hand-picked from our newest work.</p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 sm:gap-x-6 sm:gap-y-10">
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
