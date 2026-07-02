import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyRoles } from "@/lib/products.functions";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ArrowLeft,
  Layers,
  Settings,
  Store,
  Hammer,
  BarChart3,
  Gift,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — CarpenterBullet" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const fetchRoles = useServerFn(getMyRoles);
  const { data: roles, isLoading } = useQuery({
    queryKey: ["my-roles"],
    queryFn: () => fetchRoles(),
  });
  const location = useLocation();

  if (isLoading)
    return <div className="p-12 text-center text-muted-foreground">Checking access…</div>;
  if (!(roles ?? []).includes("admin")) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-display text-3xl">Admin access required</h1>
        <p className="mt-2 text-muted-foreground">
          Visit your profile to claim admin if no admin exists yet.
        </p>
        <Link
          to="/profile"
          className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Go to profile
        </Link>
      </div>
    );
  }

  const tabs = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/admin/products", label: "Products", icon: Package },
    { to: "/admin/categories", label: "Categories", icon: Layers },
    { to: "/admin/vendors", label: "Vendors", icon: Hammer },
    { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
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
            <h2 className="font-display text-lg font-semibold text-foreground">Admin Panel</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-0.5">
              Management
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
