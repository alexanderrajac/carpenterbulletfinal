import { Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { listCategories } from "@/lib/products.functions";
import { ArrowUp, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const categoriesQO = queryOptions({ queryKey: ["categories"], queryFn: () => listCategories() });

export function Footer() {
  const { data: categories } = useQuery(categoriesQO);
  const [email, setEmail] = useState("");

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    toast.success("Thanks for subscribing! You'll hear from us soon.");
    setEmail("");
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="border-t border-border/60 bg-secondary/40 relative">
      {/* Back to top */}
      <button
        onClick={scrollToTop}
        className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground rounded-full p-2.5 shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all cursor-pointer"
        title="Back to top"
      >
        <ArrowUp className="h-4 w-4" />
      </button>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg gradient-emerald text-primary-foreground font-display font-bold shadow-sm">C</span>
            <span className="font-display text-lg font-semibold">CarpenterBullet</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">Heirloom-grade carpentry, made to last generations. The ultimate wood industry marketplace.</p>

          {/* Social icons */}
          <div className="mt-4 flex gap-3">
            {[
              { href: "#", label: "Instagram", path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" },
              { href: "#", label: "Facebook", path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
              { href: "#", label: "YouTube", path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300 cursor-pointer"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d={social.path} /></svg>
              </a>
            ))}
          </div>
        </div>

        {/* Dynamic Shop Categories */}
        <div>
          <h4 className="text-sm font-semibold">Shop</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {(categories ?? []).slice(0, 6).map((cat: any) => (
              <li key={cat.id}>
                <Link to="/shop" search={{ category: cat.slug }} className="hover:text-foreground transition-colors">{cat.name}</Link>
              </li>
            ))}
            <li>
              <Link to="/shop" className="text-primary font-semibold hover:underline text-xs">View All →</Link>
            </li>
          </ul>
        </div>

        {/* Account */}
        <div>
          <h4 className="text-sm font-semibold">Account</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/auth" className="hover:text-foreground transition-colors">Sign in</Link></li>
            <li><Link to="/profile" className="hover:text-foreground transition-colors">Profile & orders</Link></li>
            <li><Link to="/cart" className="hover:text-foreground transition-colors">Cart</Link></li>
            <li><Link to="/wishlist" className="hover:text-foreground transition-colors">Wishlist</Link></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="text-sm font-semibold">Stay Updated</h4>
          <p className="mt-3 text-sm text-muted-foreground">Get the latest drops and workshop stories in your inbox.</p>
          <form onSubmit={handleNewsletterSubmit} className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>© {new Date().getFullYear()} CarpenterBullet Co. All rights reserved.</div>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-foreground transition-colors">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
