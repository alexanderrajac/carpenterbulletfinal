import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowRight, Sparkles, ShieldCheck, Leaf, Search, Star, Truck, Award } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { listProducts, listCategories } from "@/lib/products.functions";
import { ProductCard } from "@/components/product-card";
import { heroImage, resolveImage } from "@/lib/product-images";
import { useState, useRef, useEffect, useCallback } from "react";

const featuredQO = queryOptions({
  queryKey: ["products", { featured: true }],
  queryFn: () => listProducts({ data: { featured: true } }),
});
const categoriesQO = queryOptions({ queryKey: ["categories"], queryFn: () => listCategories() });

export const Route = createFileRoute("/")(  {
  head: () => ({
    meta: [
      { title: "CarpenterBullet — The Amazon + IKEA + Urban Company of the Wood Industry" },
      { name: "description", content: "The Amazon + IKEA + Urban Company of the Wood Industry. Order raw wood, furniture, hardware, custom processing, and on-demand professional carpentry services." },
      { property: "og:title", content: "CarpenterBullet — World's First Wood Industry Hub" },
      { property: "og:description", content: "Heirloom-grade furniture, kitchenware and tools." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(featuredQO);
    context.queryClient.ensureQueryData(categoriesQO);
  },
  component: Home,
  errorComponent: ({ error }) => <div className="p-12 text-center">{error.message}</div>,
});

// Animated counter component
function AnimatedCounter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let start = 0;
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
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{prefix}{count.toLocaleString("en-IN")}{suffix}</span>;
}

function Home() {
  const { data: featured } = useSuspenseQuery(featuredQO);
  const { data: categories } = useSuspenseQuery(categoriesQO);
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

  const handleHeroMouseMove = useCallback((e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }, [mouseX, mouseY]);

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
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col justify-center"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary tracking-wide uppercase"
            >
              <Sparkles className="h-3 w-3 animate-pulse text-amber-500" />
              New: Premium Hardwoods Seeding
            </motion.span>
            <h1 className="mt-8 font-display text-5xl font-medium leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-7xl">
              Carpentry,
              <br />
              <span className="bg-gradient-to-r from-primary via-primary/90 to-amber-600 dark:to-amber-500 bg-clip-text text-transparent italic font-serif">refined.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground text-balance leading-relaxed">
              Hand-built furniture, doors, windows, raw timber and professional services. Made in small batches, designed to endure for a lifetime.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/shop" className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition duration-300 hover:bg-primary/95 hover:shadow-xl cursor-pointer">
                Shop the collection <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link to="/shop" search={{ category: "furnitures" }} className="inline-flex items-center rounded-full border border-border bg-card px-7 py-3.5 text-sm font-semibold text-foreground transition duration-300 hover:bg-accent hover:border-primary/30 cursor-pointer">
                Browse furniture
              </Link>
            </div>

            {/* Hero Search Bar */}
            <div className="mt-8 w-full max-w-lg">
              <form onSubmit={handleHeroSearch} className="flex items-center relative w-full shadow-luxury rounded-2xl bg-card/70 backdrop-blur-md border border-border/60">
                <input
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder="What can we build or supply for you today?"
                  className="w-full rounded-2xl bg-transparent py-4 pl-5 pr-14 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:opacity-90 text-primary-foreground rounded-xl p-2.5 transition-colors cursor-pointer shadow-md" aria-label="Search">
                  <Search className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Quality Badges */}
            <div className="mt-12 grid grid-cols-3 gap-4 border-t border-border/60 pt-8 text-xs text-muted-foreground font-medium">
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
          </motion.div>

          {/* 3D Parallax Hero Image */}
          <motion.div
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-muted shadow-luxury border border-border/80 group lg:aspect-[5/6] perspective-container"
          >
            <motion.img
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              src={heroImage}
              alt="Workshop with handcrafted walnut chair"
              width={1920}
              height={1080}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-102"
            />

            {/* Floating overlay card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="absolute bottom-5 left-5 right-5 rounded-2xl bg-black/60 backdrop-blur-md p-4 text-white border border-white/10 flex items-center justify-between shadow-xl"
              style={{ transform: "translateZ(40px)" }}
            >
              <div>
                <p className="text-[10px] uppercase tracking-widest text-primary font-semibold">Featured Piece</p>
                <h4 className="font-display text-lg font-medium mt-0.5">The Walnut Lounge Chair</h4>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white font-mono">Series 01</span>
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
                <p className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-1 text-xs text-muted-foreground font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
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
            One platform for raw timber, high-precision processing, custom furniture, construction woodworks, hardware supply, and on-demand professional carpentry.
          </p>
        </div>

        <div className="grid gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 perspective-container">
          {categories.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 40, rotateY: -5 }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                type: "spring",
                stiffness: 70,
                damping: 15,
                delay: i * 0.08
              }}
              whileHover={{
                y: -12,
                rotateY: 2,
                rotateX: -2,
                transition: { type: "spring", stiffness: 200, damping: 15 }
              }}
              className="group relative block w-full aspect-[4/5] overflow-hidden rounded-3xl bg-card border border-border/60 shadow-sm card-3d cursor-pointer"
            >
              <Link to="/shop" search={{ category: c.slug }} className="absolute inset-0">
                {/* Image background */}
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={resolveImage(c.image_url)}
                    alt={c.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent transition-opacity duration-300" />
                </div>

                {/* Content */}
                <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 text-white flex flex-col justify-end min-h-[50%]">
                  <span className="text-[9px] uppercase tracking-[0.2em] text-primary font-bold mb-1 block">Department</span>
                  <h3 className="font-display text-xl sm:text-2xl font-semibold text-white transition-colors duration-300 group-hover:text-primary leading-tight">
                    {c.name}
                  </h3>
                  <p className="mt-2 text-xs text-white/70 line-clamp-2 leading-relaxed font-sans group-hover:text-white/80 transition-colors">
                    {c.description}
                  </p>

                  <div className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-white/95 group-hover:text-primary transition-all duration-300">
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
          <Link to="/shop" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 sm:gap-x-6 sm:gap-y-10">
          {featured.map((p, i) => <ProductCard key={p.id} p={p as any} index={i} />)}
        </div>
        <div className="mt-8 text-center sm:hidden">
          <Link to="/shop" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            View all products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Story / Testimonial */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-3xl gradient-wood px-8 py-16 text-center sm:px-16 sm:py-24 overflow-hidden"
        >
          {/* Grain texture overlay */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iLjA1Ii8+PC9zdmc+')] pointer-events-none" />

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-medium leading-tight text-cream text-balance sm:text-5xl">
              "Every joint, every grain, every breath of finish — done by hand."
            </h2>
            <p className="mt-6 text-sm uppercase tracking-[0.2em] text-cream/70">— The CarpenterBullet Workshop</p>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
