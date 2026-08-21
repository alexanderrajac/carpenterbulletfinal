import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListServices,
  adminSaveService,
  adminDeleteService,
  adminBulkDeleteServices,
  adminBulkSaveServices,
  adminBulkUpdateServices,
  SERVICE_PRESET_HD_IMAGES,
} from "@/lib/services.functions";
import { formatPrice } from "@/lib/format";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Upload,
  Loader2,
  Zap,
  Download,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  LayoutGrid,
  List,
  AlertTriangle,
  Play,
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
  "Clothes hanger",
  "Bed",
  "Drill & hang",
  "At home consultation",
];

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

function AdminServicesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>("all"); // all, active, inactive
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const [editingService, setEditingService] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Multi-Select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // CSV Importer state
  const [showCsvImporter, setShowCsvImporter] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);

  // Bulk confirmation modals
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Server functions
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
      queryClient.invalidateQueries({ queryKey: ["services-list"] });
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
      queryClient.invalidateQueries({ queryKey: ["services-list"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete service");
    },
  });

  // Bulk Mutations
  const bulkDeleteFn = useServerFn(adminBulkDeleteServices);
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkDeleteFn({ data: { ids } }),
    onSuccess: () => {
      toast.success(`Deleted selected services!`);
      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);
      queryClient.invalidateQueries({ queryKey: ["admin-services-list"] });
      queryClient.invalidateQueries({ queryKey: ["services-grouped"] });
      queryClient.invalidateQueries({ queryKey: ["services-list"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed bulk delete"),
  });

  const bulkUpdateFn = useServerFn(adminBulkUpdateServices);
  const bulkUpdateMutation = useMutation({
    mutationFn: (vars: { ids: string[]; updates: { is_active?: boolean; image_url?: string } }) =>
      bulkUpdateFn({ data: vars }),
    onSuccess: () => {
      toast.success("Updated selected services!");
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["admin-services-list"] });
      queryClient.invalidateQueries({ queryKey: ["services-grouped"] });
      queryClient.invalidateQueries({ queryKey: ["services-list"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed bulk update"),
  });

  const bulkSaveFn = useServerFn(adminBulkSaveServices);

  // Filtered Services List
  const filteredServices = useMemo(() => {
    return (services ?? []).filter((s: any) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === "all" || s.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesStatus =
        activeStatusFilter === "all" ||
        (activeStatusFilter === "active" && s.is_active) ||
        (activeStatusFilter === "inactive" && !s.is_active);

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [services, searchQuery, selectedCategory, activeStatusFilter]);

  // Selection Logic
  const allFilteredSelected =
    filteredServices.length > 0 && filteredServices.every((s: any) => selectedIds.has(s.id));
  const someFilteredSelected =
    filteredServices.length > 0 &&
    filteredServices.some((s: any) => selectedIds.has(s.id)) &&
    !allFilteredSelected;

  const toggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (allFilteredSelected) {
      filteredServices.forEach((s: any) => next.delete(s.id));
    } else {
      filteredServices.forEach((s: any) => next.add(s.id));
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

  // Bulk Apply HD Presets
  const handleBulkApplyPresetImages = () => {
    if (selectedIds.size === 0) return;
    const selectedList = (services ?? []).filter((s: any) => selectedIds.has(s.id));
    const updates = selectedList.map((s: any) => ({
      ...s,
      image_url: SERVICE_PRESET_HD_IMAGES[s.category] || SERVICE_PRESET_HD_IMAGES["Wooden Door"],
    }));

    toast.promise(bulkSaveFn({ data: { services: updates } }), {
      loading: "Applying HD Photography Presets...",
      success: () => {
        setSelectedIds(new Set());
        queryClient.invalidateQueries({ queryKey: ["admin-services-list"] });
        queryClient.invalidateQueries({ queryKey: ["services-grouped"] });
        queryClient.invalidateQueries({ queryKey: ["services-list"] });
        return "Applied HD photos to selected services!";
      },
      error: (err: any) => err.message || "Failed preset assignment",
    });
  };

  // CSV File Handler
  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const rows = parseCSV(text);
        if (rows.length < 2) {
          toast.error("CSV file must contain a header row and at least 1 service data row.");
          return;
        }
        setCsvHeaders(rows[0]);
        setCsvData(rows.slice(1));

        // Auto-detect header mappings
        const autoMappings: Record<string, string> = {};
        rows[0].forEach((header) => {
          const lower = header.toLowerCase();
          if (lower.includes("name") || lower.includes("title") || lower.includes("service")) {
            autoMappings["name"] = header;
          } else if (lower.includes("cat")) {
            autoMappings["category"] = header;
          } else if (lower.includes("desc") || lower.includes("detail")) {
            autoMappings["description"] = header;
          } else if (
            lower.includes("price") ||
            lower.includes("start") ||
            lower.includes("cost") ||
            lower.includes("rate") ||
            lower.includes("inr") ||
            lower.includes("rupee")
          ) {
            autoMappings["starts_at"] = header;
          } else if (lower.includes("img") || lower.includes("image") || lower.includes("photo") || lower.includes("pic")) {
            autoMappings["image_url"] = header;
          }
        });
        setMappings(autoMappings);
        toast.success(`Parsed ${rows.length - 1} services from CSV file!`);
      } catch (err: any) {
        toast.error("Failed parsing CSV file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Export Services to CSV
  const handleExportCSV = () => {
    const exportData = filteredServices.length > 0 ? filteredServices : (services ?? []);
    if (exportData.length === 0) {
      toast.error("No services available to export");
      return;
    }

    const headers = ["category", "name", "description", "starts_at", "image_url", "is_active"];
    const rows = exportData.map((s: any) => {
      const priceFormatted = s.starts_at_cents === 0 ? "Quote" : `₹${s.starts_at_cents / 100}`;
      return [
        `"${(s.category || "").replace(/"/g, '""')}"`,
        `"${(s.name || "").replace(/"/g, '""')}"`,
        `"${(s.description || "").replace(/"/g, '""')}"`,
        `"${priceFormatted}"`,
        `"${(s.image_url || "").replace(/"/g, '""')}"`,
        s.is_active ? "TRUE" : "FALSE",
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `carpenterbullet_services_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${exportData.length} services to CSV!`);
  };

  // Download Sample CSV Template
  const handleDownloadSampleCSV = () => {
    const sampleHeaders = "category,name,description,starts_at,image_url,is_active";
    const sampleRows = [
      'Wooden Door,Teak Main Door Alignment & Lock Fitting,"Complete unmounting, hinge lubrication, and Godrej lock installation",₹499,https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80,TRUE',
      'Cupboard & Drawer,Hydraulic Hinge & Soft-Close Channel Fitting,"Replace old squeaky almirah hinges with hydraulic soft close hinges",₹199,https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80,TRUE',
      'Furniture Assembly,King Size Hydraulic Storage Bed Assembly,"Complete unboxing and heavy lift hydraulic frame assembly",₹999,https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80,TRUE',
    ];
    const csvContent = "data:text/csv;charset=utf-8," + [sampleHeaders, ...sampleRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "carpenterbullet_services_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloaded sample CSV template");
  };

  // Start Batch Import from CSV
  const handleStartCSVImport = async () => {
    if (!mappings["name"]) {
      toast.error("Service Title / Name column mapping is required.");
      return;
    }

    setImporting(true);

    const itemsToSave: any[] = [];
    csvData.forEach((row, index) => {
      const rowObj: Record<string, string> = {};
      csvHeaders.forEach((h, colIdx) => {
        rowObj[h] = row[colIdx] || "";
      });

      const name = rowObj[mappings["name"]];
      if (!name || name.trim() === "") return;

      const category = rowObj[mappings["category"]] || SERVICE_CATEGORIES[0];
      const description = rowObj[mappings["description"]] || "";

      // Parse price
      let startsAtCents = 19900;
      const rawPrice = rowObj[mappings["starts_at"]] || "";
      if (rawPrice) {
        if (rawPrice.toLowerCase().includes("quote") || rawPrice === "0") {
          startsAtCents = 0;
        } else {
          const parsed = parseFloat(rawPrice.replace(/[^\d.-]/g, ""));
          if (!isNaN(parsed)) {
            startsAtCents = Math.round(parsed * 100);
          }
        }
      }

      // Parse image or fallback to preset
      let imageUrl = rowObj[mappings["image_url"]] || "";
      if (!imageUrl || imageUrl.trim() === "") {
        imageUrl = SERVICE_PRESET_HD_IMAGES[category] || SERVICE_PRESET_HD_IMAGES["Wooden Door"];
      }

      itemsToSave.push({
        category,
        name: name.trim(),
        description: description.trim(),
        starts_at_cents: startsAtCents,
        image_url: imageUrl.trim(),
        is_active: true,
        sort_order: index + 1,
      });
    });

    if (itemsToSave.length === 0) {
      toast.error("No valid service rows found in CSV.");
      setImporting(false);
      return;
    }

    try {
      const res = await bulkSaveFn({ data: { services: itemsToSave } });
      toast.success(`Successfully imported ${res.count} services from CSV!`);
      queryClient.invalidateQueries({ queryKey: ["admin-services-list"] });
      queryClient.invalidateQueries({ queryKey: ["services-grouped"] });
      queryClient.invalidateQueries({ queryKey: ["services-list"] });
      setCsvData([]);
      setShowCsvImporter(false);
    } catch (err: any) {
      toast.error(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

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
    const preset = SERVICE_PRESET_HD_IMAGES[categoryName] || SERVICE_PRESET_HD_IMAGES["Wooden Door"];
    setEditingService((prev: any) => ({
      ...prev,
      image_url: preset,
    }));
    toast.success("Applied HD photography preset!");
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

  const fieldCls =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-amber-500/20";

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wrench className="h-6 w-6 text-amber-500" />
            Urban Carpentry Services Admin Dashboard
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage services with multi-select controls, CSV bulk import/export, and HD photography assignments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export CSV */}
          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="rounded-xl text-xs gap-1.5 border-border hover:bg-muted font-semibold cursor-pointer"
          >
            <Download className="h-4 w-4 text-emerald-500" /> Export CSV
          </Button>

          {/* Upload / Import CSV */}
          <Button
            onClick={() => setShowCsvImporter(true)}
            variant="outline"
            size="sm"
            className="rounded-xl text-xs gap-1.5 border-border hover:bg-muted font-semibold cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-amber-500" /> Upload Services as CSV
          </Button>

          {/* Add New Service */}
          <Button
            onClick={() =>
              setEditingService({
                id: undefined,
                category: SERVICE_CATEGORIES[0],
                name: "",
                description: "",
                price_rupees: "199",
                image_url: SERVICE_PRESET_HD_IMAGES[SERVICE_CATEGORIES[0]],
                is_active: true,
                sort_order: 0,
              })
            }
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add New Service
          </Button>
        </div>
      </div>

      {/* Filter Bar & View Switcher */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
        {/* Categories Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto py-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              selectedCategory === "all"
                ? "bg-amber-500 text-zinc-950 shadow-sm"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({services?.length ?? 0})
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

        {/* Search, Status & Layout Controls */}
        <div className="flex items-center gap-3 w-full lg:w-auto shrink-0 justify-end">
          {/* Status Filter */}
          <select
            value={activeStatusFilter}
            onChange={(e) => setActiveStatusFilter(e.target.value)}
            className="rounded-xl border border-border bg-background py-1.5 px-3 text-xs outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* Search Box */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services..."
              className="w-full rounded-xl border border-border bg-background py-1.5 pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl bg-muted p-1 border border-border shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                viewMode === "grid" ? "bg-card text-foreground shadow-sm font-bold" : "text-muted-foreground"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                viewMode === "table" ? "bg-card text-foreground shadow-sm font-bold" : "text-muted-foreground"
              }`}
              title="Table View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Select Master Control Bar */}
      <div className="flex items-center justify-between bg-muted/40 border border-border/80 px-4 py-2.5 rounded-xl text-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 font-bold text-foreground hover:text-amber-500 transition cursor-pointer"
          >
            {allFilteredSelected ? (
              <CheckSquare className="h-4 w-4 text-amber-500" />
            ) : someFilteredSelected ? (
              <div className="h-4 w-4 rounded bg-amber-500/20 border border-amber-500 flex items-center justify-center">
                <div className="h-1.5 w-2 bg-amber-500 rounded-sm" />
              </div>
            ) : (
              <Square className="h-4 w-4 text-muted-foreground" />
            )}
            <span>Select All Filtered ({filteredServices.length})</span>
          </button>
          {selectedIds.size > 0 && (
            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold px-2.5 py-0.5 rounded-full border border-amber-500/20">
              {selectedIds.size} Selected
            </span>
          )}
        </div>

        {selectedIds.size > 0 && (
          <button
            onClick={clearSelection}
            className="text-xs text-muted-foreground hover:text-foreground font-medium underline cursor-pointer"
          >
            Clear Selection
          </button>
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-950/95 backdrop-blur-xl border border-amber-500/40 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 text-xs"
          >
            <div className="font-bold flex items-center gap-2 pr-2 border-r border-zinc-800">
              <CheckSquare className="h-4 w-4 text-amber-500" />
              <span>{selectedIds.size} Services Selected</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  bulkUpdateMutation.mutate({
                    ids: Array.from(selectedIds),
                    updates: { is_active: true },
                  })
                }
                disabled={bulkUpdateMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl cursor-pointer transition flex items-center gap-1"
              >
                <Eye className="h-3.5 w-3.5" /> Bulk Activate
              </button>

              <button
                onClick={() =>
                  bulkUpdateMutation.mutate({
                    ids: Array.from(selectedIds),
                    updates: { is_active: false },
                  })
                }
                disabled={bulkUpdateMutation.isPending}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-3 py-1.5 rounded-xl cursor-pointer transition flex items-center gap-1"
              >
                <EyeOff className="h-3.5 w-3.5" /> Bulk Deactivate
              </button>

              <button
                onClick={handleBulkApplyPresetImages}
                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold px-3 py-1.5 rounded-xl cursor-pointer transition flex items-center gap-1"
              >
                <Zap className="h-3.5 w-3.5" /> Bulk Apply HD Photos
              </button>

              <button
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1.5 rounded-xl cursor-pointer transition flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" /> Bulk Delete
              </button>

              <button
                onClick={clearSelection}
                className="p-1 rounded-full text-zinc-400 hover:text-white cursor-pointer ml-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Services Grid or Table */}
      {isLoading ? (
        <div className="text-center py-16">
          <Loader2 className="h-8 w-8 text-amber-500 animate-spin mx-auto" />
          <p className="mt-2 text-xs text-muted-foreground">Loading services catalog...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-3xl p-8">
          <Wrench className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No services found</h3>
          <p className="text-xs text-muted-foreground mt-1">Try clearing filters or add a new service.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service: any) => {
            const isSelected = selectedIds.has(service.id);
            const imgUrl =
              service.image_url && service.image_url.trim() !== ""
                ? resolveImage(service.image_url)
                : SERVICE_PRESET_HD_IMAGES[service.category] || SERVICE_PRESET_HD_IMAGES["Wooden Door"];

            return (
              <div
                key={service.id}
                className={`rounded-3xl border bg-card overflow-hidden shadow-sm flex flex-col justify-between transition-all relative ${
                  isSelected
                    ? "border-amber-500 ring-2 ring-amber-500/30 shadow-lg bg-amber-500/5"
                    : "border-border hover:shadow-md"
                }`}
              >
                <div>
                  {/* Select Checkbox Banner */}
                  <div className="relative aspect-[16/10] bg-zinc-950 overflow-hidden border-b border-border">
                    <img src={imgUrl} alt={service.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

                    {/* Checkbox overlay */}
                    <button
                      onClick={() => toggleSelectOne(service.id)}
                      className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md p-1.5 rounded-xl border border-white/20 text-white cursor-pointer hover:scale-105 transition"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Square className="h-4 w-4 text-zinc-400" />
                      )}
                    </button>

                    <span className="absolute top-3 left-12 bg-zinc-950/80 backdrop-blur-md text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-500/30">
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

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h4 className="font-bold text-sm text-white line-clamp-1">{service.name}</h4>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {service.description || "Doorstep service with verified carpenter & 30-day guarantee."}
                    </p>
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
                      className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition cursor-pointer"
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
                      className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition cursor-pointer"
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
      ) : (
        /* Table View */
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted border-b border-border uppercase font-bold text-muted-foreground">
              <tr>
                <th className="p-3 w-10 text-center">
                  <button onClick={toggleSelectAll} className="cursor-pointer">
                    {allFilteredSelected ? (
                      <CheckSquare className="h-4 w-4 text-amber-500" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </th>
                <th className="p-3">Service Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredServices.map((service: any) => {
                const isSelected = selectedIds.has(service.id);
                const imgUrl =
                  service.image_url && service.image_url.trim() !== ""
                    ? resolveImage(service.image_url)
                    : SERVICE_PRESET_HD_IMAGES[service.category] || SERVICE_PRESET_HD_IMAGES["Wooden Door"];

                return (
                  <tr key={service.id} className={isSelected ? "bg-amber-500/10" : "hover:bg-muted/30"}>
                    <td className="p-3 text-center">
                      <button onClick={() => toggleSelectOne(service.id)} className="cursor-pointer">
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </td>
                    <td className="p-3 font-semibold text-foreground">
                      <div className="flex items-center gap-3">
                        <img src={imgUrl} alt="" className="h-9 w-12 rounded-lg object-cover bg-zinc-950 border shrink-0" />
                        <div>
                          <p className="font-bold line-clamp-1">{service.name}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{service.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-medium text-muted-foreground">{service.category}</td>
                    <td className="p-3 font-mono font-bold">
                      {service.starts_at_cents === 0 ? "Quote" : formatPrice(service.starts_at_cents)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          service.is_active ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {service.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() =>
                            setEditingService({
                              ...service,
                              price_rupees: (service.starts_at_cents / 100).toString(),
                            })
                          }
                          className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete service "${service.name}"?`)) {
                              deleteMutation.mutate(service.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CSV Importer Modal */}
      <AnimatePresence>
        {showCsvImporter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-4 text-foreground max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-amber-500" />
                  <h3 className="font-bold text-base">Bulk Upload Services from CSV File</h3>
                </div>
                <button
                  onClick={() => {
                    setShowCsvImporter(false);
                    setCsvData([]);
                  }}
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {csvData.length === 0 ? (
                /* Step 1: File Dropzone & Template Download */
                <div className="space-y-4">
                  <div className="p-8 border-2 border-dashed border-border hover:border-amber-500/50 rounded-2xl bg-muted/20 text-center space-y-3">
                    <FileSpreadsheet className="h-10 w-10 text-amber-500/60 mx-auto" />
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        Select or Drag & Drop your Services CSV spreadsheet
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        File should contain columns like Category, Service Name, Description, Price (starts_at), and Image URL
                      </p>
                    </div>

                    <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 text-xs font-bold hover:bg-amber-400 cursor-pointer shadow-md">
                      <Upload className="h-4 w-4" /> Choose CSV File
                      <input type="file" accept=".csv" onChange={handleCSVFileChange} className="sr-only" />
                    </label>
                  </div>

                  <div className="flex items-center justify-between bg-muted/40 p-3.5 rounded-xl text-xs border border-border">
                    <div>
                      <span className="font-bold text-foreground block">Need a starting format?</span>
                      <span className="text-muted-foreground text-[10px]">
                        Download our pre-formatted Urban Company service template.
                      </span>
                    </div>
                    <Button
                      onClick={handleDownloadSampleCSV}
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs gap-1 border-border cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5 text-amber-500" /> Download Template
                    </Button>
                  </div>
                </div>
              ) : (
                /* Step 2: Mapping & Preview Table */
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs text-emerald-400">
                    <span className="font-bold">✓ Loaded {csvData.length} service rows</span>
                    <button
                      onClick={() => setCsvData([])}
                      className="text-[10px] underline hover:text-white cursor-pointer"
                    >
                      Choose Different CSV
                    </button>
                  </div>

                  {/* Header Mapping Selection */}
                  <div className="space-y-2 border-b border-border pb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Confirm Column Mappings
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-[10px] font-bold block mb-1">Service Title / Name *</label>
                        <select
                          value={mappings["name"] || ""}
                          onChange={(e) => setMappings({ ...mappings, name: e.target.value })}
                          className={fieldCls}
                        >
                          <option value="">-- Select Column --</option>
                          {csvHeaders.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold block mb-1">Category</label>
                        <select
                          value={mappings["category"] || ""}
                          onChange={(e) => setMappings({ ...mappings, category: e.target.value })}
                          className={fieldCls}
                        >
                          <option value="">-- Select Column (or use fallback) --</option>
                          {csvHeaders.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold block mb-1">Price (₹ INR / starts_at)</label>
                        <select
                          value={mappings["starts_at"] || ""}
                          onChange={(e) => setMappings({ ...mappings, starts_at: e.target.value })}
                          className={fieldCls}
                        >
                          <option value="">-- Select Column --</option>
                          {csvHeaders.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold block mb-1">Image URL</label>
                        <select
                          value={mappings["image_url"] || ""}
                          onChange={(e) => setMappings({ ...mappings, image_url: e.target.value })}
                          className={fieldCls}
                        >
                          <option value="">-- Select Column (or auto-preset) --</option>
                          {csvHeaders.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Live Preview Table */}
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-border bg-background p-2 text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-muted font-bold text-[10px] uppercase text-muted-foreground border-b">
                        <tr>
                          <th className="p-2">#</th>
                          <th className="p-2">Title</th>
                          <th className="p-2">Category</th>
                          <th className="p-2">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {csvData.slice(0, 5).map((row, idx) => {
                          const rowObj: Record<string, string> = {};
                          csvHeaders.forEach((h, colIdx) => {
                            rowObj[h] = row[colIdx] || "";
                          });
                          return (
                            <tr key={idx}>
                              <td className="p-2 text-muted-foreground">{idx + 1}</td>
                              <td className="p-2 font-bold">{rowObj[mappings["name"]] || "—"}</td>
                              <td className="p-2 text-muted-foreground">
                                {rowObj[mappings["category"]] || SERVICE_CATEGORIES[0]}
                              </td>
                              <td className="p-2 font-mono">{rowObj[mappings["starts_at"]] || "₹199"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-2 flex justify-end gap-2 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCsvImporter(false);
                        setCsvData([]);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleStartCSVImport}
                      disabled={importing}
                      className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs gap-1.5 cursor-pointer"
                    >
                      {importing && <Loader2 className="h-4 w-4 animate-spin" />}
                      <Play className="h-4 w-4" /> Import {csvData.length} Services Now
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                  className="p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
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
                      value={
                        editingService.price_rupees ??
                        (editingService.starts_at_cents ? editingService.starts_at_cents / 100 : "199")
                      }
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
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1">
                    🖼️ HD Service Photo Image URL
                  </label>
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
                      className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="h-3.5 w-3.5" /> Auto-Apply Urban HD Photography Preset
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
                    className="rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
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
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs gap-1.5 cursor-pointer"
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

      {/* Bulk Delete Confirm Modal */}
      <AnimatePresence>
        {showBulkDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 text-center">
              <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
              <h3 className="font-bold text-base text-foreground">Confirm Bulk Delete</h3>
              <p className="text-xs text-muted-foreground">
                Are you sure you want to permanently delete <strong className="text-foreground">{selectedIds.size}</strong> selected services?
              </p>

              <div className="flex justify-center gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowBulkDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
                  disabled={bulkDeleteMutation.isPending}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer"
                >
                  Delete {selectedIds.size} Services
                </Button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
