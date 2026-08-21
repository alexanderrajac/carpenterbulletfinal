import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Search, MapPin, SlidersHorizontal, UserCheck, Store, Wrench, ShoppingBag, ArrowRight, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { listProducts, listPublicVendors } from "@/lib/products.functions";
import { listServices, SERVICE_PRESET_HD_IMAGES } from "@/lib/services.functions";
import { formatPrice } from "@/lib/format";
import { resolveImage } from "@/lib/product-images";

interface SmartSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
}

export function SmartSearchDialog({ open, onOpenChange, initialQuery = "" }: SmartSearchDialogProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<"all" | "carpenters" | "products" | "services" | "vendors">("all");
  const [selectedCity, setSelectedCity] = useState<string>("All Locations");
  const [pincode, setPincode] = useState<string>("");
  const [products, setProducts] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const CITIES = ["All Locations", "Chennai", "Coimbatore", "Madurai", "Bengaluru", "Hyderabad", "Mumbai", "Kochi"];

  useEffect(() => {
    if (open) {
      setQuery(initialQuery);
    }
  }, [open, initialQuery]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const [prodsRes, vendsRes, svcsRes] = await Promise.all([
          listProducts({ data: { search: query.trim() } }),
          listPublicVendors(),
          listServices(),
        ]);

        let filteredVendors = vendsRes;
        if (query.trim()) {
          const qLower = query.toLowerCase();
          filteredVendors = vendsRes.filter(
            (v: any) =>
              v.business_name.toLowerCase().includes(qLower) ||
              v.owner_name.toLowerCase().includes(qLower) ||
              v.city.toLowerCase().includes(qLower)
          );
        }
        if (selectedCity !== "All Locations") {
          filteredVendors = filteredVendors.filter((v: any) => v.city.toLowerCase() === selectedCity.toLowerCase());
        }

        let filteredServices = svcsRes;
        if (query.trim()) {
          const qLower = query.toLowerCase();
          filteredServices = svcsRes.filter(
            (s: any) => s.name.toLowerCase().includes(qLower) || s.category.toLowerCase().includes(qLower)
          );
        }

        setProducts(prodsRes);
        setVendors(filteredVendors);
        setServices(filteredServices);
      } catch (err) {
        console.error("Smart search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [open, query, selectedCity]);

  const handleSelectProduct = (slug: string) => {
    onOpenChange(false);
    navigate({ to: `/product/${slug}` });
  };

  const handleSelectVendor = (id: string) => {
    onOpenChange(false);
    navigate({ to: `/carpenter/${id}` });
  };

  const handleSelectService = (id: string) => {
    onOpenChange(false);
    navigate({ to: `/book-service/${id}` });
  };

  const handleFullSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenChange(false);
    navigate({ to: "/shop", search: { q: query.trim(), category: "all" } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden rounded-3xl border border-border bg-card/98 backdrop-blur-2xl shadow-2xl">
        <DialogTitle className="sr-only">Universal Search</DialogTitle>
        {/* Search Header */}
        <div className="p-4 sm:p-5 border-b border-border/60 bg-muted/30">
          <form onSubmit={handleFullSearch} className="flex items-center gap-3 relative">
            <Search className="h-5 w-5 text-primary shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search wardrobe carpenter, teak dining table, door repair, hardware..."
              className="w-full bg-transparent text-base sm:text-lg font-medium text-foreground outline-none placeholder:text-muted-foreground/70"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="submit"
              className="shrink-0 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all shadow-sm"
            >
              Search <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Location Bar & Quick Filter Pills */}
          <div className="mt-3.5 pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <span className="flex items-center gap-1 font-semibold text-foreground shrink-0">
                <MapPin className="h-3.5 w-3.5 text-primary" /> City:
              </span>
              {CITIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCity(c)}
                  className={`px-2.5 py-1 rounded-lg transition-all shrink-0 font-medium cursor-pointer ${
                    selectedCity === c
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/60 text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <input
                type="text"
                placeholder="PIN code..."
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-24 px-2.5 py-1 rounded-lg border border-border/80 bg-background text-xs outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Result Tabs */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: "all", label: "All Results", icon: SlidersHorizontal },
              { id: "carpenters", label: `Carpenters (${vendors.length})`, icon: UserCheck },
              { id: "products", label: `Products (${products.length})`, icon: ShoppingBag },
              { id: "services", label: `Services (${services.length})`, icon: Wrench },
              { id: "vendors", label: `Shops (${vendors.length})`, icon: Store },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-xs transition-all cursor-pointer shrink-0 ${
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary border border-primary/30 font-bold"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-5 space-y-6">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-xs font-mono animate-pulse">
              Searching database across India...
            </div>
          ) : (
            <>
              {/* Carpenters & Vendors */}
              {(activeTab === "all" || activeTab === "carpenters" || activeTab === "vendors") && vendors.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4 text-primary" /> Verified Carpenters & Workshops
                    </h4>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {vendors.slice(0, activeTab === "all" ? 4 : 10).map((v) => (
                      <div
                        key={v.id}
                        onClick={() => handleSelectVendor(v.id)}
                        className="flex items-center gap-3 p-3 rounded-2xl border border-border/60 bg-muted/20 hover:bg-accent hover:border-primary/40 transition-all cursor-pointer group"
                      >
                        <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 overflow-hidden shrink-0 flex items-center justify-center">
                          {v.avatar_url ? (
                            <img src={resolveImage(v.avatar_url)} alt={v.business_name} className="h-full w-full object-cover" />
                          ) : (
                            <UserCheck className="h-5 w-5 text-amber-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h5 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {v.business_name}
                            </h5>
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              Verified
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">Owner: {v.owner_name} • {v.city}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:translate-x-1 group-hover:text-primary transition-all shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Products */}
              {(activeTab === "all" || activeTab === "products") && products.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <ShoppingBag className="h-4 w-4 text-primary" /> Products & Hardware
                    </h4>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {products.slice(0, activeTab === "all" ? 4 : 10).map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProduct(p.slug)}
                        className="flex items-center gap-3 p-3 rounded-2xl border border-border/60 bg-muted/20 hover:bg-accent hover:border-primary/40 transition-all cursor-pointer group"
                      >
                        <img
                          src={resolveImage(p.image_url, "f_auto,q_auto,w_100")}
                          alt={p.name}
                          className="h-12 w-12 rounded-xl object-cover bg-muted border border-border/40 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {p.name}
                          </h5>
                          <p className="text-xs font-mono font-bold text-primary mt-0.5">{formatPrice(p.price_cents)}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:translate-x-1 group-hover:text-primary transition-all shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Services */}
              {(activeTab === "all" || activeTab === "services") && services.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Wrench className="h-4 w-4 text-primary" /> Carpentry Services & Repair
                    </h4>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {services.slice(0, activeTab === "all" ? 4 : 10).map((s) => {
                      const imgUrl =
                        s.image_url && s.image_url.trim() !== ""
                          ? resolveImage(s.image_url)
                          : SERVICE_PRESET_HD_IMAGES[s.category] ||
                            SERVICE_PRESET_HD_IMAGES["Wooden Door"] ||
                            "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80";

                      return (
                        <div
                          key={s.id}
                          onClick={() => handleSelectService(s.id)}
                          className="flex items-center gap-3 p-3 rounded-2xl border border-border/60 bg-muted/20 hover:bg-accent hover:border-primary/40 transition-all cursor-pointer group"
                        >
                          <img
                            src={imgUrl}
                            alt={s.name}
                            className="h-12 w-12 rounded-xl object-cover bg-zinc-950 border border-border/40 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                              {s.name}
                            </h5>
                            <p className="text-xs text-muted-foreground truncate">
                              {s.category} • Starts {s.starts_at_cents === 0 ? "Free Quote" : formatPrice(s.starts_at_cents)}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:translate-x-1 group-hover:text-primary transition-all shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {products.length === 0 && vendors.length === 0 && services.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="text-sm font-medium">No results found matching "{query}"</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Try searching for "teak table", "door repair", or "wardrobe"</p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
