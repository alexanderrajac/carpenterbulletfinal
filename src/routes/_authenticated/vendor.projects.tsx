import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Layers,
  Plus,
  Image as ImageIcon,
  MapPin,
  IndianRupee,
  Clock,
  Sparkles,
  CheckCircle2,
  Trash2,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/vendor/projects")({
  component: VendorProjectsPage,
});

function VendorProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Cupboard & Drawer",
    city: "Chennai",
    area: "Ambattur",
    beforeImageUrl: "",
    afterImageUrl: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
    durationDays: 3,
    priceRangeText: "₹25,000 - ₹35,000",
    materialsUsedText: "Greenply Plywood, Hettich Soft-Close Hinges",
  });

  const categories = [
    "Cupboard & Drawer",
    "Wooden Door",
    "Modular Kitchen",
    "Furniture Assembly",
    "Furniture Repair",
    "Shelf & Cabinet",
  ];

  useEffect(() => {
    fetchMyProjects();
  }, []);

  const fetchMyProjects = async () => {
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) return;

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("vendor_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setProjects(data);
      }
    } catch (err) {
      console.error("Fetch projects error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.afterImageUrl) {
      toast.error("Please enter project title and completed after photo URL.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) {
        toast.error("User not authenticated.");
        return;
      }

      const slug = `${form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-4)}`;
      const materialsArray = form.materialsUsedText.split(",").map((m) => m.trim()).filter(Boolean);

      const { error } = await supabase.from("projects").insert({
        vendor_id: userData.user.id,
        slug,
        title: form.title,
        description: form.description,
        category: form.category,
        city: form.city,
        area: form.area,
        before_image_url: form.beforeImageUrl || null,
        after_image_url: form.afterImageUrl,
        duration_days: Number(form.durationDays),
        price_range_text: form.priceRangeText,
        materials_used: materialsArray,
        featured: true,
      });

      if (error) throw error;

      toast.success("Project portfolio entry published!");
      setIsAdding(false);
      fetchMyProjects();
    } catch (err: any) {
      console.error("Create project error:", err);
      toast.error(err.message || "Failed to publish project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Portfolio Showcase Manager
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight mt-0.5">
            My Carpentry Projects
          </h1>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
        >
          <Plus className="w-4 h-4" /> {isAdding ? "Cancel" : "Add New Project"}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmitProject} className="bg-card rounded-2xl p-6 border border-border space-y-4 shadow-sm">
          <h2 className="font-bold text-base border-b border-border pb-2">Add New Portfolio Project</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Project Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. 3-Door Teak Wardrobe in Ambattur"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Describe materials, custom fittings, and work duration..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-xl border border-border bg-background p-2.5 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Before Photo URL (Optional)</label>
              <input
                type="text"
                placeholder="https://..."
                value={form.beforeImageUrl}
                onChange={(e) => setForm({ ...form, beforeImageUrl: e.target.value })}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">After (Completed) Photo URL *</label>
              <input
                type="text"
                required
                placeholder="https://..."
                value={form.afterImageUrl}
                onChange={(e) => setForm({ ...form, afterImageUrl: e.target.value })}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Area / Locality</label>
              <input
                type="text"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Cost Range Text</label>
              <input
                type="text"
                placeholder="e.g. ₹20,000 - ₹30,000"
                value={form.priceRangeText}
                onChange={(e) => setForm({ ...form, priceRangeText: e.target.value })}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Materials Used (Comma Separated)</label>
              <input
                type="text"
                placeholder="e.g. Teak Plywood, Hettich Hinges"
                value={form.materialsUsedText}
                onChange={(e) => setForm({ ...form, materialsUsedText: e.target.value })}
                className="w-full rounded-xl border border-border bg-background p-2.5 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Publishing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Publish Project to Portfolio Gallery
              </>
            )}
          </button>
        </form>
      )}

      {/* Projects List */}
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Loading portfolio projects...</div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center border border-dashed rounded-2xl bg-card">
          <Layers className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <h3 className="font-bold text-base">No Portfolio Projects Published Yet</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Showcase your completed wardrobes, door repairs, and custom woodwork to attract more customer leads.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((p) => (
            <div key={p.id} className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm space-y-3 p-4">
              <div className="h-44 rounded-xl overflow-hidden relative bg-slate-800">
                <img src={p.after_image_url} alt={p.title} className="w-full h-full object-cover" />
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold">
                  {p.category}
                </span>
              </div>
              <h3 className="font-bold text-sm line-clamp-1">{p.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/60 font-medium">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-amber-600" /> {p.area}, {p.city}</span>
                <span className="text-emerald-600 font-bold">{p.price_range_text}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
