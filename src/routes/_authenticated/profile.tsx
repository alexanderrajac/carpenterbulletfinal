import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listMyOrders, getMyRoles, checkAdminExists } from "@/lib/products.functions";
import { makeMeAdmin } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";
import { LogOut, ShieldCheck, Sparkles, Store, MapPin } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — CarpenterBullet" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchOrders = useServerFn(listMyOrders);
  const fetchRoles = useServerFn(getMyRoles);
  const makeAdmin = useServerFn(makeMeAdmin);
  const fetchAdminExists = useServerFn(checkAdminExists);

  const orders = useQuery({ queryKey: ["my-orders"], queryFn: () => fetchOrders() });
  const roles = useQuery({ queryKey: ["my-roles"], queryFn: () => fetchRoles() });
  const adminExists = useQuery({ queryKey: ["admin-exists"], queryFn: () => fetchAdminExists() });
  const isAdmin = (roles.data ?? []).includes("admin");
  const isVendor = (roles.data ?? []).includes("vendor");

  const orderedWorkshops = useMemo(() => {
    if (!orders.data) return [];
    const workshopsMap = new Map<string, { id: string; business_name: string; city?: string; state?: string }>();
    orders.data.forEach((order: any) => {
      order.order_items?.forEach((item: any) => {
        const vp = item.vendor_profiles;
        if (vp && vp.id && vp.business_name) {
          workshopsMap.set(vp.id, {
            id: vp.id,
            business_name: vp.business_name,
            city: vp.city,
            state: vp.state,
          });
        }
      });
    });
    return Array.from(workshopsMap.values());
  }, [orders.data]);

  const promote = useMutation({
    mutationFn: () => makeAdmin(),
    onSuccess: () => {
      toast.success("You're now an admin");
      qc.invalidateQueries({ queryKey: ["my-roles"] });
    },
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
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              <ShieldCheck className="h-4 w-4" /> Admin
            </Link>
          )}
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>

      {/* Vendor Profile Banner */}
      {!roles.isLoading && (
        <div className="mt-6 p-6 rounded-2xl border border-border bg-card shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-display text-base font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
              {isVendor ? "Workshop Craftsman Portal" : "Join Us as a Vendor / Supplier"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
              {isVendor 
                ? "Manage your solid wood catalog, customize direct UPI settings, and track customer fulfillment orders."
                : "Open your woodcraft shop on India's premier wood industry marketplace. List custom wood furniture and receive direct UPI payouts."}
            </p>
          </div>
          <Link
            to={isVendor ? "/vendor" : "/join-carpenter"}
            className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-95 shadow-sm inline-flex items-center gap-1.5 transition-all text-center justify-center cursor-pointer"
          >
            {isVendor ? "Open Portal" : "Become a Partner"}
          </Link>
        </div>
      )}

      {!roles.isLoading && !isAdmin && !adminExists.data?.exists && (
        <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-dashed border-border bg-card p-4 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> Bootstrap: claim admin if no admin exists
            yet.
          </span>
          <button
            onClick={() => promote.mutate()}
            disabled={promote.isPending}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground cursor-pointer"
          >
            Make me admin
          </button>
        </div>
      )}

      <h2 className="mt-12 font-display text-2xl">Order history</h2>
      {orders.isLoading ? (
        <p className="mt-4 text-muted-foreground">Loading…</p>
      ) : (orders.data ?? []).length === 0 ? (
        <p className="mt-4 text-muted-foreground">
          No orders yet.{" "}
          <Link to="/shop" className="text-primary hover:underline">
            Start shopping →
          </Link>
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {orders.data!.map((o: any) => (
            <li key={o.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</p>
                  <p className="mt-1 font-medium">{new Date(o.created_at).toLocaleDateString()}</p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium capitalize">
                  {o.status}
                </span>
                <span className="font-medium tabular-nums">{formatPrice(o.total_cents)}</span>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {o.order_items?.map((it: any) => (
                  <li key={it.id}>
                    {it.product_name} × {it.quantity}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {/* Workshops Ordered From */}
      {!orders.isLoading && orderedWorkshops.length > 0 && (
        <div className="mt-12 space-y-6">
          <div>
            <h2 className="font-display text-2xl">Workshops you've ordered from</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Quickly browse or order again from the local artisans behind your purchases.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {orderedWorkshops.map((w) => (
              <Link
                key={w.id}
                to="/carpenter/$id"
                params={{ id: w.id }}
                className="group rounded-2xl border border-border/60 bg-card p-5 shadow-sm hover:shadow-md hover:border-primary/45 transition-all duration-300 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform duration-300">
                    <Store className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                      {w.business_name}
                    </h3>
                    {(w.city || w.state) && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground/60" />
                        {w.city}
                        {w.city && w.state && ", "}
                        {w.state}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform pr-1">
                  Visit Shop →
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
