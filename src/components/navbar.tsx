import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ShoppingBag, User, Menu, X, Heart, Search, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart-store";
import { useWishlist } from "@/lib/wishlist-store";
import { supabase } from "@/integrations/supabase/client";
import { listProducts } from "@/lib/products.functions";
import { resolveImage } from "@/lib/product-images";
import { formatPrice } from "@/lib/format";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const count = useCart((s) => s.totalCount());
  const wishlistCount = useWishlist((s) => s.items.length);
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentQuery = (routerState.location.search as any).q || "";
  const [searchQuery, setSearchQuery] = useState(currentQuery);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
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

  const links = [
    { to: "/", label: "Home" },
    { to: "/shop", label: "Shop" },
    { to: "/shop", label: "Construction Furniture", search: { category: "construction-furniture" } },
    { to: "/shop", label: "Furnitures", search: { category: "furnitures" } },
    { to: "/shop", label: "Fittings", search: { category: "fittings" } },
    { to: "/shop", label: "Paints", search: { category: "paints" } },
  ] as const;

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
                      src={resolveImage(item.image_url)}
                      alt={item.name}
                      className="h-10 w-10 rounded-lg object-cover bg-muted border border-border/40 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-medium text-foreground truncate">{item.name}</h4>
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

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="grid h-8 w-8 place-items-center rounded-lg gradient-emerald text-primary-foreground font-display text-lg font-bold">C</span>
          <span className="font-display text-xl font-semibold tracking-tight">CarpenterBullet</span>
        </Link>

        {/* Desktop Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center flex-1 max-w-lg mx-auto relative search-container">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search wood products, furniture, hardware..."
              className="w-full rounded-full border border-border bg-card py-2 pl-4 pr-10 text-sm outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
            <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 bg-amber-500 hover:bg-amber-600 text-white rounded-full p-1.5 transition-colors cursor-pointer" aria-label="Submit search">
              <Search className="h-3.5 w-3.5" />
            </button>
            {renderSuggestions()}
          </div>
        </form>

        <nav className="hidden items-center gap-5 lg:flex shrink-0">
          {links.map((l, i) => (
            <Link
              key={i}
              to={l.to}
              search={(l as any).search}
              className="text-sm text-foreground/70 transition hover:text-foreground"
              activeOptions={{ exact: true }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 shrink-0">
          {isAdmin && (
            <Link to="/admin" aria-label="Admin Dashboard" className="rounded-full p-2.5 hover:bg-accent text-primary cursor-pointer" title="Admin Dashboard">
              <ShieldCheck className="h-5 w-5" />
            </Link>
          )}
          <Link to={authed ? "/profile" : "/auth"} aria-label="Account" className="rounded-full p-2.5 hover:bg-accent cursor-pointer">
            <User className="h-5 w-5" />
          </Link>
          <Link to="/wishlist" aria-label="Wishlist" className="relative rounded-full p-2.5 hover:bg-accent cursor-pointer">
            <Heart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">{wishlistCount}</span>
            )}
          </Link>
          <Link to="/cart" aria-label="Cart" className="relative rounded-full p-2.5 hover:bg-accent cursor-pointer">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">{count}</span>
            )}
          </Link>
          <button className="lg:hidden rounded-full p-2.5 hover:bg-accent cursor-pointer" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar Row (Amazon-style double header) */}
      <div className="block md:hidden px-4 pb-3 pt-0.5">
        <form onSubmit={handleSearchSubmit} className="flex items-center relative w-full search-container">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search wood products, services..."
            className="w-full rounded-full border border-border bg-card py-2 pl-4 pr-10 text-sm outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
          <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 bg-amber-500 hover:bg-amber-600 text-white rounded-full p-1.5 transition-colors cursor-pointer" aria-label="Submit search">
            <Search className="h-3.5 w-3.5" />
          </button>
          {renderSuggestions()}
        </form>
      </div>

      {open && (
        <div className="border-t border-border lg:hidden bg-background">
          <div className="mx-auto flex max-w-7xl flex-col px-4 py-2">
            {links.map((l, i) => (
              <Link key={i} to={l.to} search={(l as any).search} onClick={() => setOpen(false)} className="py-3 text-sm text-foreground/80">
                {l.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" onClick={() => setOpen(false)} className="py-3 text-sm font-semibold text-primary">
                Admin Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
