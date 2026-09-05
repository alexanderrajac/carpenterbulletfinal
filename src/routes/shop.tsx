import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { listProducts, listCategories } from "@/lib/products.functions";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { Search, Sparkles, MessageCircle, ShieldCheck, Truck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const searchSchema = z.object({
  category: fallback(z.string(), "all").default("all"),
  q: fallback(z.string(), "").default(""),
  subcategory: fallback(z.string(), "all").default("all"),
});

export const Route = createFileRoute("/shop")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Shop Wood Products — Furniture, Timber & Tools | CarpenterBullet WoodVerse" },
      {
        name: "description",
        content:
          "Browse handcrafted wood furniture, solid teak shelves, kitchen boards, tools and carpentry services. Shop India's best wood marketplace — CarpenterBullet WoodVerse.",
      },
      { property: "og:title", content: "Shop — CarpenterBullet WoodVerse" },
      {
        property: "og:description",
        content:
          "Discover handcrafted solid wood furniture, timber tools, kitchenware and book expert carpenter services across India.",
      },
      {
        name: "keywords",
        content:
          "buy wood furniture, teak shelves, solid wood products, carpentry services online, timber shop India, WoodVerse",
      },
    ],
  }),
  loaderDeps: ({ search }) => ({ category: search.category, q: search.q }),
  loader: async ({ context, deps }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(productsQO(deps)),
      context.queryClient.ensureQueryData(categoriesQO),
    ]);
  },
  component: Shop,
  pendingComponent: ShopSkeleton,
  errorComponent: ({ error }) => <div className="p-12 text-center">{error.message}</div>,
});

const categoriesQO = queryOptions({ queryKey: ["categories"], queryFn: () => listCategories() });
const productsQO = (deps: { category: string; q: string }) =>
  queryOptions({
    queryKey: ["products", deps],
    queryFn: () => listProducts({ data: { category: deps.category, search: deps.q || undefined } }),
  });

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function getSubcategory(p: any): string {
  if (!p.description) return "General";
  const m = p.description.match(/^\[Subcategory:\s*([^\]]+)\]/);
  return m ? m[1] : "General";
}

