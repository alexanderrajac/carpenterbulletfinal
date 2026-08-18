import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Sparkles,
  MapPin,
  IndianRupee,
  Clock,
  Star,
  CheckCircle2,
  Wrench,
  Layers,
  ArrowRight,
  Filter,
  UserCheck
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/projects")({
  component: ProjectsPortfolioPage,
});

function ProjectsPortfolioPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Cupboard & Drawer", "Wooden Door", "Modular Kitchen", "Furniture Assembly", "Furniture Repair"];

  useEffect(() => {
    fetchProjects();
  }, [selectedCategory]);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("projects")
        .select("*, vendor_profiles(*)")
        .order("created_at", { ascending: false });

      if (selectedCategory !== "All") {
        query = query.eq("category", selectedCategory);
      }

      const { data, error } = await query;
      if (!error && data) {
        setProjects(data);
      }
    } catch (err) {
      console.error("Fetch projects error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-amber-950 to-slate-900 text-white py-16 px-4 border-b border-amber-900/30">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Real Carpentry Work Showcase
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Carpenter Project Portfolio
          </h1>
          <p className="text-slate-300 text-base max-w-2xl mx-auto">
            Browse verified before & after transformations, custom wardrobes, door installations, and modular kitchen projects built by top local carpenters.
          </p>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? "bg-amber-600 text-white shadow-lg shadow-amber-600/30"
                    : "bg-white/10 text-slate-300 hover:bg-white/20"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-12">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">Loading project gallery...</div>
        ) : projects.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
            <Layers className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-lg font-bold">No Projects Found in Category</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mt-1 mb-6">
              Check back soon as verified carpenters add more completed project photos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projects.map((proj) => {
              const vendor = proj.vendor_profiles;
              return (
                <motion.div
                  key={proj.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-2xl transition-all group"
                >
                  {/* Before / After Image Split Container */}
                  <div className="relative h-64 bg-slate-800 grid grid-cols-2 gap-0.5 overflow-hidden">
                    {proj.before_image_url ? (
                      <div className="relative group/before">
                        <img
                          src={proj.before_image_url}
                          alt="Before Carpentry Work"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white font-extrabold text-[10px] uppercase backdrop-blur-sm">
                          BEFORE
                        </span>
                      </div>
                    ) : null}

                    <div className={`relative ${proj.before_image_url ? "" : "col-span-2"}`}>
                      <img
                        src={proj.after_image_url}
                        alt={proj.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-emerald-600 text-white font-extrabold text-[10px] uppercase shadow-md">
                        AFTER (COMPLETED)
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                        {proj.category}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-600" /> {proj.area}, {proj.city}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
                      {proj.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {proj.description}
                    </p>

                    {/* Metadata Pill Row */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {proj.price_range_text && (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] text-slate-400 block font-semibold">COST RANGE</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{proj.price_range_text}</span>
                        </div>
                      )}
                      {proj.duration_days && (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] text-slate-400 block font-semibold">DURATION</span>
                          <span className="font-bold">{proj.duration_days} Day(s)</span>
                        </div>
                      )}
                    </div>

                    {/* Materials List */}
                    {proj.materials_used && proj.materials_used.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Materials & Brands Used
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {proj.materials_used.map((mat: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium"
                            >
                              {mat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Vendor Profile Link */}
                    {vendor && (
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={vendor.avatar_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"}
                            alt={vendor.business_name}
                            className="w-8 h-8 rounded-full object-cover border border-amber-500"
                          />
                          <div>
                            <span className="text-xs font-bold block flex items-center gap-1">
                              {vendor.business_name}
                              <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                            </span>
                            <span className="text-[10px] text-slate-400">{vendor.owner_name}</span>
                          </div>
                        </div>

                        <Link
                          to="/carpenter/$id"
                          params={{ id: vendor.id }}
                          className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                        >
                          View Storefront <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
