import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { createOrder } from "@/lib/products.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, ArrowLeft, Copy, Check, Info, ChevronDown, Lock } from "lucide-react";
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

  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600 dark:text-emerald-400" />
        <h1 className="mt-6 font-display text-3xl">Order confirmed</h1>
        <p className="mt-2 text-muted-foreground">Thank you for your craftsmanship order!</p>
        <p className="mt-4 text-xs font-mono bg-muted p-3.5 rounded-lg inline-block text-muted-foreground break-all max-w-full">
          Order IDs: {success}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/profile"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            View orders
          </Link>
          <Link
            to="/shop"
            className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium"
          >
            Keep shopping
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
    setShippingData({
      full_name: String(fd.get("full_name") || ""),
      phone_number: String(fd.get("phone_number") || ""),
      address: String(fd.get("address") || ""),
      city: String(fd.get("city") || ""),
      postal_code: String(fd.get("postal_code") || ""),
      country: String(fd.get("country") || "India"),
    });
    setStep("payment");
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
              <span className="tabular-nums font-mono">{formatPrice(usdTotal)}</span>
            </div>
            <button
              type="submit"
              className="mt-6 w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all shadow-md"
            >
              Proceed to Payment
            </button>
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
                Confirm Payments & Place Order
              </Button>
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
