import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart-store";
import { resolveImage } from "@/lib/product-images";
import { formatPrice } from "@/lib/format";
import { Minus, Plus, X, ShoppingBag, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — CarpenterBullet WoodVerse" },
      {
        name: "description",
        content:
          "Review your cart and checkout handcrafted wood furniture, tools and carpentry services at CarpenterBullet WoodVerse.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const total = useCart((s) => s.totalCents());

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-muted">
          <ShoppingBag className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="mt-6 font-display text-3xl">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Discover heirloom pieces made by hand.</p>
        <Link
          to="/shop"
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
        >
          Shop now
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-medium tracking-tight">Cart</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        <ul className="divide-y divide-border lg:col-span-2">
          {items.map((i, idx) => (
            <li key={`${i.id}-${idx}`} className="flex gap-4 py-6">
              <Link
                to="/product/$slug"
                params={{ slug: i.slug }}
                className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted"
              >
                <img
                  src={resolveImage(i.image_url, "f_auto,q_auto,w_150")}
                  alt={i.name}
                  className="h-full w-full object-cover"
                />
              </Link>
              <div className="flex-1">
                <div className="flex justify-between gap-2">
                  <div>
                    <Link
                      to="/product/$slug"
                      params={{ slug: i.slug }}
                      className="font-display text-lg leading-tight hover:underline"
                    >
                      {i.name}
                    </Link>
                    {i.customizations && Object.keys(i.customizations).length > 0 && (
                      <div className="text-xs text-muted-foreground mt-0.5 space-y-0.5">
                        {Object.entries(i.customizations).map(([key, val]: [string, any]) => (
                          <p key={key}>
                            {key}: <span className="font-medium text-foreground">{val.label || val}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => remove(i.id, i.customizations)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{formatPrice(i.price_cents)}</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="inline-flex items-center rounded-full border border-border">
                    <button
                      onClick={() => setQty(i.id, i.quantity - 1, i.customizations)}
                      className="p-2 hover:bg-accent rounded-l-full"
                      aria-label="Decrease"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-8 text-center text-sm tabular-nums">{i.quantity}</span>
                    <button
                      onClick={() => setQty(i.id, i.quantity + 1, i.customizations)}
                      className="p-2 hover:bg-accent rounded-r-full"
                      aria-label="Increase"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="ml-auto font-medium tabular-nums">
                    {formatPrice(i.price_cents * i.quantity)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <aside className="rounded-2xl border border-border bg-card p-6 h-fit">
          <h2 className="font-display text-xl">Summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>Calculated at checkout</dd>
            </div>
          </dl>
          <div className="mt-4 flex justify-between border-t border-border pt-4 text-base font-medium">
            <span>Total</span>
            <span className="tabular-nums">{formatPrice(total)}</span>
          </div>
          <Link
            to="/checkout"
            className="mt-6 block rounded-full bg-primary py-3 text-center text-sm font-medium text-primary-foreground hover:opacity-90 transition-all active:scale-98 shadow-md"
          >
            Checkout
          </Link>

          {/* Trust seals & help section */}
          <div className="mt-6 border-t border-border/80 pt-6 space-y-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 font-semibold text-foreground/90">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-450 shrink-0 animate-pulse" />
              <span>100% Secure Checkout Guaranteed</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              We protect your transaction with secure UPI QR verification. Commissions are processed upon verification.
            </p>
            {/* Payment Icons */}
            <div className="flex flex-wrap gap-2 items-center opacity-70 filter grayscale hover:grayscale-0 transition-all duration-300">
              <span className="bg-muted px-2 py-0.5 rounded font-mono text-[9px] font-bold border border-border">UPI</span>
              <span className="bg-muted px-2 py-0.5 rounded font-mono text-[9px] font-bold border border-border">BHIM</span>
              <span className="bg-muted px-2 py-0.5 rounded font-mono text-[9px] font-bold border border-border">RuPay</span>
              <span className="bg-muted px-2 py-0.5 rounded font-mono text-[9px] font-bold border border-border">Visa</span>
              <span className="bg-muted px-2 py-0.5 rounded font-mono text-[9px] font-bold border border-border">Mastercard</span>
            </div>
            {/* Support hotline */}
            <div className="bg-muted/40 border border-border/60 p-3 rounded-xl space-y-1 mt-2">
              <p className="font-semibold text-foreground text-[11px]">Need custom sizing or assistance?</p>
              <p className="text-[10px] leading-relaxed">
                Talk directly to our South Indian wood workshop:
                <br />
                <span className="font-semibold text-primary select-all font-mono">+91 82486 51695</span>
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
