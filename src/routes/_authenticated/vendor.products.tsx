import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listCategories } from "@/lib/products.functions";
import { listVendorProducts, vendorUpsertProduct, vendorDeleteProduct } from "@/lib/vendor.functions";
import { formatPrice } from "@/lib/format";
import { resolveImage, uploadImage } from "@/lib/product-images";
import { Plus, Edit2, Trash2, X, Search, Info, Loader2, Upload } from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/_authenticated/vendor/products")({
  component: VendorProductsPage,
});

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function VendorProductsPage() {
  const queryClient = useQueryClient();
  const fetchProducts = useServerFn(listVendorProducts);
  const fetchCategories = useServerFn(listCategories);
  const upsertProductFn = useServerFn(vendorUpsertProduct);
  const deleteProductFn = useServerFn(vendorDeleteProduct);

  // Queries
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["vendor-products"],
    queryFn: () => fetchProducts(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchCategories(),
  });

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    slug: "",
    price_inr: "",
    stock: "5",
    category_id: "",
    description: "",
    image_url: "p2-dining-table.jpg", // default preset image
    featured: false,
  });

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const filePath = `products/${fileName}`;

      const publicUrl = await uploadImage(file, filePath);

      setFormData((prev) => ({
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

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  // Mutations
  const upsertMutation = useMutation({
    mutationFn: (vars: any) => upsertProductFn({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard-stats"] });
      toast.success("Product saved successfully!");
      setModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save product.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProductFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard-stats"] });
      toast.success("Product deleted successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete product.");
    },
  });

  const openAddModal = () => {
    setFormData({
      id: "",
      name: "",
      slug: "",
      price_inr: "",
      stock: "5",
      category_id: categories[0]?.id || "",
      description: "",
      image_url: "p2-dining-table.jpg",
      featured: false,
    });
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setEditingProduct(p);
    setFormData({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price_inr: String(Math.round(p.price_cents / 100)),
      stock: String(p.stock),
      category_id: p.category_id || "",
      description: p.description || "",
      image_url: p.image_url || "",
      featured: p.featured || false,
    });
    setModalOpen(true);
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: slugify(name),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceINR = parseFloat(formData.price_inr);
    if (isNaN(priceINR) || priceINR < 0) {
      toast.error("Please enter a valid price.");
      return;
    }

    const payload: any = {
      slug: formData.slug,
      name: formData.name,
      description: formData.description,
      price_cents: Math.round(priceINR * 100),
      stock: parseInt(formData.stock, 10),
      category_id: formData.category_id || null,
      image_url: formData.image_url || null,
      featured: formData.featured,
    };

    if (formData.id) {
      payload.id = formData.id;
    }

    upsertMutation.mutate(payload);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const fieldCls =
    "w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary transition duration-150";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">My Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your custom wood products, prices, and available stock.
          </p>
        </div>
        <Button
          onClick={openAddModal}
          className="rounded-full bg-primary font-semibold text-primary-foreground shadow-sm hover:opacity-95 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Filter and search row */}
      <div className="flex items-center relative w-full sm:max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search my inventory..."
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary"
        />
      </div>

      {/* Catalog Grid / List */}
      {loadingProducts ? (
        <div className="p-12 text-center text-muted-foreground">Loading products…</div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-20 text-center text-muted-foreground">
          No products found. Click "Add Product" to create your first listing!
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                  <th className="p-4 w-16">Image</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-accent/30 transition-colors">
                    <td className="p-4">
                      <div className="h-10 w-10 rounded-lg overflow-hidden border border-border/50 bg-muted">
                        <img
                          src={resolveImage(p.image_url, "f_auto,q_auto,w_100")}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-foreground">
                      <div>{p.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{p.slug}</div>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {p.categories?.name || "General"}
                    </td>
                    <td className="p-4 font-mono font-semibold">
                      {formatPrice(p.price_cents)}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        p.stock === 0
                          ? "bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                          : p.stock < 5
                          ? "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                          : "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                      }`}>
                        {p.stock} units
                      </span>
                    </td>
                    <td className="p-4">
                      {p.is_approved ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-450 border border-amber-500/20" title="Pending Admin Review">
                          Pending Verification
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-1.5">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Edit product"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-950/30 rounded-lg text-muted-foreground hover:text-red-600 dark:hover:text-red-450 transition-colors cursor-pointer"
                        title="Delete product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit / Add Modal Form */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-card border border-border w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6 overflow-y-auto max-h-[90vh]"
            >
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-6 right-6 p-1.5 hover:bg-accent rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div>
                <h2 className="font-display text-2xl font-semibold">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Fill in your carpentry or timber specs below to list it.
                </p>
              </div>

              <div className="flex gap-2.5 items-start p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-amber-600 dark:text-amber-450 text-xs">
                <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <span className="font-semibold block">Needs Admin Verification</span>
                  All new products or details edits must be verified by an administrator before appearing live on the public storefront.
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Product Name</label>
                  <input
                    required
                    placeholder="e.g. Teak Dining Stool"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className={fieldCls}
                    maxLength={150}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">URL Slug (lowercase & dashes)</label>
                    <input
                      required
                      placeholder="e.g. teak-dining-stool"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: slugify(e.target.value) })}
                      className={`${fieldCls} font-mono`}
                      maxLength={120}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      className={fieldCls}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Price (INR ₹)</label>
                    <input
                      required
                      type="number"
                      placeholder="e.g. 4500"
                      value={formData.price_inr}
                      onChange={(e) => setFormData({ ...formData, price_inr: e.target.value })}
                      className={fieldCls}
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Stock Count</label>
                    <input
                      required
                      type="number"
                      placeholder="e.g. 5"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className={fieldCls}
                      min={0}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground block font-medium">Product Image</label>
                  
                  {/* Preview of current image */}
                  {formData.image_url && (
                    <div className="relative h-24 w-24 rounded-2xl overflow-hidden border border-border bg-muted/40 shadow-sm">
                      <img
                        src={resolveImage(formData.image_url)}
                        alt="Product preview"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image_url: "" })}
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
                              Click to upload product image
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              JPG, PNG, WEBP up to 10MB (Uploaded to Cloudinary)
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

                    {/* Or URL input fallback */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Or enter a preset image key or custom URL"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-xs focus:border-primary outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Product Description</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide details on dimensions, finish, wood type, and care guidelines..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={`${fieldCls} py-2`}
                    maxLength={3800}
                  />
                </div>

                <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border">
                  <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <span>
                    New listings are automatically linked to your workshop account. Buyers see you as the seller and pay directly to your verified UPI payout address.
                  </span>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-full border border-border bg-card px-5 py-2.5 text-xs font-semibold hover:bg-accent transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    loading={upsertMutation.isPending}
                    className="rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-95 cursor-pointer"
                  >
                    Save Product
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
