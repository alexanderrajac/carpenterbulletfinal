import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listVendorServiceBookings, updateBookingStatus } from "@/lib/services.functions";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  XCircle,
  Hammer,
  Play,
  AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/vendor/bookings")({
  head: () => ({ meta: [{ title: "Service Bookings — Workshop Portal" }] }),
  component: VendorBookingsPage,
});

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: AlertCircle },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: CheckCircle2 },
  in_progress: { label: "In Progress", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: Play },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

function VendorBookingsPage() {
  const queryClient = useQueryClient();
  const fetchBookings = useServerFn(listVendorServiceBookings);
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["vendor-service-bookings"],
    queryFn: () => fetchBookings(),
  });

  const updateStatus = useServerFn(updateBookingStatus);
  const statusMutation = useMutation({
    mutationFn: (vars: { bookingId: string; status: string }) =>
      updateStatus({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-service-bookings"] });
      toast.success("Booking status updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const allBookings = bookings ?? [];
  const todayStr = new Date().toISOString().split("T")[0];
  const todayBookings = allBookings.filter((b: any) => b.scheduled_date === todayStr);
  const pendingBookings = allBookings.filter((b: any) => b.status === "pending");
  const completedCount = allBookings.filter((b: any) => b.status === "completed").length;
  const totalEarnings = allBookings
    .filter((b: any) => b.status === "completed")
    .reduce((sum: number, b: any) => sum + b.total_cents, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Hammer className="h-8 w-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">Service Bookings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your carpentry service requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Today's Jobs", value: todayBookings.length, color: "text-blue-600" },
          { label: "Pending", value: pendingBookings.length, color: "text-amber-600" },
          { label: "Completed", value: completedCount, color: "text-emerald-600" },
          { label: "Total Earned", value: formatPrice(totalEarnings), color: "text-primary" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-2xl border border-border bg-card/60">
            <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
            <p className={`font-display text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Bookings List */}
      {allBookings.length === 0 ? (
        <div className="text-center py-16 bg-muted/20 border border-border/60 rounded-2xl">
          <Calendar className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">No service bookings yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Bookings will appear here when customers book your services.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {allBookings.map((booking: any, idx: number) => {
            const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
            const StatusIcon = status.icon;
            const addr = booking.address || {};

            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="p-5 rounded-2xl border border-border bg-card/60 hover:shadow-sm transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{booking.services?.name || "Service"}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${status.color}`}>
                        <StatusIcon className="h-3 w-3" /> {status.label}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {booking.booking_number}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" /> {booking.customer_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" /> {booking.customer_phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> {booking.scheduled_date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {booking.scheduled_slot}
                      </span>
                    </div>

                    {addr.line1 && (
                      <p className="text-xs text-muted-foreground flex items-start gap-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        {addr.line1}, {addr.city}, {addr.district} - {addr.pincode}
                      </p>
                    )}

                    {booking.notes && (
                      <p className="text-xs italic text-muted-foreground/80">Note: {booking.notes}</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-lg font-bold text-primary font-mono">
                      {formatPrice(booking.total_cents)}
                    </span>

                    {/* Action Buttons */}
                    {booking.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => statusMutation.mutate({ bookingId: booking.id, status: "confirmed" })}
                          disabled={statusMutation.isPending}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 cursor-pointer transition"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => statusMutation.mutate({ bookingId: booking.id, status: "cancelled" })}
                          disabled={statusMutation.isPending}
                          className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 cursor-pointer transition dark:bg-red-900/30 dark:text-red-400"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                    {booking.status === "confirmed" && (
                      <button
                        onClick={() => statusMutation.mutate({ bookingId: booking.id, status: "in_progress" })}
                        disabled={statusMutation.isPending}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 cursor-pointer transition"
                      >
                        Start Work
                      </button>
                    )}
                    {booking.status === "in_progress" && (
                      <button
                        onClick={() => statusMutation.mutate({ bookingId: booking.id, status: "completed" })}
                        disabled={statusMutation.isPending}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 cursor-pointer transition"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
