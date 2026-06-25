import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listProducts, listCategories } from "@/lib/products.functions";
import {
  upsertProduct,
  deleteProduct,
  deleteProducts,
  purgeAllProducts,
  bulkUpdateCategory,
  bulkUpdateFeatured,
  bulkUpdateStock,
  adminVerifyProduct,
} from "@/lib/admin.functions";
import { formatPrice } from "@/lib/format";
import { resolveImage, uploadImage } from "@/lib/product-images";
import { useState, useMemo, useRef } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  FileSpreadsheet,
  Play,
  Check,
  Loader2,
  Search,
  ArrowUpDown,
  ShieldAlert,
  Layers,
  Sparkles,
  ToggleLeft,
  Ban,
  CheckSquare,
  Square,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Store,
} from "lucide-react";
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
  const verify = useServerFn(adminVerifyProduct);

  // Bulk server functions
  const bulkDelete = useServerFn(deleteProducts);
  const purgeAll = useServerFn(purgeAllProducts);
  const bulkSetCategory = useServerFn(bulkUpdateCategory);
  const bulkSetFeatured = useServerFn(bulkUpdateFeatured);
  const bulkSetStock = useServerFn(bulkUpdateStock);

  const products = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => fetchProducts({ data: { includeUnapproved: true } }),
  });
  const categories = useQuery({ queryKey: ["categories"], queryFn: () => fetchCats() });

  const [editing, setEditing] = useState<any | null>(null);

  // Filtering & Sorting states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("all"); // all, out, low, instock
  const [featuredFilter, setFeaturedFilter] = useState("all"); // all, featured, normal
  const [approvalFilter, setApprovalFilter] = useState("all"); // all, approved, pending
  const [sortBy, setSortBy] = useState("newest"); // newest, name-asc, name-desc, price-asc, price-desc, stock-asc, stock-desc

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Bulk operation modals
  const [showBulkCategoryModal, setShowBulkCategoryModal] = useState(false);
  const [showBulkStockModal, setShowBulkStockModal] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [showDeleteSelectedConfirm, setShowDeleteSelectedConfirm] = useState(false);

  const [bulkCategoryVal, setBulkCategoryVal] = useState<string | null>(null);
  const [bulkStockVal, setBulkStockVal] = useState(10);
  const [purgeConfirmText, setPurgeConfirmText] = useState("");
  const [purgeForce, setPurgeForce] = useState(false);
  const [deleteSelectedForce, setDeleteSelectedForce] = useState(false);

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

  const verifyMut = useMutation({
    mutationFn: (vars: { productId: string; isApproved: boolean }) => verify({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product verification updated successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Bulk Mutations
  const deleteProductsMut = useMutation({
    mutationFn: (vars: { ids: string[]; force?: boolean }) => bulkDelete({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      setSelectedIds(new Set());
      setShowDeleteSelectedConfirm(false);
      setDeleteSelectedForce(false);
      toast.success("Selected products deleted successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const purgeAllMut = useMutation({
    mutationFn: (vars: { force?: boolean }) => purgeAll({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      setSelectedIds(new Set());
      setShowPurgeModal(false);
      setPurgeConfirmText("");
      setPurgeForce(false);
      toast.success("Catalog wiped cleanly");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkUpdateCategoryMut = useMutation({
    mutationFn: (vars: { ids: string[]; category_id: string | null }) =>
      bulkSetCategory({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      setSelectedIds(new Set());
      setShowBulkCategoryModal(false);
      toast.success("Updated category for selected products");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkUpdateFeaturedMut = useMutation({
    mutationFn: (vars: { ids: string[]; featured: boolean }) => bulkSetFeatured({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      setSelectedIds(new Set());
      toast.success("Updated featured status for selected products");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkUpdateStockMut = useMutation({
    mutationFn: (vars: { ids: string[]; stock: number }) => bulkSetStock({ data: vars }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      setSelectedIds(new Set());
      setShowBulkStockModal(false);
      toast.success("Updated stock counts");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Client-side filtering & sorting
  const filteredProducts = useMemo(() => {
    const list = products.data ?? [];
    return list
      .filter((p: any) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const subcat = parseProductMetadata(p.description).subcategory.toLowerCase();
          const matchName = p.name?.toLowerCase().includes(q);
          const matchSlug = p.slug?.toLowerCase().includes(q);
          const matchDesc = p.description?.toLowerCase().includes(q);
          const matchSub = subcat.includes(q);
          if (!matchName && !matchSlug && !matchDesc && !matchSub) return false;
        }

        // Category filter
        if (categoryFilter && p.category_id !== categoryFilter) return false;

        // Stock filter
        if (stockFilter === "out" && p.stock > 0) return false;
        if (stockFilter === "low" && (p.stock === 0 || p.stock >= 5)) return false;
        if (stockFilter === "instock" && p.stock === 0) return false;

        // Featured filter
        if (featuredFilter === "featured" && !p.featured) return false;
        if (featuredFilter === "normal" && p.featured) return false;

        // Approval filter
        if (approvalFilter === "approved" && !p.is_approved) return false;
        if (approvalFilter === "pending" && p.is_approved) return false;

        return true;
      })
      .sort((a: any, b: any) => {
        switch (sortBy) {
          case "name-asc":
            return a.name.localeCompare(b.name);
          case "name-desc":
            return b.name.localeCompare(a.name);
          case "price-asc":
            return a.price_cents - b.price_cents;
          case "price-desc":
            return b.price_cents - a.price_cents;
          case "stock-asc":
            return a.stock - b.stock;
          case "stock-desc":
            return b.stock - a.stock;
          case "newest":
          default:
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        }
      });
  }, [products.data, searchQuery, categoryFilter, stockFilter, featuredFilter, approvalFilter, sortBy]);

  // Master selection helpers
  const allFilteredSelected =
    filteredProducts.length > 0 && filteredProducts.every((p: any) => selectedIds.has(p.id));
  const someFilteredSelected =
    filteredProducts.length > 0 &&
    filteredProducts.some((p: any) => selectedIds.has(p.id)) &&
    !allFilteredSelected;

  const toggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (allFilteredSelected) {
      filteredProducts.forEach((p: any) => next.delete(p.id));
    } else {
      filteredProducts.forEach((p: any) => next.add(p.id));
    }
    setSelectedIds(next);
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

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
          } else if (
            lowerHeader.includes("desc") ||
            lowerHeader.includes("about") ||
            lowerHeader.includes("detail")
          ) {
            initialMappings["description"] = header;
          } else if (
            lowerHeader.includes("price") ||
            lowerHeader.includes("cost") ||
            lowerHeader.includes("rate") ||
            lowerHeader.includes("mrp")
          ) {
            initialMappings["price"] = header;
          } else if (
            lowerHeader.includes("stock") ||
            lowerHeader.includes("qty") ||
            lowerHeader.includes("inventory") ||
            lowerHeader.includes("quantity")
          ) {
            initialMappings["stock"] = header;
          } else if (
            lowerHeader.includes("image") ||
            lowerHeader.includes("pic") ||
            lowerHeader.includes("photo") ||
            lowerHeader.includes("url")
          ) {
            initialMappings["image_url"] = header;
          } else if (
            lowerHeader.includes("subcat") ||
            lowerHeader.includes("type") ||
            lowerHeader.includes("tag")
          ) {
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
    const csvContent =
      "data:text/csv;charset=utf-8,Name,Description,Price,Stock,Image_URL,Subcategory\nTeak Dining Table,Solid Teakwood 6-seater table,18999.00,10,p2-dining-table.jpg,Wooden Table\nVasakal Main Door,Traditional solid wood door frame,32000.00,5,p4-floating-shelf.jpg,Wooden Door\nHandyman Callout,On-demand lock repair service,350.00,99,,Lock & Hinge";
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
      const baseSlug = productName
        .toLowerCase()
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
          },
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

  const clearAllFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setStockFilter("all");
    setFeaturedFilter("all");
    setApprovalFilter("all");
    setSortBy("newest");
  };

  const isFiltersActive =
    searchQuery ||
    categoryFilter ||
    stockFilter !== "all" ||
    featuredFilter !== "all" ||
    approvalFilter !== "all" ||
    sortBy !== "newest";

  return (
    <div className="dark p-6 pb-24 min-h-screen bg-[#020617] text-[#F8FAFC] font-admin selection:bg-emerald-500/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-admin text-3xl font-semibold tracking-tight text-white">Products Catalog</h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage physical products and booked carpentry services.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImporter(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
              Import CSV
            </button>

          <button
            onClick={() =>
              setEditing({
                slug: "",
                name: "",
                description: "",
                price_cents: 0,
                stock: 10,
                featured: false,
                image_url: "",
                category_id: null,
              })
            }
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 shadow-sm cursor-pointer transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add New
          </button>
        </div>
      </div>

      {/* Advanced Filter Controls */}
      <div className="mt-6 mx-6 p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Filters & Organization
          </h3>
          {isFiltersActive && (
            <button
              onClick={clearAllFilters}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-700 bg-slate-950 text-slate-200 text-sm focus:border-emerald-500 hover:border-slate-600 transition-colors outline-none placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Category filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-slate-200 text-sm focus:border-emerald-500 hover:border-slate-600 transition-colors outline-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.data?.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock filter */}
          <div>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-slate-200 text-sm focus:border-emerald-500 hover:border-slate-600 transition-colors outline-none cursor-pointer"
            >
              <option value="all">All Inventory</option>
              <option value="instock">In Stock</option>
              <option value="low">Low Stock (&lt; 5)</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>

          {/* Featured filter */}
          <div>
            <select
              value={featuredFilter}
              onChange={(e) => setFeaturedFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-slate-200 text-sm focus:border-emerald-500 hover:border-slate-600 transition-colors outline-none cursor-pointer"
            >
              <option value="all">All Showcase</option>
              <option value="featured">Featured Only</option>
              <option value="normal">Standard Only</option>
            </select>
          </div>

          {/* Approval filter */}
          <div>
            <select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-950 text-slate-200 text-sm focus:border-emerald-500 hover:border-slate-600 transition-colors outline-none cursor-pointer"
            >
              <option value="all">All Verification</option>
              <option value="approved">Approved / Live</option>
              <option value="pending">Pending Approval</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-700 bg-slate-950 text-slate-200 text-sm focus:border-emerald-500 hover:border-slate-600 transition-colors outline-none cursor-pointer appearance-none"
            >
              <option value="newest">Newest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="price-asc">Price (Low to High)</option>
              <option value="price-desc">Price (High to Low)</option>
              <option value="stock-asc">Stock (Low to High)</option>
              <option value="stock-desc">Stock (High to Low)</option>
            </select>
            <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="mt-4 mx-6 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-400 select-none">
              <tr>
                <th className="w-12 px-4 py-3 text-center">
                    <button
                      onClick={toggleSelectAll}
                      className="rounded text-slate-400 hover:text-slate-200 focus:outline-none transition cursor-pointer"
                      title="Select All filtered"
                    >
                      {allFilteredSelected ? (
                        <CheckSquare className="h-4.5 w-4.5 text-emerald-500" />
                      ) : someFilteredSelected ? (
                        <div className="h-4.5 w-4.5 rounded bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
                          <div className="h-1.5 w-2 bg-emerald-500 rounded-sm" />
                        </div>
                      ) : (
                        <Square className="h-4.5 w-4.5 text-slate-600" />
                      )}
                    </button>
                </th>
                <th className="px-4 py-3">Product / Service</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Featured</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 w-36"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    No products found matching active filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p: any) => {
                  const isSelected = selectedIds.has(p.id);
                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors duration-200 border-b border-slate-800/50 ${
                        isSelected
                          ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-l-2 border-l-emerald-500"
                          : "hover:bg-slate-800/50"
                      }`}
                    >
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleSelectOne(p.id)}
                          className="rounded text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4.5 w-4.5 text-emerald-500" />
                          ) : (
                            <Square className="h-4.5 w-4.5 text-slate-600 hover:text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={resolveImage(p.image_url)}
                            alt=""
                            className="h-10 w-10 rounded-lg object-cover bg-muted border border-border/40 shrink-0"
                          />
                          <div>
                            <p className="font-medium text-foreground">{p.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{p.slug}</p>
                            {p.vendor_profiles && (
                              <p className="text-[10px] text-amber-500/90 font-semibold flex items-center gap-1 mt-0.5" title="Vendor Listing">
                                <Store className="h-3 w-3 shrink-0 text-amber-500" />
                                {p.vendor_profiles.business_name}
                              </p>
                            )}
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
                      <td className="px-4 py-3 tabular-nums font-mono font-medium">
                        {formatPrice(p.price_cents)}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {p.stock === 0 ? (
                          <span className="text-xs font-medium text-destructive px-1.5 py-0.5 rounded bg-destructive/10">
                            Out of Stock
                          </span>
                        ) : p.stock < 5 ? (
                          <span className="text-xs font-medium text-amber-500 px-1.5 py-0.5 rounded bg-amber-500/10">
                            {p.stock} left (Low)
                          </span>
                        ) : (
                          <span>{p.stock}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.featured ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500">
                            <Sparkles className="h-3.5 w-3.5 fill-current" />
                            Yes
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {p.is_approved ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20">
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-450 border border-amber-500/20">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <button
                          onClick={() => {
                            verifyMut.mutate({ productId: p.id, isApproved: !p.is_approved });
                          }}
                          disabled={verifyMut.isPending}
                          className={`rounded p-2 hover:bg-accent cursor-pointer ${
                            p.is_approved ? "text-red-500 hover:text-red-600" : "text-emerald-500 hover:text-emerald-650"
                          }`}
                          title={p.is_approved ? "Suspend Approval" : "Verify & Approve"}
                        >
                          {p.is_approved ? (
                            <Ban className="h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setEditing(p)}
                          className="rounded p-2 hover:bg-accent cursor-pointer text-muted-foreground hover:text-foreground"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Delete this product?")) delMut.mutate(p.id);
                          }}
                          className="rounded p-2 hover:bg-accent text-destructive cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DANGER ZONE - Purge all products */}
      <div className="mt-12 rounded-2xl border border-destructive/20 bg-destructive/5 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Permanently remove all products in this database catalog. Cannot be undone.
            </p>
          </div>
          <button
            onClick={() => {
              setPurgeConfirmText("");
              setPurgeForce(false);
              setShowPurgeModal(true);
            }}
            className="px-5 py-2 text-sm font-semibold rounded-full border border-destructive bg-transparent hover:bg-destructive hover:text-white transition duration-200 cursor-pointer"
          >
            Delete All Products
          </button>
        </div>
      </div>

      {/* Bottom Floating Actions Bar for Multi-Select */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-background/90 backdrop-blur-md border border-border/80 shadow-2xl rounded-2xl px-6 py-4 flex flex-wrap items-center justify-between gap-4 max-w-4xl w-[92%] transition-all duration-300 transform scale-100 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <p className="text-sm font-bold text-foreground">
              {selectedIds.size} product{selectedIds.size > 1 ? "s" : ""} selected
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => {
                setBulkStockVal(10);
                setShowBulkStockModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold hover:bg-accent transition cursor-pointer"
            >
              Set Stock
            </button>

            <button
              onClick={() => {
                setBulkCategoryVal(null);
                setShowBulkCategoryModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold hover:bg-accent transition cursor-pointer"
            >
              <Layers className="h-3.5 w-3.5" />
              Set Category
            </button>

            <button
              onClick={() =>
                bulkUpdateFeaturedMut.mutate({ ids: Array.from(selectedIds), featured: true })
              }
              disabled={bulkUpdateFeaturedMut.isPending}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold hover:bg-accent transition cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-current" />
              Feature
            </button>

            <button
              onClick={() =>
                bulkUpdateFeaturedMut.mutate({ ids: Array.from(selectedIds), featured: false })
              }
              disabled={bulkUpdateFeaturedMut.isPending}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold hover:bg-accent transition cursor-pointer"
            >
              Unfeature
            </button>

            <button
              onClick={() => {
                setDeleteSelectedForce(false);
                setShowDeleteSelectedConfirm(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 px-3.5 py-1.5 text-xs font-semibold hover:bg-destructive hover:text-white transition cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected
            </button>

            <div className="h-5 w-[1px] bg-border mx-1" />

            <button
              onClick={clearSelection}
              className="rounded-full p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition"
              title="Cancel selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bulk Stock Modifier Modal */}
      {showBulkStockModal && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onClick={() => setShowBulkStockModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="font-display text-xl font-medium flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Update Stock ({selectedIds.size} products)
              </h2>
              <button
                onClick={() => setShowBulkStockModal(false)}
                className="hover:bg-accent rounded-full p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  New Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={bulkStockVal}
                  onChange={(e) => setBulkStockVal(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary outline-none"
                />
              </div>
              <div className="flex gap-3 pt-3">
                <button
                  onClick={() => setShowBulkStockModal(false)}
                  className="flex-1 rounded-full border border-border py-2 text-sm font-semibold hover:bg-accent transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    bulkUpdateStockMut.mutate({ ids: Array.from(selectedIds), stock: bulkStockVal })
                  }
                  disabled={bulkUpdateStockMut.isPending}
                  className="flex-1 rounded-full bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {bulkUpdateStockMut.isPending ? "Updating..." : "Apply Stock"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Category Modifier Modal */}
      {showBulkCategoryModal && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onClick={() => setShowBulkCategoryModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="font-display text-xl font-medium flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Change Category ({selectedIds.size} products)
              </h2>
              <button
                onClick={() => setShowBulkCategoryModal(false)}
                className="hover:bg-accent rounded-full p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Select New Category
                </label>
                <select
                  value={bulkCategoryVal ?? ""}
                  onChange={(e) => setBulkCategoryVal(e.target.value || null)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary outline-none cursor-pointer"
                >
                  <option value="">No Category</option>
                  {categories.data?.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-3">
                <button
                  onClick={() => setShowBulkCategoryModal(false)}
                  className="flex-1 rounded-full border border-border py-2 text-sm font-semibold hover:bg-accent transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    bulkUpdateCategoryMut.mutate({
                      ids: Array.from(selectedIds),
                      category_id: bulkCategoryVal,
                    })
                  }
                  disabled={bulkUpdateCategoryMut.isPending}
                  className="flex-1 rounded-full bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {bulkUpdateCategoryMut.isPending ? "Updating..." : "Apply Category"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Selected Confirmation Modal */}
      {showDeleteSelectedConfirm && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onClick={() => setShowDeleteSelectedConfirm(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="font-display text-xl font-medium text-destructive flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                Confirm Bulk Delete
              </h2>
              <button
                onClick={() => setShowDeleteSelectedConfirm(false)}
                className="hover:bg-accent rounded-full p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                You are about to delete{" "}
                <strong className="text-foreground">{selectedIds.size}</strong> selected products.
                This action cannot be undone.
              </p>

              <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4.5 space-y-3">
                <p className="text-xs text-destructive font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4" />
                  Foreign Key Restrictions
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  If any of these products are in a customer's order history, standard deletion will
                  fail. Check the option below to force-delete and clear their order history
                  automatically.
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="delete_selected_force"
                    checked={deleteSelectedForce}
                    onChange={(e) => setDeleteSelectedForce(e.target.checked)}
                    className="rounded border-border text-destructive focus:ring-destructive h-4 w-4 cursor-pointer"
                  />
                  <label
                    htmlFor="delete_selected_force"
                    className="text-xs font-semibold select-none text-foreground cursor-pointer"
                  >
                    Force Delete (clears order history containing these items)
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowDeleteSelectedConfirm(false)}
                  className="flex-1 rounded-full border border-border py-2 text-sm font-semibold hover:bg-accent transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    deleteProductsMut.mutate({
                      ids: Array.from(selectedIds),
                      force: deleteSelectedForce,
                    })
                  }
                  disabled={deleteProductsMut.isPending}
                  className="flex-1 rounded-full bg-destructive py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90 shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {deleteProductsMut.isPending ? "Deleting..." : "Delete Products"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purge Catalog Modal */}
      {showPurgeModal && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onClick={() => setShowPurgeModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="font-display text-xl font-medium text-destructive flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                Purge Entire Catalog
              </h2>
              <button
                onClick={() => setShowPurgeModal(false)}
                className="hover:bg-accent rounded-full p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                This will permanently delete <strong className="text-foreground">ALL</strong>{" "}
                products in the catalog.
              </p>

              <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4.5 space-y-3">
                <p className="text-xs text-destructive font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4" />
                  Cascade Order Deletion Required
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  To perform a complete wipe of all products, the database requires clearing all
                  associated customer orders and order histories.
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="purge_force"
                    checked={purgeForce}
                    onChange={(e) => setPurgeForce(e.target.checked)}
                    className="rounded border-border text-destructive focus:ring-destructive h-4 w-4 cursor-pointer"
                  />
                  <label
                    htmlFor="purge_force"
                    className="text-xs font-semibold select-none text-foreground cursor-pointer"
                  >
                    Force Purge (Clear all orders & order history)
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  To confirm, type <strong className="text-foreground">DELETE ALL</strong> below:
                </p>
                <input
                  type="text"
                  value={purgeConfirmText}
                  onChange={(e) => setPurgeConfirmText(e.target.value)}
                  placeholder="DELETE ALL"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-destructive outline-none uppercase font-mono font-bold tracking-wider"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPurgeModal(false)}
                  className="flex-1 rounded-full border border-border py-2 text-sm font-semibold hover:bg-accent transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => purgeAllMut.mutate({ force: purgeForce })}
                  disabled={purgeAllMut.isPending || purgeConfirmText !== "DELETE ALL"}
                  className="flex-1 rounded-full bg-destructive py-2 text-sm font-semibold text-destructive-foreground disabled:opacity-40 hover:opacity-90 shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {purgeAllMut.isPending ? "Purging..." : "Confirm Purge"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 overflow-y-auto"
          onClick={() => {
            if (!importing) setShowImporter(false);
          }}
        >
          <div
            className="w-full max-w-2xl rounded-3xl bg-card p-6 shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h2 className="font-display text-2xl flex items-center gap-2">
                <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
                CSV Catalog Importer
              </h2>
              <button
                disabled={importing}
                onClick={() => setShowImporter(false)}
                className="disabled:opacity-40 hover:bg-accent rounded-full p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {csvData.length === 0 ? (
              <div className="space-y-6 py-4">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl p-8 bg-muted/20 text-center">
                  <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-sm font-medium">Select a CSV file to upload</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">
                    Supports exports from Amazon, Flipkart, or custom inventory files.
                  </p>
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
                    <p className="mt-1">
                      Make sure your file lists your items. You will be able to map columns like
                      Name, Price, and Images in the next step.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                  <button
                    onClick={downloadTemplate}
                    className="text-xs text-primary hover:underline font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
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
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${(importProgress / importTotal) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 font-mono">
                        {importProgress} / {importTotal} records processed
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Map columns from your CSV sheet to the corresponding database field.
                    </p>

                    <div className="space-y-1 mt-2">
                      {destFields.map((field) => (
                        <div
                          key={field.key}
                          className="grid grid-cols-2 items-center gap-4 py-2 border-b border-border/40"
                        >
                          <label className="text-xs font-semibold text-foreground">
                            {field.label}{" "}
                            {field.required && <span className="text-red-500">*</span>}
                          </label>
                          <select
                            value={mappings[field.key] ?? ""}
                            onChange={(e) =>
                              setMappings({ ...mappings, [field.key]: e.target.value })
                            }
                            className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary cursor-pointer"
                          >
                            <option value="">-- Do Not Map --</option>
                            {csvHeaders.map((header) => (
                              <option key={header} value={header}>
                                {header}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1.5 pt-3 border-t">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                        Assign to Department Category
                      </label>
                      <select
                        value={defaultCategoryId}
                        onChange={(e) => setDefaultCategoryId(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary outline-none mt-1 cursor-pointer"
                      >
                        <option value="">No Category (Custom Seeding)</option>
                        {categories.data?.map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-3 pt-4 border-t mt-4">
                      <button
                        onClick={() => {
                          setCsvData([]);
                          setCsvHeaders([]);
                        }}
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
    result.sizes = sizesMatch[1].split(",").map((s) => s.trim());
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
    editing.image_url
      ? editing.image_url
          .split(",")
          .map((x: string) => x.trim())
          .filter(Boolean)
      : [],
  );
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [wood, setWood] = useState(metadata.wood);
  const [sakkai, setSakkai] = useState(metadata.sakkai);
  const [sizes, setSizes] = useState(metadata.sizes.join(", "));
  const [subcategory, setSubcategory] = useState(metadata.subcategory);
  const [descriptionText, setDescriptionText] = useState(metadata.description);

  const [seoKeywords, setSeoKeywords] = useState(editing.seo_keywords || "");
  const [customizations, setCustomizations] = useState<any[]>(
    Array.isArray(editing.customizations) ? editing.customizations : []
  );

  const addCustomization = () => {
    setCustomizations([...customizations, { name: "", options: [{ label: "", price_modifier_cents: 0 }] }]);
  };

  const updateCustomizationName = (index: number, name: string) => {
    const newCust = [...customizations];
    newCust[index].name = name;
    setCustomizations(newCust);
  };

  const addOption = (custIndex: number) => {
    const newCust = [...customizations];
    newCust[custIndex].options.push({ label: "", price_modifier_cents: 0 });
    setCustomizations(newCust);
  };

  const updateOption = (custIndex: number, optIndex: number, field: "label" | "price_modifier_cents", value: string | number) => {
    const newCust = [...customizations];
    newCust[custIndex].options[optIndex][field] = value as never;
    setCustomizations(newCust);
  };

  const removeCustomization = (index: number) => {
    setCustomizations(customizations.filter((_, i) => i !== index));
  };

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

      setImages((prev) => [...prev, publicUrl]);
      toast.success("Image uploaded successfully!");
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(null);
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
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl bg-card p-6 shadow-2xl border border-border my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h2 className="font-display text-2xl">{editing.id ? "Edit Product" : "New Product"}</h2>
          <button onClick={onClose} className="hover:bg-accent rounded-full p-1">
            <X className="h-5 w-5" />
          </button>
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
              const cleanedSizes = sizes
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .join(",");
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
              is_approved: fd.get("is_approved") === "on",
              image_url: images.join(", ") || null,
              category_id: String(fd.get("category_id")) || null,
              seo_keywords: seoKeywords.trim() || null,
              customizations: customizations.filter(c => c.name.trim() !== ""),
            });
          }}
        >
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Product Name</label>
            <input
              name="name"
              defaultValue={editing.name}
              required
              placeholder="e.g. Teak Lounge Chair"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">URL Slug</label>
            <input
              name="slug"
              defaultValue={editing.slug}
              required
              placeholder="e.g. teak-lounge-chair"
              pattern="[a-z0-9-]+"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">
              Product Description
            </label>
            <textarea
              name="descriptionText"
              value={descriptionText}
              onChange={(e) => setDescriptionText(e.target.value)}
              required
              placeholder="Enter basic product details..."
              rows={2}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">
              SEO Keywords (comma separated)
            </label>
            <input
              type="text"
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
              placeholder="e.g. custom wood, neem wood bed, teak furniture"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary outline-none"
            />
          </div>

          {/* Carpentry Settings */}
          <div className="bg-muted/30 p-4.5 rounded-2xl border border-border/40 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Carpentry Options & Settings
            </h3>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="wood_cust"
                checked={wood}
                onChange={(e) => setWood(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
              <label
                htmlFor="wood_cust"
                className="text-xs font-semibold select-none text-foreground"
              >
                Enable Wood Type Customization (Veppamaram, Teak, etc.)
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sakkai_cust"
                checked={sakkai}
                onChange={(e) => setSakkai(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
              <label
                htmlFor="sakkai_cust"
                className="text-xs font-semibold select-none text-foreground"
              >
                Enable Sakkai Configuration Options (Tamil Rebate Wedges)
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                Custom Sizes (comma-separated)
              </label>
              <input
                type="text"
                value={sizes}
                onChange={(e) => setSizes(e.target.value)}
                placeholder="e.g. 4x3 Feet, 3x3 Feet"
                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:border-primary outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                Service Subcategory (for Carpentry Services category)
              </label>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="e.g. Door Repair, Custom Cutting"
                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:border-primary outline-none"
              />
            </div>
            
            <div className="pt-2 border-t border-border/40 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">
                  Dynamic Product Options (with prices)
                </label>
                <button
                  type="button"
                  onClick={addCustomization}
                  className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 transition"
                >
                  + Add Option Group
                </button>
              </div>

              {customizations.map((cust, custIdx) => (
                <div key={custIdx} className="bg-background rounded-xl p-3 border border-border/60 space-y-2 relative">
                  <button type="button" onClick={() => removeCustomization(custIdx)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                  <input
                    type="text"
                    placeholder="Option Name (e.g. Wood Type)"
                    value={cust.name}
                    onChange={(e) => updateCustomizationName(custIdx, e.target.value)}
                    className="w-3/4 rounded bg-transparent border-b border-border px-1 py-1 text-sm font-semibold focus:border-primary outline-none"
                  />
                  <div className="space-y-2 pt-2">
                    {cust.options.map((opt: any, optIdx: number) => (
                      <div key={optIdx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Label (e.g. Veppam Maram)"
                          value={opt.label}
                          onChange={(e) => updateOption(custIdx, optIdx, "label", e.target.value)}
                          className="flex-1 rounded-lg border border-border bg-muted/20 px-2 py-1 text-xs outline-none"
                        />
                        <span className="text-xs text-muted-foreground">+ ₹</span>
                        <input
                          type="number"
                          placeholder="Price"
                          value={opt.price_modifier_cents ? opt.price_modifier_cents / 100 : ""}
                          onChange={(e) => updateOption(custIdx, optIdx, "price_modifier_cents", Math.round(Number(e.target.value) * 100))}
                          className="w-20 rounded-lg border border-border bg-muted/20 px-2 py-1 text-xs outline-none"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOption(custIdx)}
                      className="text-[10px] text-muted-foreground hover:text-foreground font-medium"
                    >
                      + Add choice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Price (₹ INR)</label>
              <input
                name="price"
                type="number"
                step="0.01"
                defaultValue={(editing.price_cents / 100).toFixed(2)}
                required
                placeholder="Price"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Stock Inventory</label>
              <input
                name="stock"
                type="number"
                defaultValue={editing.stock}
                required
                placeholder="Stock"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary outline-none"
              />
            </div>
          </div>

          {/* Dynamic Multi-Image Gallery Editor */}
          <div className="space-y-3 p-4 rounded-2xl border-2 border-dashed border-border bg-muted/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5" />
                Product Image Gallery
              </label>
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-mono">
                {images.length} image{images.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Image Thumbnails Preview */}
            {images.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[200px] overflow-y-auto p-1.5 border border-border/40 rounded-xl bg-background">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-xl overflow-hidden border border-border group shrink-0 shadow-sm"
                  >
                    <img src={resolveImage(img)} alt="" className="h-full w-full object-cover" />
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 text-[8px] font-bold bg-primary/90 text-primary-foreground px-1 rounded">
                        Main
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition duration-150 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Drop Zone */}
            <label
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-dashed cursor-pointer transition-colors ${
                uploading
                  ? "border-primary/50 bg-primary/5 animate-pulse"
                  : "border-border hover:border-primary/50 hover:bg-primary/5"
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  <p className="text-xs text-primary font-semibold">{uploadProgress}</p>
                </>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground">
                      Click to upload an image
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

            {/* URL Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Or paste an image URL here"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs focus:border-primary outline-none"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="rounded-xl bg-secondary px-4 py-2 text-xs border border-border hover:bg-accent font-semibold cursor-pointer transition shrink-0"
              >
                Add URL
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">
              Department Category
            </label>
            <select
              name="category_id"
              defaultValue={editing.category_id ?? ""}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary outline-none"
            >
              <option value="">No Category</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                name="featured"
                defaultChecked={editing.featured}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
              <label htmlFor="featured" className="text-sm font-medium select-none">
                Feature on Homepage
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_approved"
                name="is_approved"
                defaultChecked={editing.id ? editing.is_approved : true}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
              <label htmlFor="is_approved" className="text-sm font-medium select-none">
                Approved (Live in store)
              </label>
            </div>
          </div>

          <Button
            disabled={saveMut.isPending || uploading}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 mt-2"
          >
            {saveMut.isPending ? "Saving…" : "Save Product"}
          </Button>
        </form>
      </div>
    </div>
  );
}