function Shop() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const { data: products } = useSuspenseQuery(productsQO(search));
  const { data: categories } = useSuspenseQuery(categoriesQO);

  const pills = [
    { slug: "all", name: "All" },
    ...categories.map((c) => ({ slug: c.slug, name: c.name })),
  ];

  const isServices = search.category === "carpenter-services";

  let filteredProducts = products;
  if (search.subcategory && search.subcategory !== "all") {
    filteredProducts = filteredProducts.filter((p) => getSubcategory(p) === search.subcategory);
  }

  // Group products by subcategory if Carpenter Services is selected AND no specific subcategory is filtered
  const groupedProducts: Record<string, typeof products> = {};
  if (isServices && (!search.subcategory || search.subcategory === "all")) {
    filteredProducts.forEach((p) => {
      const sub = getSubcategory(p);
      if (!groupedProducts[sub]) groupedProducts[sub] = [];
      groupedProducts[sub].push(p);
    });
  }

  const subcategories = isServices && (!search.subcategory || search.subcategory === "all") ? Object.keys(groupedProducts) : [];

  const scrollToSub = (subName: string) => {
    const el = document.getElementById(`sub-${slugify(subName)}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const trendingTags = [
    "Teak Door",
    "Dining Table",
    "Wardrobe",
    "Teak Planks",
    "Cutting Board",
    "Wooden Shelf",
    "Chisels",
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-12 sm:px-6 lg:px-8">
      {/* Header & Title */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full inline-flex items-center gap-1.5 border border-primary/20">
            <Sparkles className="h-3 w-3" /> South Indian Solid Wood & Timber Catalog
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl text-foreground">
            The Master Collection
          </h1>
          <p className="mt-2 text-muted-foreground text-xs sm:text-sm max-w-2xl">
            {products.length} genuine solid wood pieces, kiln-dried raw lumber, hardware supply & on-demand carpentry services.
          </p>
        </div>

        {/* Custom Sizing RFQ Action */}
        <a
          href="https://wa.me/918248651695?text=Hi%20CarpenterBullet!%20I%20need%20a%20custom%20size%20or%20wood%20quote%20for%20furniture."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <MessageCircle className="h-4 w-4 fill-current" />
          <span>Custom Sizing / WhatsApp RFQ</span>
        </a>
      </div>

      {/* Trust Highlight Strip */}
      <div className="mb-6 grid grid-cols-3 gap-2 p-3 rounded-2xl bg-muted/30 border border-border/60 text-center text-[10px] sm:text-xs text-muted-foreground font-semibold">
        <div className="flex items-center justify-center gap-1.5">
          <Truck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Free Crated Pan-India Delivery</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 border-x border-border/60">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-450" />
          <span>100% Kiln-Dried Wood</span>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>5-Year Structural Warranty</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full overflow-x-auto gap-2 pb-2 no-scrollbar snap-x scroll-smooth">
          {pills.map((p) => (
            <button
              key={p.slug}
              onClick={() => navigate({ search: (s) => ({ ...s, category: p.slug, subcategory: "all" }) })}
              className={`shrink-0 snap-align-start rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition duration-200 cursor-pointer ${
                search.category === p.slug
                  ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "border-border bg-card text-foreground hover:bg-accent hover:border-muted-foreground/30"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search.q}
            onChange={(e) => navigate({ search: (s) => ({ ...s, q: e.target.value }) })}
            placeholder="Search products or services..."
            className="w-full rounded-full border border-border bg-card py-2 pl-9.5 pr-4 text-sm outline-none transition duration-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 sm:w-64"
          />
        </div>
      </div>

      {/* Trending Search Chips */}
      <div className="mb-8 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 text-xs">
        <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1 shrink-0">
          🔥 Trending:
        </span>
        {trendingTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => navigate({ search: (s) => ({ ...s, q: tag }) })}
            className={`shrink-0 px-3 py-1 rounded-full border text-[11px] font-medium transition cursor-pointer ${
              search.q === tag
                ? "bg-primary/10 border-primary text-primary font-bold"
                : "bg-card border-border/80 text-muted-foreground hover:text-foreground hover:border-primary/40"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Subcategory scroll navigation bar */}
      {isServices && subcategories.length > 0 && (
        <div className="mb-8 flex w-full overflow-x-auto gap-2 pb-3 no-scrollbar snap-x scroll-smooth border-b border-border/40">
          <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-muted-foreground self-center mr-2">
            Jump to:
          </span>
          {subcategories.map((sub) => (
            <button
              key={sub}
              onClick={() => scrollToSub(sub)}
              className="shrink-0 snap-align-start rounded-full border border-border/80 bg-muted/40 px-4 py-1 text-xs font-semibold text-foreground/80 hover:bg-primary hover:border-primary hover:text-primary-foreground transition duration-200 cursor-pointer"
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-20 text-center text-muted-foreground">
          No products match.
        </div>
      ) : isServices && (!search.subcategory || search.subcategory === "all") ? (
        <div className="space-y-16">
          {Object.entries(groupedProducts).map(([sub, items]) => (
            <section key={sub} id={`sub-${slugify(sub)}`} className="scroll-mt-24">
              <div className="mb-6 border-b border-border/60 pb-2">
                <h2 className="font-display text-2xl font-semibold text-foreground">{sub}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {items.length} carpentry services available
                </p>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-x-6 sm:gap-y-10">
                {items.map((p, i) => (
                  <ProductCard key={p.id} p={p as any} index={i} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-x-6 sm:gap-y-10">
          {filteredProducts.map((p, i) => (
            <ProductCard key={p.id} p={p as any} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function ShopSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Skeleton className="h-10 w-56 rounded-lg" />
        <Skeleton className="mt-2 h-5 w-36 rounded-md" />
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Skeleton className="h-9 w-full rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-x-6 sm:gap-y-10">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
