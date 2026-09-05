import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart-store";
import { resolveImage } from "@/lib/product-images";
import { formatPrice } from "@/lib/format";
import { Minus, Plus, X, ShoppingBag, ShieldCheck, Truck, Sparkles, MessageCircle, ArrowRight } from "lucide-react";

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

  // Free shipping progress calculation (Free crated delivery over ₹2,500)
  const FREE_SHIPPING_THRESHOLD = 250000;
  const progressPercent = Math.min(100, Math.round((total / FREE_SHIPPING_THRESHOLD) * 100));
  const isFreeShippingUnlocked = total >= FREE_SHIPPING_THRESHOLD;
  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD - total;

  const handleWhatsAppCartOrder = () => {
    const itemsSummary = items
      .map((it) => {
        let details = `• ${it.name} (Qty: ${it.quantity}) - ${formatPrice(it.price_cents * it.quantity)}`;
        if (it.customizations && Object.keys(it.customizations).length > 0) {
          const customStr = Object.entries(it.customizations)
            .map(([k, v]: [string, any]) => `${k}: ${v.label || v}`)
            .join(", ");
          details += `\n   ↳ Customization: ${customStr}`;
        }
        return details;
      })
      .join("\n");
    const text = `🪵 *New Order Request from Cart — CarpenterBullet*\n\n📦 *Cart Items:*\n${itemsSummary}\n\n💰 *Total Cart Value:* ${formatPrice(total)}\n🚚 *Delivery:* ${isFreeShippingUnlocked ? "Free Crated Pan-India Delivery (Unlocked!)" : "Pan-India Crated Delivery"}\n\nPlease provide payment details (UPI QR / Bank Transfer / COD) and dispatch timeline!`;
    const url = `https://wa.me/918248651695?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-muted">
          <ShoppingBag className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="mt-6 font-display text-3xl">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Discover heirloom solid wood furniture and expert carpentry.</p>
        <Link
          to="/shop"
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
        >
          Explore Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-border/60 pb-4">
        <h1 className="font-display text-4xl font-medium tracking-tight">Your Cart</h1>
        <span className="text-sm text-muted-foreground font-medium">
          {items.reduce((sum, it) => sum + it.quantity, 0)} handcrafted pieces
        </span>
      </div>

      {/* Free Delivery Progress Bar */}
      <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-primary/10 border border-emerald-500/30">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-foreground">
            <Truck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            {isFreeShippingUnlocked ? (
              <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                🎉 Congratulations! You unlocked Free Crated Pan-India Delivery!
              </span>
            ) : (
              <span>
                Add <strong className="text-primary font-mono">{formatPrice(remainingForFreeShipping)}</strong> more to get <strong>Free Crated Delivery</strong>
              </span>
            )}
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">{progressPercent}%</span>
        </div>
        <div className="mt-2.5 h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        <ul className="divide-y divide-border lg:col-span-2">
          {items.map((i, idx) => (
            <li key={`${i.id}-${idx}`} className="flex gap-4 py-6">
              <Link
                to="/product/$slug"
                params={{ slug: i.slug }}
                className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted/40 border border-border/40 p-1 flex items-center justify-center"
              >
                <img
                  src={resolveImage(i.image_url, "f_auto,q_auto,w_150")}
                  alt={i.name}
                  className="h-full w-full object-contain"
                />
              </Link>
              <div className="flex-1">
                <div className="flex justify-between gap-2">
                  <div>
                    <Link
                      to="/product/$slug"
                      params={{ slug: i.slug }}
                      className="font-display text-lg leading-tight hover:underline font-semibold"
                    >
                      {i.name}
                    </Link>
                    {i.customizations && Object.keys(i.customizations).length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                        {Object.entries(i.customizations).map(([key, val]: [string, any]) => (
                          <p key={key} className="bg-muted/40 px-2 py-0.5 rounded text-[11px] w-fit">
                            {key}: <span className="font-medium text-foreground">{val.label || val}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => remove(i.id, i.customizations, i.vendor_id)}
                    className="text-muted-foreground hover:text-foreground p-1"
                    aria-label="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-sm font-mono font-bold text-foreground">{formatPrice(i.price_cents)}</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center rounded-xl border border-border bg-card">
                    <button
                      onClick={() => setQty(i.id, i.quantity - 1, i.customizations, i.vendor_id)}
                      className="p-2 hover:bg-accent rounded-l-xl transition"
                      aria-label="Decrease"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-8 text-center text-sm font-mono tabular-nums">{i.quantity}</span>
                    <button
                      onClick={() => setQty(i.id, i.quantity + 1, i.customizations, i.vendor_id)}
                      className="p-2 hover:bg-accent rounded-r-xl transition"
                      aria-label="Increase"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="ml-auto font-bold font-mono text-primary tabular-nums">
                    {formatPrice(i.price_cents * i.quantity)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <aside className="rounded-3xl border border-border bg-card p-6 h-fit shadow-sm">
          <h2 className="font-display text-xl font-semibold">Order Summary</h2>
          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="tabular-nums font-mono font-medium">{formatPrice(total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Crated Shipping</dt>
              <dd className="font-semibold text-emerald-600 dark:text-emerald-400">
                {isFreeShippingUnlocked ? "FREE" : "Calculated at checkout"}
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex justify-between border-t border-border pt-4 text-base font-bold">
            <span>Estimated Total</span>
            <span className="tabular-nums font-mono text-primary text-xl">{formatPrice(total)}</span>
          </div>

          <div className="mt-6 space-y-2.5">
            <Link
              to="/checkout"
              className="block w-full rounded-full bg-primary hover:bg-primary/95 text-primary-foreground py-3.5 text-center text-sm font-bold shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Proceed to Website Checkout →</span>
            </Link>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-border/80"></div>
              <span className="flex-shrink mx-2 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">or order via</span>
              <div className="flex-grow border-t border-border/80"></div>
            </div>

            {/* Direct WhatsApp Order Option */}
            <button
              type="button"
              onClick={handleWhatsAppCartOrder}
              className="w-full flex items-center justify-center gap-2 rounded-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-98 cursor-pointer border border-emerald-400/30"
            >
              <MessageCircle className="h-4 w-4 fill-current" />
              <span>⚡ Order Entire Cart on WhatsApp</span>
            </button>
          </div>

          {/* Trust seals & help section */}
          <div className="mt-6 border-t border-border/80 pt-6 space-y-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 font-semibold text-foreground/90">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-450 shrink-0" />
              <span>100% Safe & Secure Transaction</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Protected by 256-bit bank-grade encryption with instant UPI QR & Cash on Delivery options.
            </p>
            {/* Payment Icons */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="bg-muted px-2 py-0.5 rounded font-mono text-[9px] font-bold border border-border">UPI</span>
              <span className="bg-muted px-2 py-0.5 rounded font-mono text-[9px] font-bold border border-border">GPay</span>
              <span className="bg-muted px-2 py-0.5 rounded font-mono text-[9px] font-bold border border-border">PhonePe</span>
              <span className="bg-muted px-2 py-0.5 rounded font-mono text-[9px] font-bold border border-border">Paytm</span>
              <span className="bg-muted px-2 py-0.5 rounded font-mono text-[9px] font-bold border border-border">NetBanking</span>
              <span className="bg-muted px-2 py-0.5 rounded font-mono text-[9px] font-bold border border-border">COD</span>
            </div>
            {/* Support hotline */}
            <div className="bg-muted/40 border border-border/60 p-3 rounded-2xl space-y-1 mt-2">
              <p className="font-semibold text-foreground text-[11px]">Need custom sizing or wood assistance?</p>
              <p className="text-[10px] leading-relaxed">
                Talk directly with our master wood workshop:
                <br />
                <span className="font-bold text-primary select-all font-mono">+91 82486 51695</span>
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
