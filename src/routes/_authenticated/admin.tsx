import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyRoles } from "@/lib/products.functions";
import { LayoutDashboard, Package, ShoppingCart, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Woodverse" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const fetchRoles = useServerFn(getMyRoles);
  const { data: roles, isLoading } = useQuery({ queryKey: ["my-roles"], queryFn: () => fetchRoles() });
  const location = useLocation();

  if (isLoading) return <div className="p-12 text-center text-muted-foreground">Checking access…</div>;
  if (!(roles ?? []).includes("admin")) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-display text-3xl">Admin access required</h1>
        <p className="mt-2 text-muted-foreground">Visit your profile to claim admin if no admin exists yet.</p>
        <Link to="/profile" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Go to profile</Link>
      </div>
    );
  }

  const tabs = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/admin/products", label: "Products", icon: Package },
    { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to store</Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-[200px_1fr]">
        <nav className="space-y-1">
          {tabs.map((t) => {
            const active = t.exact ? location.pathname === t.to : location.pathname.startsWith(t.to);
            return (
              <Link key={t.to} to={t.to} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${active ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>
                <t.icon className="h-4 w-4" /> {t.label}
              </Link>
            );
          })}
        </nav>
        <div><Outlet /></div>
      </div>
    </div>
  );
}
