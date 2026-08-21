import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listAllVendors,
  toggleVendorApproval,
  updateVendorProfileAdmin,
  adminBulkSaveVendors,
  adminBulkDeleteVendors,
  adminBulkUpdateVendorStatus,
  adminUpdateVendorServicesAndAreas,
} from "@/lib/admin.functions";
import { adminListServices } from "@/lib/services.functions";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Hammer,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  User,
  Copy,
  ShieldAlert,
  Edit,
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  Play,
  Loader2,
  Wrench,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/vendors")({
  head: () => ({ meta: [{ title: "Admin — Carpenter & Store Registrations | CarpenterBullet" }] }),
  component: AdminVendorsPage,
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

function AdminVendorsPage() {
  const queryClient = useQueryClient();
  const fetchVendors = useServerFn(listAllVendors);
  const toggleApproval = useServerFn(toggleVendorApproval);
  const updateVendor = useServerFn(updateVendorProfileAdmin);

  // Bulk Server Functions
  const bulkSaveVendorsFn = useServerFn(adminBulkSaveVendors);
  const bulkDeleteVendorsFn = useServerFn(adminBulkDeleteVendors);
  const bulkUpdateStatusFn = useServerFn(adminBulkUpdateVendorStatus);
  const updateServicesAndAreasFn = useServerFn(adminUpdateVendorServicesAndAreas);
  const fetchServices = useServerFn(adminListServices);

  // Queries
  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["admin-vendors"],
    queryFn: () => fetchVendors(),
  });

  const { data: allServices = [] } = useQuery({
    queryKey: ["admin-services-list"],
    queryFn: () => fetchServices(),
  });

  // Filtering State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved">("all");

  // Multi-Select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Edit Modal State
  const [editingVendor, setEditingVendor] = useState<any | null>(null);
  const [activeEditTab, setActiveEditTab] = useState<"profile" | "services" | "areas">("profile");
  const [editForm, setEditForm] = useState({
    id: "",
    business_name: "",
    owner_name: "",
    phone_number: "",
    workshop_address: "",
    city: "",
    state: "",
    upi_payout_id: "",
    bio: "",
    districts_covered: [] as string[],
    services_offered: [] as string[],
  });

  // CSV Importer State
  const [showCsvImporter, setShowCsvImporter] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);

  // Bulk Delete Confirm Modal
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Single Toggle Approval Mutation
  const toggleMutation = useMutation({
    mutationFn: (vars: { vendorId: string; isApproved: boolean }) => toggleApproval({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
      toast.success("Vendor approval status updated!");
    },
    onError: (err: any) => toast.error(err.message || "Failed status update"),
  });

  // Bulk Approval Mutation
  const bulkStatusMutation = useMutation({
    mutationFn: (vars: { ids: string[]; isApproved: boolean }) => bulkUpdateStatusFn({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
      setSelectedIds(new Set());
      toast.success("Updated approval status for selected carpenters!");
    },
    onError: (err: any) => toast.error(err.message || "Failed bulk status update"),
  });

  // Bulk Delete Mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkDeleteVendorsFn({ data: { ids } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);
      toast.success("Deleted selected carpenters!");
    },
    onError: (err: any) => toast.error(err.message || "Failed bulk delete"),
  });

  // Edit Vendor Details Mutation
  const editMutation = useMutation({
    mutationFn: async (vars: any) => {
      await updateVendor({ data: vars });
      await updateServicesAndAreasFn({
        data: {
          vendorId: vars.id,
          districts_covered: editForm.districts_covered,
          service_ids: editForm.services_offered,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
      toast.success("Carpenter profile & connected services updated!");
      setEditingVendor(null);
    },
    onError: (err: any) => toast.error(err.message || "Failed to save details"),
  });

  // Filtered List
  const filteredVendors = useMemo(() => {
    return vendors.filter((v: any) => {
      const matchesSearch =
        v.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.phone_number && v.phone_number.includes(searchQuery));

      if (filterStatus === "all") return matchesSearch;
      if (filterStatus === "pending") return matchesSearch && !v.is_approved;
      if (filterStatus === "approved") return matchesSearch && v.is_approved;
      return matchesSearch;
    });
  }, [vendors, searchQuery, filterStatus]);

  // Selection Logic
  const allFilteredSelected =
    filteredVendors.length > 0 && filteredVendors.every((v: any) => selectedIds.has(v.id));
  const someFilteredSelected =
    filteredVendors.length > 0 &&
    filteredVendors.some((v: any) => selectedIds.has(v.id)) &&
    !allFilteredSelected;

  const toggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (allFilteredSelected) {
      filteredVendors.forEach((v: any) => next.delete(v.id));
    } else {
      filteredVendors.forEach((v: any) => next.add(v.id));
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

  // Open Edit Modal
  const openEditModal = (vendor: any) => {
    setEditingVendor(vendor);
    setActiveEditTab("profile");
    setEditForm({
      id: vendor.id,
      business_name: vendor.business_name || "",
      owner_name: vendor.owner_name || "",
      phone_number: vendor.phone_number || "",
      workshop_address: vendor.workshop_address || "",
      city: vendor.city || "",
      state: vendor.state || "Tamil Nadu",
      upi_payout_id: vendor.upi_payout_id || "",
      bio: vendor.bio || "",
      districts_covered: vendor.districts_covered || [vendor.city],
      services_offered: vendor.services_offered || [],
    });
  };

  // CSV Importer File Handler
  const handleCSVFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const rows = parseCSV(text);
        if (rows.length < 2) {
          toast.error("CSV file must contain a header row and at least 1 carpenter row.");
          return;
        }
        setCsvHeaders(rows[0]);
        setCsvData(rows.slice(1));

        // Auto detect mappings
        const autoMappings: Record<string, string> = {};
        rows[0].forEach((header) => {
          const lower = header.toLowerCase();
          if (lower.includes("business") || lower.includes("store") || lower.includes("shop") || lower.includes("workshop")) {
            autoMappings["business_name"] = header;
          } else if (lower.includes("owner") || lower.includes("craftsman") || lower.includes("carpenter")) {
            autoMappings["owner_name"] = header;
          } else if (lower.includes("phone") || lower.includes("mobile") || lower.includes("contact")) {
            autoMappings["phone_number"] = header;
          } else if (lower.includes("city")) {
            autoMappings["city"] = header;
          } else if (lower.includes("state")) {
            autoMappings["state"] = header;
          } else if (lower.includes("address")) {
            autoMappings["workshop_address"] = header;
          } else if (lower.includes("upi")) {
            autoMappings["upi_payout_id"] = header;
          } else if (lower.includes("district") || lower.includes("area")) {
            autoMappings["districts_covered"] = header;
          } else if (lower.includes("service")) {
            autoMappings["services_offered"] = header;
          }
        });
        setMappings(autoMappings);
        toast.success(`Parsed ${rows.length - 1} carpenters from CSV!`);
      } catch (err: any) {
        toast.error("Failed parsing CSV file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  // Download Sample Carpenter CSV Template
  const handleDownloadSampleCSV = () => {
    const sampleHeaders = "business_name,owner_name,phone_number,city,state,workshop_address,upi_payout_id,districts_covered,services_offered,is_approved";
    const sampleRows = [
      'Raja Fine Woodworks & Door Fitting,Alexander Raja,8248651695,Kanchipuram,Tamil Nadu,"45 West Mada Street, Kanchipuram",8248651695@upi,"Kanchipuram,Chennai,Chengalpattu","c0040000-0000-4000-8000-000000000003,c0040000-0000-4000-8000-000000000008",TRUE',
      'Sri Wood Crafts & Teak Furnishings,Karthik M,9876543210,Chennai,Tamil Nadu,"12 Mount Road, Anna Nagar",9876543210@upi,"Chennai,Tiruvallur","c0030000-0000-4000-8000-000000000001,c0080000-0000-4000-8000-000000000002",TRUE',
    ];
    const csvContent = "data:text/csv;charset=utf-8," + [sampleHeaders, ...sampleRows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "carpenterbullet_carpenters_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloaded sample carpenter CSV template!");
  };

  // Export Carpenters to CSV
  const handleExportCSV = () => {
    const exportList = filteredVendors.length > 0 ? filteredVendors : vendors;
    if (exportList.length === 0) {
      toast.error("No carpenters available to export");
      return;
    }

    const headers = ["business_name", "owner_name", "phone_number", "city", "state", "workshop_address", "upi_payout_id", "districts_covered", "is_approved"];
    const rows = exportList.map((v: any) => {
      const dists = Array.isArray(v.districts_covered) ? v.districts_covered.join(";") : v.districts_covered || "";
      return [
        `"${(v.business_name || "").replace(/"/g, '""')}"`,
        `"${(v.owner_name || "").replace(/"/g, '""')}"`,
        `"${(v.phone_number || "").replace(/"/g, '""')}"`,
        `"${(v.city || "").replace(/"/g, '""')}"`,
        `"${(v.state || "").replace(/"/g, '""')}"`,
        `"${(v.workshop_address || "").replace(/"/g, '""')}"`,
        `"${(v.upi_payout_id || "").replace(/"/g, '""')}"`,
        `"${dists.replace(/"/g, '""')}"`,
        v.is_approved ? "TRUE" : "FALSE",
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `carpenterbullet_carpenters_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${exportList.length} carpenters to CSV!`);
  };

  // Start CSV Batch Import
  const handleStartCSVImport = async () => {
    if (!mappings["business_name"] || !mappings["owner_name"] || !mappings["phone_number"]) {
      toast.error("Business Name, Owner Name, and Phone Number column mappings are required.");
      return;
    }

    setImporting(true);
    const vendorsToSave: any[] = [];

    csvData.forEach((row) => {
      const rowObj: Record<string, string> = {};
      csvHeaders.forEach((h, idx) => {
        rowObj[h] = row[idx] || "";
      });

      const bName = rowObj[mappings["business_name"]];
      const oName = rowObj[mappings["owner_name"]];
      const phone = rowObj[mappings["phone_number"]];

      if (!bName || !oName || !phone) return;

      const city = rowObj[mappings["city"]] || "Chennai";
      const state = rowObj[mappings["state"]] || "Tamil Nadu";
      const address = rowObj[mappings["workshop_address"]] || `${city}, ${state}`;
      const upi = rowObj[mappings["upi_payout_id"]] || `${phone}@upi`;

      // Parse districts
      let districts: string[] = [city];
      const rawDists = rowObj[mappings["districts_covered"]];
      if (rawDists) {
        districts = rawDists.split(/[,;]/).map((d) => d.trim()).filter(Boolean);
      }

      // Parse services
      let services: string[] = [];
      const rawSvcs = rowObj[mappings["services_offered"]];
      if (rawSvcs) {
        services = rawSvcs.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
      }

      vendorsToSave.push({
        business_name: bName.trim(),
        owner_name: oName.trim(),
        phone_number: phone.trim(),
        city: city.trim(),
        state: state.trim(),
        workshop_address: address.trim(),
        upi_payout_id: upi.trim(),
        districts_covered: districts,
        services_offered: services,
        is_approved: true,
      });
    });

    if (vendorsToSave.length === 0) {
      toast.error("No valid carpenter rows found in CSV.");
      setImporting(false);
      return;
    }

    try {
      const res = await bulkSaveVendorsFn({ data: { vendors: vendorsToSave } });
      toast.success(`Successfully imported ${res.count} carpenters/stores from CSV!`);
      queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
      setCsvData([]);
      setShowCsvImporter(false);
    } catch (err: any) {
      toast.error(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const fieldCls =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-amber-500/20";

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight flex items-center gap-2">
            <Hammer className="h-6 w-6 text-amber-500" />
            Carpenter & Store Registrations Dashboard
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage carpenters, bulk import workshops via CSV, and map connected doorstep services & coverage districts.
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
            <FileSpreadsheet className="h-4 w-4 text-amber-500" /> Upload Carpenters as CSV
          </Button>

          {/* Add New Carpenter Manual */}
          <Button
            onClick={() =>
              openEditModal({
                id: `v-${Date.now()}`,
                business_name: "",
                owner_name: "",
                phone_number: "",
                workshop_address: "",
                city: "Kanchipuram",
                state: "Tamil Nadu",
                upi_payout_id: "",
                bio: "",
                districts_covered: ["Kanchipuram"],
                services_offered: [],
              })
            }
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add New Carpenter
          </Button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workshop, phone, city..."
            className="w-full rounded-xl border border-border bg-background py-1.5 pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {/* Filter Status Tabs */}
        <div className="flex items-center gap-1.5 bg-muted p-1 rounded-xl w-fit">
          {(["all", "pending", "approved"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition cursor-pointer ${
                filterStatus === st
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {st} ({st === "all" ? vendors.length : vendors.filter((v: any) => st === "pending" ? !v.is_approved : v.is_approved).length})
            </button>
          ))}
        </div>
      </div>

      {/* Master Multi-Select Control Bar */}
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
            <span>Select All Filtered ({filteredVendors.length})</span>
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
              <span>{selectedIds.size} Carpenters Selected</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  bulkStatusMutation.mutate({
                    ids: Array.from(selectedIds),
                    isApproved: true,
                  })
                }
                disabled={bulkStatusMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl cursor-pointer transition flex items-center gap-1"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Bulk Approve
              </button>

              <button
                onClick={() =>
                  bulkStatusMutation.mutate({
                    ids: Array.from(selectedIds),
                    isApproved: false,
                  })
                }
                disabled={bulkStatusMutation.isPending}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1.5 rounded-xl cursor-pointer transition flex items-center gap-1"
              >
                <AlertCircle className="h-3.5 w-3.5" /> Bulk Suspend
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

      {/* Carpenters List Cards */}
      {isLoading ? (
        <div className="text-center py-16">
          <Loader2 className="h-8 w-8 text-amber-500 animate-spin mx-auto" />
          <p className="mt-2 text-xs text-muted-foreground">Loading registered carpenters…</p>
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border py-16 text-center text-muted-foreground bg-card/20 space-y-3">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <p className="text-sm font-bold text-foreground">No carpenters found</p>
          <p className="text-xs text-muted-foreground">Try clearing your search query or upload a CSV file.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredVendors.map((vendor: any) => {
            const isSelected = selectedIds.has(vendor.id);
            const dists = Array.isArray(vendor.districts_covered)
              ? vendor.districts_covered
              : [vendor.city];

            const svcs = Array.isArray(vendor.services_offered)
              ? vendor.services_offered
              : [];

            return (
              <div
                key={vendor.id}
                className={`bg-card border rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-all duration-300 relative ${
                  isSelected
                    ? "border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/5 shadow-md"
                    : vendor.is_approved
                    ? "border-border/60 hover:border-emerald-500/40"
                    : "border-amber-500/30 bg-gradient-to-br from-card via-card to-amber-500/[0.02]"
                }`}
              >
                {/* Select Checkbox & Approval Status Header */}
                <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-3">
                  <button
                    onClick={() => toggleSelectOne(vendor.id)}
                    className="flex items-center gap-2 font-bold text-xs text-foreground cursor-pointer"
                  >
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 text-amber-500" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span>Select Carpenter</span>
                  </button>

                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                      vendor.is_approved
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {vendor.is_approved ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" /> Approved ✓
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 animate-pulse" /> Pending Verification
                      </>
                    )}
                  </span>
                </div>

                {/* Details Body */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground leading-snug line-clamp-1">
                      {vendor.business_name}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground/60" />
                      Lead Craftsman: <span className="font-semibold text-foreground">{vendor.owner_name}</span>
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground bg-muted/20 border border-border/40 p-3 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span className="font-mono font-bold text-foreground select-all">{vendor.phone_number}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">
                        {vendor.workshop_address}, {vendor.city}, {vendor.state}
                      </span>
                    </div>

                    {/* Coverage & Connected Services Tags */}
                    <div className="pt-2 border-t border-border/40 space-y-1">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[10px] font-bold text-foreground uppercase tracking-wider mr-1">
                          Districts ({dists.length}):
                        </span>
                        {dists.slice(0, 4).map((d: string) => (
                          <span
                            key={d}
                            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded-md border border-amber-500/20"
                          >
                            {d}
                          </span>
                        ))}
                        {dists.length > 4 && (
                          <span className="text-[9px] font-bold text-muted-foreground">+{dists.length - 4} more</span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        <span className="text-[10px] font-bold text-foreground uppercase tracking-wider mr-1">
                          Connected Services ({svcs.length}):
                        </span>
                        {svcs.length > 0 ? (
                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/20">
                            {svcs.length} Doorstep Services Mapped
                          </span>
                        ) : (
                          <span className="text-[9px] text-muted-foreground italic">No specific service IDs connected yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-4 pt-3 border-t border-border/30 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => openEditModal(vendor)}
                    className="rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-bold hover:bg-accent text-foreground transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Wrench className="h-3.5 w-3.5 text-amber-500" /> Edit & Connect Services
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleMutation.mutate({ vendorId: vendor.id, isApproved: !vendor.is_approved })}
                    disabled={toggleMutation.isPending}
                    className={`rounded-xl px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
                      vendor.is_approved
                        ? "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                    }`}
                  >
                    {vendor.is_approved ? "Suspend" : "Verify & Approve"}
                  </button>
                </div>
              </div>
            );
          })}
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
                  <h3 className="font-bold text-base">Bulk Upload Carpenters & Stores from CSV</h3>
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
                /* Step 1: File Dropzone */
                <div className="space-y-4">
                  <div className="p-8 border-2 border-dashed border-border hover:border-amber-500/50 rounded-2xl bg-muted/20 text-center space-y-3">
                    <FileSpreadsheet className="h-10 w-10 text-amber-500/60 mx-auto" />
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        Select or Drag & Drop your Carpenters / Stores CSV spreadsheet
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Columns: Business Name, Owner Name, Phone Number, City, State, Address, Coverage Districts
                      </p>
                    </div>

                    <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 text-xs font-bold hover:bg-amber-400 cursor-pointer shadow-md">
                      <Upload className="h-4 w-4" /> Choose Carpenter CSV File
                      <input type="file" accept=".csv" onChange={handleCSVFileChange} className="sr-only" />
                    </label>
                  </div>

                  <div className="flex items-center justify-between bg-muted/40 p-3.5 rounded-xl text-xs border border-border">
                    <div>
                      <span className="font-bold text-foreground block">Need a starting template?</span>
                      <span className="text-muted-foreground text-[10px]">
                        Download our pre-formatted South Indian Carpenter CSV template.
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
                /* Step 2: Mapping & Live Preview Table */
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs text-emerald-400">
                    <span className="font-bold">✓ Loaded {csvData.length} carpenter rows</span>
                    <button onClick={() => setCsvData([])} className="text-[10px] underline hover:text-white cursor-pointer">
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
                        <label className="text-[10px] font-bold block mb-1">Business / Workshop Name *</label>
                        <select
                          value={mappings["business_name"] || ""}
                          onChange={(e) => setMappings({ ...mappings, business_name: e.target.value })}
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
                        <label className="text-[10px] font-bold block mb-1">Lead Craftsman / Owner Name *</label>
                        <select
                          value={mappings["owner_name"] || ""}
                          onChange={(e) => setMappings({ ...mappings, owner_name: e.target.value })}
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
                        <label className="text-[10px] font-bold block mb-1">Contact Phone Number *</label>
                        <select
                          value={mappings["phone_number"] || ""}
                          onChange={(e) => setMappings({ ...mappings, phone_number: e.target.value })}
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
                        <label className="text-[10px] font-bold block mb-1">City</label>
                        <select
                          value={mappings["city"] || ""}
                          onChange={(e) => setMappings({ ...mappings, city: e.target.value })}
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
                        <label className="text-[10px] font-bold block mb-1">Coverage Districts (comma separated)</label>
                        <select
                          value={mappings["districts_covered"] || ""}
                          onChange={(e) => setMappings({ ...mappings, districts_covered: e.target.value })}
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
                        <label className="text-[10px] font-bold block mb-1">Services Offered (comma separated IDs)</label>
                        <select
                          value={mappings["services_offered"] || ""}
                          onChange={(e) => setMappings({ ...mappings, services_offered: e.target.value })}
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
                    </div>
                  </div>

                  {/* Live Preview Table */}
                  <div className="max-h-44 overflow-y-auto rounded-xl border border-border bg-background p-2 text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-muted font-bold text-[10px] uppercase text-muted-foreground border-b">
                        <tr>
                          <th className="p-2">#</th>
                          <th className="p-2">Business</th>
                          <th className="p-2">Owner</th>
                          <th className="p-2">Phone</th>
                          <th className="p-2">City</th>
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
                              <td className="p-2 font-bold">{rowObj[mappings["business_name"]] || "—"}</td>
                              <td className="p-2">{rowObj[mappings["owner_name"]] || "—"}</td>
                              <td className="p-2 font-mono">{rowObj[mappings["phone_number"]] || "—"}</td>
                              <td className="p-2">{rowObj[mappings["city"]] || "Chennai"}</td>
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
                      <Play className="h-4 w-4" /> Import {csvData.length} Carpenters Now
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit & Connect Services/Districts Modal */}
      <AnimatePresence>
        {editingVendor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border w-full max-w-xl rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-bold text-base">
                  {editingVendor.business_name ? `Manage Carpenter: ${editingVendor.business_name}` : "Add New Carpenter"}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingVendor(null)}
                  className="rounded-full p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="flex border-b border-border text-xs font-bold gap-4">
                <button
                  onClick={() => setActiveEditTab("profile")}
                  className={`pb-2 border-b-2 cursor-pointer transition ${
                    activeEditTab === "profile" ? "border-amber-500 text-amber-500" : "border-transparent text-muted-foreground"
                  }`}
                >
                  Profile & Contact
                </button>
                <button
                  onClick={() => setActiveEditTab("areas")}
                  className={`pb-2 border-b-2 cursor-pointer transition ${
                    activeEditTab === "areas" ? "border-amber-500 text-amber-500" : "border-transparent text-muted-foreground"
                  }`}
                >
                  Coverage Districts ({editForm.districts_covered.length})
                </button>
                <button
                  onClick={() => setActiveEditTab("services")}
                  className={`pb-2 border-b-2 cursor-pointer transition ${
                    activeEditTab === "services" ? "border-amber-500 text-amber-500" : "border-transparent text-muted-foreground"
                  }`}
                >
                  Connected Services ({editForm.services_offered.length})
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); editMutation.mutate(editForm); }} className="space-y-4">
                {activeEditTab === "profile" && (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase block mb-1">Business Name *</label>
                        <input
                          required
                          value={editForm.business_name}
                          onChange={(e) => setEditForm({ ...editForm, business_name: e.target.value })}
                          className={fieldCls}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase block mb-1">Owner / Craftsman *</label>
                        <input
                          required
                          value={editForm.owner_name}
                          onChange={(e) => setEditForm({ ...editForm, owner_name: e.target.value })}
                          className={fieldCls}
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase block mb-1">Phone Number *</label>
                        <input
                          required
                          value={editForm.phone_number}
                          onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                          className={fieldCls}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase block mb-1">UPI Payout ID *</label>
                        <input
                          required
                          value={editForm.upi_payout_id}
                          onChange={(e) => setEditForm({ ...editForm, upi_payout_id: e.target.value })}
                          className={fieldCls}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase block mb-1">Workshop Address *</label>
                      <input
                        required
                        value={editForm.workshop_address}
                        onChange={(e) => setEditForm({ ...editForm, workshop_address: e.target.value })}
                        className={fieldCls}
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase block mb-1">Primary City *</label>
                        <input
                          required
                          value={editForm.city}
                          onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                          className={fieldCls}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase block mb-1">State *</label>
                        <input
                          required
                          value={editForm.state}
                          onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                          className={fieldCls}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeEditTab === "areas" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>Select Tamil Nadu Districts Covered:</span>
                      <div className="flex gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, districts_covered: TAMIL_NADU_DISTRICTS })}
                          className="text-amber-500 underline cursor-pointer"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, districts_covered: [] })}
                          className="text-red-500 underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1">
                      {TAMIL_NADU_DISTRICTS.map((dist) => {
                        const isChecked = editForm.districts_covered.includes(dist);
                        return (
                          <button
                            key={dist}
                            type="button"
                            onClick={() => {
                              const next = isChecked
                                ? editForm.districts_covered.filter((d) => d !== dist)
                                : [...editForm.districts_covered, dist];
                              setEditForm({ ...editForm, districts_covered: next });
                            }}
                            className={`p-2 rounded-xl text-left text-xs font-semibold cursor-pointer border transition ${
                              isChecked
                                ? "bg-amber-500/10 border-amber-500 text-amber-500"
                                : "bg-card border-border text-muted-foreground"
                            }`}
                          >
                            {dist} {isChecked && "✓"}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeEditTab === "services" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>Check Doorstep Services Offered by Carpenter:</span>
                      <span className="text-[10px] text-muted-foreground">
                        {editForm.services_offered.length} selected
                      </span>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto p-1 border rounded-xl bg-background">
                      {allServices.map((svc: any) => {
                        const isChecked = editForm.services_offered.includes(svc.id);
                        return (
                          <div
                            key={svc.id}
                            onClick={() => {
                              const next = isChecked
                                ? editForm.services_offered.filter((id) => id !== svc.id)
                                : [...editForm.services_offered, svc.id];
                              setEditForm({ ...editForm, services_offered: next });
                            }}
                            className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition text-xs ${
                              isChecked ? "bg-emerald-500/10 border-emerald-500" : "border-border hover:bg-muted"
                            }`}
                          >
                            <div>
                              <p className="font-bold text-foreground">{svc.name}</p>
                              <p className="text-[10px] text-muted-foreground">{svc.category}</p>
                            </div>
                            <CheckCircle2 className={`h-4 w-4 ${isChecked ? "text-emerald-500" : "text-muted-foreground/30"}`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-3 border-t border-border">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingVendor(null)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={editMutation.isPending}
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs cursor-pointer"
                  >
                    {editMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Carpenter & Connections
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
                Are you sure you want to delete <strong className="text-foreground">{selectedIds.size}</strong> selected carpenters/stores?
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
                  Delete {selectedIds.size} Carpenters
                </Button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
