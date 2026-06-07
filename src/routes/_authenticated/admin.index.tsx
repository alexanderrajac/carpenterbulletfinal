import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminStats } from "@/lib/admin.functions";
import { formatPrice } from "@/lib/format";
import { Package, ShoppingCart, DollarSign } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const fetchStats = useServerFn(adminStats);
  const { data, isLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: () => fetchStats() });

  const cards = [
    { label: "Products", value: data?.productCount ?? "—", icon: Package },
    { label: "Orders", value: data?.orderCount ?? "—", icon: ShoppingCart },
    { label: "Revenue", value: data ? formatPrice(data.revenueCents) : "—", icon: DollarSign },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-medium tracking-tight">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">Workshop at a glance.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-6">
            <c.icon className="h-5 w-5 text-primary" />
            <p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">{c.label}</p>
            <p className="mt-1 font-display text-3xl">{isLoading ? "…" : c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
