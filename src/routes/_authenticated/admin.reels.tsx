import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listPublicVendorReels, listPublicVendorPosts } from "@/lib/vendor.functions";
import { uploadMediaFile } from "@/lib/product-images";
import {
  Flame,
  Trash2,
  Sparkles,
  Award,
  Phone,
  Plus,
  Eye,
  CheckCircle2,
  Heart,
  MessageCircle,
  Video,
  Image,
  RefreshCw,
  Search,
  Upload,
  X,
  Loader2,
  Store,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/_authenticated/admin/reels")({
  head: () => ({ meta: [{ title: "Admin — Manage WoodReels & Feeds | CarpenterBullet" }] }),
  component: AdminReelsPage,
});

function AdminReelsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"reels" | "posts">("reels");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdminUploadModal, setShowAdminUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Admin reel creation form state
  const [adminReel, setAdminReel] = useState({
    business_name: "Sri Royal Teakwood Works",
    owner_name: "Master Ramesh",
    phone_number: "+91 98421 88210",
    city: "Madurai",
    state: "Tamil Nadu",
    title: "",
    caption: "",
    video_url: "",
    tags_str: "Teakwood, Carving, Woodworking",
  });

  const { data: reels, isLoading: reelsLoading, refetch: refetchReels } = useQuery({
    queryKey: ["admin-reels-list"],
    queryFn: () => listPublicVendorReels(),
  });

  const { data: posts, isLoading: postsLoading, refetch: refetchPosts } = useQuery({
    queryKey: ["admin-posts-list"],
    queryFn: () => listPublicVendorPosts(),
  });

  // Local state for items added / deleted by admin
  const [customReels, setCustomReels] = useState<any[]>([]);
  const [deletedIds, setDeletedIds] = useState<Record<string, boolean>>({});
  const [featuredIds, setFeaturedIds] = useState<Record<string, boolean>>({});

  const handleDelete = (id: string, type: "reel" | "post") => {
    if (confirm(`Are you sure you want to remove this ${type}?`)) {
      setDeletedIds((prev) => ({ ...prev, [id]: true }));
      toast.success(`${type === "reel" ? "WoodReel" : "Work Post"} removed successfully.`);
    }
  };

  const toggleFeature = (id: string) => {
    const next = !featuredIds[id];
    setFeaturedIds((prev) => ({ ...prev, [id]: next }));
    toast.success(next ? "Marked as Featured Reel!" : "Unmarked Featured");
  };

  const handleVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    toast.info("Uploading video to Cloudinary...");
    try {
      const url = await uploadMediaFile(file, "woodreels");
      setAdminReel((prev) => ({ ...prev, video_url: url }));
      toast.success("✅ Video uploaded to Cloudinary!");
    } catch (err) {
      toast.error("Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAdminPublish = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry = {
      id: `admin-reel-${Date.now()}`,
      vendor_id: `admin-${Date.now()}`,
      business_name: adminReel.business_name,
      owner_name: adminReel.owner_name,
      phone_number: adminReel.phone_number,
      city: adminReel.city,
      state: adminReel.state,
      title: adminReel.title,
      caption: adminReel.caption,
      video_url: adminReel.video_url || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      thumbnail_url: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80",
      tags: adminReel.tags_str.split(",").map((s) => s.trim()),
      applauds_count: 500,
      created_at: new Date().toISOString(),
    };

    setCustomReels([newEntry, ...customReels]);
    setShowAdminUploadModal(false);
    toast.success("🚀 Admin Reel published live to WoodReels!");
  };

  const allReelsList = [...customReels, ...(reels ?? [])];

  const filteredReels = allReelsList
    .filter((r: any) => !deletedIds[r.id])
    .filter((r: any) => {
      const q = searchQuery.toLowerCase();
      return (
        r.title?.toLowerCase().includes(q) ||
        r.business_name?.toLowerCase().includes(q) ||
        r.city?.toLowerCase().includes(q)
      );
    });

  const filteredPosts = (posts ?? [])
    .filter((p: any) => !deletedIds[p.id])
    .filter((p: any) => {
      const q = searchQuery.toLowerCase();
      return (
        p.title?.toLowerCase().includes(q) ||
        p.business_name?.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q)
      );
    });

  const fieldCls =
    "w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-amber-500/20";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Flame className="h-6 w-6 text-amber-500 fill-amber-500 animate-pulse" />
            WoodReels & Work Feed Control Dashboard
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage, publish, feature, and moderate all carpentry short video reels and artisan project posts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowAdminUploadModal(true)}
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md gap-1.5"
          >
            <Plus className="h-4 w-4" /> Upload Reel as Admin
          </Button>
          <Link
            to="/reels"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 px-3.5 py-2 text-xs font-bold hover:bg-amber-500/20 transition"
          >
            <Eye className="h-4 w-4" /> Live WoodReels
          </Link>
          <Link
            to="/feed"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl bg-card border border-border px-3.5 py-2 text-xs font-bold hover:bg-accent transition"
          >
            <Eye className="h-4 w-4" /> Live Work Feed
          </Link>
        </div>
      </div>

      {/* Direct Admin Reel Upload Modal */}
      <AnimatePresence>
        {showAdminUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 text-foreground"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-amber-500" />
                  <h3 className="font-bold text-base">Admin Upload WoodReel</h3>
                </div>
                <button onClick={() => setShowAdminUploadModal(false)} className="p-1 rounded-full text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAdminPublish} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider block mb-1">Workshop / Store Name</label>
                    <input
                      type="text"
                      required
                      value={adminReel.business_name}
                      onChange={(e) => setAdminReel({ ...adminReel, business_name: e.target.value })}
                      className={fieldCls}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider block mb-1">Craftsman Name</label>
                    <input
                      type="text"
                      required
                      value={adminReel.owner_name}
                      onChange={(e) => setAdminReel({ ...adminReel, owner_name: e.target.value })}
                      className={fieldCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider block mb-1">Workshop Phone Tel</label>
                    <input
                      type="tel"
                      required
                      value={adminReel.phone_number}
                      onChange={(e) => setAdminReel({ ...adminReel, phone_number: e.target.value })}
                      className={fieldCls}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider block mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={adminReel.city}
                      onChange={(e) => setAdminReel({ ...adminReel, city: e.target.value })}
                      className={fieldCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1">Reel Title *</label>
                  <input
                    type="text"
                    required
                    value={adminReel.title}
                    onChange={(e) => setAdminReel({ ...adminReel, title: e.target.value })}
                    placeholder="e.g. Teakwood Temple Door Fitting Demo 🪵⚡"
                    className={fieldCls}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1">Caption / Story</label>
                  <textarea
                    rows={2}
                    value={adminReel.caption}
                    onChange={(e) => setAdminReel({ ...adminReel, caption: e.target.value })}
                    placeholder="Watch live wood carving timelapse..."
                    className={fieldCls}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1">📹 Video File Upload (Cloudinary)</label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileSelect}
                      disabled={isUploading}
                      className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-zinc-950 hover:file:bg-amber-400 cursor-pointer"
                    />
                    {isUploading && <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />}
                  </div>
                  <input
                    type="url"
                    required
                    value={adminReel.video_url}
                    onChange={(e) => setAdminReel({ ...adminReel, video_url: e.target.value })}
                    placeholder="Or paste video MP4 URL"
                    className={fieldCls}
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-border">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAdminUploadModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs">
                    🚀 Publish Live
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("reels")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "reels"
                ? "bg-amber-500 text-zinc-950 shadow-sm"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Video className="h-4 w-4" /> WoodReels ({filteredReels.length})
          </button>
          <button
            onClick={() => setActiveTab("posts")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "posts"
                ? "bg-amber-500 text-zinc-950 shadow-sm"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Image className="h-4 w-4" /> Work Posts ({filteredPosts.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by title, shop name, city..."
            className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-xs outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </div>

      {/* Grid Display */}
      {activeTab === "reels" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReels.map((reel: any) => {
            const isFeat = featuredIds[reel.id];
            return (
              <div
                key={reel.id}
                className="group relative rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="relative aspect-[9/16] max-h-80 bg-zinc-950 overflow-hidden">
                  <video src={reel.video_url} poster={reel.thumbnail_url} className="w-full h-full object-cover" muted />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                  
                  {isFeat && (
                    <span className="absolute top-3 left-3 bg-amber-500 text-zinc-950 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Featured Reel
                    </span>
                  )}

                  <div className="absolute bottom-3 left-3 right-3 text-white space-y-1">
                    <h4 className="font-bold text-xs line-clamp-1">{reel.title}</h4>
                    <p className="text-[10px] text-zinc-300 flex items-center gap-1">
                      <Store className="h-3 w-3 text-amber-400" /> {reel.business_name} • {reel.city}
                    </p>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between bg-card border-t border-border">
                  <button
                    onClick={() => toggleFeature(reel.id)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                      isFeat ? "bg-amber-500/10 text-amber-500 border-amber-500/30" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isFeat ? "Featured ✓" : "Feature"}
                  </button>

                  <button
                    onClick={() => handleDelete(reel.id, "reel")}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition"
                    title="Delete Reel"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post: any) => (
            <div key={post.id} className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm flex flex-col justify-between">
              {post.image_urls?.[0] && (
                <div className="aspect-video bg-muted overflow-hidden">
                  <img src={post.image_urls[0]} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4 space-y-2">
                <h4 className="font-bold text-xs line-clamp-1">{post.title}</h4>
                <p className="text-[11px] text-muted-foreground line-clamp-2">{post.content}</p>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-[10px] font-bold text-amber-500">{post.business_name}</span>
                  <button onClick={() => handleDelete(post.id, "post")} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
