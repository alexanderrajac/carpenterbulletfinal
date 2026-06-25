import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listVendorOrders, updateVendorOrderItemStatus } from "@/lib/products.functions";
import { resolveImage } from "@/lib/product-images";
import { formatPrice } from "@/lib/format";
import { Search, ShoppingBag, MapPin, Phone, User, Calendar, Lock } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_authenticated/vendor/orders")({
  component: VendorOrdersPage,
});

function VendorOrdersPage() {
  const queryClient = useQueryClient();
  const fetchOrders = useServerFn(listVendorOrders);
  const updateStatusFn = useServerFn(updateVendorOrderItemStatus);

  // Queries
  const { data: orderItems = [], isLoading } = useQuery({
    queryKey: ["vendor-orders"],
    queryFn: () => fetchOrders(),
  });

  // State
  const [searchQuery, setSearchQuery] = useState("");

  // Filter orders
  const filteredItems = useMemo(() => {
    return orderItems.filter((item) =>
      item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.order_id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [orderItems, searchQuery]);

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: (vars: { itemId: string; status: string }) =>
      updateStatusFn({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard-stats"] });
      toast.success("Fulfillment status updated successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update fulfillment status.");
    },
  });

  const handleStatusChange = (itemId: string, status: string) => {
    updateStatusMutation.mutate({ itemId, status });
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-200/50",
    processing: "bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200/50",
    crated: "bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200/50",
    shipped: "bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border-indigo-200/50",
    delivered: "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/50",
    cancelled: "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200/50",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight">Commissions & Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View custom build requests and update shipping statuses for your pieces.
        </p>
      </div>

      {/* Filter and search row */}
      <div className="flex items-center relative w-full sm:max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Order ID or Product Name..."
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary"
        />
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground">Loading orders…</div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-20 text-center text-muted-foreground">
          No orders received yet. Items purchased from your catalog will appear here!
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item, idx) => {
            const order = item.orders;
            const shipping = (order?.shipping_address || {}) as any;
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 hover:border-primary/20 transition-all duration-300"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-3 gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs font-bold bg-muted px-2.5 py-1 rounded-lg text-foreground border border-border/40">
                      Order #{item.order_id.slice(0, 8)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(order?.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  
                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs text-muted-foreground font-semibold">Fulfillment:</span>
                    <select
                      value={item.fulfillment_status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className={`px-3 py-1 text-xs font-semibold rounded-full border cursor-pointer outline-none transition ${
                        statusColors[item.fulfillment_status] ?? "bg-gray-100"
                      }`}
                      disabled={updateStatusMutation.isPending}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="crated">Crated</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Content Split: Item detail & Customer detail */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Left Column: Product Info */}
                  <div className="flex gap-4">
                    <div className="h-16 w-16 rounded-xl overflow-hidden bg-muted border border-border/40 shrink-0">
                      <img
                        src={resolveImage(item.product_image_url, "f_auto,q_auto,w_200")}
                        alt={item.product_name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">{item.product_name}</h4>
                      <p className="text-xs text-muted-foreground font-mono">
                        {item.quantity} unit{item.quantity > 1 ? "s" : ""} @ {formatPrice(item.unit_price_cents)} each
                      </p>
                      {item.customizations && Object.keys(item.customizations).length > 0 && (
                        <div className="text-[10px] text-muted-foreground mt-1 space-y-0.5 border-l-2 border-primary/20 pl-2.5 py-0.5">
                          {Object.entries(item.customizations).map(([key, val]: [string, any]) => (
                            <p key={key}>
                              {key}: <span className="font-medium text-foreground">{val.label || val}</span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Customer Info */}
                  <div className="space-y-2 border-t md:border-t-0 md:border-l border-border/40 pt-4 md:pt-0 md:pl-6 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                      <User className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{shipping.full_name || "Guest Buyer"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                      <span className="select-all font-mono">{shipping.phone_number || "—"}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 mt-0.5" />
                      <span>
                        {shipping.address}, {shipping.city}, {shipping.postal_code}, {shipping.country}
                      </span>
                    </div>
                    
                    {/* Payment Receipt / UTR Verification */}
                    {shipping.upi_utr && (
                      <div className="mt-3 bg-muted/40 border border-border/60 p-2.5 rounded-xl flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Verified UPI Receipt (UTR ID)</span>
                          <span className="font-mono text-[11px] font-bold text-foreground select-all">{shipping.upi_utr}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-450 bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 rounded uppercase tracking-wider">
                          <Lock className="h-3 w-3" /> Secure Pay
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Total Row */}
                <div className="flex justify-between items-center border-t border-border/30 pt-3 text-xs bg-muted/10 -mx-5 -mb-5 px-5 py-3 rounded-b-2xl">
                  <span className="text-muted-foreground font-medium">Total Workshop Earnings:</span>
                  <span className="font-mono text-sm font-bold text-primary">
                    {formatPrice(item.unit_price_cents * item.quantity)}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
