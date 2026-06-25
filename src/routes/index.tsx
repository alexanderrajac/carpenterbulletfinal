import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowRight, Sparkles, ShieldCheck, Leaf, Search, Star, Truck, Award, Hammer, MapPin } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { listProducts, listCategories, listPublicVendors } from "@/lib/products.functions";
import { ProductCard } from "@/components/product-card";
import { heroImage, resolveImage } from "@/lib/product-images";
import { useState, useRef, useEffect, useCallback } from "react";

const featuredQO = queryOptions({
  queryKey: ["products", { featured: true }],
  queryFn: () => listProducts({ data: { featured: true } }),
});
const categoriesQO = queryOptions({ queryKey: ["categories"], queryFn: () => listCategories() });
const vendorsQO = queryOptions({ queryKey: ["public-vendors"], queryFn: () => listPublicVendors() });

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
              New: Premium Hardwoods Seeding
            </span>
            <h1 className="mt-6 sm:mt-8 font-display text-3xl font-medium leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-7xl">
              Carpentry,
              <br />
              <span className="bg-gradient-to-r from-primary via-primary/90 to-amber-600 dark:to-amber-500 bg-clip-text text-transparent italic font-serif">
                refined.
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground text-balance leading-relaxed">
              Hand-built furniture, doors, windows, raw timber and professional services. Made in
              small batches, designed to endure for a lifetime.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                to="/shop"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition duration-300 hover:bg-primary/95 hover:shadow-xl cursor-pointer active:scale-95"
              >
                Shop the collection{" "}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/shop"
                search={{ category: "furnitures" }}
                className="inline-flex items-center justify-center rounded-full border border-border bg-card px-7 py-3.5 text-sm font-semibold text-foreground transition duration-300 hover:bg-accent hover:border-primary/30 cursor-pointer active:scale-95"
              >
                Browse furniture
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
                <p className="text-[10px] uppercase tracking-widest text-primary font-semibold">
                  Featured Piece
                </p>
                <h4 className="font-display text-lg font-medium mt-0.5">The Walnut Lounge Chair</h4>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white font-mono">
                Series 01
              </span>
            </motion.div>

            {/* Floating badge */}
            <motion.div
              className="absolute top-5 right-5 bg-primary/90 backdrop-blur-sm text-primary-foreground px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              ★ Bestseller
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

      {/* Why Choose CarpenterBullet (Trust & Guarantees) */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-b border-border/40">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="font-display text-3xl font-medium tracking-tight sm:text-4xl text-foreground">
            Built for Trust, Crafted for Generations
          </h2>
          <p className="mt-3 text-muted-foreground text-sm sm:text-base leading-relaxed">
            Every piece from CarpenterBullet is made using the finest wood processing technologies and traditional standards.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Kiln-Dried Hardwood",
              description: "Moisture levels maintained between 8-12% using advanced kiln drying. Prevents warping, cracking, and decay in local climates.",
              icon: Leaf,
              color: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/20",
            },
            {
              title: "10-Year Warranty",
              description: "Heirloom-grade furniture constructed using authentic Mortise & Tenon joints. We stand behind our joints.",
              icon: Award,
              color: "text-amber-600 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-500/20",
            },
            {
              title: "Sustainably Sourced",
              description: "100% FSC-Certified timber. Ethically harvested Teak, Mahogany, and Rosewood from South Indian reserves.",
              icon: ShieldCheck,
              color: "text-blue-600 bg-blue-500/10 dark:text-blue-400 dark:bg-blue-500/20",
            },
            {
              title: "Secure Direct Checkout",
              description: "Direct workshop pricing with secure UPI QR verification and live customer order tracking.",
              icon: Truck,
              color: "text-indigo-600 bg-indigo-500/10 dark:text-indigo-400 dark:bg-indigo-500/20",
            },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05, type: "spring", stiffness: 100 }}
              className="group rounded-2xl border border-border/60 bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/45 transition-all duration-300"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.color} mb-5 group-hover:scale-105 transition-transform duration-300`}>
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Departments Grid — 3D Cards */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-14 text-center max-w-3xl mx-auto">
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-xs uppercase tracking-[0.25em] text-primary dark:text-primary font-extrabold bg-primary/10 border border-primary/20 px-4 py-2 rounded-full inline-flex items-center gap-1.5 shadow-sm text-glow-amber"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
            World's First Wood Industry Hub
          </motion.span>
          <h2 className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl text-foreground">
            Explore Our Departments
          </h2>
          <p className="mt-3 text-muted-foreground text-sm sm:text-base leading-relaxed">
            One platform for raw timber, high-precision processing, custom furniture, construction
            woodworks, hardware supply, and on-demand professional carpentry.
          </p>
        </div>

        <div className="grid gap-6 sm:gap-8 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 justify-items-center lg:justify-items-center">
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

          {/* Desktop: full grid (hidden on mobile) */}
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
                {/* Circular Image Container */}
                <div className="relative w-40 h-40 sm:w-48 sm:h-48 mb-6 rounded-full p-1 bg-gradient-to-tr from-primary/40 via-amber-500/20 to-primary/10 shadow-xl shadow-primary/10 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-primary/30 group-hover:scale-105">
                  <div className="w-full h-full rounded-full overflow-hidden border-[6px] border-background bg-card relative z-10">
                    <img
                      src={resolveImage(c.image_url, "f_auto,q_auto,w_500")}
                      alt={c.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay" />
                  </div>
                  
                  {/* Decorative rotating ring on hover */}
                  <div className="absolute -inset-3 rounded-full border border-primary/30 scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100 animate-spin transition-all duration-700" style={{ animationDuration: '10s' }} />
                </div>

                {/* Content */}
                <div className="flex flex-col items-center px-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-primary/80 font-bold mb-1 block group-hover:text-primary transition-colors">
                    Department
                  </span>
                  <h3 className="font-display text-xl sm:text-2xl font-semibold text-foreground transition-colors duration-300 group-hover:text-primary">
                    {c.name}
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed group-hover:text-foreground/80 transition-colors">
                    {c.description}
                  </p>
                  
                  <div className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-primary opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    <span className="relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-primary after:transition-all group-hover:after:w-full">
                      Explore Catalog
                    </span>
                    <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="font-display text-3xl font-medium tracking-tight sm:text-4xl"
            >
              Featured pieces
            </motion.h2>
            <p className="mt-2 text-muted-foreground">Hand-picked from our newest work.</p>
          </div>
          <Link
            to="/shop"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 sm:gap-x-6 sm:gap-y-10">
          {featured.map((p, i) => (
            <ProductCard key={p.id} p={p as any} index={i} />
          ))}
        </div>
        <div className="mt-8 text-center sm:hidden">
          <Link
            to="/shop"
            className="inline-flex items-center justify-center gap-2 w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md active:scale-95 transition-all"
          >
            View all products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Verified Carpenter Workshops */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-border/40">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] font-extrabold text-primary bg-primary/10 px-3.5 py-1.5 rounded-full inline-block">
              Direct From Workshops
            </span>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="mt-3 font-display text-3xl font-medium tracking-tight sm:text-4xl"
            >
              Meet Our Verified Artisans
            </motion.h2>
            <p className="mt-2 text-muted-foreground text-sm">
              Buy directly from the finest solid-wood workshops in South India with direct UPI payments.
            </p>
          </div>
        </div>

        {vendors.length === 0 ? (
          <div className="text-center py-16 bg-muted/20 border border-border/60 rounded-3xl">
            <Hammer className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">No workshops registered yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vendors.map((v: any, idx: number) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05, type: "spring", stiffness: 100 }}
                className="group relative rounded-2xl border border-border/60 bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/45 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-500 group-hover:scale-105 transition-transform duration-300">
                      <Hammer className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        {v.business_name}
                      </h3>
                      <p className="text-xs text-muted-foreground">Owner: {v.owner_name}</p>
                    </div>
                  </div>
                  {v.bio && (
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
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
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    Visit Shop <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
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
            Read verified feedback from our custom commissions across India.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              name: "Rohan Sharma",
              location: "Bengaluru, Karnataka",
              review: "Commissioned a 6-seater dining table in solid teak. The grain match is perfect, and the mortise-and-tenon construction is incredibly sturdy. Delivery was fully crated and safe.",
              product: "Teak Dining Table",
              date: "May 2026",
            },
            {
              name: "Priya Nair",
              location: "Kochi, Kerala",
              review: "Got my home temple door custom carved here. The wood moisture level check was sent to me before carving. Outstanding professionalism and beautiful mahogany finish.",
              product: "Custom Pooja Door",
              date: "June 2026",
            },
            {
              name: "Vikram Malhotra",
              location: "Mumbai, Maharashtra",
              review: "Ordered teak boards for my modular shelving project. Hardwood is kiln-dried and perfectly straight. Best raw timber supplier online in India, highly recommended.",
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
