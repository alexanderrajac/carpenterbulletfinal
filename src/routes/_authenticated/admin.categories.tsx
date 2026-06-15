import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listCategories } from "@/lib/products.functions";
import { upsertCategory, deleteCategory } from "@/lib/admin.functions";
import { resolveImage } from "@/lib/product-images";
import { useState } from "react";
import { Plus, Pencil, Trash2, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: AdminCategories,
});

function AdminCategories() {
  const qc = useQueryClient();
  const fetchCats = useServerFn(listCategories);
  const save = useServerFn(upsertCategory);
  const del = useServerFn(deleteCategory);

  const categories = useQuery({ queryKey: ["categories"], queryFn: () => fetchCats() });

  const [editing, setEditing] = useState<any | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const saveMut = useMutation({
    mutationFn: (vars: any) => save({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      setEditing(null);
      toast.success("Category saved!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `cat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `categories/${fileName}`;
      const { error } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });
      if (error) throw new Error(error.message);
      const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(filePath);
      setImageUrl(publicUrl);
      toast.success("Image uploaded!");
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const openNew = () => {
    setEditing({ slug: "", name: "", description: "", image_url: "" });
    setImageUrl("");
  };

  const openEdit = (cat: any) => {
    setEditing(cat);
    setImageUrl(cat.image_url ?? "");
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage department categories for your storefront.</p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 shadow-md cursor-pointer transition"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.data?.map((cat: any, i: number) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="relative rounded-2xl border border-border bg-card overflow-hidden group hover:border-primary/30 transition-colors duration-300"
          >
            {/* Image */}
            <div className="aspect-[16/9] overflow-hidden bg-muted">
              <img
                src={resolveImage(cat.image_url)}
                alt={cat.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-lg font-semibold">{cat.name}</h3>
                  <p className="text-[10px] font-mono text-muted-foreground">{cat.slug}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(cat)}
                    className="rounded-lg p-2 hover:bg-accent cursor-pointer transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                  <button
                    onClick={() => { if (confirm("Delete this category? Products using it will become uncategorized.")) delMut.mutate(cat.id); }}
                    className="rounded-lg p-2 hover:bg-accent text-destructive cursor-pointer transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {cat.description && (
                <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{cat.description}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Edit/Create Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 overflow-y-auto" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg rounded-3xl bg-card p-6 shadow-2xl border border-border my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="font-display text-2xl">{editing.id ? "Edit Category" : "New Category"}</h2>
              <button onClick={() => setEditing(null)} className="hover:bg-accent rounded-full p-1 cursor-pointer"><X className="h-5 w-5" /></button>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                saveMut.mutate({
                  id: editing.id,
                  slug: String(fd.get("slug")),
                  name: String(fd.get("name")),
                  description: String(fd.get("description")),
                  image_url: imageUrl || null,
                });
              }}
            >
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Category Name</label>
                <input name="name" defaultValue={editing.name} required placeholder="e.g. Wooden Cup" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">URL Slug</label>
                <input name="slug" defaultValue={editing.slug} required placeholder="e.g. wooden-cup" pattern="[a-z0-9-]+" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Description</label>
                <textarea name="description" defaultValue={editing.description} placeholder="Brief description of this category" rows={3} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary outline-none" />
              </div>

              {/* Image upload */}
              <div className="space-y-1.5 p-3.5 rounded-2xl border border-dashed border-border bg-muted/20">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category Image</label>
                <div className="flex items-center gap-4 mt-1">
                  <img src={resolveImage(imageUrl)} alt="" className="h-14 w-14 rounded-xl object-cover bg-card border border-border/40 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                    />
                    {uploading && <p className="text-xs text-primary animate-pulse mt-0.5">Uploading...</p>}
                  </div>
                </div>
                <div className="mt-2">
                  <label className="text-[10px] font-semibold text-muted-foreground">Or enter image URL / filename</label>
                  <input
                    type="text"
                    placeholder="e.g. p9-bowl-set.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-1 text-xs focus:border-primary outline-none mt-0.5"
                  />
                </div>
              </div>

              <Button disabled={saveMut.isPending || uploading} className="w-full rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 mt-2">
                {saveMut.isPending ? "Saving…" : "Save Category"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
