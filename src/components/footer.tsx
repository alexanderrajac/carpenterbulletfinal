import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg gradient-emerald text-primary-foreground font-display font-bold">C</span>
            <span className="font-display text-lg font-semibold">CarpenterBullet</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Heirloom-grade carpentry, made to last generations.</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Shop</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/shop" search={{ category: "furniture" }}>Furniture</Link></li>
            <li><Link to="/shop" search={{ category: "storage" }}>Storage</Link></li>
            <li><Link to="/shop" search={{ category: "kitchen" }}>Kitchen</Link></li>
            <li><Link to="/shop" search={{ category: "tools" }}>Tools</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Account</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/auth">Sign in</Link></li>
            <li><Link to="/profile">Profile & orders</Link></li>
            <li><Link to="/cart">Cart</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Craft</h4>
          <p className="mt-3 text-sm text-muted-foreground">Hand-built in our Vermont workshop using sustainably sourced hardwoods.</p>
        </div>
      </div>
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
