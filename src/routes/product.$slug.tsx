import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getProduct } from "@/lib/products.functions";
import { resolveImage } from "@/lib/product-images";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart-store";
import { toast } from "sonner";
import { ArrowLeft, Check, ShoppingBag } from "lucide-react";

const productQO = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: async () => {
      const p = await getProduct({ data: { slug } });
      if (!p) throw notFound();
      return p;
    },
  });

export const Route = createFileRoute("/product/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(productQO(params.slug)),
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} — Woodverse` },
          { name: "description", content: loaderData.description?.slice(0, 160) },
          { property: "og:title", content: loaderData.name },
          { property: "og:image", content: resolveImage(loaderData.image_url) },
        ]
      : [{ title: "Product — Woodverse" }],
  }),
  component: ProductPage,
  notFoundComponent: () => <div className="p-20 text-center">Product not found.</div>,
  errorComponent: ({ error }) => <div className="p-12 text-center">{error.message}</div>,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: p } = useSuspenseQuery(productQO(slug));
  const add = useCart((s) => s.add);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to shop
      </Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="aspect-square overflow-hidden rounded-3xl bg-muted">
          <img src={resolveImage(p.image_url)} alt={p.name} width={1024} height={1024} className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col justify-center">
          {p.categories && (
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{(p.categories as any).name}</p>
          )}
          <h1 className="mt-3 font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl">{p.name}</h1>
          <p className="mt-4 text-3xl font-medium tabular-nums">{formatPrice(p.price_cents)}</p>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">{p.description}</p>
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-primary" />
            {p.stock > 0 ? `${p.stock} in stock · Ships in 3–5 days` : "Sold out"}
          </div>
          <div className="mt-8 flex gap-3">
            <button
              disabled={p.stock === 0}
              onClick={() => {
                add({ id: p.id, slug: p.slug, name: p.name, price_cents: p.price_cents, image_url: p.image_url });
                toast.success(`Added ${p.name} to cart`);
              }}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              <ShoppingBag className="h-4 w-4" /> Add to cart
            </button>
            <Link to="/cart" className="rounded-full border border-border bg-card px-6 py-3.5 text-sm font-medium hover:bg-accent">View cart</Link>
          </div>
          <dl className="mt-10 grid grid-cols-2 gap-4 border-t border-border pt-6 text-sm">
            <div><dt className="text-muted-foreground">Material</dt><dd className="mt-1 font-medium">Solid hardwood</dd></div>
            <div><dt className="text-muted-foreground">Finish</dt><dd className="mt-1 font-medium">Hand-rubbed oil</dd></div>
            <div><dt className="text-muted-foreground">Origin</dt><dd className="mt-1 font-medium">Vermont, USA</dd></div>
            <div><dt className="text-muted-foreground">Warranty</dt><dd className="mt-1 font-medium">Lifetime</dd></div>
          </dl>
        </div>
      </div>
    </div>
  );
}
