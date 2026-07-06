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
} from "lucide-react";
import { resolveImage, uploadImage } from "@/lib/product-images";

export const Route = createFileRoute("/_authenticated/admin/services")({
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

function AdminServicesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [editingService, setEditingService] = useState<any | null>(null); // null means not editing, { id: undefined, ... } means creating
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

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
      const filePath = `services/${fileName}`;

      const publicUrl = await uploadImage(file, filePath);

      setEditingService((prev: any) => ({
        ...prev,
        image_url: publicUrl,
      }));
      toast.success("Image uploaded successfully!");
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

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
      toast.success("Service deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-services-list"] });
      queryClient.invalidateQueries({ queryKey: ["services-grouped"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete service");
    },
  });

  const handleEdit = (service: any) => {
    setEditingService({
      id: service.id,
      category: service.category,
      name: service.name,
      description: service.description ?? "",
      starts_at_cents: service.starts_at_cents,
      image_url: service.image_url ?? "",
      is_active: service.is_active,
      sort_order: service.sort_order,
    });
  };

  const handleCreate = () => {
    setEditingService({
      category: SERVICE_CATEGORIES[0],
      name: "",
      description: "",
      starts_at_cents: 9900, // Default ₹99
      image_url: "",
      is_active: true,
      sort_order: (services?.length ?? 0) + 1,
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete service "${name}"? This will also remove it from any carpenters who offer it.`)) {
      deleteMutation.mutate(id);
    }
  };

  const filteredServices = (services ?? []).filter((s: any) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">Services Catalog</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage carpentry services offered on the platform.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/95 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Service
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-2xl border border-border/60">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary cursor-pointer"
          >
            <option value="all">All Categories</option>
            {SERVICE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table / List */}
      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">Loading services...</div>
      ) : filteredServices.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground bg-card rounded-2xl border border-border/40">
          No services found. Click "Add Service" to create one.
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-6 py-4 w-16">Image</th>
                  <th className="px-6 py-4">Sort</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Starting Price</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filteredServices.map((service: any) => (
                  <tr key={service.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="h-10 w-10 rounded-lg overflow-hidden border border-border/50 bg-muted">
                        <img
                          src={resolveImage(service.image_url, "f_auto,q_auto,w_100")}
                          alt={service.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-muted-foreground">
                      {service.sort_order}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {service.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{service.name}</div>
                      {service.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {service.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold">
                      {service.starts_at_cents === 0 ? (
                        <span className="text-muted-foreground text-xs italic">Get Quote</span>
                      ) : (
                        formatPrice(service.starts_at_cents)
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          service.is_active
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                        }`}
                      >
                        {service.is_active ? (
                          <>
                            <Eye className="h-3 w-3" /> Live
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3" /> Hidden
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(service)}
                          className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground cursor-pointer transition"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(service.id, service.name)}
                          className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-destructive cursor-pointer transition"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit/Create Dialog Modal */}
      <AnimatePresence>
        {editingService && (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 overflow-y-auto"
            onClick={() => setEditingService(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg rounded-3xl bg-card p-6 shadow-2xl border border-border my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <h2 className="font-display text-xl font-semibold">
                  {editingService.id ? "Edit Service" : "New Service"}
                </h2>
                <button
                  onClick={() => setEditingService(null)}
                  className="hover:bg-accent rounded-full p-1 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  saveMutation.mutate({
                    id: editingService.id,
                    category: String(fd.get("category")),
                    name: String(fd.get("name")),
                    description: String(fd.get("description")) || null,
                    starts_at_cents: Math.round(Number(fd.get("starts_at")) * 100),
                    sort_order: Number(fd.get("sort_order")),
                    is_active: fd.get("is_active") === "on",
                    image_url: editingService.image_url || null,
                  });
                }}
              >
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Category *</label>
                  <select
                    name="category"
                    defaultValue={editingService.category}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary outline-none cursor-pointer"
                  >
                    {SERVICE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Service Name *</label>
                  <input
                    name="name"
                    required
                    defaultValue={editingService.name}
                    placeholder="e.g. Traditional Poort Lock Fitting"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingService.description}
                    placeholder="Describe what is included in the service..."
                    rows={3}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground block">Service Image</label>
                  
                  {/* Preview of current image */}
                  {editingService.image_url && (
                    <div className="relative h-24 w-24 rounded-2xl overflow-hidden border border-border bg-muted/40 shadow-sm">
                      <img
                        src={resolveImage(editingService.image_url)}
                        alt="Service preview"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setEditingService((prev: any) => ({ ...prev, image_url: "" }))}
                        className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 rounded-full p-1 text-white cursor-pointer transition border-none"
                        title="Remove image"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {/* Upload Drop Zone / Button */}
                  <div className="flex flex-col gap-2">
                    <label
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-dashed cursor-pointer transition-colors ${
                        uploading
                          ? "border-primary/50 bg-primary/5 animate-pulse"
                          : "border-border hover:border-primary/50 hover:bg-primary/5"
                      }`}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-5 w-5 text-primary animate-spin" />
                          <p className="text-xs text-primary font-medium">{uploadProgress}</p>
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 text-muted-foreground" />
                          <div className="text-center">
                            <p className="text-xs font-semibold text-foreground">
                              Click to upload service image
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              JPG, PNG, WEBP up to 10MB (Uploaded to Cloudinary)
                            </p>
                          </div>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="sr-only"
                      />
                    </label>

                    {/* Or URL input fallback */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Or enter a custom image URL"
                        value={editingService.image_url || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditingService((prev: any) => ({ ...prev, image_url: val }));
                        }}
                        className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-xs focus:border-primary outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Starts At (₹ INR) *
                    </label>
                    <input
                      name="starts_at"
                      type="number"
                      step="0.01"
                      required
                      defaultValue={(editingService.starts_at_cents / 100).toFixed(2)}
                      placeholder="e.g. 99"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Sort Order *
                    </label>
                    <input
                      name="sort_order"
                      type="number"
                      required
                      defaultValue={editingService.sort_order}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    defaultChecked={editingService.is_active}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                  />
                  <label
                    htmlFor="is_active"
                    className="text-sm font-semibold select-none cursor-pointer"
                  >
                    Active / Visible to Customers
                  </label>
                </div>

                <button
                  disabled={saveMutation.isPending}
                  className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition flex items-center justify-center gap-2 mt-4 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  {saveMutation.isPending ? "Saving..." : "Save Service"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
