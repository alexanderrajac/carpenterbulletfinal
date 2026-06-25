import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyRoles } from "@/lib/products.functions";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ArrowLeft,
  Settings,
  Store,
  Hammer,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/vendor")({
  head: () => ({ meta: [{ title: "Workshop Portal — CarpenterBullet" }] }),
  component: VendorLayout,
});

function VendorLayout() {
  const fetchRoles = useServerFn(getMyRoles);
  const { data: roles, isLoading } = useQuery({
    queryKey: ["my-roles"],
    queryFn: () => fetchRoles(),
  });
  const location = useLocation();

  if (isLoading)
    return <div className="p-12 text-center text-muted-foreground">Verifying workshop access…</div>;

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
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
          >
            Apply as Carpenter
          </Link>
          <Link
            to="/"
            className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold transition hover:bg-accent"
          >
            Go to Shop
          </Link>
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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to store
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/15 transition-colors"
        >
          <Store className="h-3.5 w-3.5" /> View Storefront
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <nav className="space-y-1">
          <div className="px-3 mb-4">
            <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-1.5">
              <Hammer className="h-4 w-4 text-amber-500" />
              Workshop Portal
            </h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-0.5">
              Carpenter Dashboard
            </p>
          </div>
          {tabs.map((t) => {
            const active = t.exact
              ? location.pathname === t.to
              : location.pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </Link>
            );
          })}
        </nav>

        {/* Main content */}
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
