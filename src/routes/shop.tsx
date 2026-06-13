import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { listProducts, listCategories } from "@/lib/products.functions";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const searchSchema = z.object({
  category: fallback(z.string(), "all").default("all"),
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/shop")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Shop — Woodverse" },
      { name: "description", content: "Browse handcrafted furniture, kitchenware, and tools." },
    ],
  }),
  loaderDeps: ({ search }) => ({ category: search.category, q: search.q }),
  loader: ({ context, deps }) => {
    context.queryClient.ensureQueryData(productsQO(deps));
    context.queryClient.ensureQueryData(categoriesQO);
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

function Shop() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const { data: products } = useSuspenseQuery(productsQO(search));
  const { data: categories } = useSuspenseQuery(categoriesQO);

  const pills = [{ slug: "all", name: "All" }, ...categories.map((c) => ({ slug: c.slug, name: c.name }))];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">The collection</h1>
        <p className="mt-2 text-muted-foreground">{products.length} pieces, all hand-built.</p>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full overflow-x-auto gap-2 pb-2 no-scrollbar snap-x scroll-smooth sm:w-auto sm:flex-wrap sm:pb-0">
          {pills.map((p) => (
            <button
              key={p.slug}
              onClick={() => navigate({ search: (s) => ({ ...s, category: p.slug }) })}
              className={`shrink-0 snap-align-start rounded-full border px-4.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition duration-200 cursor-pointer ${
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
            placeholder="Search this collection..."
            className="w-full rounded-full border border-border bg-card py-2 pl-9.5 pr-4 text-sm outline-none transition duration-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 sm:w-64"
          />
        </div>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-20 text-center text-muted-foreground">
          No products match.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-x-6 sm:gap-y-10">
          {products.map((p, i) => <ProductCard key={p.id} p={p as any} index={i} />)}
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
