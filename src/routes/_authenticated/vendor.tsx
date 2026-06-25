import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyRoles, getVendorProfile } from "@/lib/products.functions";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ArrowLeft,
  Settings,
  Store,
  Hammer,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { resolveImage } from "@/lib/product-images";

export const Route = createFileRoute("/_authenticated/vendor")({
  head: () => ({ meta: [{ title: "Workshop Portal — CarpenterBullet" }] }),
  component: VendorLayout,
});

function VendorLayout() {
  const fetchRoles = useServerFn(getMyRoles);
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["my-roles"],
    queryFn: () => fetchRoles(),
  });

  const fetchProfile = useServerFn(getVendorProfile);
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["my-vendor-profile"],
    queryFn: () => fetchProfile(),
    enabled: !!(roles ?? []).includes("vendor"),
  });

  const location = useLocation();

  const isLoading = rolesLoading || (roles?.includes("vendor") && profileLoading);

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-wood-pattern">
        <div className="text-center space-y-4">
          <Hammer className="h-8 w-8 text-amber-500 animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Verifying workshop access…</p>
        </div>
      </div>
    );

  if (!(roles ?? []).includes("vendor")) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center space-y-6">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
          <Hammer className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-semibold">Workshop Access Required</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            You must register your carpentry workshop and receive admin verification before you can access the vendor panel.
          </p>
        </div>
        <div className="flex flex-col gap-3 justify-center sm:flex-row">
          <Link
            to="/join-carpenter"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95 cursor-pointer"
          >
            Apply as Carpenter
          </Link>
          <Link
            to="/"
            className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold transition hover:bg-accent cursor-pointer"
          >
            Go to Shop
          </Link>
        </div>
      </div>
    );
  }

  if (!profile || !profile.is_approved) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center space-y-6">
        <div className="mx-auto h-16 w-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-inner">
          <Hammer className="h-8 w-8 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Workshop Under Review</h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            Your carpentry workshop profile has been registered and is currently pending review by our administrator board.
          </p>
          <div className="bg-muted/40 border border-border p-4 rounded-2xl text-xs text-muted-foreground max-w-md mx-auto text-left space-y-1.5 mt-4">
            <p className="font-bold text-foreground">Next Steps:</p>
            <p>1. Admins will verify your workshop address and UPI payout configuration.</p>
            <p>2. Verification usually takes less than 24 hours.</p>
            <p>3. Once approved, refreshing this page will unlock your products catalog and order management dashboard.</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 justify-center sm:flex-row pt-2">
          <Link
            to="/"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-95 transition cursor-pointer"
          >
            Go to Shop Storefront
          </Link>
          <a
            href="mailto:support@carpenterbullet.com"
            className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-accent transition"
          >
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  const tabs = [
    { to: "/vendor", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/vendor/products", label: "My Products", icon: Package },
    { to: "/vendor/orders", label: "Orders", icon: ShoppingCart },
    { to: "/vendor/profile", label: "Settings", icon: Settings },
  ];

  return (
    <div className="bg-wood-pattern min-h-screen pb-16">
      {/* Glow background decorations */}
      <div className="fixed top-0 left-1/4 h-[350px] w-[350px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-10 right-1/4 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[140px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        {/* Header navigation links */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-0.5 transition-transform" /> Back to store
          </Link>
          <Link
            to={profile ? `/carpenter/${profile.id}` : "/"}
            className="inline-flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 px-3.5 py-2 rounded-full hover:bg-primary/15 transition-colors cursor-pointer"
          >
            <Store className="h-3.5 w-3.5" /> View Storefront
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* Sidebar */}
          <nav className="space-y-1">
            {/* Workshop profile card in sidebar */}
            {profile && (
              <div className="mb-6 p-4 rounded-2xl border border-border bg-card/75 backdrop-blur-md shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-primary/5 pointer-events-none" />
                
                {/* Circular Avatar */}
                <div className="relative h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-500 mb-3 shadow-inner group-hover:scale-105 transition-transform duration-300">
                  {profile.avatar_url ? (
                    <div className="h-full w-full rounded-2xl overflow-hidden">
                      <img src={resolveImage(profile.avatar_url)} alt="" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <Hammer className="h-7 w-7" />
                  )}
                  <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-card" title="Workshop Verified" />
                </div>
                
                <h3 className="font-display font-bold text-foreground text-sm line-clamp-1 w-full" title={profile.business_name}>
                  {profile.business_name}
                </h3>
                <p className="text-[11px] text-muted-foreground font-medium mt-0.5 line-clamp-1 w-full">
                  Lead: {profile.owner_name}
                </p>
                
                <div className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/40">
                  <MapPin className="h-3 w-3 text-zinc-400" />
                  <span>{profile.city}, {profile.state}</span>
                </div>
              </div>
            )}

            <div className="px-3 mb-4">
              <h2 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">
                Management
              </h2>
            </div>
            
            <div className="space-y-1">
              {tabs.map((t) => {
                const active = t.exact
                  ? location.pathname === t.to
                  : location.pathname.startsWith(t.to);
                return (
                  <Link
                    key={t.to}
                    to={t.to}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer ${
                      active
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    }`}
                  >
                    <t.icon className="h-4 w-4 shrink-0" /> {t.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Main content */}
          <div className="bg-card/40 backdrop-blur-md border border-border/60 rounded-3xl p-6 sm:p-8 shadow-sm">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
