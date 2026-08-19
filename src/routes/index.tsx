import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Leaf,
  Search,
  Star,
  Truck,
  Award,
  Hammer,
  MapPin,
  Wrench,
  Clock,
  DoorOpen,
  Armchair,
  Frame,
  Lock,
  BookOpen,
  Blinds,
  BadgeCheck,
  Package,
} from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { listProducts, listCategories, listPublicVendors } from "@/lib/products.functions";
import { listServices } from "@/lib/services.functions";
import { formatPrice } from "@/lib/format";
import { ProductCard } from "@/components/product-card";
import { heroImage, resolveImage } from "@/lib/product-images";
import { useState, useRef, useEffect, useCallback } from "react";

const featuredQO = queryOptions({
  queryKey: ["products", { featured: true }],
  queryFn: () => listProducts({ data: { featured: true } }),
});
const categoriesQO = queryOptions({ queryKey: ["categories"], queryFn: () => listCategories() });
const vendorsQO = queryOptions({ queryKey: ["public-vendors"], queryFn: () => listPublicVendors() });
const servicesQO = queryOptions({ queryKey: ["services-list"], queryFn: () => listServices() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CarpenterBullet WoodVerse — Buy Timber, Furniture & Carpentry Services in India" },
      {
        name: "description",
        content:
          "Shop raw timber, solid wood furniture, kitchenware, hardware tools and book expert carpentry services online. Teak, mahogany, veneer — handcrafted in South India.",
      },
      {
        property: "og:title",
        content: "CarpenterBullet WoodVerse — India's Premier Wood Industry Marketplace",
      },
      {
        property: "og:description",
        content:
          "Buy raw timber, custom furniture, hardware, and book expert carpentry services across India at WoodVerse by CarpenterBullet.",
      },
      { property: "og:image", content: "https://www.carpenterbullet.com/favicon.jpg" },
      {
        name: "keywords",
        content:
          "wood furniture India, teak furniture, carpentry services, custom furniture, solid wood, timber online, mahogany, carpenter, WoodVerse, CarpenterBullet",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(featuredQO);
    context.queryClient.ensureQueryData(categoriesQO);
    context.queryClient.ensureQueryData(vendorsQO);
    context.queryClient.ensureQueryData(servicesQO);
  },
  component: Home,
  errorComponent: ({ error }) => <div className="p-12 text-center">{error.message}</div>,
});

