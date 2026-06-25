import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ShoppingBag,
  User,
  Menu,
  X,
  Heart,
  Search,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Home,
  Store,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/lib/cart-store";
import { useWishlist } from "@/lib/wishlist-store";
import { supabase } from "@/integrations/supabase/client";
import { listProducts, listCategories } from "@/lib/products.functions";
import { resolveImage } from "@/lib/product-images";
import { formatPrice } from "@/lib/format";
import { motion, AnimatePresence } from "framer-motion";
import logoUrl from "@/assets/logo.jpg";

function getSubcategory(p: any): string {
  if (!p.description) return "General";
  const m = p.description.match(/^\[Subcategory:\s*([^\]]+)\]/);
  return m ? m[1] : "General";
}

export function Navbar() {
  const count = useCart((s) => s.totalCount());
  const wishlistCount = useWishlist((s) => s.items.length);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const megaMenuTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentQuery = (routerState.location.search as any).q || "";
  const [searchQuery, setSearchQuery] = useState(currentQuery);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch categories for mega menu
  useEffect(() => {
    listCategories()
      .then((cats) => setCategories(cats))
      .catch(() => {});
    listProducts({ data: {} })
      .then((prods) => setAllProducts(prods))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setSearchQuery(currentQuery);
  }, [currentQuery]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const results = await listProducts({ data: { search: searchQuery.trim() } });
        setSuggestions(results.slice(0, 5));
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      }
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".search-container")) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      if (data.session) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.session.user.id)
          .eq("role", "admin")
          .then(({ data: roles }) => {
            setIsAdmin((roles ?? []).length > 0);
          });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => {
      setAuthed(!!s);
      if (s) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", s.user.id)
          .eq("role", "admin")
          .then(({ data: roles }) => {
            setIsAdmin((roles ?? []).length > 0);
          });
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    navigate({
      to: "/shop",
      search: { q: searchQuery.trim(), category: "all" },
    });
  };

  // Get subcategories for a given category
  const getSubcategoriesForCategory = (categorySlug: string) => {
    const catProducts = allProducts.filter((p: any) => p.categories?.slug === categorySlug);
    const subMap = new Map<string, number>();
    catProducts.forEach((p: any) => {
      const sub = getSubcategory(p);
      subMap.set(sub, (subMap.get(sub) || 0) + 1);
    });
    return Array.from(subMap.entries()).map(([name, count]) => ({ name, count }));
  };

  const handleCategoryEnter = (slug: string) => {
    if (megaMenuTimer.current) clearTimeout(megaMenuTimer.current);
    setHoveredCategory(slug);
  };

  const handleCategoryLeave = () => {
    megaMenuTimer.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 200);
  };

  const handleMegaMenuEnter = () => {
    if (megaMenuTimer.current) clearTimeout(megaMenuTimer.current);
  };

  const renderSuggestions = () => {
    if (!showSuggestions || !searchQuery.trim()) return null;
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-2xl p-2 max-h-[320px] overflow-y-auto"
        >
          {suggestions.length > 0 ? (
            <>
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40">
                Suggestions
              </div>
              <div className="mt-1 space-y-0.5">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      navigate({ to: `/product/${item.slug}` });
                      setSearchQuery("");
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left flex items-center gap-3 p-2 rounded-xl hover:bg-accent transition duration-150 cursor-pointer"
                  >
                    <img
                      src={resolveImage(item.image_url, "f_auto,q_auto,w_100")}
                      alt={item.name}
                      className="h-10 w-10 rounded-lg object-cover bg-muted border border-border/40 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-medium text-foreground truncate">
                          {item.name}
                        </h4>
                        {item.categories && (
                          <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                            {item.categories.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {formatPrice(item.price_cents)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No products found matching "{searchQuery}"
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  const productCountForCategory = (slug: string) => {
    return allProducts.filter((p: any) => p.categories?.slug === slug).length;
  };

  return (
    <header className="sticky top-0 z-40">
      {/* Row 1: Brand + Search + Actions */}
      <div className="border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <img
              src={logoUrl}
              alt="CarpenterBullet Logo"
              className="h-9 w-9 rounded-xl object-cover bg-muted border border-border/40 shadow-md group-hover:shadow-lg transition duration-200"
            />
            <span className="font-display text-xl font-semibold tracking-tight">
              CarpenterBullet
            </span>
          </Link>

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex items-center flex-1 max-w-xl mx-auto relative search-container"
          >
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search wood products, furniture, hardware, services..."
                className="w-full rounded-2xl border border-border/80 bg-muted/40 py-2.5 pl-5 pr-12 text-sm outline-none transition-all focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/15 focus:shadow-lg"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl p-2 transition-all cursor-pointer shadow-sm hover:shadow-md"
                aria-label="Submit search"
              >
                <Search className="h-4 w-4" />
              </button>
              {renderSuggestions()}
            </div>
          </form>

          <div className="flex items-center gap-0.5 shrink-0">
            {isAdmin && (
              <Link
                to="/admin"
                aria-label="Admin Dashboard"
                className="rounded-xl p-2.5 hover:bg-accent text-primary cursor-pointer transition-colors"
                title="Admin Dashboard"
              >
                <ShieldCheck className="h-5 w-5" />
              </Link>
            )}
            <Link
              to={authed ? "/profile" : "/auth"}
              aria-label="Account"
              className="rounded-xl p-2.5 hover:bg-accent cursor-pointer transition-colors"
            >
              <User className="h-5 w-5" />
            </Link>
            <Link
              to="/wishlist"
              aria-label="Wishlist"
              className="relative rounded-xl p-2.5 hover:bg-accent cursor-pointer transition-colors"
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link
              to="/cart"
              aria-label="Cart"
              className="relative rounded-xl p-2.5 hover:bg-accent cursor-pointer transition-colors"
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-sm">
                  {count}
                </span>
              )}
            </Link>
            <button
              className="lg:hidden rounded-xl p-2.5 hover:bg-accent cursor-pointer transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="block md:hidden px-4 pb-3 pt-0.5">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center relative w-full search-container"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search products, services..."
              className="w-full rounded-2xl border border-border bg-muted/40 py-2.5 pl-4 pr-10 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl p-2 transition-colors cursor-pointer"
              aria-label="Submit search"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
            {renderSuggestions()}
          </form>
        </div>
      </div>

      {/* Row 2: Category Navigation Bar with Mega Menu */}
      <div className="hidden lg:block border-b border-border/40 bg-card/60 backdrop-blur-md relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 h-11 overflow-x-auto no-scrollbar">
            <Link
              to="/"
              className="shrink-0 px-3.5 py-1.5 text-xs font-semibold text-foreground/70 hover:text-foreground rounded-lg hover:bg-accent transition-all duration-200"
            >
              Home
            </Link>
            <Link
              to="/shop"
              search={{ category: "all" }}
              className="shrink-0 px-3.5 py-1.5 text-xs font-semibold text-foreground/70 hover:text-foreground rounded-lg hover:bg-accent transition-all duration-200"
            >
              All Products
            </Link>
            <Link
              to="/about"
              className="shrink-0 px-3.5 py-1.5 text-xs font-semibold text-foreground/70 hover:text-foreground rounded-lg hover:bg-accent transition-all duration-200"
            >
              About Us
            </Link>

            <div className="w-px h-5 bg-border/60 mx-1" />

            {categories.map((cat) => (
              <div
                key={cat.id}
                className="relative"
                onMouseEnter={() => handleCategoryEnter(cat.slug)}
                onMouseLeave={handleCategoryLeave}
              >
                <Link
                  to="/shop"
                  search={{ category: cat.slug }}
                  className={`shrink-0 inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                    hoveredCategory === cat.slug
                      ? "text-primary bg-primary/5"
                      : "text-foreground/70 hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {cat.name}
                  <ChevronDown
                    className={`h-3 w-3 transition-transform duration-200 ${hoveredCategory === cat.slug ? "rotate-180 text-primary" : "opacity-50"}`}
                  />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Mega Menu Dropdown */}
        <AnimatePresence>
          {hoveredCategory && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-full left-0 right-0 z-50 border-b border-border/60"
              onMouseEnter={handleMegaMenuEnter}
              onMouseLeave={handleCategoryLeave}
            >
              <div className="bg-card/95 mega-menu-backdrop shadow-2xl">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
                  {(() => {
                    const cat = categories.find((c) => c.slug === hoveredCategory);
                    if (!cat) return null;
                    const subcats = getSubcategoriesForCategory(cat.slug);
                    const featuredProducts = allProducts
                      .filter((p: any) => p.categories?.slug === cat.slug)
                      .slice(0, 3);

                    return (
                      <div className="grid grid-cols-12 gap-8">
                        {/* Category info */}
                        <div className="col-span-3">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="h-12 w-12 rounded-2xl overflow-hidden bg-muted border border-border/40 shadow-sm">
                              <img
                                src={resolveImage(cat.image_url, "f_auto,q_auto,w_100")}
                                alt={cat.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div>
                              <h3 className="font-display text-lg font-semibold text-foreground">
                                {cat.name}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {productCountForCategory(cat.slug)} products
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                            {cat.description}
                          </p>
                          <Link
                            to="/shop"
                            search={{ category: cat.slug }}
                            onClick={() => setHoveredCategory(null)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                          >
                            View all {cat.name}
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        </div>

                        {/* Subcategories */}
                        <div className="col-span-3">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                            Subcategories
                          </h4>
                          {subcats.length > 0 ? (
                            <ul className="space-y-1.5">
                              {subcats.map((sub) => (
                                <li key={sub.name}>
                                  <Link
                                    to="/shop"
                                    search={{ category: cat.slug, subcategory: sub.name }}
                                    onClick={() => setHoveredCategory(null)}
                                    className="flex items-center justify-between px-3 py-2 rounded-xl text-sm text-foreground/80 hover:bg-accent hover:text-foreground transition-colors"
                                  >
                                    <span>{sub.name}</span>
                                    <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                                      {sub.count}
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">
                              All products in this department
                            </p>
                          )}
                        </div>

                        {/* Featured products preview */}
                        <div className="col-span-6">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                            Popular in {cat.name}
                          </h4>
                          <div className="grid grid-cols-3 gap-3">
                            {featuredProducts.map((fp: any) => (
                              <Link
                                key={fp.id}
                                to="/product/$slug"
                                params={{ slug: fp.slug }}
                                onClick={() => setHoveredCategory(null)}
                                className="group/fp block rounded-xl border border-border/40 bg-background overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-300"
                              >
                                <div className="aspect-square overflow-hidden">
                                  <img
                                    src={resolveImage(fp.image_url, "f_auto,q_auto,w_300")}
                                    alt={fp.name}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover/fp:scale-105"
                                  />
                                </div>
                                <div className="p-2.5">
                                  <p className="text-xs font-medium text-foreground truncate">
                                    {fp.name}
                                  </p>
                                  <p className="text-xs font-mono text-primary font-semibold mt-0.5">
                                    {formatPrice(fp.price_cents)}
                                  </p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="border-b border-border lg:hidden bg-card overflow-hidden"
          >
            <div className="mx-auto flex max-w-7xl flex-col px-4 py-4">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="py-3 px-3 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-xl transition-all active:scale-98"
              >
                Home
              </Link>
              <Link
                to="/shop"
                onClick={() => setMobileOpen(false)}
                className="py-3 px-3 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-xl transition-all active:scale-98"
              >
                All Products
              </Link>
              <Link
                to="/about"
                onClick={() => setMobileOpen(false)}
                className="py-3 px-3 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-xl transition-all active:scale-98"
              >
                About Us
              </Link>

              <div className="h-px bg-border/60 my-3" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-2 px-3">
                Departments
              </p>

              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to="/shop"
                  search={{ category: cat.slug }}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 py-3 px-3 text-sm text-foreground/80 hover:text-foreground hover:bg-accent rounded-xl transition-all active:scale-98"
                >
                  <img
                    src={resolveImage(cat.image_url, "f_auto,q_auto,w_80")}
                    alt={cat.name}
                    className="h-10 w-10 rounded-xl object-cover bg-muted border border-border/40 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-foreground block">{cat.name}</span>
                    <span className="text-[11px] text-muted-foreground">{productCountForCategory(cat.slug)} products</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                </Link>
              ))}

              {isAdmin && (
                <>
                  <div className="h-px bg-border/60 my-3" />
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="py-3 px-3 text-sm font-bold text-primary flex items-center gap-2 hover:bg-primary/10 rounded-xl transition-all active:scale-98"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Admin Dashboard
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-border/60 bg-card/95 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl text-muted-foreground hover:text-primary active:scale-95 transition-all cursor-pointer"
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Home</span>
          </Link>
          <Link
            to="/shop"
            onClick={() => setMobileOpen(false)}
            className="flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl text-muted-foreground hover:text-primary active:scale-95 transition-all cursor-pointer"
          >
            <Store className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Shop</span>
          </Link>
          <Link
            to="/cart"
            onClick={() => setMobileOpen(false)}
            className="relative flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl text-muted-foreground hover:text-primary active:scale-95 transition-all cursor-pointer"
          >
            <div className="relative">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-primary-foreground shadow-sm">
                  {count}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold">Cart</span>
          </Link>
          <Link
            to="/wishlist"
            onClick={() => setMobileOpen(false)}
            className="relative flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl text-muted-foreground hover:text-primary active:scale-95 transition-all cursor-pointer"
          >
            <div className="relative">
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold">Wishlist</span>
          </Link>
          <Link
            to={authed ? "/profile" : "/auth"}
            onClick={() => setMobileOpen(false)}
            className="flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl text-muted-foreground hover:text-primary active:scale-95 transition-all cursor-pointer"
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Account</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
