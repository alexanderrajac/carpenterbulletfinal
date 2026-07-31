import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListServices, adminSaveService, adminDeleteService } from "@/lib/services.functions";
import { formatPrice } from "@/lib/format";
import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Eye,
  EyeOff,
  Sparkles,
  Save,
  Trash,
  Upload,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
  Zap,
} from "lucide-react";
import { resolveImage, uploadImage } from "@/lib/product-images";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/services")({
  head: () => ({ meta: [{ title: "Admin — Manage Carpentry Services | CarpenterBullet" }] }),
  component: AdminServicesPage,
});

const SERVICE_CATEGORIES = [
  "Wooden Door",
  "Cupboard & Drawer",
  "Decor & Mirror",
  "Shelf & Cabinet",
  "Lock & Hinge",
  "Curtain & Window",
  "Furniture Repair",
  "Furniture Assembly",
];

const PRESET_HD_IMAGES: Record<string, string> = {
  "Wooden Door": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  "Cupboard & Drawer": "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
  "Furniture Assembly": "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80",
  "Lock & Hinge": "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80",
  "Shelf & Cabinet": "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80",
  "Furniture Repair": "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80",
  "Curtain & Window": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  "Decor & Mirror": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80",
};

function AdminServicesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [editingService, setEditingService] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const fetchServices = useServerFn(adminListServices);
  const { data: services, isLoading } = useQuery({
    queryKey: ["admin-services-list"],
    queryFn: () => fetchServices(),
  });

  const saveServiceFn = useServerFn(adminSaveService);
  const saveMutation = useMutation({
    mutationFn: (data: any) => saveServiceFn({ data }),
    onSuccess: () => {
      toast.success("Service saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-services-list"] });
      queryClient.invalidateQueries({ queryKey: ["services-grouped"] });
      setEditingService(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save service");
    },
  });

  const deleteServiceFn = useServerFn(adminDeleteService);
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteServiceFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Service deleted!");
      queryClient.invalidateQueries({ queryKey: ["admin-services-list"] });
      queryClient.invalidateQueries({ queryKey: ["services-grouped"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete service");
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(`Uploading ${file.name}...`);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `services/${fileName}`;

      const publicUrl = await uploadImage(file, filePath);

      setEditingService((prev: any) => ({
        ...prev,
        image_url: publicUrl,
      }));
      toast.success("Service image uploaded successfully!");
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleApplyPresetImage = (categoryName: string) => {
    const preset = PRESET_HD_IMAGES[categoryName] || PRESET_HD_IMAGES["Wooden Door"];
    setEditingService((prev: any) => ({
      ...prev,
      image_url: preset,
    }));
    toast.success("Applied HD Urban photography preset!");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    saveMutation.mutate({
      id: editingService.id,
      category: editingService.category || SERVICE_CATEGORIES[0],
      name: editingService.name,
      description: editingService.description,
      starts_at_cents: Math.round(parseFloat(editingService.price_rupees || "0") * 100),
      image_url: editingService.image_url,
      is_active: editingService.is_active ?? true,
      sort_order: editingService.sort_order || 0,
    });
  };

  const filteredServices = (services ?? []).filter((s: any) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "all" || s.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const fieldCls =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-amber-500/20";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wrench className="h-6 w-6 text-amber-500" />
            Urban Carpentry Services Admin Dashboard
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Add, edit, assign HD photography, and manage all doorstep carpentry services.
          </p>
        </div>

        <Button
          onClick={() =>
            setEditingService({
              id: undefined,
              category: SERVICE_CATEGORIES[0],
              name: "",
              description: "",
              price_rupees: "199",
              image_url: PRESET_HD_IMAGES[SERVICE_CATEGORIES[0]],
              is_active: true,
              sort_order: 0,
            })
          }
          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md gap-1.5"
        >
          <Plus className="h-4 w-4" /> Add New Service
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto py-1">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              selectedCategory === "all"
                ? "bg-amber-500 text-zinc-950 shadow-sm"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All Categories ({services?.length ?? 0})
          </button>
          {SERVICE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                selectedCategory === cat
                  ? "bg-amber-500 text-zinc-950 shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search service title..."
            className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-xs outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </div>

      {/* Edit / Create Service Modal */}
      <AnimatePresence>
        {editingService && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 text-foreground max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-base">
                  {editingService.id ? "Edit Carpentry Service" : "Add New Carpentry Service"}
                </h3>
                <button
                  onClick={() => setEditingService(null)}
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1">Service Title *</label>
                  <input
                    type="text"
                    required
                    value={editingService.name || ""}
                    onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                    placeholder="e.g. Teakwood Main Door Alignment & Hinge Repair"
                    className={fieldCls}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider block mb-1">Category *</label>
                    <select
                      value={editingService.category || SERVICE_CATEGORIES[0]}
                      onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                      className={fieldCls}
                    >
                      {SERVICE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider block mb-1">Price (₹ INR) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editingService.price_rupees ?? (editingService.starts_at_cents ? editingService.starts_at_cents / 100 : "199")}
                      onChange={(e) => setEditingService({ ...editingService, price_rupees: e.target.value })}
                      className={fieldCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={editingService.description || ""}
                    onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                    placeholder="Complete inspection, latch repair, and lubricated hinge fitting..."
                    className={fieldCls}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1">🖼️ HD Service Photo Image URL</label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-zinc-950 hover:file:bg-amber-400 cursor-pointer"
                    />
                    {uploading && <Loader2 className="h-4 w-4 text-amber-500 animate-spin shrink-0" />}
                  </div>

                  <input
                    type="url"
                    value={editingService.image_url || ""}
                    onChange={(e) => setEditingService({ ...editingService, image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className={fieldCls}
                  />

                  <div className="mt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleApplyPresetImage(editingService.category)}
                      className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <Zap className="h-3.5 w-3.5" /> Auto-Apply Urban HD Unsplash Photo Preset
                    </button>
                  </div>
                </div>

                {/* Preview Image */}
                {editingService.image_url && (
                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-zinc-950 border border-border">
                    <img src={editingService.image_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={editingService.is_active ?? true}
                    onChange={(e) => setEditingService({ ...editingService, is_active: e.target.checked })}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="is_active" className="text-xs font-medium cursor-pointer">
                    Service Active on Live Doorstep Booking Page
                  </label>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-border">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingService(null)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs gap-1.5"
                  >
                    {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Save className="h-4 w-4" /> Save Service
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Services Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 text-amber-500 animate-spin mx-auto" />
          <p className="mt-2 text-xs text-muted-foreground">Loading services...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service: any) => {
            const imgUrl =
              service.image_url && service.image_url.trim() !== ""
                ? resolveImage(service.image_url)
                : PRESET_HD_IMAGES[service.category] || PRESET_HD_IMAGES["Wooden Door"];

            return (
              <div
                key={service.id}
                className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <div className="relative aspect-[16/10] bg-zinc-950 overflow-hidden border-b border-border">
                    <img src={imgUrl} alt={service.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    <span className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-500/30">
                      {service.category}
                    </span>

                    <span
                      className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        service.is_active
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                      }`}
                    >
                      {service.is_active ? "Active ✓" : "Inactive"}
                    </span>
                  </div>

                  <div className="p-4 space-y-2">
                    <h4 className="font-bold text-sm text-foreground line-clamp-1">{service.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{service.description}</p>
                  </div>
                </div>

                <div className="p-4 pt-2 border-t border-border bg-muted/20 flex items-center justify-between">
                  <span className="font-mono font-bold text-base text-foreground">
                    {service.starts_at_cents === 0 ? "Free Visit" : formatPrice(service.starts_at_cents)}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setEditingService({
                          ...service,
                          price_rupees: (service.starts_at_cents / 100).toString(),
                        })
                      }
                      className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition"
                      title="Edit Service"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete service "${service.name}"?`)) {
                          deleteMutation.mutate(service.id);
                        }
                      }}
                      className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition"
                      title="Delete Service"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
