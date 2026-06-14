import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listProducts, listCategories } from "@/lib/products.functions";
import { upsertProduct, deleteProduct } from "@/lib/admin.functions";
import { formatPrice } from "@/lib/format";
import { resolveImage } from "@/lib/product-images";
import { useState } from "react";
import { Plus, Pencil, Trash2, X, Upload, FileSpreadsheet, Play, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: AdminProducts,
});

// CSV parser supporting double quotes and commas inside cells
function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          cell += '"';
          i++; // Skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(cell.trim());
        cell = "";
      } else if (char === "\n" || char === "\r") {
        if (char === "\r" && nextChar === "\n") {
          i++; // Skip \n
        }
        row.push(cell.trim());
        if (row.length > 1 || row[0] !== "") {
          lines.push(row);
        }
        row = [];
        cell = "";
      } else {
        cell += char;
      }
    }
  }
  
  if (cell !== "" || row.length > 0) {
    row.push(cell.trim());
    lines.push(row);
  }
  
  return lines;
}

function AdminProducts() {
  const qc = useQueryClient();
  const fetchProducts = useServerFn(listProducts);
  const fetchCats = useServerFn(listCategories);
  const save = useServerFn(upsertProduct);
  const del = useServerFn(deleteProduct);

  const products = useQuery({ queryKey: ["admin-products"], queryFn: () => fetchProducts({ data: {} }) });
  const categories = useQuery({ queryKey: ["categories"], queryFn: () => fetchCats() });

  const [editing, setEditing] = useState<any | null>(null);
  
  // Importer states
  const [showImporter, setShowImporter] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>("");

  const saveMut = useMutation({
    mutationFn: (vars: any) => save({ data: vars }),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["admin-products"] }); 
      qc.invalidateQueries({ queryKey: ["products"] }); 
      setEditing(null); 
      toast.success("Saved successfully"); 
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["admin-products"] }); 
      toast.success("Deleted"); 
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const rows = parseCSV(text);
        if (rows.length < 2) {
          toast.error("CSV file must have at least a header row and one data row.");
          return;
        }
        setCsvHeaders(rows[0]);
        setCsvData(rows.slice(1));
        
        // Auto-detect mappings based on header name matches
        const initialMappings: Record<string, string> = {};
        rows[0].forEach((header) => {
          const lowerHeader = header.toLowerCase();
          if (lowerHeader.includes("name") || lowerHeader.includes("title")) {
            initialMappings["name"] = header;
          } else if (lowerHeader.includes("desc") || lowerHeader.includes("about") || lowerHeader.includes("detail")) {
            initialMappings["description"] = header;
          } else if (lowerHeader.includes("price") || lowerHeader.includes("cost") || lowerHeader.includes("rate") || lowerHeader.includes("mrp")) {
            initialMappings["price"] = header;
          } else if (lowerHeader.includes("stock") || lowerHeader.includes("qty") || lowerHeader.includes("inventory") || lowerHeader.includes("quantity")) {
            initialMappings["stock"] = header;
          } else if (lowerHeader.includes("image") || lowerHeader.includes("pic") || lowerHeader.includes("photo") || lowerHeader.includes("url")) {
            initialMappings["image_url"] = header;
          } else if (lowerHeader.includes("subcat") || lowerHeader.includes("type") || lowerHeader.includes("tag")) {
            initialMappings["subcategory"] = header;
          }
        });
        setMappings(initialMappings);
        toast.success(`Loaded ${rows.length - 1} rows from spreadsheet!`);
      } catch (err: any) {
        toast.error("Failed to parse CSV file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,Description,Price,Stock,Image_URL,Subcategory\nTeak Dining Table,Solid Teakwood 6-seater table,18999.00,10,p2-dining-table.jpg,Wooden Table\nVasakal Main Door,Traditional solid wood door frame,32000.00,5,p4-floating-shelf.jpg,Wooden Door\nHandyman Callout,On-demand lock repair service,350.00,99,,Lock & Hinge";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "carpenterbullet_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startImport = async () => {
    if (!mappings["name"] || !mappings["price"]) {
      toast.error("Product Name and Price column mappings are required.");
      return;
    }

    setImporting(true);
    setImportProgress(0);
    setImportTotal(csvData.length);

    let successCount = 0;
    let failCount = 0;

    for (let index = 0; index < csvData.length; index++) {
      const row = csvData[index];
      const rowObj: Record<string, string> = {};
      csvHeaders.forEach((header, colIdx) => {
        rowObj[header] = row[colIdx] || "";
      });

      const productName = rowObj[mappings["name"]];
      if (!productName) {
        failCount++;
        continue;
      }

      // Generate clean url-friendly slug
      const baseSlug = productName.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

      // Parse price to cents
      const rawPrice = Number(rowObj[mappings["price"]].replace(/[^\d.-]/g, ""));
      const priceCents = isNaN(rawPrice) ? 0 : Math.round(rawPrice * 100);

      // Parse stock
      const rawStock = Number(rowObj[mappings["stock"]]);
      const stock = isNaN(rawStock) ? 10 : Math.max(0, Math.floor(rawStock));

      // Image Url
      const rawImg = rowObj[mappings["image_url"]] || null;

      // Description & subcategory
      let description = rowObj[mappings["description"]] || "";
      const sub = rowObj[mappings["subcategory"]];
      if (sub) {
        description = `[Subcategory: ${sub}] ${description}`;
      }

      try {
        await save({
          data: {
            slug,
            name: productName,
            description,
            price_cents: priceCents,
            stock,
            featured: false,
            image_url: rawImg,
            category_id: defaultCategoryId || null,
          }
        });
        successCount++;
      } catch (err) {
        console.error("Failed importing row:", productName, err);
        failCount++;
      }

      setImportProgress(index + 1);
    }

    setImporting(false);
    setCsvData([]);
    setShowImporter(false);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
    toast.success(`Import complete! Added ${successCount} products. (${failCount} failed/skipped)`);
  };

  const destFields = [
    { key: "name", label: "Product Name (Required)", required: true },
    { key: "description", label: "Description / Details", required: false },
    { key: "price", label: "Price in INR (e.g. 599.00) (Required)", required: true },
    { key: "stock", label: "Stock Quantity", required: false },
    { key: "image_url", label: "Image (URL or filename)", required: false },
    { key: "subcategory", label: "Subcategory Tag", required: false },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Products Catalog</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage physical products and booked carpentry services.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowImporter(true)} 
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4.5 py-2 text-sm font-semibold hover:bg-accent transition cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Import CSV
          </button>
          
          <button 
            onClick={() => setEditing({ slug: "", name: "", description: "", price_cents: 0, stock: 10, featured: false, image_url: "", category_id: null })} 
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 shadow-md cursor-pointer transition"
          >
            <Plus className="h-4 w-4" /> 
            Add New
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Product / Service</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.data?.map((p: any) => (
              <tr key={p.id} className="hover:bg-accent/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={resolveImage(p.image_url)} alt="" className="h-10 w-10 rounded-lg object-cover bg-muted border border-border/40 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{p.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {p.categories ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
                      {p.categories.name}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">None</span>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums font-mono font-medium">{formatPrice(p.price_cents)}</td>
                <td className="px-4 py-3 tabular-nums">{p.stock}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditing(p)} className="rounded p-2 hover:bg-accent cursor-pointer" title="Edit"><Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" /></button>
                  <button onClick={() => { if (confirm("Delete this product?")) delMut.mutate(p.id); }} className="rounded p-2 hover:bg-accent text-destructive cursor-pointer" title="Delete"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Product Editor Modal */}
      {editing && (
        <ProductEditModal 
          key={editing.id ?? "new"}
          editing={editing} 
          categories={categories.data ?? []} 
          saveMut={saveMut} 
          onClose={() => setEditing(null)} 
        />
      )}

      {/* CSV Importer Modal */}
      {showImporter && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 overflow-y-auto" onClick={() => { if (!importing) setShowImporter(false); }}>
          <div className="w-full max-w-2xl rounded-3xl bg-card p-6 shadow-2xl border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="font-display text-2xl flex items-center gap-2">
                <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
                CSV Catalog Importer
              </h2>
              <button disabled={importing} onClick={() => setShowImporter(false)} className="disabled:opacity-40 hover:bg-accent rounded-full p-1"><X className="h-5 w-5" /></button>
            </div>

            {csvData.length === 0 ? (
              <div className="space-y-6 py-4">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl p-8 bg-muted/20 text-center">
                  <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-sm font-medium">Select a CSV file to upload</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">Supports exports from Amazon, Flipkart, or custom inventory files.</p>
                  <input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleFileChange} 
                    className="block w-full text-xs text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer max-w-xs mx-auto" 
                  />
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                  <span className="text-lg font-bold">ℹ</span>
                  <div>
                    <p className="font-semibold">Formatting Guidelines</p>
                    <p className="mt-1">Make sure your file lists your items. You will be able to map columns like Name, Price, and Images in the next step.</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                  <button onClick={downloadTemplate} className="text-xs text-primary hover:underline font-semibold flex items-center gap-1.5 cursor-pointer">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Download Sample Import CSV Template
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                {importing ? (
                  <div className="space-y-4 py-8 text-center">
                    <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
                    <h3 className="font-medium text-lg">Importing Products...</h3>
                    <div className="max-w-xs mx-auto">
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${(importProgress / importTotal) * 100}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 font-mono">{importProgress} / {importTotal} records processed</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">Map columns from your CSV sheet to the corresponding database field.</p>
                    
                    <div className="space-y-1 mt-2">
                      {destFields.map((field) => (
                        <div key={field.key} className="grid grid-cols-2 items-center gap-4 py-2 border-b border-border/40">
                          <label className="text-xs font-semibold text-foreground">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          <select
                            value={mappings[field.key] ?? ""}
                            onChange={(e) => setMappings({ ...mappings, [field.key]: e.target.value })}
                            className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                          >
                            <option value="">-- Do Not Map --</option>
                            {csvHeaders.map((header) => (
                              <option key={header} value={header}>{header}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1.5 pt-3 border-t">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Assign to Department Category</label>
                      <select 
                        value={defaultCategoryId} 
                        onChange={(e) => setDefaultCategoryId(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary outline-none mt-1"
                      >
                        <option value="">No Category (Custom Seeding)</option>
                        {categories.data?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    <div className="flex gap-3 pt-4 border-t mt-4">
                      <button 
                        onClick={() => { setCsvData([]); setCsvHeaders([]); }} 
                        className="flex-1 rounded-full border border-border py-2 text-sm font-semibold hover:bg-accent transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={startImport} 
                        className="flex-1 rounded-full bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Play className="h-4 w-4 fill-current" />
                        Run Import ({csvData.length} items)
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Extraction for editing modal to manage image uploads cleanly
interface EditModalProps {
  editing: any;
  categories: any[];
  saveMut: any;
  onClose: () => void;
}

function parseProductMetadata(description: string | null | undefined) {
  const result = {
    description: "",
    subcategory: "",
    wood: false,
    sizes: [] as string[],
    sakkai: false,
  };

  if (!description) return result;

  let cleanedDesc = description;

  // Extract [Subcategory: X]
  const subMatch = cleanedDesc.match(/^\[Subcategory:\s*([^\]]+)\]/);
  if (subMatch) {
    result.subcategory = subMatch[1];
    cleanedDesc = cleanedDesc.replace(/^\[Subcategory:\s*[^\]]+\]\s*/, "");
  }

  // Extract [Wood: X]
  const woodMatch = cleanedDesc.match(/^\[Wood:\s*([^\]]+)\]/);
  if (woodMatch) {
    result.wood = woodMatch[1] === "true";
    cleanedDesc = cleanedDesc.replace(/^\[Wood:\s*[^\]]+\]\s*/, "");
  }

  // Extract [Sizes: X]
  const sizesMatch = cleanedDesc.match(/^\[Sizes:\s*([^\]]+)\]/);
  if (sizesMatch) {
    result.sizes = sizesMatch[1].split(",").map(s => s.trim());
    cleanedDesc = cleanedDesc.replace(/^\[Sizes:\s*[^\]]+\]\s*/, "");
  }

  // Extract [Sakkai: X]
  const sakkaiMatch = cleanedDesc.match(/^\[Sakkai:\s*([^\]]+)\]/);
  if (sakkaiMatch) {
    result.sakkai = sakkaiMatch[1] === "true";
    cleanedDesc = cleanedDesc.replace(/^\[Sakkai:\s*[^\]]+\]\s*/, "");
  }

  result.description = cleanedDesc.trim();
  return result;
}

function ProductEditModal({ editing, categories, saveMut, onClose }: EditModalProps) {
  const metadata = parseProductMetadata(editing.description);

  const [images, setImages] = useState<string[]>(
    editing.image_url ? editing.image_url.split(",").map((x: string) => x.trim()).filter(Boolean) : []
  );
  const [uploading, setUploading] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");

  const [wood, setWood] = useState(metadata.wood);
  const [sakkai, setSakkai] = useState(metadata.sakkai);
  const [sizes, setSizes] = useState(metadata.sizes.join(", "));
  const [subcategory, setSubcategory] = useState(metadata.subcategory);
  const [descriptionText, setDescriptionText] = useState(metadata.description);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // Upload file to Supabase product-images storage bucket
      const { data, error } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (error) throw new Error(error.message);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      setImages([...images, publicUrl]);
      toast.success("Image uploaded successfully!");
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}. Please verify a bucket named 'product-images' exists in Storage.`);
    } finally {
      setUploading(false);
    }
  };

  const handleAddImageUrl = () => {
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl("");
      toast.success("Image URL added!");
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    toast.success("Image removed.");
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl bg-card p-6 shadow-2xl border border-border my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h2 className="font-display text-2xl">{editing.id ? "Edit Product" : "New Product"}</h2>
          <button onClick={onClose} className="hover:bg-accent rounded-full p-1"><X className="h-5 w-5" /></button>
        </div>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            
            // Build dynamic description metadata
            let metaString = "";
            if (subcategory.trim()) metaString += `[Subcategory: ${subcategory.trim()}] `;
            if (wood) metaString += `[Wood: true] `;
            if (sizes.trim()) {
              const cleanedSizes = sizes.split(",").map(s => s.trim()).filter(Boolean).join(",");
              if (cleanedSizes) metaString += `[Sizes: ${cleanedSizes}] `;
            }
            if (sakkai) metaString += `[Sakkai: true] `;

            const finalDesc = `${metaString}${descriptionText}`.trim();

            saveMut.mutate({
              id: editing.id,
              slug: String(fd.get("slug")),
              name: String(fd.get("name")),
              description: finalDesc,
              price_cents: Math.round(Number(fd.get("price")) * 100),
              stock: Number(fd.get("stock")),
              featured: fd.get("featured") === "on",
              image_url: images.join(", ") || null,
              category_id: String(fd.get("category_id")) || null,
            });
          }}
        >
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Product Name</label>
            <input name="name" defaultValue={editing.name} required placeholder="e.g. Teak Lounge Chair" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary outline-none" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">URL Slug</label>
            <input name="slug" defaultValue={editing.slug} required placeholder="e.g. teak-lounge-chair" pattern="[a-z0-9-]+" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary outline-none" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Product Description</label>
            <textarea name="descriptionText" value={descriptionText} onChange={(e) => setDescriptionText(e.target.value)} required placeholder="Enter basic product details..." rows={2} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary outline-none" />
          </div>

          {/* Carpentry Settings */}
          <div className="bg-muted/30 p-4.5 rounded-2xl border border-border/40 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Carpentry Options & Settings</h3>
            
            <div className="flex items-center gap-2">
              <input type="checkbox" id="wood_cust" checked={wood} onChange={(e) => setWood(e.target.checked)} className="rounded border-border text-primary focus:ring-primary h-4 w-4" />
              <label htmlFor="wood_cust" className="text-xs font-semibold select-none text-foreground">Enable Wood Type Customization (Veppamaram, Teak, etc.)</label>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="sakkai_cust" checked={sakkai} onChange={(e) => setSakkai(e.target.checked)} className="rounded border-border text-primary focus:ring-primary h-4 w-4" />
              <label htmlFor="sakkai_cust" className="text-xs font-semibold select-none text-foreground">Enable Sakkai Configuration Options (Tamil Rebate Wedges)</label>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Custom Sizes (comma-separated)</label>
              <input type="text" value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="e.g. 4x3 Feet, 3x3 Feet" className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:border-primary outline-none" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Service Subcategory (for Carpentry Services category)</label>
              <input type="text" value={subcategory} onChange={(e) => setSubcategory(e.target.value)} placeholder="e.g. Door Repair, Custom Cutting" className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:border-primary outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Price (₹ INR)</label>
              <input name="price" type="number" step="0.01" defaultValue={(editing.price_cents / 100).toFixed(2)} required placeholder="Price" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Stock Inventory</label>
              <input name="stock" type="number" defaultValue={editing.stock} required placeholder="Stock" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary outline-none" />
            </div>
          </div>

          {/* Dynamic Multi-Image Gallery Editor */}
          <div className="space-y-2.5 p-3.5 rounded-2xl border border-dashed border-border bg-muted/20">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Product Image Gallery ({images.length} images)</label>
            
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2.5 mt-1 max-h-[140px] overflow-y-auto p-1 border border-border/40 rounded-lg bg-background animate-fade-in">
                {images.map((img, idx) => (
                  <div key={idx} className="relative h-12 w-12 rounded-lg overflow-hidden border border-border group shrink-0 shadow-sm">
                    <img src={resolveImage(img)} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition duration-150 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                />
                {uploading && <p className="text-xs text-primary animate-pulse mt-0.5">Uploading...</p>}
              </div>
            </div>

            <div className="flex gap-1.5 mt-1">
              <input
                type="text"
                placeholder="Or input image web URL"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs focus:border-primary outline-none"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="rounded-lg bg-secondary px-3 py-1 text-xs border border-border hover:bg-accent font-semibold cursor-pointer transition"
              >
                Add URL
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Department Category</label>
            <select name="category_id" defaultValue={editing.category_id ?? ""} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary outline-none">
              <option value="">No Category</option>
              {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="featured" name="featured" defaultChecked={editing.featured} className="rounded border-border text-primary focus:ring-primary h-4 w-4" />
            <label htmlFor="featured" className="text-sm font-medium select-none">Feature on Homepage</label>
          </div>

          <Button disabled={saveMut.isPending || uploading} className="w-full rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 mt-2">
            {saveMut.isPending ? "Saving…" : "Save Product"}
          </Button>
        </form>
      </div>
    </div>
  );
}
