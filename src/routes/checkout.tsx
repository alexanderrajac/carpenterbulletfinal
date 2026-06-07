import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { createOrder } from "@/lib/products.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, ArrowLeft, Copy, Check, Info } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Woodverse" }] }),
  component: Checkout,
});

function Checkout() {
  const navigate = useNavigate();
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.totalCents());
  const clear = useCart((s) => s.clear);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<"shipping" | "payment">("shipping");
  const [copied, setCopied] = useState(false);
  
  const [shippingData, setShippingData] = useState({
    full_name: "",
    address: "",
    city: "",
    postal_code: "",
    country: "India",
  });
  
  const [utr, setUtr] = useState("");
  const submit = useServerFn(createOrder);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);

  const mutation = useMutation({
    mutationFn: (vars: any) => submit({ data: vars }),
    onSuccess: (res) => { 
      clear(); 
      setSuccess(res.orderId); 
      toast.success("Order placed successfully!"); 
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (authed === false) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-display text-3xl">Sign in to checkout</h1>
        <p className="mt-2 text-muted-foreground">You need an account to place an order.</p>
        <Link to="/auth" search={{ redirect: "/checkout" }} className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">Sign in</Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600 dark:text-emerald-400" />
        <h1 className="mt-6 font-display text-3xl">Order confirmed</h1>
        <p className="mt-2 text-muted-foreground">Thank you for your craftsmanship order!</p>
        <p className="mt-4 text-xs font-mono bg-muted p-2 rounded-lg inline-block text-muted-foreground">Order ID: {success}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/profile" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">View orders</Link>
          <Link to="/shop" className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium">Keep shopping</Link>
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
      address: String(fd.get("address") || ""),
      city: String(fd.get("city") || ""),
      postal_code: String(fd.get("postal_code") || ""),
      country: String(fd.get("country") || "India"),
    });
    setStep("payment");
  }

  // Handle final order creation with UPI verification
  function onPaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!utr.trim() || utr.trim().length < 8) {
      toast.error("Please enter a valid UPI Transaction Ref No. / UTR");
      return;
    }
    
    mutation.mutate({
      items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
      shipping: {
        ...shippingData,
        payment_method: "UPI QR Code",
        upi_id: "8248651695@ibl",
        upi_utr: utr.trim(),
      },
    });
  }

  const copyUpiId = () => {
    navigator.clipboard.writeText("8248651695@ibl");
    setCopied(true);
    toast.success("UPI ID copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const fieldCls = "w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary transition-all duration-200";

  // Converting USD total to INR (using exchange rate of 1 USD = 83 INR)
  const usdTotal = total;
  const inrTotal = Math.round((total / 100) * 83);

  // Generate standard UPI payload URL
  const upiUrl = `upi://pay?pa=8248651695@ibl&pn=Woodverse%20Store&am=${inrTotal}&cu=INR&tn=Order%20Payment`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex items-center gap-3">
        {step === "payment" && (
          <button onClick={() => setStep("shipping")} className="p-2 hover:bg-accent rounded-full transition-all">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="font-display text-4xl font-medium tracking-tight">Checkout</h1>
      </div>
      
      {step === "shipping" ? (
        <form onSubmit={onShippingSubmit} className="mt-8 grid gap-10 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <h2 className="font-display text-xl border-b border-border pb-2">Shipping Information</h2>
            <div className="space-y-4">
              <input name="full_name" required placeholder="Full name" defaultValue={shippingData.full_name} className={fieldCls} maxLength={120} />
              <input name="address" required placeholder="Street address" defaultValue={shippingData.address} className={fieldCls} maxLength={240} />
              <div className="grid gap-4 sm:grid-cols-3">
                <input name="city" required placeholder="City" defaultValue={shippingData.city} className={fieldCls} maxLength={120} />
                <input name="postal_code" required placeholder="Postal code" defaultValue={shippingData.postal_code} className={fieldCls} maxLength={20} />
                <input name="country" required placeholder="Country" defaultValue={shippingData.country} className={fieldCls} maxLength={80} />
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3.5 rounded-xl border border-border">
              <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <span>We ship across India. Your order will be handmade and processed once payment is confirmed.</span>
            </div>
          </div>
          
          <aside className="rounded-2xl border border-border bg-card p-6 h-fit shadow-sm">
            <h2 className="font-display text-xl border-b border-border pb-2">Order Summary</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between gap-2 text-muted-foreground">
                  <span className="truncate text-foreground font-medium">{i.name} <span className="text-xs text-muted-foreground font-normal">×{i.quantity}</span></span>
                  <span className="tabular-nums font-mono">{formatPrice(i.price_cents * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex justify-between border-t border-border pt-4 font-semibold text-lg">
              <span>Total</span><span className="tabular-nums font-mono">{formatPrice(usdTotal)}</span>
            </div>
            <button type="submit" className="mt-6 w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all shadow-md">
              Proceed to Payment
            </button>
          </aside>
        </form>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="font-display text-xl border-b border-border pb-2">Scan & Pay with UPI</h2>
            
            {/* Premium QR Payment Card */}
            <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/20 p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm">
              <div className="bg-white p-4 rounded-2xl shadow-inner border border-border/50 shrink-0">
                <img src={qrCodeUrl} alt="UPI QR Code to Scan" className="h-[200px] w-[200px]" />
                <div className="text-center text-[10px] text-zinc-400 mt-2 font-mono tracking-wider">SECURE QR CODE</div>
              </div>
              
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full">Recommended</span>
                  <h3 className="mt-2 text-2xl font-semibold font-display">UPI QR Code</h3>
                  <p className="text-sm text-muted-foreground mt-1">Scan using BHIM, Google Pay, PhonePe, Paytm, or any banking app.</p>
                </div>
                
                <div className="bg-background/80 backdrop-blur border border-border p-3.5 rounded-xl flex items-center justify-between gap-3 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block text-left">UPI Address</span>
                    <span className="font-semibold text-foreground select-all font-mono">8248651695@ibl</span>
                  </div>
                  <button onClick={copyUpiId} className="p-2 hover:bg-accent rounded-lg transition-all" title="Copy UPI ID">
                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                  <div>
                    <span className="text-xs text-muted-foreground block">Order Total</span>
                    <span className="text-lg font-bold font-mono">{formatPrice(usdTotal)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Payable Amount</span>
                    <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">₹{inrTotal}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Payment Verification Form */}
            <form onSubmit={onPaymentSubmit} className="space-y-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
              <h3 className="font-display text-lg font-medium">Payment Verification</h3>
              <p className="text-sm text-muted-foreground">After completing the transaction in your app, enter the 12-digit transaction ID (UTR / Ref No.) below to verify and place your order.</p>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Transaction ID (UTR / UPI Ref Number)</label>
                <input 
                  type="text" 
                  pattern="[0-9]{12}" 
                  maxLength={12} 
                  required 
                  placeholder="e.g. 123456789012" 
                  value={utr}
                  onChange={(e) => setUtr(e.target.value.replace(/[^0-9]/g, ''))}
                  className={`${fieldCls} font-mono text-base tracking-widest text-center`} 
                />
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                <span>Your order is secure. Confirmed orders will be shipped to {shippingData.full_name}.</span>
              </div>
              <button 
                type="submit" 
                disabled={mutation.isPending || utr.length !== 12}
                className="w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all shadow-md mt-2"
              >
                {mutation.isPending ? "Confirming Payment..." : "Confirm Payment & Place Order"}
              </button>
            </form>
          </div>
          
          <aside className="space-y-6 h-fit">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-display text-xl border-b border-border pb-2">Order</h2>
              <ul className="mt-4 space-y-3 text-sm border-b border-border pb-4">
                {items.map((i) => (
                  <li key={i.id} className="flex justify-between gap-2 text-muted-foreground">
                    <span className="truncate text-foreground font-medium">{i.name} <span className="text-xs font-normal text-muted-foreground">×{i.quantity}</span></span>
                    <span className="tabular-nums font-mono">{formatPrice(i.price_cents * i.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-between font-semibold text-lg">
                <span>Total Payable</span>
                <span className="tabular-nums font-mono text-emerald-600 dark:text-emerald-400">₹{inrTotal}</span>
              </div>
            </div>
            
            <div className="rounded-2xl border border-border bg-muted/30 p-5 space-y-2.5 text-sm">
              <h4 className="font-semibold text-foreground">Shipping Address</h4>
              <p className="text-muted-foreground leading-relaxed text-xs">
                {shippingData.full_name}<br />
                {shippingData.address}<br />
                {shippingData.city}, {shippingData.postal_code}<br />
                {shippingData.country}
              </p>
              <button onClick={() => setStep("shipping")} className="text-xs font-semibold text-primary hover:underline mt-1.5">Edit address</button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
