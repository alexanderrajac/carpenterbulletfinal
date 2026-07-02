import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getServiceAnalytics } from "@/lib/services.functions";
import { formatPrice } from "@/lib/format";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Target,
  Users,
  ShoppingBag,
  TrendingUp,
  Calendar,
  Hammer,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  head: () => ({ meta: [{ title: "Revenue Analytics — Admin Dashboard" }] }),
  component: AdminAnalyticsPage,
});

const PIE_COLORS = [
  "#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
];

function AdminAnalyticsPage() {
  const fetchAnalytics = useServerFn(getServiceAnalytics);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => fetchAnalytics(),
    refetchInterval: 30000, // refresh every 30s
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Hammer className="h-8 w-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const targetCents = 10000000; // ₹1 Crore = 1,00,00,000 in paise... wait that's 100x too much
  // Actually: ₹1 Crore = ₹1,00,00,000. In cents (paise): 1,00,00,000 * 100 = 1,00,00,00,000 paise
  // But our system uses cents where ₹1 = 100 cents. So ₹1 Crore = 1,00,00,000 * 100 = 10,00,00,000 cents
  const TARGET_CENTS = 1_00_00_000 * 100; // ₹1 Crore in cents
  const progressPercent = Math.min(100, (data.totalGmvCents / TARGET_CENTS) * 100);

  const pieData = Object.entries(data.categoryBreakdown).map(([name, value]) => ({
    name,
    value: value as number,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" /> Revenue Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Track progress toward the ₹1 Crore target</p>
      </div>

      {/* ₹1 Crore Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-amber-500/5 to-transparent relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-primary/10 blur-[80px] pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
              <h2 className="font-display text-lg font-bold">₹1 Crore Target</h2>
            </div>
            <span className="text-sm font-mono font-bold text-primary">{progressPercent.toFixed(1)}%</span>
          </div>

          {/* Progress Bar */}
          <div className="h-6 rounded-full bg-muted/60 border border-border overflow-hidden mb-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-primary via-amber-500 to-emerald-500 relative"
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.15)_50%,transparent_75%)] bg-[length:20px_20px] animate-[shimmer_2s_infinite]" />
            </motion.div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              GMV: <strong className="text-foreground">{formatPrice(data.totalGmvCents)}</strong>
            </span>
            <span>Target: <strong>₹1,00,00,000</strong></span>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Carpenters", value: data.totalCarpenters, subtitle: `${data.approvedCarpenters} approved`, icon: Users, color: "text-blue-600" },
          { label: "Service Bookings", value: data.totalBookings, subtitle: `${data.completedBookings} completed`, icon: Calendar, color: "text-amber-600" },
          { label: "Product Orders", value: data.totalOrders, subtitle: "all time", icon: ShoppingBag, color: "text-emerald-600" },
          { label: "Total GMV", value: formatPrice(data.totalGmvCents), subtitle: "services + products", icon: TrendingUp, color: "text-primary" },
        ].map((m, idx) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="p-4 rounded-2xl border border-border bg-card/60 relative overflow-hidden group hover:shadow-md transition-all"
          >
            <div className="absolute top-3 right-3 h-8 w-8 rounded-xl bg-muted/50 flex items-center justify-center opacity-50 group-hover:opacity-100 transition">
              <m.icon className={`h-4 w-4 ${m.color}`} />
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">{m.label}</p>
            <p className={`font-display text-2xl font-bold mt-1 ${m.color}`}>{m.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{m.subtitle}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Service vs Product Revenue */}
        <div className="p-5 rounded-2xl border border-border bg-card/60">
          <h3 className="font-semibold text-sm mb-1">Revenue Breakdown</h3>
          <p className="text-xs text-muted-foreground mb-4">Services vs Product Sales</p>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Service Revenue</span>
                <span className="font-mono font-semibold">{formatPrice(data.serviceRevenueCents)}</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{
                    width: data.totalGmvCents > 0
                      ? `${(data.serviceRevenueCents / data.totalGmvCents) * 100}%`
                      : "0%",
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Product Revenue</span>
                <span className="font-mono font-semibold">{formatPrice(data.productRevenueCents)}</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: data.totalGmvCents > 0
                      ? `${(data.productRevenueCents / data.totalGmvCents) * 100}%`
                      : "0%",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="p-5 rounded-2xl border border-border bg-card/60">
          <h3 className="font-semibold text-sm mb-1">Bookings by Category</h3>
          <p className="text-xs text-muted-foreground mb-4">Service type distribution</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
              No booking data yet
            </div>
          )}
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="p-5 rounded-2xl border border-border bg-card/60">
        <h3 className="font-semibold text-sm mb-1">Monthly Revenue Trend</h3>
        <p className="text-xs text-muted-foreground mb-4">Services + Products combined</p>
        {data.monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 100).toLocaleString("en-IN")}`} />
              <Tooltip
                formatter={(value: number) => formatPrice(value)}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="services" name="Services" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="products" name="Products" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
            Revenue data will appear here as orders come in
          </div>
        )}
      </div>

      {/* Quick KPIs */}
      <div className="p-5 rounded-2xl border border-border bg-muted/20">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <ArrowUpRight className="h-4 w-4 text-emerald-500" /> Growth KPIs
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-foreground">{data.approvedCarpenters}/{2000}</p>
            <p className="text-xs text-muted-foreground">Carpenter Target</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{data.completedBookings}/{15800}</p>
            <p className="text-xs text-muted-foreground">Booking Target</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{data.totalOrders}/{4100}</p>
            <p className="text-xs text-muted-foreground">Order Target</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{progressPercent.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Revenue Target</p>
          </div>
        </div>
      </div>
    </div>
  );
}
