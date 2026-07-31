import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listServicesByCategory } from "@/lib/services.functions";
import { formatPrice } from "@/lib/format";
import { motion, AnimatePresence } from "framer-motion";
import { resolveImage } from "@/lib/product-images";
import {
  ArrowRight,
  DoorOpen,
  Armchair,
  Frame,
  BookOpen,
  Lock,
  Blinds,
  Wrench,
  Hammer,
  Sparkles,
  ShieldCheck,
  Clock,
  Star,
  CreditCard,
  Search,
  CheckCircle2,
  Check,
  Zap,
  Award,
  ThumbsUp,
  ChevronRight,
  PhoneCall,
} from "lucide-react";
import { useState } from "react";

const servicesQO = queryOptions({
  queryKey: ["services-grouped"],
  queryFn: () => listServicesByCategory(),
});

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Urban Doorstep Carpentry Services — CarpenterBullet" },
      {
        name: "description",
        content:
          "Book Urban Company-style doorstep carpenter services across Tamil Nadu & India. Door repair, furniture assembly, cupboard fitting, lock replacement with 30-day warranty.",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(servicesQO);
  },
  component: ServicesPage,
});

const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  "Wooden Door": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  "Cupboard & Drawer": "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
  "Furniture Assembly": "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80",
  "Lock & Hinge": "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80",
  "Shelf & Cabinet": "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80",
  "Furniture Repair": "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80",
  "Curtain & Window": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  "Decor & Mirror": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80",
};

const categoryIcons: Record<string, any> = {
  "Wooden Door": DoorOpen,
  "Cupboard & Drawer": BookOpen,
  "Decor & Mirror": Frame,
  "Shelf & Cabinet": Armchair,
  "Lock & Hinge": Lock,
  "Curtain & Window": Blinds,
  "Furniture Repair": Wrench,
  "Furniture Assembly": Hammer,
};

const categoryColors: Record<string, string> = {
  "Wooden Door": "from-amber-500/20 to-orange-500/10 text-amber-600 border-amber-500/20",
  "Cupboard & Drawer": "from-blue-500/20 to-indigo-500/10 text-blue-600 border-blue-500/20",
  "Decor & Mirror": "from-pink-500/20 to-rose-500/10 text-pink-600 border-pink-500/20",
  "Shelf & Cabinet": "from-emerald-500/20 to-teal-500/10 text-emerald-600 border-emerald-500/20",
  "Lock & Hinge": "from-slate-500/20 to-zinc-500/10 text-slate-600 border-slate-500/20",
  "Curtain & Window": "from-violet-500/20 to-purple-500/10 text-violet-600 border-violet-500/20",
  "Furniture Repair": "from-red-500/20 to-rose-500/10 text-red-600 border-red-500/20",
  "Furniture Assembly": "from-cyan-500/20 to-sky-500/10 text-cyan-600 border-cyan-500/20",
};

