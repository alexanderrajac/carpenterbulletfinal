import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listMyOrders, getMyRoles, checkAdminExists } from "@/lib/products.functions";
import { makeMeAdmin } from "@/lib/admin.functions";
import { listMyBookings, submitServiceReview } from "@/lib/services.functions";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";
import { LogOut, ShieldCheck, Sparkles, Store, MapPin, Calendar, Clock, Star, MessageSquare } from "lucide-react";
import { useMemo, useState } from "react";

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
  const fetchBookings = useServerFn(listMyBookings);
  const submitReview = useServerFn(submitServiceReview);

  // Queries
  const orders = useQuery({ queryKey: ["my-orders"], queryFn: () => fetchOrders() });
  const roles = useQuery({ queryKey: ["my-roles"], queryFn: () => fetchRoles() });
  const adminExists = useQuery({ queryKey: ["admin-exists"], queryFn: () => fetchAdminExists() });
  const bookings = useQuery({ queryKey: ["my-bookings"], queryFn: () => fetchBookings() });

  const isAdmin = (roles.data ?? []).includes("admin");
  const isVendor = (roles.data ?? []).includes("vendor");

  // Review states
  const [reviewingBookingId, setReviewingBookingId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

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

  const reviewMutation = useMutation({
    mutationFn: (vars: { bookingId: string; rating: number; reviewText: string }) =>
      submitReview({
        data: {
          bookingId: vars.bookingId,
          rating: vars.rating,
          reviewText: vars.reviewText || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Thank you for your feedback! Review submitted.");
      setReviewingBookingId(null);
      setReviewText("");
      setRating(5);
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit review.");
    },
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const handleReviewSubmit = (e: React.FormEvent, bookingId: string) => {
    e.preventDefault();
    reviewMutation.mutate({ bookingId, rating, reviewText });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/40";
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200/40";
      case "in_progress":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200/40";
      case "completed":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/40";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border-red-200/40";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

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
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-95 shadow-sm cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4" /> Admin
            </Link>
          )}
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent transition cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>

      {/* Vendor Profile Banner */}
      {!roles.isLoading && (
        <div className="mt-6 p-6 rounded-2xl border border-border bg-card shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-primary/5 pointer-events-none" />
          <div className="space-y-1 relative z-10">
            <h3 className="font-display text-base font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
              {isVendor ? "Workshop Craftsman Portal" : "Join Us as a Vendor / Supplier"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
              {isVendor 
                ? "Manage your solid wood catalog, set up service coverage districts, and track service bookings & orders."
                : "Open your woodcraft shop on India's premier wood industry marketplace. List custom wood furniture and receive direct UPI payouts."}
            </p>
          </div>
          <Link
            to={isVendor ? "/vendor" : "/join-carpenter"}
            className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-95 shadow-sm inline-flex items-center gap-1.5 transition-all text-center justify-center cursor-pointer relative z-10"
          >
            {isVendor ? "Open Portal" : "Become a Partner"}
          </Link>
        </div>
      )}

      {!roles.isLoading && !isAdmin && !adminExists.data?.exists && (
        <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-dashed border-border bg-card p-4 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> Bootstrap: claim admin if no admin exists yet.
          </span>
          <button
            onClick={() => promote.mutate()}
            disabled={promote.isPending}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground cursor-pointer hover:opacity-95"
          >
            Make me admin
          </button>
        </div>
      )}

      {/* ─── Service Bookings Section ─── */}
      <h2 className="mt-12 font-display text-2xl flex items-center gap-2">Service Bookings</h2>
      {bookings.isLoading ? (
        <p className="mt-4 text-muted-foreground">Loading bookings…</p>
      ) : (bookings.data ?? []).length === 0 ? (
        <p className="mt-4 text-muted-foreground">
          No bookings yet.{" "}
          <Link to="/services" className="text-primary hover:underline font-semibold">
            Book a Carpenter Service →
          </Link>
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {(bookings.data as any[]).map((b) => (
            <div key={b.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/40 pb-3.5">
                <div>
                  <span className="text-[10px] font-bold font-mono text-muted-foreground tracking-wider uppercase block">
                    Booking No.
                  </span>
                  <span className="font-mono text-xs font-bold text-foreground">{b.booking_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase border ${getStatusColor(b.status)}`}>
                    {b.status.replace("_", " ")}
                  </span>
                  <span className="font-bold font-mono text-sm text-foreground">{formatPrice(b.total_cents)}</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                <div className="space-y-2">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Service</span>
                    <span className="font-semibold text-foreground text-sm">{(b.services as any)?.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Carpenter / Workshop</span>
                    {b.vendor_profiles ? (
                      <Link
                        to="/carpenter/$id"
                        params={{ id: b.vendor_profiles.id }}
                        className="font-semibold text-amber-700 dark:text-amber-500 hover:underline inline-flex items-center gap-1"
                      >
                        <Store className="h-3.5 w-3.5" />
                        {b.vendor_profiles.business_name}
                      </Link>
                    ) : (
                      <span className="font-medium text-foreground">Assigned Carpenter</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-4 w-4 text-primary shrink-0" />
                    <span>Scheduled for: <strong>{new Date(b.scheduled_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4 text-primary shrink-0" />
                    <span className="capitalize">Slot: <strong>{b.scheduled_slot}</strong></span>
                  </div>
                  <div className="flex items-start gap-1.5 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>Address: {b.address.line1}, {b.address.city}</span>
                  </div>
                </div>
              </div>

              {/* Review Section */}
              {b.status === "completed" && (
                <div className="border-t border-border/40 pt-3 flex flex-col items-start gap-2">
                  {reviewingBookingId === b.id ? (
                    <form onSubmit={(e) => handleReviewSubmit(e, b.id)} className="w-full space-y-3 bg-muted/30 p-4 rounded-xl border border-border/60">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground">Select Rating:</span>
                        <div className="flex gap-1 text-amber-500">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className="cursor-pointer hover:scale-110 transition-transform"
                            >
                              <Star className={`h-5 w-5 ${star <= rating ? "fill-current" : "opacity-35"}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        rows={2}
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Write a brief review about the carpenter's work..."
                        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs outline-none focus:border-primary"
                        maxLength={500}
                        required
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setReviewingBookingId(null)}
                          className="px-3.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-accent cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={reviewMutation.isPending}
                          className="px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:opacity-95 disabled:opacity-50 cursor-pointer"
                        >
                          Submit Review
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setReviewingBookingId(b.id)}
                      className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline cursor-pointer"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Write Workshop Review
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── Product Order History Section ─── */}
      <h2 className="mt-12 font-display text-2xl">Order history</h2>
      {orders.isLoading ? (
        <p className="mt-4 text-muted-foreground">Loading orders…</p>
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
