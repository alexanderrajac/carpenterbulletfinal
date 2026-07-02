import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVendorProfile } from "@/lib/products.functions";
import { updateVendorProfile } from "@/lib/vendor.functions";
import {
  listServices,
  getVendorServiceSettings,
  updateVendorServiceSettings,
} from "@/lib/services.functions";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Info,
  Save,
  Store,
  Copy,
  ExternalLink,
  Loader2,
  Upload,
  User,
  Trash2,
  MapPin,
  Hammer,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { resolveImage, uploadImage } from "@/lib/product-images";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/_authenticated/vendor/profile")({
  component: VendorProfilePage,
});

const TAMIL_NADU_DISTRICTS = [
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore",
  "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kancheepuram",
  "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
  "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai",
  "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi",
  "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
  "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur",
  "Vellore", "Viluppuram", "Virudhunagar",
];

function VendorProfilePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"details" | "services">("details");

  const fetchProfile = useServerFn(getVendorProfile);
  const updateProfile = useServerFn(updateVendorProfile);
  const fetchAllServices = useServerFn(listServices);
  const fetchServiceSettings = useServerFn(getVendorServiceSettings);
  const saveServiceSettings = useServerFn(updateVendorServiceSettings);

  // Queries
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["vendor-profile"],
    queryFn: () => fetchProfile(),
  });

  const { data: allServices, isLoading: servicesLoading } = useQuery({
    queryKey: ["all-services-list"],
    queryFn: () => fetchAllServices(),
  });

  const { data: serviceSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["vendor-service-settings"],
    queryFn: () => fetchServiceSettings(),
    enabled: !!profile,
  });

  // State: Tab 1 (Details)
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

  // State: Tab 2 (Services & Areas)
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [vendorServices, setVendorServices] = useState<
    Record<string, { isActive: boolean; customPriceCents: string }>
  >({});

  const [storefrontUrl, setStorefrontUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate Tab 1 state
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

  // Populate Tab 2 state
  useEffect(() => {
    if (serviceSettings) {
      setSelectedDistricts(serviceSettings.districts_covered || []);
      const initialServices: typeof vendorServices = {};
      (serviceSettings.services_offered || []).forEach((vs: any) => {
        initialServices[vs.service_id] = {
          isActive: vs.is_active,
          customPriceCents: vs.custom_price_cents
            ? String(vs.custom_price_cents / 100)
            : "",
        };
      });
      setVendorServices(initialServices);
    }
  }, [serviceSettings]);

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
  const detailsMutation = useMutation({
    mutationFn: (vars: any) => updateProfile({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-profile"] });
      toast.success("Workshop profile updated successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update profile.");
    },
  });

  const settingsMutation = useMutation({
    mutationFn: (vars: any) => saveServiceSettings({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-service-settings"] });
      toast.success("Services & coverage areas updated successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update service settings.");
    },
  });

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    detailsMutation.mutate(formData);
  };

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedServices = Object.entries(vendorServices).map(
      ([serviceId, s]) => ({
        serviceId,
        isActive: s.isActive,
        customPriceCents:
          s.isActive && s.customPriceCents.trim() !== ""
            ? Math.round(parseFloat(s.customPriceCents) * 100)
            : null,
      })
    );
    settingsMutation.mutate({
      districts_covered: selectedDistricts,
      services: formattedServices,
    });
  };

  const toggleDistrict = (dist: string) => {
    setSelectedDistricts((prev) =>
      prev.includes(dist) ? prev.filter((d) => d !== dist) : [...prev, dist]
    );
  };

  const selectAllDistricts = () => {
    setSelectedDistricts(TAMIL_NADU_DISTRICTS);
  };

  const clearAllDistricts = () => {
    setSelectedDistricts([]);
  };

  const toggleServiceActive = (serviceId: string) => {
    setVendorServices((prev) => {
      const current = prev[serviceId] || { isActive: false, customPriceCents: "" };
      return {
        ...prev,
        [serviceId]: {
          ...current,
          isActive: !current.isActive,
        },
      };
    });
  };

  const handleCustomPriceChange = (serviceId: string, val: string) => {
    setVendorServices((prev) => {
      const current = prev[serviceId] || { isActive: false, customPriceCents: "" };
      return {
        ...prev,
        [serviceId]: {
          ...current,
          customPriceCents: val,
        },
      };
    });
  };

  const fieldCls =
    "w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200";

  if (profileLoading || servicesLoading || settingsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading settings panel…</p>
      </div>
    );
  }

  // Group services by category for easier configuration
  const servicesByCategory = (allServices ?? []).reduce(
    (acc: any, s: any) => {
      if (!acc[s.category]) acc[s.category] = [];
      acc[s.category].push(s);
      return acc;
    },
    {} as Record<string, any[]>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight">Workshop Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update workshop details, claim coverage regions, and offer custom service rates.
        </p>
      </div>

      {/* Tabs Switcher Navigation */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("details")}
          className={`px-6 py-3 text-sm font-semibold border-b-2 cursor-pointer transition-all ${
            activeTab === "details"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Workshop Details
        </button>
        <button
          onClick={() => setActiveTab("services")}
          className={`px-6 py-3 text-sm font-semibold border-b-2 cursor-pointer transition-all flex items-center gap-1.5 ${
            activeTab === "services"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Hammer className="h-4 w-4" /> Services & Coverage Areas
        </button>
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        {activeTab === "details" ? (
          <motion.div
            key="details-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                <Store className="h-5 w-5 text-amber-500" />
                <h2 className="font-display text-lg font-semibold">Storefront Configuration</h2>
              </div>

              <form onSubmit={handleDetailsSubmit} className="space-y-4">
                {/* Avatar Upload */}
                <div className="flex flex-col sm:flex-row gap-6 items-center bg-muted/20 border border-border/40 p-5 rounded-2xl">
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
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground block">
                      Workshop Profile Image
                    </label>
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
                              JPG, PNG, WEBP up to 10MB
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

                {/* Form Fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Business/Workshop Name</label>
                    <input
                      required
                      placeholder="e.g. Raja Fine Woodworks"
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      className={fieldCls}
                      disabled={detailsMutation.isPending}
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
                      disabled={detailsMutation.isPending}
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
                      disabled={detailsMutation.isPending}
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
                      disabled={detailsMutation.isPending}
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
                    disabled={detailsMutation.isPending}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">City</label>
                    <input
                      required
                      placeholder="e.g. Chennai"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className={fieldCls}
                      disabled={detailsMutation.isPending}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">State</label>
                    <input
                      required
                      placeholder="e.g. Tamil Nadu"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className={fieldCls}
                      disabled={detailsMutation.isPending}
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
                    disabled={detailsMutation.isPending}
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
                    loading={detailsMutation.isPending}
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
                  This is the direct catalog link your customers use to browse your custom woodworks and buy modular products.
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
          </motion.div>
        ) : (
          <motion.div
            key="services-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <form onSubmit={handleSettingsSubmit} className="space-y-6">
              {/* Coverage Districts Selection */}
              <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border/40 pb-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <h2 className="font-display text-lg font-semibold">Service Coverage Areas</h2>
                      <p className="text-xs text-muted-foreground">Select which districts in Tamil Nadu you offer on-site services in.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllDistricts}
                      className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-muted-foreground/30 text-xs">|</span>
                    <button
                      type="button"
                      onClick={clearAllDistricts}
                      className="text-xs text-red-500 font-semibold hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {TAMIL_NADU_DISTRICTS.map((dist) => {
                    const isChecked = selectedDistricts.includes(dist);
                    return (
                      <button
                        key={dist}
                        type="button"
                        onClick={() => toggleDistrict(dist)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all text-xs font-semibold flex items-center justify-between ${
                          isChecked
                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                            : "border-border bg-card text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        <span>{dist}</span>
                        {isChecked && <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Services Offered Selection */}
              <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                  <Hammer className="h-5 w-5 text-amber-500" />
                  <div>
                    <h2 className="font-display text-lg font-semibold">Offered Services & Pricing</h2>
                    <p className="text-xs text-muted-foreground">Check the services you perform. You can set custom pricing (in ₹) or use platform default.</p>
                  </div>
                </div>

                <div className="space-y-8">
                  {Object.entries(servicesByCategory).map(([category, services]) => (
                    <div key={category} className="space-y-3">
                      <h3 className="font-display text-sm font-bold text-foreground border-b border-border/40 pb-1.5 uppercase tracking-wider">
                        {category}
                      </h3>
                      <div className="grid gap-3">
                        {((services as any[]) || []).map((svc: any) => {
                          const state = vendorServices[svc.id] || { isActive: false, customPriceCents: "" };
                          return (
                            <div
                              key={svc.id}
                              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                                state.isActive
                                  ? "border-primary/50 bg-primary/5"
                                  : "border-border bg-card"
                              }`}
                            >
                              <div className="flex-1 flex gap-3">
                                <input
                                  type="checkbox"
                                  id={`svc-${svc.id}`}
                                  checked={state.isActive}
                                  onChange={() => toggleServiceActive(svc.id)}
                                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer mt-1"
                                />
                                <div>
                                  <label
                                    htmlFor={`svc-${svc.id}`}
                                    className="text-sm font-semibold text-foreground cursor-pointer"
                                  >
                                    {svc.name}
                                  </label>
                                  <p className="text-xs text-muted-foreground leading-normal mt-0.5">
                                    {svc.description}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                <div className="text-right">
                                  <span className="text-[10px] text-muted-foreground uppercase block font-semibold">
                                    Base Price
                                  </span>
                                  <span className="text-xs font-mono font-bold text-muted-foreground">
                                    ₹{svc.starts_at_cents / 100}
                                  </span>
                                </div>

                                <div className="h-8 w-px bg-border" />

                                <div className="w-32">
                                  <label className="text-[10px] text-muted-foreground uppercase block font-bold mb-0.5">
                                    Custom Price (₹)
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    placeholder={`e.g. ${(svc.starts_at_cents / 100) + 50}`}
                                    value={state.customPriceCents}
                                    onChange={(e) => handleCustomPriceChange(svc.id, e.target.value)}
                                    disabled={!state.isActive}
                                    className={`w-full rounded-lg border border-border px-3 py-1.5 text-xs font-mono outline-none bg-background focus:border-primary disabled:opacity-30 disabled:bg-muted/50`}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-start gap-2 text-[11px] sm:text-xs text-muted-foreground bg-muted/40 p-3.5 rounded-xl border border-border">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                <span>
                  Customers looking for service bookings in your selected districts will only see your workshop if you are checked active for that service.
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  loading={settingsMutation.isPending}
                  className="rounded-full bg-primary py-3 px-6 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-95 flex items-center gap-1.5 cursor-pointer animate-pulse-slow"
                >
                  <Save className="h-4 w-4" /> Save Services & Coverage
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
