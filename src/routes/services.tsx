import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listServicesByCategory } from "@/lib/services.functions";
import { formatPrice } from "@/lib/format";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { useState } from "react";

const servicesQO = queryOptions({
  queryKey: ["services-grouped"],
  queryFn: () => listServicesByCategory(),
});

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Book Carpentry Services — CarpenterBullet WoodVerse" },
      {
        name: "description",
        content:
          "Book verified carpenter services across Tamil Nadu. Door repair, furniture assembly, cupboard installation, lock replacement and more. Starting at ₹79.",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(servicesQO);
  },
  component: ServicesPage,
});

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
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-primary/5 to-background border-b border-border/40">
        <div className="absolute inset-0 gradient-mesh pointer-events-none opacity-50" />
        <div className="absolute top-0 left-1/4 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 h-[350px] w-[350px] rounded-full bg-amber-500/8 blur-[100px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 text-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-bold text-primary tracking-wide uppercase"
          >
            <Sparkles className="h-3 w-3 animate-pulse text-amber-500" />
            Professional Carpentry Services
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 font-display text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight"
          >
            Book Expert Carpenters
            <br />
            <span className="bg-gradient-to-r from-primary via-primary/90 to-amber-600 bg-clip-text text-transparent italic font-serif">
              at your doorstep.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed"
          >
            Door repairs, furniture assembly, cupboard installation, lock replacement, and more.
            Verified carpenters across Tamil Nadu. Pay after service.
          </motion.p>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-muted-foreground"
          >
            {[
              { icon: ShieldCheck, label: "Verified Carpenters" },
              { icon: Clock, label: "Same-Day Service" },
              { icon: CreditCard, label: "Pay After Service" },
              { icon: Star, label: "4.9★ Average Rating" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-1.5">
                <b.icon className="h-4 w-4 text-primary" />
                <span className="font-medium">{b.label}</span>
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
            <div className="flex items-center relative w-full shadow-luxury rounded-2xl bg-card/70 backdrop-blur-md border border-border/60">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services... e.g. door repair, furniture assembly"
                className="w-full rounded-2xl bg-transparent py-4 pl-5 pr-14 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary/10 text-primary rounded-xl p-2.5">
                <Search className="h-4 w-4" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category Filter Pills */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
              !selectedCategory
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card border border-border text-muted-foreground hover:bg-accent"
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
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card border border-border text-muted-foreground hover:bg-accent"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* Services Grid */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        {Object.entries(filteredGrouped).length === 0 ? (
          <div className="text-center py-20">
            <Hammer className="mx-auto h-12 w-12 text-muted-foreground/40 animate-bounce" />
            <p className="mt-4 text-sm text-muted-foreground">No services match your search.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(filteredGrouped).map(([category, services], catIdx) => {
              const Icon = categoryIcons[category] || Hammer;
              const colors = categoryColors[category] || "from-gray-500/20 to-gray-500/10 text-gray-600 border-gray-500/20";

              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: catIdx * 0.05 }}
                >
                  {/* Category Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${colors} flex items-center justify-center border shadow-sm`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground">{category}</h2>
                      <p className="text-xs text-muted-foreground">{(services as any[]).length} services available</p>
                    </div>
                  </div>

                  {/* Services Cards */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {(services as any[]).map((service, sIdx) => (
                      <motion.div
                        key={service.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: sIdx * 0.03 }}
                        className="group relative rounded-2xl border border-border/60 bg-card p-5 shadow-sm hover:shadow-lg hover:border-primary/40 transition-all duration-300 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-display text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors pr-2">
                              {service.name}
                            </h3>
                            <span className="shrink-0 bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full font-mono whitespace-nowrap">
                              {service.starts_at_cents === 0 ? "Get Quote" : `${formatPrice(service.starts_at_cents)}`}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {service.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                            {service.starts_at_cents > 0 ? "Starts at" : "Custom pricing"}
                          </span>
                          <Link
                            to="/book-service/$serviceId"
                            params={{ serviceId: service.id }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline group/btn cursor-pointer"
                          >
                            Book Now
                            <ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-3xl gradient-wood px-6 py-12 sm:px-16 sm:py-16 text-center overflow-hidden"
        >
          <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iLjA1Ii8+PC9zdmc+')] pointer-events-none" />
          <h2 className="font-display text-2xl sm:text-4xl font-medium text-cream mb-4">
            Are you a skilled carpenter?
          </h2>
          <p className="text-cream/70 text-sm mb-8 max-w-md mx-auto">
            Join 2,000+ carpenters earning ₹50,000+/month on CarpenterBullet. Get orders directly from customers in your area.
          </p>
          <Link
            to="/join-carpenter"
            className="inline-flex items-center gap-2 rounded-full bg-white/95 px-8 py-3.5 text-sm font-bold text-amber-900 shadow-lg hover:bg-white transition-all active:scale-95 cursor-pointer"
          >
            Join as Carpenter <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
