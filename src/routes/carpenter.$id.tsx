import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getPublicVendorStorefront } from "@/lib/vendor.functions";
import { ProductCard } from "@/components/product-card";
import { MapPin, ShieldCheck, Phone, Hammer, ArrowLeft, Heart, Sparkles, MessageSquare, X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { resolveImage } from "@/lib/product-images";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

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
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const displayedImages = (profile.portfolio_images || []).slice(0, 12);

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
          <div className="h-20 w-20 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0 shadow-inner overflow-hidden">
            {profile.avatar_url ? (
              <img
                src={resolveImage(profile.avatar_url)}
                alt={`${profile.business_name} logo`}
                className="h-full w-full object-cover"
              />
            ) : (
              <Hammer className="h-10 w-10" />
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
                {profile.business_name}
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Police & Background Verified
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-semibold text-amber-300">
                ⚡ 0% Broker Commission
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-zinc-300">
              <span className="font-semibold text-white">Master Craftsman: {profile.owner_name}</span>
              <span className="hidden sm:inline text-zinc-500">•</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4 text-zinc-400" />
                {profile.city}, {profile.state}
              </span>
              <span className="hidden sm:inline text-zinc-500">•</span>
              <span className="text-amber-400 font-bold text-xs flex items-center gap-1">
                ★ 4.9 (84 Jobs Completed)
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
                Direct UPI / Payment ID
              </span>
              <span className="text-sm font-mono font-bold text-amber-400 select-all block mt-0.5">
                {profile.upi_payout_id}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    await supabase.from("lead_events").insert({
                      event_type: "call",
                      vendor_id: profile.id,
                      city: profile.city,
                    });
                  } catch (e) {}
                  window.location.href = `tel:${profile.phone_number}`;
                }}
                className="flex-1 inline-flex items-center gap-2 justify-center rounded-xl bg-white/10 hover:bg-white/15 px-4 py-2.5 text-xs font-semibold text-white transition shadow-sm border border-white/10 cursor-pointer"
              >
                <Phone className="h-3.5 w-3.5" /> Call Workshop
              </button>
              <button
                onClick={async () => {
                  try {
                    await supabase.from("lead_events").insert({
                      event_type: "whatsapp",
                      vendor_id: profile.id,
                      city: profile.city,
                    });
                  } catch (e) {}
                  window.open(
                    `https://wa.me/${profile.phone_number.replace(/\D/g, "")}?text=Hi%20${encodeURIComponent(profile.business_name)},%20I%20saw%20your%20carpentry%20profile%20on%20CarpenterBullet`,
                    "_blank"
                  );
                }}
                className="flex-1 inline-flex items-center gap-2 justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white transition shadow-sm cursor-pointer"
              >
                WhatsApp Direct
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Work Portfolio Showcase */}
      {displayedImages.length > 0 && (
        <div className="mb-12 space-y-6 animate-in fade-in">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Craftsmanship Showcase ({displayedImages.length})
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Photos of custom creations and completed installations by this workshop.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {displayedImages.map((img: string, idx: number) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.02 }}
                onClick={() => setLightboxIndex(idx)}
                className="relative aspect-square rounded-2xl overflow-hidden border border-border/60 bg-muted cursor-pointer group shadow-sm hover:shadow-md transition-all duration-300"
              >
                <img
                  src={resolveImage(img)}
                  alt={`Showcase item ${idx + 1}`}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-semibold px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
                    View Fullscreen
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && displayedImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLightboxIndex(null)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(null);
              }}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition border-none"
              title="Close modal"
            >
              <X className="h-6 w-6" />
            </button>

            {displayedImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((prev) => 
                      prev !== null ? (prev - 1 + displayedImages.length) % displayedImages.length : null
                    );
                  }}
                  className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition border-none"
                  title="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((prev) => 
                      prev !== null ? (prev + 1) % displayedImages.length : null
                    );
                  }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition border-none"
                  title="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <motion.div
              key={lightboxIndex}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={resolveImage(displayedImages[lightboxIndex])}
                alt="Showcase fullscreen"
                className="max-w-full max-h-[85vh] object-contain rounded-2xl"
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm border border-white/10 text-white text-xs font-semibold px-4 py-1.5 rounded-full select-none">
                {lightboxIndex + 1} / {displayedImages.length}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Mobile Sticky Call Workshop & WhatsApp Action Bar */}
      {profile.phone_number && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl p-3 border-t border-amber-500/20 shadow-2xl flex items-center gap-2">
          <a
            href={`tel:${profile.phone_number}`}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 text-zinc-950 px-4 py-3 text-xs font-bold transition shadow-md active:scale-95"
          >
            <Phone className="h-4 w-4 fill-zinc-950" /> Call Workshop Tel
          </a>
          <a
            href={`https://wa.me/${profile.phone_number.replace(/\D/g, "")}?text=Hi%20${encodeURIComponent(
              profile.business_name
            )},%20I%20saw%20your%20carpentry%20profile%20on%20CarpenterBullet`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-3 text-xs font-bold transition shadow-md active:scale-95"
          >
            <MessageSquare className="h-4 w-4 fill-white" /> WhatsApp Direct
          </a>
        </div>
      )}
    </div>
  );
}

