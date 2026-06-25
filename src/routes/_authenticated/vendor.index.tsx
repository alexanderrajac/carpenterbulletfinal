import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getVendorDashboardStats } from "@/lib/vendor.functions";
import { getVendorProfile } from "@/lib/products.functions";
import { formatPrice } from "@/lib/format";
import { Package, ShoppingCart, DollarSign, ArrowUpRight, Hammer } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/vendor/")({
  component: VendorDashboard,
});

function VendorDashboard() {
  const fetchStats = useServerFn(getVendorDashboardStats);
  const { data, isLoading } = useQuery({
    queryKey: ["vendor-dashboard-stats"],
    queryFn: () => fetchStats(),
  });

  const fetchProfile = useServerFn(getVendorProfile);
  const { data: profile } = useQuery({
    queryKey: ["vendor-profile"],
    queryFn: () => fetchProfile(),
  });

  const cards = [
    {
      label: "My Products",
      value: data?.productCount ?? "0",
      icon: Package,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
      desc: "Active catalog listings",
    },
    {
      label: "Commissions",
      value: data?.orderCount ?? "0",
      icon: ShoppingCart,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      desc: "Total client orders received",
    },
    {
      label: "My Earnings",
      value: data ? formatPrice(data.revenueCents) : "₹0",
      icon: DollarSign,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
      desc: "Gross revenue generated",
    },
  ];

  const statuses = data?.statusBreakdown ?? {};
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500",
    processing: "bg-blue-500",
    crated: "bg-purple-500",
    shipped: "bg-indigo-500",
    delivered: "bg-emerald-500",
    cancelled: "bg-red-500",
  };

  return (
    <div className="space-y-8">
      {/* Welcome Greeting Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Welcome back, {profile?.owner_name || "Craftsman"}!
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            Here is what's happening at <span className="font-semibold text-foreground underline decoration-amber-500/50 decoration-2">{profile?.business_name || "your workshop"}</span> today.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-450 bg-emerald-100 dark:bg-emerald-950/30 border border-emerald-200/50 px-3.5 py-1.5 rounded-full self-start sm:self-auto shadow-sm select-none">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Live Workshop
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="relative rounded-2xl border border-border/60 bg-card/50 p-6 overflow-hidden group hover:border-primary/45 hover:shadow-md transition-all duration-300"
          >
            {/* Decorative subtle gradient background on hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Large faint background icon */}
            <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:scale-105 transition-transform duration-500">
              <c.icon className="h-24 w-24" />
            </div>

            <div className="relative z-10 flex items-start justify-between">
              <div className={`inline-flex items-center justify-center h-11 w-11 rounded-xl ${c.bg} border border-border/20`}>
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground/60 bg-muted px-2 py-0.5 rounded">
                Live Metric
              </span>
            </div>

            <div className="relative z-10 mt-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                {c.label}
              </p>
              <p className="mt-1 font-display text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                {isLoading ? "…" : c.value}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {c.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Trend Chart */}
        <div className="lg:col-span-2 rounded-3xl border border-border/60 bg-card/30 p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">Sales Revenue Trend</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Earnings track for the last 30 days</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-primary font-bold bg-primary/10 px-3 py-1 rounded-full">
              <ArrowUpRight className="h-3.5 w-3.5" />
              Active Sales
            </div>
          </div>

          {data?.orderTrend && data.orderTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.orderTrend}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgb(245, 158, 11)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="rgb(245, 158, 11)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) =>
                    new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                  }
                  className="text-xs font-mono"
                  stroke="rgba(128,128,128,0.5)"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis 
                  className="text-xs font-mono" 
                  stroke="rgba(128,128,128,0.5)" 
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "16px",
                    fontSize: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  }}
                  labelFormatter={(v) =>
                    new Date(v).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  }
                  formatter={(value: any) => [`₹${value}`, "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="rgb(245, 158, 11)"
                  fill="url(#colorSales)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex flex-col items-center justify-center text-sm text-muted-foreground border border-dashed border-border/50 rounded-2xl bg-muted/10 p-6">
              <DollarSign className="h-8 w-8 text-muted-foreground/50 mb-2 animate-pulse" />
              <p className="font-semibold text-foreground/80">No Sales Data Yet</p>
              <p className="text-xs mt-1 text-center max-w-xs leading-normal">
                Your revenue trend line will automatically populate as customers purchase items from your workshop.
              </p>
            </div>
          )}
        </div>

        {/* Fulfillment Status Breakdown */}
        <div className="rounded-3xl border border-border/60 bg-card/30 p-6 sm:p-8 shadow-sm">
          <h3 className="font-display text-lg font-bold text-foreground">Fulfillment Status</h3>
          <p className="text-xs text-muted-foreground mt-0.5 mb-6">Current active pipeline status</p>
          
          {Object.keys(statuses).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(statuses).map(([status, count]) => {
                const total = Object.values(statuses).reduce((s, v) => s + v, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={status} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="capitalize font-semibold text-foreground">{status}</span>
                      <span className="font-mono text-muted-foreground font-bold">
                        {count} piece{count > 1 ? "s" : ""} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden border border-border/20">
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
            <div className="h-44 flex flex-col items-center justify-center text-sm text-muted-foreground border border-dashed border-border/50 rounded-2xl bg-muted/10 p-6">
              <ShoppingCart className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="font-semibold text-foreground/80">Empty Pipeline</p>
              <p className="text-[11px] text-center mt-1">Pending, processing and shipped orders will show up here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
