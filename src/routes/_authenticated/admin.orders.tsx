import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listAllOrders, updateOrderStatus } from "@/lib/admin.functions";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrders,
});

const STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;

function AdminOrders() {
  const qc = useQueryClient();
  const fetchOrders = useServerFn(listAllOrders);
  const updateStatus = useServerFn(updateOrderStatus);
  const orders = useQuery({ queryKey: ["admin-orders"], queryFn: () => fetchOrders() });
  const mut = useMutation({
    mutationFn: (v: { id: string; status: string }) => updateStatus({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-medium tracking-tight">Orders</h1>
      <div className="mt-6 space-y-3">
        {orders.data?.length === 0 && <p className="text-muted-foreground">No orders yet.</p>}
        {orders.data?.map((o: any) => (
          <div key={o.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</p>
                <p className="mt-1 text-sm">{new Date(o.created_at).toLocaleString()}</p>
              </div>
              <select
                value={o.status}
                onChange={(e) => mut.mutate({ id: o.id, status: e.target.value })}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs capitalize"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <span className="font-medium tabular-nums">{formatPrice(o.total_cents)}</span>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {o.order_items?.map((it: any) => (
                <li key={it.id}>
                  {it.product_name} × {it.quantity}
                </li>
              ))}
            </ul>
            {o.shipping_address && (
              <div className="mt-3 flex flex-col gap-1.5 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Ship to:</span> {o.shipping_address.full_name}, {o.shipping_address.address},{" "}
                  {o.shipping_address.city}, {o.shipping_address.postal_code}
                </p>
                {o.shipping_address.upi_utr && (
                  <p className="text-xs text-muted-foreground bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg inline-block w-fit border border-emerald-500/20">
                    <span className="font-semibold">UPI UTR / Ref No:</span> <span className="font-mono tracking-widest">{o.shipping_address.upi_utr}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
