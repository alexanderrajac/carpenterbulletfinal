import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAdminDashboardStats } from "@/lib/admin.functions";
import { formatPrice } from "@/lib/format";
import { Package, ShoppingCart, DollarSign, Layers, TrendingUp, ArrowUpRight } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const fetchStats = useServerFn(getAdminDashboardStats);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: () => fetchStats(),
  });

  const cards = [
    {
      label: "Products",
      value: data?.productCount ?? "—",
      icon: Package,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Orders",
      value: data?.orderCount ?? "—",
      icon: ShoppingCart,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Revenue",
      value: data ? formatPrice(data.revenueCents) : "—",
      icon: DollarSign,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Categories",
      value: data?.categoryCount ?? "—",
      icon: Layers,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-500/10",
    },
  ];

  const statuses = data?.statusBreakdown ?? {};
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500",
    paid: "bg-blue-500",
    shipped: "bg-indigo-500",
    delivered: "bg-emerald-500",
    cancelled: "bg-red-500",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Workshop at a glance — real-time metrics.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full">
          <TrendingUp className="h-3.5 w-3.5" />
          Live
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="relative rounded-2xl border border-border bg-card p-5 overflow-hidden group hover:border-primary/30 transition-colors duration-300"
          >
            {/* Background icon */}
            <div className="absolute -right-3 -top-3 opacity-[0.04]">
              <c.icon className="h-24 w-24" />
            </div>

            <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl ${c.bg}`}>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </div>
            <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              {c.label}
            </p>
            <p className="mt-1 font-display text-3xl font-bold tabular-nums">
              {isLoading ? "…" : c.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Order Trend Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg font-semibold">Order Trend</h3>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
              <ArrowUpRight className="h-3.5 w-3.5" />
              Recent Activity
            </div>
          </div>

          {data?.orderTrend && data.orderTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.orderTrend}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) =>
                    new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                  }
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                />
                <YAxis className="text-xs" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                  labelFormatter={(v) =>
                    new Date(v).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  }
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="hsl(var(--primary))"
                  fill="url(#colorOrders)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">
              No order data yet. Orders will appear here as they come in.
            </div>
          )}
        </div>

        {/* Order Status Breakdown */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-semibold mb-4">Order Status</h3>
          {Object.keys(statuses).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(statuses).map(([status, count]) => {
                const total = Object.values(statuses).reduce((s, v) => s + v, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="capitalize font-medium">{status}</span>
                      <span className="text-xs font-mono text-muted-foreground">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                        className={`h-full rounded-full ${statusColors[status] ?? "bg-gray-500"}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
              No orders yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