function HighlightText({ text, search }: { text: string; search: string }) {
  if (!search) return <>{text}</>;
  const parts = text.split(new RegExp(`(${search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")})`, "gi"));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === search.toLowerCase() ? (
          <mark key={index} className="bg-amber-500/30 text-amber-950 dark:text-amber-400 font-semibold px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

function ServicesPage() {
  const { data: grouped } = useSuspenseQuery(servicesQO);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Object.keys(grouped);

  // Filter services by search
  const filteredGrouped = Object.entries(grouped).reduce(
    (acc, [cat, services]) => {
      if (selectedCategory && cat !== selectedCategory) return acc;
      const filtered = (services as any[]).filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      if (filtered.length > 0) acc[cat] = filtered;
      return acc;
    },
    {} as Record<string, any[]>,
  );

  return (
    <div className="bg-wood-pattern min-h-screen">
      {/* Urban Company Style Hero Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-900 to-background border-b border-border/40 text-white pt-12 pb-16">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay pointer-events-none" />
        <div className="absolute top-0 left-1/4 h-[400px] w-[400px] rounded-full bg-amber-500/10 blur-[140px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-4 py-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-400" />
            Urban Quality Doorstep Carpentry Services
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-5 font-display text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white"
          >
            Expert Master Carpenters
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-orange-500 bg-clip-text text-transparent italic font-serif">
              at your doorstep in 60 mins.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-zinc-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed font-light"
          >
            Door lock fitting, teakwood door repair, modular kitchen cupboard assembly, lathe turning, and custom woodwork. Fixed rate card with 30-Day Workmanship Guarantee.
          </motion.p>

          {/* Urban Company Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs"
          >
            {[
              { icon: ShieldCheck, label: "Police Verified Craftsmen", color: "text-emerald-400" },
              { icon: Clock, label: "60-Min Quick Dispatch", color: "text-amber-400" },
              { icon: CreditCard, label: "Fixed Rate Card (No Brokerage)", color: "text-blue-400" },
              { icon: Star, label: "4.9★ Rating (15,000+ Jobs Done)", color: "text-yellow-400" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-1.5 bg-zinc-900/80 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/10 shadow-sm">
                <b.icon className={`h-4 w-4 ${b.color}`} />
                <span className="font-semibold text-zinc-200">{b.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 max-w-lg mx-auto"
          >
            <div className="flex items-center relative w-full shadow-2xl rounded-2xl bg-zinc-900/90 border border-amber-500/30">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services... e.g. door repair, lock fitting, sofa repair"
                className="w-full rounded-2xl bg-transparent py-4 pl-5 pr-14 text-sm text-white placeholder-zinc-400 outline-none focus:ring-2 focus:ring-amber-500/30"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-amber-500 text-zinc-950 rounded-xl p-2.5 shadow-md">
                <Search className="h-4 w-4 stroke-[2.5]" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Urban Category Filter Bar */}
      <section className="sticky top-16 z-30 bg-background/95 backdrop-blur-md border-b border-border shadow-sm py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer ${
                !selectedCategory
                  ? "bg-amber-500 text-zinc-950 shadow-md"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              All Services
            </button>
            {categories.map((cat) => {
              const Icon = categoryIcons[cat] || Hammer;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    selectedCategory === cat
                      ? "bg-amber-500 text-zinc-950 shadow-md"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Urban Services Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {Object.entries(filteredGrouped).length === 0 ? (
          <div className="text-center py-20 bg-card border border-border rounded-3xl p-8">
            <Hammer className="mx-auto h-12 w-12 text-amber-500/50 animate-bounce" />
            <h3 className="mt-4 text-base font-bold text-foreground">No services found</h3>
            <p className="mt-1 text-xs text-muted-foreground">Try searching for door, lock, or furniture repair.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {Object.entries(filteredGrouped).map(([category, services], catIdx) => {
              const Icon = categoryIcons[category] || Hammer;
              const colors = categoryColors[category] || "from-amber-500/20 to-orange-500/10 text-amber-600 border-amber-500/20";

              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: catIdx * 0.05 }}
                  className="space-y-6"
                >
                  {/* Category Header with Urban Visual Style */}
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${colors} flex items-center justify-center border shadow-sm`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                          {category}
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Urban Certified
                          </span>
                        </h2>
                        <p className="text-xs text-muted-foreground">{(services as any[]).length} doorstep services with 30-day warranty</p>
                      </div>
                    </div>
                  </div>

                  {/* Urban Services Card Grid */}
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {(services as any[]).map((service, sIdx) => {
                      const imgUrl =
                        service.image_url && service.image_url.trim() !== ""
                          ? resolveImage(service.image_url)
                          : DEFAULT_CATEGORY_IMAGES[category] ||
                            "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80";

                      return (
                        <motion.div
                          key={service.id}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: sIdx * 0.03 }}
                          className="group relative rounded-3xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-2xl hover:border-amber-500/50 hover:-translate-y-1 transform transition-all duration-300 flex flex-col justify-between"
                        >
                          <div>
                            {/* Urban HD Photography Image Banner */}
                            <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-900 border-b border-border/50">
                              <img
                                src={imgUrl}
                                alt={service.name}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                              
                              {/* Rating & Warranty Tags */}
                              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                                <span className="bg-zinc-950/80 backdrop-blur-md text-amber-400 border border-amber-500/30 text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> 4.9 (1.2k+)
                                </span>
                              </div>

                              <div className="absolute top-3 right-3">
                                <span className="bg-emerald-950/80 backdrop-blur-md text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> 30-Day Warranty
                                </span>
                              </div>

                              <div className="absolute bottom-3 left-3 right-3 text-white">
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 block mb-0.5">
                                  {category}
                                </span>
                                <h3 className="font-display text-base font-bold text-white line-clamp-1 group-hover:text-amber-400 transition-colors">
                                  <HighlightText text={service.name} search={searchQuery} />
                                </h3>
                              </div>
                            </div>

                            {/* Service Content */}
                            <div className="p-5 space-y-3">
                              {service.description && (
                                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                  <HighlightText text={service.description} search={searchQuery} />
                                </p>
                              )}

                              {/* Urban Checklist Bullets */}
                              <div className="space-y-1.5 pt-1">
                                <div className="flex items-center gap-2 text-[11px] text-foreground font-medium">
                                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                  <span>Police-verified master carpenter doorstep visit</span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-foreground font-medium">
                                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                  <span>Precision tools & post-job clean up included</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Footer & Price */}
                          <div className="p-5 pt-3 border-t border-border/60 bg-muted/30 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                                {service.starts_at_cents > 0 ? "Fixed Rate Starts" : "Custom Quote"}
                              </span>
                              <span className="text-lg font-black font-mono text-foreground">
                                {service.starts_at_cents === 0 ? "Free Visit" : formatPrice(service.starts_at_cents)}
                              </span>
                            </div>

                            <Link
                              to="/book-service/$serviceId"
                              params={{ serviceId: service.id }}
                              className="inline-flex items-center gap-1.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold px-4 py-2.5 text-xs shadow-md transition transform active:scale-95 cursor-pointer"
                            >
                              Book Now
                              <ArrowRight className="h-4 w-4 stroke-[3]" />
                            </Link>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Urban How It Works Steps */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="bg-card border border-border rounded-3xl p-8 sm:p-12 shadow-sm text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground mb-8">
            How Urban Doorstep Carpentry Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-500 font-black text-xl flex items-center justify-center border border-amber-500/30">
                1
              </div>
              <h4 className="font-bold text-base text-foreground">Select Service</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Choose your required carpentry job (door repair, lock change, cupboard assembly).
              </p>
            </div>
            <div className="space-y-3">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-500 font-black text-xl flex items-center justify-center border border-amber-500/30">
                2
              </div>
              <h4 className="font-bold text-base text-foreground">Master Dispatch</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A verified local carpenter arrives at your doorstep in 60 minutes with full toolset.
              </p>
            </div>
            <div className="space-y-3">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-500 font-black text-xl flex items-center justify-center border border-amber-500/30">
                3
              </div>
              <h4 className="font-bold text-base text-foreground">Pay After Service</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Inspect completed job and pay directly via UPI / cash with 30-day warranty.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
