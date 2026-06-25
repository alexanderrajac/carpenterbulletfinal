import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { registerVendor } from "@/lib/products.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, Award, ShieldCheck, Heart, Info, ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/join-carpenter")({
  head: () => ({
    meta: [
      { title: "Join as a Carpenter / Supplier — CarpenterBullet WoodVerse" },
      {
        name: "description",
        content:
          "Open your digital woodcraft shop on India's premier wood industry marketplace. List solid wood furniture, raw timber, custom doors, and receive direct payments.",
      },
    ],
  }),
  component: JoinCarpenterPage,
});

function JoinCarpenterPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const submit = useServerFn(registerVendor);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      setLoadingSession(false);
    });
  }, []);

  const [formData, setFormData] = useState({
    business_name: "",
    owner_name: "",
    phone_number: "",
    workshop_address: "",
    city: "",
    state: "",
    upi_payout_id: "",
    bio: "",
  });

  const mutation = useMutation({
    mutationFn: (vars: any) => submit({ data: vars }),
    onSuccess: () => {
      toast.success("Workshop profile created successfully! Admin approval pending.");
      navigate({ to: "/profile" });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to register workshop. Business name might be taken.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authed) {
      toast.error("Please sign in or create an account first to link your workshop.");
      navigate({ to: "/auth", search: { redirect: "/join-carpenter" } });
      return;
    }
    mutation.mutate(formData);
  };

  const fieldCls =
    "w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200";

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Back button */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
      >
        <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
        Back to workshop
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Onboarding pitch */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-xs font-bold text-primary tracking-wide uppercase">
              <Sparkles className="h-3 w-3 animate-pulse text-amber-500" />
              Onboarding Artisans
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
              List Your Workshop. <br />
              Receive Direct Orders.
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              CarpenterBullet is the digital storefront for South Indian carpenters, timber suppliers, and hardware dealers. We bridge the gap between skilled woodcarvers and home owners seeking authentic quality.
            </p>
          </div>

          {/* Key marketplace features */}
          <div className="space-y-4 pt-2">
            {[
              {
                icon: Award,
                title: "Direct UPI Payouts",
                description: "Customers pay to your UPI address directly. We don't hold your money or take hefty marketplace fees.",
                color: "text-amber-500 bg-amber-500/10",
              },
              {
                icon: ShieldCheck,
                title: "Escrow UTR Verification",
                description: "Order verification checks safeguard transactions, protecting you from fake payment screenshots.",
                color: "text-emerald-500 bg-emerald-500/10",
              },
              {
                icon: Heart,
                title: "Custom Commissions",
                description: "Offer custom wood types and sizing adjustments. Buyers commission pieces directly to your specifications.",
                color: "text-rose-500 bg-rose-500/10",
              },
            ].map((feat) => (
              <div key={feat.title} className="flex gap-4 p-4 border border-border bg-card/30 rounded-2xl">
                <div className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center ${feat.color}`}>
                  <feat.icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{feat.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{feat.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Registration Form */}
        <div className="lg:col-span-7 bg-card border border-border p-6 sm:p-8 rounded-3xl shadow-sm space-y-6 h-fit relative">
          <div className="absolute top-0 right-8 -translate-y-1/2 bg-primary/95 text-primary-foreground font-mono text-[10px] font-bold uppercase px-3 py-1 rounded-full border border-primary-foreground/10 tracking-widest shadow-md">
            W-01
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold">Workshop Application</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Configure your vendor profile to begin listing carpentry or raw timber items.
            </p>
          </div>

          {!loadingSession && !authed && (
            <div className="p-4 bg-muted/40 border border-border rounded-2xl text-center space-y-3">
              <p className="text-xs text-muted-foreground">
                You must sign in or create an account first to link your workshop profile.
              </p>
              <Link
                to="/auth"
                search={{ redirect: "/join-carpenter" }}
                className="inline-flex items-center gap-1.5 justify-center rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 shadow-sm"
              >
                Sign In to Apply <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Business/Workshop Name</label>
                <input
                  required
                  placeholder="e.g. Raja Fine Woodworks"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  className={fieldCls}
                  disabled={mutation.isPending}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Owner / Lead Craftsman</label>
                <input
                  required
                  placeholder="e.g. Alexander Raja"
                  value={formData.owner_name}
                  onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                  className={fieldCls}
                  disabled={mutation.isPending}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Contact Phone Number</label>
                <input
                  required
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className={fieldCls}
                  disabled={mutation.isPending}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">UPI Address for Payouts</label>
                <input
                  required
                  placeholder="e.g. workshop@upi"
                  value={formData.upi_payout_id}
                  onChange={(e) => setFormData({ ...formData, upi_payout_id: e.target.value })}
                  className={fieldCls}
                  disabled={mutation.isPending}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Workshop Street Address</label>
              <input
                required
                placeholder="e.g. 45 Timber Yard Gate, Industrial Area"
                value={formData.workshop_address}
                onChange={(e) => setFormData({ ...formData, workshop_address: e.target.value })}
                className={fieldCls}
                disabled={mutation.isPending}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">City</label>
                <input
                  required
                  placeholder="e.g. Bengaluru"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className={fieldCls}
                  disabled={mutation.isPending}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">State</label>
                <input
                  required
                  placeholder="e.g. Karnataka"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className={fieldCls}
                  disabled={mutation.isPending}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">About the Workshop / Craftsmanship Bio</label>
              <textarea
                rows={3}
                placeholder="Describe your woodworking specialty, drying process, and background..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className={`${fieldCls} py-2`}
                disabled={mutation.isPending}
              />
            </div>

            <div className="flex items-start gap-2 text-[10px] sm:text-xs text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border mt-1">
              <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <span>
                By submitting, your details will be verified by our admin board. You will receive a notification and active shop panel access within 24 hours.
              </span>
            </div>

            <Button
              type="submit"
              loading={mutation.isPending}
              disabled={!authed}
              className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:opacity-95"
            >
              Submit Application
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
