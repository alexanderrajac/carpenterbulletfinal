import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  MapPin,
  List,
  Map as MapIcon,
  Phone,
  MessageSquare,
  Star,
  CheckCircle2,
  ShieldCheck,
  Search,
  Filter,
  Wrench,
  ShoppingBag,
  Store,
  UserCheck,
  Zap,
  ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/map")({
  component: LocalMapDiscoveryPage,
});

function LocalMapDiscoveryPage() {
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filters = ["All", "Carpenters", "Furniture Makers", "Hardware Stores"];

  useEffect(() => {
    fetchVendors();
  }, [selectedFilter, availableOnly]);

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from("vendor_profiles").select("*").eq("is_approved", true);

      if (availableOnly) {
        query = query.eq("availability_status", "AVAILABLE");
      }

      const { data, error } = await query;
      if (!error && data) {
        setVendors(data);
      }
    } catch (err) {
      console.error("Fetch vendors error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredVendors = vendors.filter((v) => {
    const query = searchQuery.toLowerCase();
    return (
      v.business_name?.toLowerCase().includes(query) ||
      v.city?.toLowerCase().includes(query) ||
      v.owner_name?.toLowerCase().includes(query)
    );
  });

  const handleLeadClick = async (type: "call" | "whatsapp", vendorPhone: string, vendorId: string) => {
    try {
      await supabase.from("lead_events").insert({
        event_type: type,
        vendor_id: vendorId,
        customer_phone: "",
        city: "Chennai",
      });

      if (type === "whatsapp") {
        window.open(`https://wa.me/91${vendorPhone}?text=Hi!%20I%20found%20your%20listing%20on%20CarpenterBullet%20Local%20Map%20and%20need%20a%20carpenter.`, "_blank");
      } else {
        window.location.href = `tel:${vendorPhone}`;
      }
    } catch (e) {
      console.error("Lead click error:", e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* Top Search & Filter Bar */}
      <div className="bg-slate-900 text-white py-8 px-4 border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Local Map & Provider Discovery
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1">
                Find Nearby Carpenters & Hardware
              </h1>
            </div>

            {/* List / Map View Toggle */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 w-fit">
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === "list" ? "bg-amber-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                <List className="w-4 h-4" /> List View
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === "map" ? "bg-amber-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                <MapIcon className="w-4 h-4" /> Map View
              </button>
            </div>
          </div>

          {/* Search Input & Available Now Toggle */}
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search carpenter name, area (e.g. Ambattur, Kanchipuram)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-2.5 text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              onClick={() => setAvailableOnly(!availableOnly)}
              className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all w-full md:w-auto justify-center ${
                availableOnly
                  ? "bg-emerald-600/20 border-emerald-500 text-emerald-400"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600"
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${availableOnly ? "text-emerald-400 fill-emerald-400" : "text-slate-400"}`} />
              Available Now Only
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">Loading map provider data...</div>
        ) : viewMode === "map" ? (
          /* Map View Container Mock & Provider Pins */
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-2xl relative min-h-[500px] flex flex-col justify-between overflow-hidden">
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between bg-slate-800/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700/80">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <MapPin className="w-4 h-4" /> Chennai & Kanchipuram District Sector Grid
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                showing {filteredVendors.length} active nodes
              </span>
            </div>

            {/* Simulated Map Markers Grid */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-8">
              {filteredVendors.map((v, i) => (
                <div
                  key={v.id}
                  className="p-4 rounded-2xl bg-slate-800/90 backdrop-blur-md border border-slate-700 shadow-xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      MAP PIN #{i + 1}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      v.availability_status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'
                    }`}>
                      ● {v.availability_status || 'AVAILABLE'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <img
                      src={v.avatar_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"}
                      alt={v.business_name}
                      className="w-10 h-10 rounded-full object-cover border border-amber-500"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-white flex items-center gap-1">
                        {v.business_name}
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      </h4>
                      <p className="text-xs text-slate-400">{v.city} • {v.owner_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
                    <button
                      onClick={() => handleLeadClick("whatsapp", v.phone_number, v.id)}
                      className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" /> WhatsApp
                    </button>
                    <button
                      onClick={() => handleLeadClick("call", v.phone_number, v.id)}
                      className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1"
                    >
                      <Phone className="w-3 h-3" /> Call
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative z-10 text-center text-xs text-slate-400">
              Click any provider marker above to connect directly via Call or WhatsApp.
            </div>
          </div>
        ) : (
          /* List View Provider Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map((v) => (
              <div
                key={v.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                      {v.verification_badge || "VERIFIED"}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      v.availability_status === 'AVAILABLE' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      ● {v.availability_status || "AVAILABLE"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <img
                      src={v.avatar_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"}
                      alt={v.business_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-amber-500 shadow-sm"
                    />
                    <div>
                      <h3 className="font-bold text-base line-clamp-1 flex items-center gap-1.5">
                        {v.business_name}
                        <UserCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      </h3>
                      <p className="text-xs text-slate-500">{v.owner_name} • {v.city}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {v.bio || "Specialist in doorstep carpentry, door repair, wardrobe fitting, and custom woodwork."}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <span className="text-slate-400 block text-[9px] font-semibold">CARPENTER SCORE</span>
                      <span className="font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {v.carpenter_score || 4.8} / 5.0
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <span className="text-slate-400 block text-[9px] font-semibold">JOBS DONE</span>
                      <span className="font-extrabold">{v.completed_jobs_count || 12}+ Jobs</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLeadClick("whatsapp", v.phone_number, v.id)}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                    </button>
                    <button
                      onClick={() => handleLeadClick("call", v.phone_number, v.id)}
                      className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call Now
                    </button>
                  </div>

                  <Link
                    to="/carpenter/$id"
                    params={{ id: v.id }}
                    className="block text-center text-xs font-bold text-slate-500 hover:text-amber-600 pt-1"
                  >
                    View Storefront Profile →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
