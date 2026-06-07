import { Link } from "@tanstack/react-router";
import { ShoppingBag, User, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart-store";
import { supabase } from "@/integrations/supabase/client";

export function Navbar() {
  const count = useCart((s) => s.totalCount());
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => subscription.unsubscribe();
  }, []);

  const links = [
    { to: "/", label: "Home" },
    { to: "/shop", label: "Shop" },
    { to: "/shop", label: "Furniture", search: { category: "furniture" } },
    { to: "/shop", label: "Tools", search: { category: "tools" } },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg gradient-emerald text-primary-foreground font-display text-lg font-bold">W</span>
          <span className="font-display text-xl font-semibold tracking-tight">Woodverse</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
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
        <div className="flex items-center gap-1">
          <Link to={authed ? "/profile" : "/auth"} aria-label="Account" className="rounded-full p-2.5 hover:bg-accent">
            <User className="h-5 w-5" />
          </Link>
          <Link to="/cart" aria-label="Cart" className="relative rounded-full p-2.5 hover:bg-accent">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">{count}</span>
            )}
          </Link>
          <button className="md:hidden rounded-full p-2.5 hover:bg-accent" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col px-4 py-2">
            {links.map((l, i) => (
              <Link key={i} to={l.to} search={(l as any).search} onClick={() => setOpen(false)} className="py-3 text-sm text-foreground/80">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