// Animated counter component
function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
}: {
  target: number;
  suffix?: string;
  prefix?: string;
}) {
  const [count, setCount] = useState(target);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    setCount(0);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const startTime = performance.now();
          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  const approxLength = target.toLocaleString("en-IN").length + suffix.length + prefix.length;

  return (
    <span
      ref={ref}
      className="tabular-nums inline-block text-center"
      style={{ minWidth: `${approxLength}ch` }}
    >
      {prefix}
      {count.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

function Home() {
  const { data: featured } = useSuspenseQuery(featuredQO);
  const { data: categories } = useSuspenseQuery(categoriesQO);
  const { data: vendors } = useSuspenseQuery(vendorsQO);
  const { data: services } = useSuspenseQuery(servicesQO);
  const navigate = useNavigate();
  const [heroSearch, setHeroSearch] = useState("");

  // Mouse parallax for hero image
  const heroRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-4, 4]);

  const handleHeroMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
      mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
    },
    [mouseX, mouseY],
  );

  const handleHeroMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate({ to: "/shop", search: { q: heroSearch.trim(), category: "all" } });
    }
  };

  return (
    <div className="bg-wood-pattern">
      {/* Hero */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        className="relative overflow-hidden bg-gradient-to-b from-background via-muted/10 to-background border-b border-border/40"
      >
        {/* Animated gradient mesh background */}
        <div className="absolute inset-0 gradient-mesh pointer-events-none" />

        {/* Glowing Orbs */}
        <div className="absolute top-0 left-1/4 h-[450px] w-[450px] -translate-x-1/2 rounded-full bg-primary/10 blur-[130px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-10 right-1/4 h-[500px] w-[500px] translate-x-1/2 rounded-full bg-amber-500/10 blur-[150px] pointer-events-none" />

        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808007_1px,transparent_1px),linear-gradient(to_bottom,#80808007_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-32">
          <div className="flex flex-col justify-center slide-up-enter">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary tracking-wide uppercase">
              <Sparkles className="h-3 w-3 animate-pulse text-amber-500" />
              India's Premier Digital Carpenter & Wood Marketplace
            </span>
            <h1 className="mt-6 sm:mt-8 font-display text-3xl font-bold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-6xl text-foreground">
              Build Better. <br className="hidden sm:inline" />
              Buy Smarter. <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-primary via-amber-600 to-primary bg-clip-text text-transparent italic font-serif">
                Find Trusted Carpenters.
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-base sm:text-lg text-muted-foreground text-balance leading-relaxed">
              Discover skilled carpenters, furniture, hardware and services — all in one professional marketplace.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-wrap gap-3 sm:gap-4">
              <Link
                to="/post-requirement"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-amber-600 px-7 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-amber-600/30 transition duration-300 hover:bg-amber-700 hover:shadow-2xl cursor-pointer active:scale-95"
              >
                <Sparkles className="h-4 w-4" /> Post Your Requirement{" "}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/map"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground transition duration-300 hover:bg-accent hover:border-primary/30 cursor-pointer active:scale-95"
              >
                <MapPin className="h-4 w-4 text-amber-600" /> Local Map Directory
              </Link>
              <Link
                to="/projects"
                className="inline-flex items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-6 py-3.5 text-sm font-semibold transition duration-300 hover:bg-amber-500/20 cursor-pointer active:scale-95"
              >
                Project Portfolio
              </Link>
            </div>

            {/* Google Verified Rating Badge */}
            <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground justify-center lg:justify-start">
              <div className="flex items-center gap-0.5 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current animate-pulse" />
                ))}
              </div>
              <span className="font-semibold text-foreground">4.9 / 5.0</span>
              <span className="opacity-40">|</span>
              <span>Based on 1,200+ Verified Customer Commissions</span>
            </div>

            {/* Hero Search Bar */}
            <div className="mt-8 w-full max-w-lg">
              <form
                onSubmit={handleHeroSearch}
                className="flex items-center relative w-full shadow-luxury rounded-2xl bg-card/70 backdrop-blur-md border border-border/60"
              >
                <input
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder="What can we build or supply for you today?"
                  className="w-full rounded-2xl bg-transparent py-4 pl-5 pr-14 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:opacity-90 text-primary-foreground rounded-xl p-2.5 transition-colors cursor-pointer shadow-md"
                  aria-label="Search"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Quick Pillar Tabs: Product First, Service Second, Order Third */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <a
                href="#products-section"
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Package className="h-3.5 w-3.5" /> 01. Products First
              </a>
              <a
                href="#services-section"
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Wrench className="h-3.5 w-3.5" /> 02. Service Second
              </a>
              <a
                href="#orders-section"
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Sparkles className="h-3.5 w-3.5" /> 03. Order & RFQ Third
              </a>
            </div>

            {/* Quality Badges */}
            <div className="mt-8 sm:mt-12 grid grid-cols-3 gap-3 sm:gap-4 border-t border-border/60 pt-6 sm:pt-8 text-[10px] sm:text-xs text-muted-foreground font-medium">
              {[
                { icon: ShieldCheck, label: "Lifetime Guarantee" },
                { icon: Leaf, label: "Sustainably Sourced" },
                { icon: Sparkles, label: "Handcrafted Excellence" },
              ].map((badge) => (
                <motion.div
                  key={badge.label}
                  className="flex items-center gap-2"
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <badge.icon className="h-4 w-4" />
                  </div>
                  <span>{badge.label}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* 3D Parallax Hero Image */}
          <motion.div
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-muted shadow-luxury border border-border/80 group lg:aspect-[5/6] perspective-container"
          >
            <motion.img
              initial={false}
              src={heroImage}
              alt="Workshop with handcrafted walnut chair"
              width={1920}
              height={1080}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-102"
            />

            {/* Floating overlay card */}
            <motion.div
              initial={false}
              className="absolute bottom-5 left-5 right-5 rounded-2xl bg-black/60 backdrop-blur-md p-4 text-white border border-white/10 flex items-center justify-between shadow-xl"
              style={{ transform: "translateZ(40px)" }}
            >
              <div>
                <p className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">
                  🚀 New Product Launch
                </p>
                <h4 className="font-display text-lg font-medium mt-0.5 text-white">Handcrafted Wooden Laptop Case</h4>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                Floral Inlay
              </span>
            </motion.div>

            {/* Floating badge */}
            <motion.div
              className="absolute top-5 right-5 bg-amber-600 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              🔥 New Launch
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trust Stats Bar */}
      <section className="border-b border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/40">
            {[
              { value: 2500, suffix: "+", label: "Products Available", icon: Award },
              { value: 15000, suffix: "+", label: "Happy Customers", icon: Star },
              { value: 50, suffix: "+", label: "Wood Species", icon: Leaf },
              { value: 500, suffix: "+", label: "Cities Delivered", icon: Truck },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="py-6 sm:py-8 text-center"
              >
                <p className="font-display text-xl sm:text-2xl sm:text-3xl font-bold text-foreground">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-1 text-xs text-muted-foreground font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 1. PRODUCT FIRST SECTION: Featured Products & Department Categories */}
      {/* ========================================================================= */}
      <section id="products-section" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-b border-border/40 scroll-mt-20">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] font-extrabold text-primary bg-primary/10 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 border border-primary/20">
              <Package className="h-3.5 w-3.5 text-primary" /> 01. PRODUCT CATALOG & FEATURED PIECES
            </span>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl"
            >
              Solid Wood Furniture & Timber Products
            </motion.h2>
            <p className="mt-2 text-muted-foreground text-sm">
              Hand-picked teak furniture, raw timber lumber, kitchenware, and hardware supply.
            </p>
          </div>
          <Link
            to="/shop"
            search={{ category: "all" }}
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline group cursor-pointer"
          >
            Explore Full Catalog <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Featured Products Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 sm:gap-x-6 sm:gap-y-10 mb-16">
          {featured.map((p, i) => (
            <ProductCard key={p.id} p={p as any} index={i} />
          ))}
        </div>

        {/* Departments & Categories Sub-section */}
        <div className="border-t border-border/40 pt-14">
          <div className="mb-10 text-center max-w-3xl mx-auto">
            <h3 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl text-foreground">
              Shop by Department
            </h3>
            <p className="mt-2 text-muted-foreground text-xs sm:text-sm">
              Explore raw timber, custom processing, hardware, and furniture departments.
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 justify-items-center">
            {/* Mobile: horizontal scroll carousel */}
            <div className="col-span-full lg:hidden snap-carousel gap-5 w-full px-1 pb-4">
              {categories.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="group w-[200px] flex flex-col items-center cursor-pointer text-center"
                >
                  <Link to="/shop" search={{ category: c.slug }} className="flex flex-col items-center w-full">
                    <div className="relative w-36 h-36 mb-4 rounded-full p-0.5 bg-gradient-to-tr from-primary/40 via-amber-500/20 to-primary/10 shadow-lg transition-all duration-500 group-hover:shadow-xl active:scale-95">
                      <div className="w-full h-full rounded-full overflow-hidden border-4 border-background bg-card relative z-10">
                        <img
                          src={resolveImage(c.image_url, "f_auto,q_auto,w_300")}
                          alt={c.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                    <h3 className="font-display text-base font-semibold text-foreground">{c.name}</h3>
                    <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed px-2">{c.description}</p>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Desktop: full grid */}
            {categories.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  type: "spring",
                  stiffness: 70,
                  damping: 15,
                  delay: i * 0.08,
                }}
                whileHover={{
                  y: -10,
                  transition: { type: "spring", stiffness: 300, damping: 20 },
                }}
                className="group relative flex flex-col items-center cursor-pointer text-center w-full max-w-[280px] hidden lg:flex"
              >
                <Link to="/shop" search={{ category: c.slug }} className="flex flex-col items-center w-full">
                  <div className="relative w-40 h-40 sm:w-48 sm:h-48 mb-6 rounded-full p-1 bg-gradient-to-tr from-primary/40 via-amber-500/20 to-primary/10 shadow-xl shadow-primary/10 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-primary/30 group-hover:scale-105">
                    <div className="w-full h-full rounded-full overflow-hidden border-[6px] border-background bg-card relative z-10">
                      <img
                        src={resolveImage(c.image_url, "f_auto,q_auto,w_500")}
                        alt={c.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center px-2">
                    <h3 className="font-display text-xl font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
                      {c.name}
                    </h3>
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-primary opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <span>Explore Catalog</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-10 text-center sm:hidden">
          <Link
            to="/shop"
            className="inline-flex items-center justify-center gap-2 w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md active:scale-95 transition-all"
          >
            View All Products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. SERVICE SECOND SECTION: Book Carpentry Services */}
      {/* ========================================================================= */}
      <section id="services-section" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-b border-border/40 scroll-mt-20">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 border border-emerald-500/20">
              <Wrench className="h-3.5 w-3.5" /> 02. CARPENTRY SERVICES
            </span>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl"
            >
              Book On-Demand Carpentry Services
            </motion.h2>
            <p className="mt-2 text-muted-foreground text-sm">
              Door repair, furniture assembly, lock replacement, shelf fitting & custom woodwork. Pay after service.
            </p>
          </div>
          <Link
            to="/services"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline group cursor-pointer"
          >
            View All Services <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(services ?? []).slice(0, 6).map((svc: any, idx: number) => {
            const Icon = (({
              "Wooden Door": DoorOpen,
              "Cupboard & Drawer": BookOpen,
              "Decor & Mirror": Frame,
              "Shelf & Cabinet": Armchair,
              "Lock & Hinge": Lock,
              "Curtain & Window": Blinds,
              "Furniture Repair": Wrench,
              "Furniture Assembly": Hammer,
            } as Record<string, any>)[svc.category]) || Hammer;

            const colorCls = (({
              "Wooden Door": "text-amber-600 bg-amber-500/10 border-amber-500/20",
              "Cupboard & Drawer": "text-blue-600 bg-blue-500/10 border-blue-500/20",
              "Decor & Mirror": "text-pink-600 bg-pink-500/10 border-pink-500/20",
              "Shelf & Cabinet": "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
              "Lock & Hinge": "text-slate-600 bg-slate-500/10 border-slate-500/20",
              "Curtain & Window": "text-violet-600 bg-violet-500/10 border-violet-500/20",
              "Furniture Repair": "text-red-600 bg-red-500/10 border-red-500/20",
              "Furniture Assembly": "text-cyan-600 bg-cyan-500/10 border-cyan-500/20",
            } as Record<string, string>)[svc.category]) || "text-gray-600 bg-gray-500/10 border-gray-500/20";

            return (
              <motion.div
                key={svc.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="group p-5 rounded-2xl border border-border/60 bg-card hover:shadow-lg hover:border-primary/45 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-xl ${colorCls} flex items-center justify-center shrink-0 border`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">{svc.name}</h3>
                        <p className="text-[10px] text-muted-foreground">{svc.category}</p>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-primary font-mono bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {svc.starts_at_cents === 0 ? "Get Quote" : formatPrice(svc.starts_at_cents)}
                      </span>
                    </div>
                    {svc.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                        {svc.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground border-t border-border/40 pt-2.5">
                      <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> Same-day Service</span>
                      <span className="flex items-center gap-0.5"><ShieldCheck className="h-3 w-3" /> Background Checked</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Link
                    to="/book-service/$serviceId"
                    params={{ serviceId: svc.id }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline group/btn cursor-pointer"
                  >
                    Book Service Now
                    <ArrowRight className="h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/services"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition duration-300 cursor-pointer active:scale-95"
          >
            Browse All Carpentry Services <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. ORDER THIRD SECTION: Custom Orders, RFQ & Artisan Workshops */}
      {/* ========================================================================= */}
      <section id="orders-section" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-b border-border/40 scroll-mt-20">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 border border-amber-500/20">
              <Sparkles className="h-3.5 w-3.5" /> 03. CUSTOM ORDERS & ARTISAN COMMISSIONS
            </span>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl"
            >
              Post Custom RFQ & Order Direct from Workshops
            </motion.h2>
            <p className="mt-2 text-muted-foreground text-sm">
              Need custom furniture or bulk timber? Post your requirement to get instant quotes from verified workshops.
            </p>
          </div>
          <Link
            to="/post-requirement"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400 hover:underline group cursor-pointer"
          >
            ⚡ Post RFQ Now <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Custom Order Callout Card */}
        <div className="mb-12 rounded-3xl bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-zinc-900 border border-amber-500/30 p-6 sm:p-10 shadow-2xl relative overflow-hidden text-amber-50">
          <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="grid gap-6 lg:grid-cols-12 items-center relative z-10">
            <div className="lg:col-span-8">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ⚡ Instant RFQ Requirement Posting
              </span>
              <h3 className="mt-3 font-display text-2xl sm:text-3xl font-semibold text-white">
                Have a Custom Woodwork Design in Mind?
              </h3>
              <p className="mt-2 text-sm text-amber-200/80 leading-relaxed max-w-2xl">
                Upload your blueprint, dimensions, or sketch. Top South Indian artisans will bid with their best prices, direct delivery dates, and timber options.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-end">
              <Link
                to="/post-requirement"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-6 py-3.5 text-sm shadow-xl transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" /> Post Custom Requirement
              </Link>
              <Link
                to="/requirements"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 font-semibold px-6 py-3 text-xs transition-all active:scale-95 cursor-pointer"
              >
                📋 Track My Quotes & Orders
              </Link>
            </div>
          </div>
        </div>

        {/* Verified Workshops Grid */}
        <div className="mb-6">
          <h3 className="font-display text-xl font-semibold text-foreground mb-4">
            Direct Commission Workshops
          </h3>
        </div>
        {vendors.length === 0 ? (
          <div className="text-center py-16 bg-muted/20 border border-border/60 rounded-3xl">
            <Hammer className="mx-auto h-10 w-10 text-muted-foreground animate-bounce" />
            <p className="mt-4 text-sm text-muted-foreground">No workshops registered yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vendors.slice(0, 3).map((v: any, idx: number) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05, type: "spring", stiffness: 100 }}
                className="group relative rounded-2xl border border-border/60 bg-card p-6 shadow-sm hover:shadow-lg hover:border-primary/45 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-500 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                      {v.avatar_url ? (
                        <img src={resolveImage(v.avatar_url)} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Hammer className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {v.business_name}
                      </h3>
                      <p className="text-xs text-muted-foreground">Owner: {v.owner_name}</p>
                    </div>
                  </div>
                  {v.bio && (
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4 min-h-[54px]">
                      {v.bio}
                    </p>
                  )}
                </div>

                <div className="border-t border-border/40 pt-4 mt-2 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                    {v.city}, {v.state}
                  </span>
                  
                  <Link
                    to="/carpenter/$id"
                    params={{ id: v.id }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline group cursor-pointer"
                  >
                    Visit Workshop Shop <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        <div className="mt-8 text-center sm:hidden">
          <Link
            to="/shops"
            className="inline-flex items-center justify-center gap-2 w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md active:scale-95 transition-all cursor-pointer"
          >
            View All Artisan Workshops <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Trust & Quality Features Section */}
      <section className="bg-muted/30 border-y border-border/60 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs uppercase tracking-[0.25em] font-extrabold text-primary bg-primary/10 px-3.5 py-1.5 rounded-full inline-block">
              Why Customers Choose Us
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-medium tracking-tight">
              Built on Craftsmanship, Guaranteed by Quality
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Direct master carpenter prices, 100% genuine solid timber, and damage-free Pan-India shipping.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: ShieldCheck,
                title: "100% Kiln-Dried Wood",
                desc: "Every piece uses seasoned, moisture-controlled teak & hardwoods that resist warping for decades.",
              },
              {
                icon: Wrench,
                title: "Direct Artisan Pricing",
                desc: "No middlemen fees. Save up to 40% by buying directly from South Indian master woodcraft workshops.",
              },
              {
                icon: Package,
                title: "Crated Damage-Free Shipping",
                desc: "Heavy-duty wooden crate packaging ensures safe arrival to over 500+ cities across India.",
              },
              {
                icon: BadgeCheck,
                title: "5-Year Structural Warranty",
                desc: "Full warranty coverage on joints, wood integrity, and structural craft. Buy with total peace of mind.",
              },
            ].map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="bg-card border border-border/60 p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 flex flex-col items-start"
              >
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 border border-primary/20">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Verified Reviews Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-border/40">
        <div className="mb-10 text-center sm:text-left">
          <span className="text-xs uppercase tracking-[0.25em] font-extrabold text-primary bg-primary/10 px-3.5 py-1.5 rounded-full inline-block">
            Real Reviews
          </span>
          <h2 className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl">
            Trusted by Custom Homeowners
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Read verified feedback from our custom commissions across South India.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              name: "Karthikeyan R.",
              location: "Chennai, Tamil Nadu",
              review: "Commissioned a 6-seater dining table in solid teak. The wood grain matching is brilliant and the traditional mortise-and-tenon joint construction is incredibly sturdy. Safe, crated transport to Chennai.",
              product: "Teak Dining Table",
              date: "May 2026",
            },
            {
              name: "Priya Krishnan",
              location: "Coimbatore, Tamil Nadu",
              review: "Got my home temple door custom carved here from premium Madurai teak. The moisture checks were sent to me throughout. Outstanding craftsmanship and mahogany glaze finish.",
              product: "Custom Pooja Door",
              date: "June 2026",
            },
            {
              name: "Muthuvel S.",
              location: "Madurai, Tamil Nadu",
              review: "Ordered processed teak planks for our wardrobe refurbishment project. Perfectly kiln-dried, absolutely straight wood. The best raw timber supplier in Tamil Nadu, highly recommended.",
              product: "Processed Teak Lumber",
              date: "April 2026",
            },
          ].map((rev, idx) => (
            <motion.div
              key={rev.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className="rounded-2xl border border-border bg-card/60 p-6 flex flex-col justify-between hover:shadow-md hover:border-primary/30 transition-all duration-300"
            >
              <div>
                <div className="flex items-center gap-1 mb-3 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                  <span className="text-[9px] text-muted-foreground font-bold ml-1.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-450 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Verified Buyer
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed italic">
                  "{rev.review}"
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4 text-[11px] sm:text-xs">
                <div>
                  <h4 className="font-semibold text-foreground">{rev.name}</h4>
                  <p className="text-muted-foreground mt-0.5">{rev.location}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[9px] font-semibold bg-muted px-2 py-0.5 rounded text-muted-foreground inline-block">
                    {rev.product}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">{rev.date}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Story / Testimonial */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-2xl sm:rounded-3xl gradient-wood px-6 py-12 sm:px-16 sm:py-24 text-center overflow-hidden"
        >
          {/* Grain texture overlay */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iLjA1Ii8+PC9zdmc+')] pointer-events-none" />

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <h2 className="mx-auto max-w-2xl font-display text-2xl font-medium leading-tight text-cream text-balance sm:text-5xl">
              "Every joint, every grain, every breath of finish — done by hand."
            </h2>
            <p className="mt-6 text-sm uppercase tracking-[0.2em] text-cream/70">
              — The CarpenterBullet Workshop
            </p>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
