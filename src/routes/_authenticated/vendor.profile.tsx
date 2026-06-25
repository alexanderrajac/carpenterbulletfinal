import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVendorProfile } from "@/lib/products.functions";
import { updateVendorProfile } from "@/lib/vendor.functions";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Settings, Info, Save, Store, Copy, ExternalLink, Loader2, Upload, User, Trash2 } from "lucide-react";
import { resolveImage, uploadImage } from "@/lib/product-images";

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
    avatar_url: "",
  });

  const [storefrontUrl, setStorefrontUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        avatar_url: profile.avatar_url || "",
      });
      if (typeof window !== "undefined") {
        setStorefrontUrl(`${window.location.origin}/carpenter/${profile.id}`);
      }
    }
  }, [profile]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 10MB.");
      return;
    }

    setUploading(true);
    setUploadProgress(`Uploading ${file.name}...`);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `vendors/${fileName}`;

      const publicUrl = await uploadImage(file, filePath);

      setFormData((prev) => ({
        ...prev,
        avatar_url: publicUrl,
      }));
      toast.success("Workshop profile image uploaded!");
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

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
          {/* Workshop Profile Avatar Upload */}
          <div className="flex flex-col sm:flex-row gap-6 items-center bg-muted/20 border border-border/40 p-5 rounded-2xl">
            {/* Avatar Preview */}
            <div className="relative h-20 w-20 rounded-2xl overflow-hidden border border-border bg-muted shrink-0 flex items-center justify-center text-muted-foreground shadow-sm">
              {formData.avatar_url ? (
                <img
                  src={resolveImage(formData.avatar_url)}
                  alt="Workshop avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <Store className="h-8 w-8 text-muted-foreground/60" />
              )}
              {formData.avatar_url && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, avatar_url: "" })}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 rounded-full p-1 text-white cursor-pointer transition border-none"
                  title="Remove image"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Upload Zone */}
            <div className="flex-1 w-full space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">Workshop Profile Image</label>
              
              <label
                className={`flex flex-col items-center justify-center gap-1.5 p-3.5 rounded-xl border border-dashed text-center cursor-pointer transition-colors ${
                  uploading
                    ? "border-primary/50 bg-primary/5 animate-pulse"
                    : "border-border hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    <p className="text-[11px] text-primary font-medium">{uploadProgress}</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        Upload custom workshop logo / avatar
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        JPG, PNG, WEBP up to 10MB (Cloudinary)
                      </p>
                    </div>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

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

      {/* Public Storefront Section */}
      {profile && (
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-border/40 pb-4">
            <Store className="h-5 w-5 text-amber-500" />
            <h2 className="font-display text-lg font-semibold">Your Public Storefront</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            This is the direct catalog link your customers use to browse your custom woodworks, learn about your craft, and check out directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-center bg-muted/30 border border-border p-3.5 rounded-2xl">
            <div className="flex-1 w-full min-w-0">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1">
                Storefront URL
              </span>
              <span className="font-mono text-xs sm:text-sm block truncate select-all text-emerald-600 dark:text-emerald-450 font-semibold">
                {storefrontUrl}
              </span>
            </div>
            <div className="flex gap-2 shrink-0 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(storefrontUrl);
                  toast.success("Link copied to clipboard!");
                }}
                className="rounded-xl flex-1 sm:flex-none cursor-pointer flex items-center gap-1.5"
              >
                <Copy className="h-4 w-4" /> Copy Link
              </Button>
              <a
                href={`/carpenter/${profile.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 font-semibold text-sm bg-primary text-primary-foreground hover:opacity-95 transition-opacity px-5 py-2.5 rounded-xl flex-1 sm:flex-none cursor-pointer"
              >
                <ExternalLink className="h-4 w-4" /> Visit Storefront
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
