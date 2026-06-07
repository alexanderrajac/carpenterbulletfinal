import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listProducts, listCategories } from "@/lib/products.functions";
import { upsertProduct, deleteProduct } from "@/lib/admin.functions";
import { formatPrice } from "@/lib/format";
import { resolveImage } from "@/lib/product-images";
import { useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: AdminProducts,
});

function AdminProducts() {
  const qc = useQueryClient();
  const fetchProducts = useServerFn(listProducts);
  const fetchCats = useServerFn(listCategories);
  const save = useServerFn(upsertProduct);
  const del = useServerFn(deleteProduct);

  const products = useQuery({ queryKey: ["admin-products"], queryFn: () => fetchProducts({ data: {} }) });
  const categories = useQuery({ queryKey: ["categories"], queryFn: () => fetchCats() });

  const [editing, setEditing] = useState<any | null>(null);

  const saveMut = useMutation({
    mutationFn: (vars: any) => save({ data: vars }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); qc.invalidateQueries({ queryKey: ["products"] }); setEditing(null); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-medium tracking-tight">Products</h1>
        <button onClick={() => setEditing({ slug: "", name: "", description: "", price_cents: 0, stock: 0, featured: false, image_url: "", category_id: null })} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" /> New</button>
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.data?.map((p: any) => (
              <tr key={p.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={resolveImage(p.image_url)} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 tabular-nums">{formatPrice(p.price_cents)}</td>
                <td className="px-4 py-3 tabular-nums">{p.stock}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditing(p)} className="rounded p-2 hover:bg-accent"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => { if (confirm("Delete this product?")) delMut.mutate(p.id); }} className="rounded p-2 hover:bg-accent text-destructive"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg rounded-3xl bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">{editing.id ? "Edit product" : "New product"}</h2>
              <button onClick={() => setEditing(null)}><X className="h-5 w-5" /></button>
            </div>
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                saveMut.mutate({
                  id: editing.id,
                  slug: String(fd.get("slug")),
                  name: String(fd.get("name")),
                  description: String(fd.get("description")),
                  price_cents: Math.round(Number(fd.get("price")) * 100),
                  stock: Number(fd.get("stock")),
                  featured: fd.get("featured") === "on",
                  image_url: String(fd.get("image_url")) || null,
                  category_id: String(fd.get("category_id")) || null,
                });
              }}
            >
              <input name="name" defaultValue={editing.name} required placeholder="Name" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              <input name="slug" defaultValue={editing.slug} required placeholder="slug-here" pattern="[a-z0-9-]+" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              <textarea name="description" defaultValue={editing.description} placeholder="Description" rows={3} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input name="price" type="number" step="0.01" defaultValue={(editing.price_cents / 100).toFixed(2)} required placeholder="Price" className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
                <input name="stock" type="number" defaultValue={editing.stock} required placeholder="Stock" className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              </div>
              <input name="image_url" defaultValue={editing.image_url ?? ""} placeholder="Image (filename or URL)" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
              <select name="category_id" defaultValue={editing.category_id ?? ""} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                <option value="">No category</option>
                {categories.data?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={editing.featured} /> Featured</label>
              <button disabled={saveMut.isPending} className="w-full rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground">{saveMut.isPending ? "Saving…" : "Save"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
