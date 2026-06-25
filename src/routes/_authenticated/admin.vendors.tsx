import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listAllVendors, toggleVendorApproval } from "@/lib/admin.functions";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Hammer,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  User,
  Copy,
  ShieldAlert,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/vendors")({
  component: AdminVendorsPage,
});

function AdminVendorsPage() {
  const queryClient = useQueryClient();
  const fetchVendors = useServerFn(listAllVendors);
  const toggleApproval = useServerFn(toggleVendorApproval);

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved">("all");

  // Query
  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["admin-vendors"],
    queryFn: () => fetchVendors(),
  });

  // Mutation
  const toggleMutation = useMutation({
    mutationFn: (vars: { vendorId: string; isApproved: boolean }) => toggleApproval({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
      toast.success("Vendor approval status updated successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update vendor status.");
    },
  });

  const handleToggleApproval = (vendorId: string, currentStatus: boolean) => {
    toggleMutation.mutate({ vendorId, isApproved: !currentStatus });
  };

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchesSearch =
        v.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.city.toLowerCase().includes(searchQuery.toLowerCase());

      if (filterStatus === "all") return matchesSearch;
      if (filterStatus === "pending") return matchesSearch && !v.is_approved;
      if (filterStatus === "approved") return matchesSearch && v.is_approved;
      return matchesSearch;
    });
  }, [vendors, searchQuery, filterStatus]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Workshop Registrations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and verify woodworking workshops applying for seller access.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3.5 py-1.5 rounded-full border border-amber-250/20">
          <Hammer className="h-3.5 w-3.5 animate-pulse" />
          <span>Active Applications</span>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between bg-card border border-border/60 p-4 rounded-2xl shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workshop, owner, city..."
            className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-xs outline-none transition focus:border-primary"
          />
        </div>

        {/* Tabs filter */}
        <div className="flex gap-1.5 bg-muted p-1 rounded-xl w-fit self-start sm:self-auto">
          {(["all", "pending", "approved"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition cursor-pointer ${
                filterStatus === status
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {status} ({status === "all" ? vendors.length : vendors.filter((v) => status === "pending" ? !v.is_approved : v.is_approved).length})
            </button>
          ))}
        </div>
      </div>

      {/* Vendors List */}
      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground">Loading workshop registrations…</div>
      ) : filteredVendors.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border py-20 text-center text-muted-foreground bg-card/20 space-y-3">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <p className="text-sm font-medium">No registrations found</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Try adjusting your search query or filter tab to locate registered craftsmen.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {filteredVendors.map((vendor, idx) => (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                className={`bg-card border rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-all duration-300 relative overflow-hidden group hover:shadow-md ${
                  vendor.is_approved
                    ? "border-border/60 hover:border-emerald-500/30"
                    : "border-amber-500/30 bg-gradient-to-br from-card via-card to-amber-500/[0.02] hover:border-amber-500/50"
                }`}
              >
                {/* Badge Status */}
                <div className="absolute top-4 right-4">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                      vendor.is_approved
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-450"
                        : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-450"
                    }`}
                  >
                    {vendor.is_approved ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" /> Approved
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 animate-pulse" /> Pending Approval
                      </>
                    )}
                  </span>
                </div>

                {/* Info block */}
                <div className="space-y-4">
                  <div className="pr-24">
                    <h3 className="font-display text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                      {vendor.business_name}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                      <User className="h-3.5 w-3.5 text-muted-foreground/60" />
                      Lead Craftsman: <span className="font-semibold text-foreground">{vendor.owner_name}</span>
                    </p>
                  </div>

                  <div className="space-y-2 text-xs text-muted-foreground border-y border-border/40 py-3.5">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                      <span className="font-mono select-all">{vendor.phone_number}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(vendor.phone_number, "Phone number")}
                        className="p-1 hover:bg-muted rounded text-muted-foreground/70 hover:text-foreground transition cursor-pointer"
                        title="Copy phone number"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 mt-0.5" />
                      <span>
                        {vendor.workshop_address}, {vendor.city}, {vendor.state}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 bg-muted/40 border border-border/40 p-2 rounded-xl">
                      <div className="truncate">
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">
                          UPI Payout Address
                        </span>
                        <span className="font-mono font-semibold text-foreground block truncate select-all">
                          {vendor.upi_payout_id}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(vendor.upi_payout_id, "UPI Address")}
                        className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground/70 hover:text-foreground transition ml-auto cursor-pointer"
                        title="Copy UPI Address"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {vendor.bio && (
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        About the Craftsman
                      </h4>
                      <p className="text-xs text-muted-foreground/90 font-light leading-relaxed line-clamp-3">
                        {vendor.bio}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Action Button */}
                <div className="mt-6 pt-4 border-t border-border/30 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleToggleApproval(vendor.id, vendor.is_approved)}
                    disabled={toggleMutation.isPending}
                    className={`rounded-full px-5 py-2 text-xs font-semibold shadow-sm transition-all duration-300 cursor-pointer ${
                      vendor.is_approved
                        ? "bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-650 hover:text-red-700"
                        : "bg-primary hover:opacity-90 text-primary-foreground font-bold"
                    }`}
                  >
                    {vendor.is_approved ? "Suspend / Reject" : "Verify & Approve"}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
