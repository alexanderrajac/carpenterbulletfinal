import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { createOrder } from "@/lib/products.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, ArrowLeft, Copy, Check, Info, ChevronDown, Lock, ShieldCheck, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/checkout")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/auth",
        search: { redirect: location.href },
      });
    }
    return { user: data.user };
  },
  head: () => ({ meta: [{ title: "Checkout — CarpenterBullet" }] }),
  component: Checkout,
});

function Checkout() {
  const navigate = useNavigate();
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.totalCents());
  const clear = useCart((s) => s.clear);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<"shipping" | "payment">("shipping");
  const [vendorUpis, setVendorUpis] = useState<Record<string, string>>({});
  const [utrs, setUtrs] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [shippingData, setShippingData] = useState({
    full_name: "",
    phone_number: "",
    address: "",
    city: "",
    postal_code: "",
    country: "India",
  });

  const submit = useServerFn(createOrder);

  useEffect(() => {
    const vIds = Array.from(new Set(items.map((i) => i.vendor_id).filter(Boolean))) as string[];
    if (vIds.length === 0) return;

    supabase
      .from("vendor_profiles")
      .select("id, upi_payout_id")
      .in("id", vIds)
      .then(({ data, error }) => {
        if (data && !error) {
          const mapping = data.reduce((acc, row) => {
            acc[row.id] = row.upi_payout_id;
            return acc;
          }, {} as Record<string, string>);
          setVendorUpis(mapping);
        }
      });
  }, [items]);

  // Group items by vendor
  const groupedItems = items.reduce((acc, item) => {
    const vId = item.vendor_id || "platform";
    const vName = item.vendor_name || "CarpenterBullet Direct";
    if (!acc[vId]) {
      acc[vId] = {
        vendorId: vId,
        vendorName: vName,
        items: [],
        totalCents: 0,
      };
    }
    acc[vId].items.push(item);
    acc[vId].totalCents += item.price_cents * item.quantity;
    return acc;
  }, {} as Record<string, { vendorId: string; vendorName: string; items: typeof items; totalCents: number }>);

  const vendorGroups = Object.values(groupedItems);

  const allUtrsEntered = vendorGroups.every((g) => {
    const code = utrs[g.vendorId];
    return code && code.length === 12;
  });

  const formatItemsList = () => {
    return items
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
  };

  const handleWhatsAppOrderDirect = (overrideData?: typeof shippingData) => {
    const ship = overrideData || shippingData;
    const itemsText = formatItemsList();
    const addressBlock = ship.full_name
      ? `\n👤 *Customer Details:*\n• Name: ${ship.full_name}\n• Phone: ${ship.phone_number || "Not specified"}\n• Address: ${ship.address || ""}, ${ship.city || ""}, ${ship.postal_code || ""}, ${ship.country || "India"}`
      : ``;

    const text = `🪵 *New Direct Order Request — CarpenterBullet*\n${addressBlock}\n\n📦 *Order Items:*\n${itemsText}\n\n💰 *Total Value:* ${formatPrice(total)}\n🚚 *Delivery:* Pan-India Crated Delivery\n\nPlease confirm order processing and provide payment UPI details / dispatch timeframe!`;
    const url = `https://wa.me/918248651695?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSendSuccessToWhatsApp = () => {
    const itemsText = formatItemsList();
    const text = `✅ *Confirmed Order Receipt — CarpenterBullet*\n\n🔖 *Order ID(s):* ${success}\n👤 *Customer:* ${shippingData.full_name} (${shippingData.phone_number})\n📍 *Delivery Address:* ${shippingData.address}, ${shippingData.city} - ${shippingData.postal_code}\n\n📦 *Ordered Items:*\n${itemsText}\n\n💰 *Total Paid / Payable:* ${formatPrice(total)}\n\nHello CarpenterBullet team, I have placed this order on the website. Please keep me updated with tracking and dispatch!`;
    const url = `https://wa.me/918248651695?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (success) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600 dark:text-emerald-400 animate-bounce" />
        <h1 className="mt-6 font-display text-3xl font-semibold">Order Confirmed!</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Thank you for choosing artisanal craftsmanship from CarpenterBullet WoodVerse.
        </p>

        <div className="mt-5 p-4 rounded-2xl bg-muted/60 border border-border text-left space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-foreground">
            <span>Order Reference ID(s):</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono">Status: Pending Verification</span>
          </div>
          <p className="text-xs font-mono bg-background p-2.5 rounded-xl border border-border/80 text-foreground break-all">
            {success}
          </p>
        </div>

        {/* WhatsApp Receipt Forwarding Card */}
        <div className="mt-6 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-left space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
            <MessageCircle className="h-5 w-5 fill-current text-emerald-600 dark:text-emerald-400" />
            <span>Get Instant WhatsApp Updates</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Send your order confirmation to our official WhatsApp support (<strong className="text-foreground font-mono">+91 82486 51695</strong>) to receive direct artisan updates, crated dispatch photos, and express tracking.
          </p>
          <button
            type="button"
            onClick={handleSendSuccessToWhatsApp}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-98 cursor-pointer"
          >
            <Send className="h-4 w-4" />
            <span>Send Order Receipt to WhatsApp</span>
          </button>
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <Link
            to="/profile"
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition shadow-sm"
          >
            View My Orders
          </Link>
          <Link
            to="/shop"
            className="rounded-full border border-border bg-card px-6 py-2.5 text-sm font-medium hover:bg-accent transition"
          >
            Keep Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    navigate({ to: "/cart" });
    return null;
  }

  // Handle shipping form submission and proceed to payment
  function onShippingSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      full_name: String(fd.get("full_name") || ""),
      phone_number: String(fd.get("phone_number") || ""),
      address: String(fd.get("address") || ""),
      city: String(fd.get("city") || ""),
      postal_code: String(fd.get("postal_code") || ""),
      country: String(fd.get("country") || "India"),
    };
    setShippingData(data);
    setStep("payment");
  }

  function handleDirectWhatsAppFromForm(e: React.MouseEvent) {
    const form = (e.currentTarget as HTMLElement).closest("form");
    if (form) {
      const fd = new FormData(form);
      const data = {
        full_name: String(fd.get("full_name") || ""),
        phone_number: String(fd.get("phone_number") || ""),
        address: String(fd.get("address") || ""),
        city: String(fd.get("city") || ""),
        postal_code: String(fd.get("postal_code") || ""),
        country: String(fd.get("country") || "India"),
      };
      setShippingData(data);
      handleWhatsAppOrderDirect(data);
    } else {
      handleWhatsAppOrderDirect();
    }
  }

  // Handle final order creation with UPI verification
  async function onPaymentSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate UTRs
    for (const group of vendorGroups) {
      const u = utrs[group.vendorId];
      if (!u || u.length !== 12) {
        toast.error(`Please enter a valid 12-digit UTR for ${group.vendorName}`);
        return;
      }
    }

    setIsSubmitting(true);
    const orderIds: string[] = [];

    try {
      for (const group of vendorGroups) {
        const upiId = group.vendorId === "platform" ? "8248651695@ibl" : (vendorUpis[group.vendorId] || "8248651695@ibl");
        const res = await submit({
          data: {
            items: group.items.map((i) => ({
              product_id: i.id,
              quantity: i.quantity,
              customizations: i.customizations,
              vendor_id: i.vendor_id,
            })),
            shipping: {
              ...shippingData,
              payment_method: "UPI QR Code",
              upi_id: upiId,
              upi_utr: utrs[group.vendorId],
            },
          }
        });
        orderIds.push(res.orderId);
      }

      clear();
      setSuccess(orderIds.join(", "));
      toast.success("All orders placed successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  }

  const fieldCls =
    "w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary transition-all duration-200";

  // Total is already in INR cents
  const usdTotal = total; // Keep variable name to avoid editing JSX lines
  const inrTotal = Math.round(total / 100);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-6 gap-4">
        <div className="flex items-center gap-3">
          {step === "payment" && (
            <button
              onClick={() => setStep("shipping")}
              className="p-2 hover:bg-accent rounded-full transition-all cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <h1 className="font-display text-3xl font-semibold tracking-tight">Checkout</h1>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-1.5 rounded-full border border-emerald-250/30">
          <Lock className="h-3.5 w-3.5 animate-pulse text-emerald-500" />
          <span>128-Bit SSL Secure Connection</span>
        </div>
      </div>

      {step === "shipping" ? (
        <form onSubmit={onShippingSubmit} className="mt-8 grid gap-10 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <h2 className="font-display text-xl border-b border-border pb-2 flex items-center gap-2">
              <Lock className="h-4.5 w-4.5 text-muted-foreground" />
              Shipping Information
            </h2>
            <div className="space-y-4">
              <input
                name="full_name"
                required
                placeholder="Full name"
                defaultValue={shippingData.full_name}
                className={fieldCls}
                maxLength={120}
              />
              <input
                name="phone_number"
                type="tel"
                required
                placeholder="Phone number"
                defaultValue={shippingData.phone_number}
                className={fieldCls}
                maxLength={20}
              />
              <input
                name="address"
                required
                placeholder="Street address"
                defaultValue={shippingData.address}
                className={fieldCls}
                maxLength={240}
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <input
                  name="city"
                  required
                  placeholder="City"
                  defaultValue={shippingData.city}
                  className={fieldCls}
                  maxLength={120}
                />
                <input
                  name="postal_code"
                  required
                  placeholder="Postal code"
                  defaultValue={shippingData.postal_code}
                  className={fieldCls}
                  maxLength={20}
                />
                <input
                  name="country"
                  required
                  placeholder="Country"
                  defaultValue={shippingData.country}
                  className={fieldCls}
                  maxLength={80}
                />
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3.5 rounded-xl border border-border">
              <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <span>
                We ship across India. Your order will be handmade and processed once payment is
                confirmed.
              </span>
            </div>
          </div>

          <aside className="rounded-2xl border border-border bg-card p-6 h-fit shadow-sm">
            <h2 className="font-display text-xl border-b border-border pb-2">Order Summary</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {items.map((i, idx) => (
                <li
                  key={`${i.id}-${idx}`}
                  className="flex flex-col gap-0.5 text-muted-foreground"
                >
                  <div className="flex justify-between gap-2">
                    <span className="truncate text-foreground font-medium">
                      {i.name}{" "}
                      <span className="text-xs text-muted-foreground font-normal">
                        ×{i.quantity}
                      </span>
                    </span>
                    <span className="tabular-nums font-mono">
                      {formatPrice(i.price_cents * i.quantity)}
                    </span>
                  </div>
                  {i.customizations && Object.keys(i.customizations).length > 0 && (
                    <div className="text-[10px] text-muted-foreground mt-0.5 space-y-0.5">
                      {Object.entries(i.customizations).map(([key, val]: [string, any]) => (
                        <p key={key}>
                          {key}: {val.label || val}
                        </p>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex justify-between border-t border-border pt-4 font-semibold text-lg">
              <span>Total</span>
              <span className="tabular-nums font-mono text-primary">{formatPrice(usdTotal)}</span>
            </div>

            <div className="mt-6 space-y-2.5">
              <button
                type="submit"
                className="w-full rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all shadow-lg active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Proceed to Online Payment →</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-border/80"></div>
                <span className="flex-shrink mx-2 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">or direct channel</span>
                <div className="flex-grow border-t border-border/80"></div>
              </div>

              <button
                type="button"
                onClick={handleDirectWhatsAppFromForm}
                className="w-full flex items-center justify-center gap-2 rounded-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer border border-emerald-400/30"
              >
                <MessageCircle className="h-4 w-4 fill-current" />
                <span>Order Entire Cart on WhatsApp</span>
              </button>
            </div>

            {/* Buyer Trust & Protection Box */}
            <div className="mt-6 p-4 rounded-2xl bg-muted/40 border border-border/60 text-xs space-y-2.5 text-muted-foreground">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>CarpenterBullet 100% Buyer Protection</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Every piece is inspect-checked before shipment. Crated wooden packaging guarantees damage-free delivery across India.
              </p>
              <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                <span>✓ 5-Yr Structural Warranty</span>
                <span>✓ Pay via UPI / COD</span>
              </div>
            </div>
          </aside>
        </form>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <h2 className="font-display text-xl border-b border-border pb-2 flex items-center gap-2">
              <Lock className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
              Secure QR Payment (UPI)
            </h2>

            <p className="text-sm text-muted-foreground">
              Please pay each vendor directly using their unique UPI address or QR code below. Enter the 12-digit UTR transaction ID for each payment to confirm.
            </p>

            <form onSubmit={onPaymentSubmit} className="space-y-8">
              {vendorGroups.map((group) => {
                const upiId = group.vendorId === "platform" ? "8248651695@ibl" : (vendorUpis[group.vendorId] || "8248651695@ibl");
                const grpInrTotal = Math.round(group.totalCents / 100);
                const grpUpiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(group.vendorName)}&am=${grpInrTotal}&cu=INR&tn=Order%20Payment`;
                const grpQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(grpUpiUrl)}`;

                return (
                  <div key={group.vendorId} className="space-y-4 border border-border/80 bg-card p-6 rounded-3xl shadow-sm relative overflow-hidden">
                    <div className="border-b border-border pb-3 flex items-center justify-between">
                      <h3 className="font-display text-lg font-semibold flex items-center gap-2 text-foreground">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        {group.vendorName}
                      </h3>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                        Payable: {formatPrice(group.totalCents)}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
                      <div className="bg-white p-3 rounded-2xl shadow-inner border border-border/50 shrink-0">
                        <img src={grpQrCodeUrl} alt="UPI QR Code to Scan" className="h-[140px] w-[140px]" />
                        <div className="text-center text-[8px] text-zinc-400 mt-1 font-mono tracking-wider">
                          SECURE QR CODE
                        </div>
                      </div>

                      <div className="flex-1 space-y-3 w-full">
                        <div className="bg-background/80 backdrop-blur border border-border p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs">
                          <div className="truncate">
                            <span className="text-[10px] text-muted-foreground block text-left">
                              UPI Address
                            </span>
                            <span className="font-semibold text-foreground select-all font-mono truncate block">
                              {upiId}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(upiId);
                              toast.success(`UPI ID for ${group.vendorName} copied!`);
                            }}
                            className="p-2 hover:bg-accent rounded-lg transition-all shrink-0 cursor-pointer"
                            title="Copy UPI ID"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div>
                          <label className="text-[10px] text-muted-foreground mb-1 block">
                            12-Digit Transaction ID (UTR / Ref Number) *
                          </label>
                          <input
                            type="text"
                            pattern="[0-9]{12}"
                            maxLength={12}
                            required
                            placeholder="Enter 12-digit UPI UTR"
                            value={utrs[group.vendorId] || ""}
                            onChange={(e) => setUtrs({
                              ...utrs,
                              [group.vendorId]: e.target.value.replace(/[^0-9]/g, "")
                            })}
                            className={`${fieldCls} font-mono text-sm tracking-widest text-center py-2`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* UTR Interactive Guide */}
              <div className="border border-border/80 bg-muted/20 rounded-xl p-3.5 space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-primary" />
                  Where to find the 12-digit UTR/Ref ID?
                </h4>
                <div className="space-y-1">
                  <UtrGuideItem
                    app="Google Pay"
                    steps="Open Google Pay > Tap 'Show transaction history' > Select the transaction > Find the 12-digit 'UPI Transaction ID'."
                  />
                  <UtrGuideItem
                    app="PhonePe"
                    steps="Open PhonePe > Tap 'History' (bottom right) > Select the transaction > Find the 12-digit 'UTR' number."
                  />
                  <UtrGuideItem
                    app="Paytm / Banking Apps"
                    steps="Open Paytm > Tap 'Balance & History' > Select the transaction > Find the 12-digit 'UPI Ref No'."
                  />
                </div>
              </div>

              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                <span>
                  Your order is secure. Confirmed orders will be shipped to {shippingData.full_name}.
                </span>
              </div>

              <Button
                type="submit"
                loading={isSubmitting}
                disabled={!allUtrsEntered}
                className="w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-all shadow-md mt-2"
              >
                Confirm Payments & Place Order (Website)
              </Button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => handleWhatsAppOrderDirect()}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center justify-center gap-1.5 mx-auto py-1"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>Prefer to pay or verify over WhatsApp? Click here</span>
                </button>
              </div>
            </form>
          </div>

          <aside className="space-y-6 h-fit">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-display text-xl border-b border-border pb-2">Order</h2>
              <ul className="mt-4 space-y-3 text-sm border-b border-border pb-4">
                {items.map((i, idx) => (
                  <li
                    key={`${i.id}-${idx}`}
                    className="flex flex-col gap-0.5 text-muted-foreground"
                  >
                    <div className="flex justify-between gap-2">
                      <span className="truncate text-foreground font-medium">
                        {i.name}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          ×{i.quantity}
                        </span>
                      </span>
                      <span className="tabular-nums font-mono">
                        {formatPrice(i.price_cents * i.quantity)}
                      </span>
                    </div>
                    {i.customizations && Object.keys(i.customizations).length > 0 && (
                      <div className="text-[10px] text-muted-foreground mt-0.5 space-y-0.5">
                        {Object.entries(i.customizations).map(([key, val]: [string, any]) => (
                          <p key={key}>
                            {key}: {val.label || val}
                          </p>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-between font-semibold text-lg">
                <span>Total Payable</span>
                <span className="tabular-nums font-mono text-emerald-600 dark:text-emerald-400">
                  ₹{inrTotal}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-muted/30 p-5 space-y-2.5 text-sm">
              <h4 className="font-semibold text-foreground">Shipping Address</h4>
              <p className="text-muted-foreground leading-relaxed text-xs">
                {shippingData.full_name}
                <br />
                Phone: {shippingData.phone_number}
                <br />
                {shippingData.address}
                <br />
                {shippingData.city}, {shippingData.postal_code}
                <br />
                {shippingData.country}
              </p>
              <button
                onClick={() => setStep("shipping")}
                className="text-xs font-semibold text-primary hover:underline mt-1.5"
              >
                Edit address
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function UtrGuideItem({ app, steps }: { app: string; steps: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-border/40 pb-2 last:border-b-0 last:pb-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left text-xs font-semibold text-foreground/80 hover:text-primary transition-colors cursor-pointer py-1.5"
      >
        <span>{app}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180 text-primary" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-24 mt-1 text-muted-foreground leading-relaxed pl-1 text-[11px]" : "max-h-0"}`}>
        {isOpen && <p>{steps}</p>}
      </div>
    </div>
  );
}
