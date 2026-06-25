import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVendorProfile } from "@/lib/products.functions";
import { updateVendorProfile } from "@/lib/vendor.functions";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Settings, Info, Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/vendor/profile")({
  component: VendorProfilePage,
});

function VendorProfilePage() {
  const queryClient = useQueryClient();
  const fetchProfile = useServerFn(getVendorProfile);
  const updateProfile = useServerFn(updateVendorProfile);

  // Queries
  const { data: profile, isLoading } = useQuery({
    queryKey: ["vendor-profile"],
    queryFn: () => fetchProfile(),
  });

  const [formData, setFormData] = useState({
    business_name: "",
    owner_name: "",
    phone_number: "",
    workshop_address: "",
    city: "",
    state: "",
    upi_payout_id: "",
    bio: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        business_name: profile.business_name || "",
        owner_name: profile.owner_name || "",
        phone_number: profile.phone_number || "",
        workshop_address: profile.workshop_address || "",
        city: profile.city || "",
        state: profile.state || "",
        upi_payout_id: profile.upi_payout_id || "",
        bio: profile.bio || "",
      });
    }
  }, [profile]);

  // Mutations
  const mutation = useMutation({
    mutationFn: (vars: any) => updateProfile({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-profile"] });
      toast.success("Workshop profile updated successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update profile.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const fieldCls =
    "w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200";

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground">Loading profile details…</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight">Workshop Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your business info, physical workshop address, and direct UPI payout details.
        </p>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-border/40 pb-4">
          <Settings className="h-5 w-5 text-amber-500" />
          <h2 className="font-display text-lg font-semibold">Storefront Configuration</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Business/Workshop Name</label>
              <input
                required
                placeholder="e.g. Raja Fine Woodworks"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                className={fieldCls}
                disabled={mutation.isPending}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Owner / Lead Craftsman</label>
              <input
                required
                placeholder="e.g. Alexander Raja"
                value={formData.owner_name}
                onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                className={fieldCls}
                disabled={mutation.isPending}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Contact Phone Number</label>
              <input
                required
                type="tel"
                placeholder="e.g. 9876543210"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className={fieldCls}
                disabled={mutation.isPending}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">UPI Address for Payouts</label>
              <input
                required
                placeholder="e.g. workshop@upi"
                value={formData.upi_payout_id}
                onChange={(e) => setFormData({ ...formData, upi_payout_id: e.target.value })}
                className={fieldCls}
                disabled={mutation.isPending}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Workshop Street Address</label>
            <input
              required
              placeholder="e.g. 45 Timber Yard Gate, Industrial Area"
              value={formData.workshop_address}
              onChange={(e) => setFormData({ ...formData, workshop_address: e.target.value })}
              className={fieldCls}
              disabled={mutation.isPending}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">City</label>
              <input
                required
                placeholder="e.g. Bengaluru"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className={fieldCls}
                disabled={mutation.isPending}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">State</label>
              <input
                required
                placeholder="e.g. Karnataka"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className={fieldCls}
                disabled={mutation.isPending}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">About the Workshop / Craftsmanship Bio</label>
            <textarea
              rows={4}
              placeholder="Describe your woodworking specialty, drying process, and background..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className={`${fieldCls} py-2`}
              maxLength={1000}
              disabled={mutation.isPending}
            />
          </div>

          <div className="flex items-start gap-2 text-[11px] sm:text-xs text-muted-foreground bg-muted/40 p-3.5 rounded-xl border border-border">
            <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
            <span>
              All modifications update your live storefront instantly. Ensure your UPI payout ID is valid so that direct checkouts credit successfully to your account.
            </span>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              loading={mutation.isPending}
              className="rounded-full bg-primary py-3 px-6 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="h-4 w-4" /> Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
