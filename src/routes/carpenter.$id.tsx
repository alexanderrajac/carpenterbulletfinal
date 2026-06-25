import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getPublicVendorStorefront } from "@/lib/vendor.functions";
import { ProductCard } from "@/components/product-card";
import { MapPin, ShieldCheck, Phone, Hammer, ArrowLeft, Heart, Sparkles, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

const storefrontQO = (id: string) =>
  queryOptions({
    queryKey: ["carpenter-storefront", id],
    queryFn: async () => {
      const data = await getPublicVendorStorefront({ data: { id } });
      if (!data) throw notFound();
      return data;
    },
  });

export const Route = createFileRoute("/carpenter/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(storefrontQO(params.id)),
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.profile.business_name} — Carpenter Profile` },
          {
            name: "description",
            content: `Browse custom solid wood furniture, raw lumber, and craftsmanship by ${loaderData.profile.business_name} from ${loaderData.profile.city}, ${loaderData.profile.state}.`,
          },
        ]
      : [{ title: "Carpenter Storefront — CarpenterBullet" }],
  }),
  component: CarpenterStorefrontPage,
  notFoundComponent: () => <div className="p-20 text-center">Carpenter profile not found.</div>,
});

function CarpenterStorefrontPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(storefrontQO(id));

  const { profile, products } = data;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <Link
        to="/shop"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
      >
        <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
        Back to marketplace
      </Link>

      {/* Workshop Banner / Header */}
      <div className="relative rounded-3xl overflow-hidden border border-border/60 bg-gradient-to-br from-amber-950 via-zinc-900 to-amber-900 text-white p-6 sm:p-10 mb-10 shadow-lg">
        {/* Decorative grain/ambient circles */}
        <div className="absolute right-0 bottom-0 top-0 w-1/2 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
          {/* Avatar Icon */}
          <div className="h-20 w-20 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0 shadow-inner">
            <Hammer className="h-10 w-10" />
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
                {profile.business_name}
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Verified Craftsman
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-zinc-300">
              <span className="font-semibold text-white">Lead Craftsman: {profile.owner_name}</span>
              <span className="hidden sm:inline text-zinc-500">•</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4 text-zinc-400" />
                {profile.city}, {profile.state}
              </span>
            </div>

            {profile.bio && (
              <p className="text-zinc-300 text-sm max-w-3xl leading-relaxed font-light">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Quick Stats / Contacts */}
          <div className="w-full md:w-auto shrink-0 flex flex-col sm:flex-row md:flex-col gap-3 pt-4 md:pt-0 border-t border-white/10 md:border-t-0">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex-1">
              <span className="text-xs text-zinc-400 block font-medium uppercase tracking-wider">
                Direct UPI ID
              </span>
              <span className="text-sm font-mono font-bold text-amber-400 select-all block mt-0.5">
                {profile.upi_payout_id}
              </span>
            </div>
            <div className="flex gap-2">
              <a
                href={`tel:${profile.phone_number}`}
                className="flex-1 inline-flex items-center gap-2 justify-center rounded-xl bg-white/10 hover:bg-white/15 px-4 py-2.5 text-xs font-semibold text-white transition shadow-sm border border-white/10"
              >
                <Phone className="h-3.5 w-3.5" /> Call Workshop
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Workshop Catalog */}
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Artisan Catalog ({products.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Handmade pieces crafted right inside {profile.business_name}'s workshop.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 border border-border/60 rounded-3xl">
            <Hammer className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-foreground">No items listed yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This craftsman hasn't uploaded items to their catalog. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p, idx) => (
              <ProductCard key={p.id} p={p} index={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
