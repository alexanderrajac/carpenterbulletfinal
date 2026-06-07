import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listMyOrders, getMyRoles } from "@/lib/products.functions";
import { makeMeAdmin } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";
import { LogOut, ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Woodverse" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchOrders = useServerFn(listMyOrders);
  const fetchRoles = useServerFn(getMyRoles);
  const makeAdmin = useServerFn(makeMeAdmin);

  const orders = useQuery({ queryKey: ["my-orders"], queryFn: () => fetchOrders() });
  const roles = useQuery({ queryKey: ["my-roles"], queryFn: () => fetchRoles() });
  const isAdmin = (roles.data ?? []).includes("admin");

  const promote = useMutation({
    mutationFn: () => makeAdmin(),
    onSuccess: () => { toast.success("You're now an admin"); qc.invalidateQueries({ queryKey: ["my-roles"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-medium tracking-tight">Your account</h1>
          <p className="mt-2 text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Link to="/admin" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              <ShieldCheck className="h-4 w-4" /> Admin
            </Link>
          )}
          <button onClick={signOut} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>

      {!isAdmin && (
        <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-dashed border-border bg-card p-4 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> Bootstrap: claim admin if no admin exists yet.
          </span>
          <button onClick={() => promote.mutate()} disabled={promote.isPending} className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground">
            Make me admin
          </button>
        </div>
      )}

      <h2 className="mt-12 font-display text-2xl">Order history</h2>
      {orders.isLoading ? (
        <p className="mt-4 text-muted-foreground">Loading…</p>
      ) : (orders.data ?? []).length === 0 ? (
        <p className="mt-4 text-muted-foreground">No orders yet. <Link to="/shop" className="text-primary hover:underline">Start shopping →</Link></p>
      ) : (
        <ul className="mt-4 space-y-3">
          {orders.data!.map((o: any) => (
            <li key={o.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</p>
                  <p className="mt-1 font-medium">{new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium capitalize">{o.status}</span>
                <span className="font-medium tabular-nums">{formatPrice(o.total_cents)}</span>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {o.order_items?.map((it: any) => (
                  <li key={it.id}>{it.product_name} × {it.quantity}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
