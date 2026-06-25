import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listPublicVendors } from "@/lib/products.functions";
import { MapPin, Hammer, ArrowLeft, Search, Sparkles, Phone, Award } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { resolveImage } from "@/lib/product-images";

const vendorsQO = queryOptions({
  queryKey: ["public-vendors"],
  queryFn: () => listPublicVendors(),
});

export const Route = createFileRoute("/shops")({
  head: () => ({
    meta: [
      { title: "Verified Woodwork Shops & Carpenters | CarpenterBullet WoodVerse" },
      {
        name: "description",
        content: "Discover and contact verified solid-wood carpentry workshops and independent artisans across South India. Buy custom furniture directly from workshops.",
      },
      { property: "og:title", content: "Artisan Workshops — CarpenterBullet WoodVerse" },
      {
        property: "og:description",
        content: "Direct access to the finest solid-wood workshops in India with direct UPI payments.",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(vendorsQO);
  },
  component: ShopsPage,
  errorComponent: ({ error }) => <div className="p-12 text-center text-red-500">{error.message}</div>,
});

function ShopsPage() {
  const { data: vendors } = useSuspenseQuery(vendorsQO);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVendors = vendors.filter((v: any) => {
    const query = searchQuery.toLowerCase();
    return (
      v.business_name?.toLowerCase().includes(query) ||
      v.owner_name?.toLowerCase().includes(query) ||
      v.city?.toLowerCase().includes(query) ||
      v.state?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="bg-wood-pattern min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Back button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
          Back to marketplace
        </Link>

        {/* Page Header */}
        <div className="relative rounded-3xl overflow-hidden border border-border/60 bg-gradient-to-br from-amber-950 via-zinc-900 to-zinc-950 text-white p-8 sm:p-12 mb-12 shadow-xl">
          <div className="absolute right-0 bottom-0 top-0 w-1/2 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 text-xs font-semibold text-amber-500 tracking-wide uppercase mb-4">
              <Sparkles className="h-3 w-3 animate-pulse" />
              Direct From Workshop
            </span>
            <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight">
              Verified Workshops
            </h1>
            <p className="mt-4 text-zinc-300 text-sm sm:text-base leading-relaxed font-light">
              Explore independent carpenter storefronts across India. Contact artisans directly, review their custom catalog, and pay securely via direct UPI transfer.
            </p>
          </div>
        </div>

        {/* Search Bar & Stats */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground font-display">All Registered Shops</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Showing {filteredVendors.length} of {vendors.length} active artisan workshops
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by workshop, city, state..."
              className="w-full rounded-full border border-border bg-card py-2.5 pl-9.5 pr-4 text-sm outline-none transition duration-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-sm"
            />
          </div>
        </div>

        {/* Shops Grid */}
        {filteredVendors.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 border border-border/60 rounded-3xl">
            <Hammer className="mx-auto h-12 w-12 text-muted-foreground animate-bounce" />
            <h3 className="mt-4 text-lg font-medium text-foreground">No workshops found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Try adjusting your search query or check back later for new registrations.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVendors.map((v: any, idx: number) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, type: "spring", stiffness: 100 }}
                className="group relative rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-lg hover:border-primary/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-500 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                      {v.avatar_url ? (
                        <img src={resolveImage(v.avatar_url)} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Hammer className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {v.business_name}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Award className="h-3 w-3 text-amber-500" />
                        Craftsman: {v.owner_name}
                      </p>
                    </div>
                  </div>
                  {v.bio ? (
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-6 min-h-[54px]">
                      {v.bio}
                    </p>
                  ) : (
                    <p className="text-xs sm:text-sm text-muted-foreground/60 italic leading-relaxed mb-6 min-h-[54px]">
                      No custom bio provided yet. Specialist in high-quality South Indian custom carpentry.
                    </p>
                  )}
                </div>

                <div className="border-t border-border/40 pt-4 mt-2 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                      {v.city}, {v.state}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-450 px-2 py-0.5 rounded-full">
                      Verified Shop
                    </span>
                  </div>
                  
                  <div className="flex gap-2 mt-1">
                    <Link
                      to="/carpenter/$id"
                      params={{ id: v.id }}
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold py-2.5 transition duration-200 cursor-pointer active:scale-95 shadow-sm"
                    >
                      Visit Shop Catalog
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
