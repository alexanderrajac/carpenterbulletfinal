import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listPublicVendorReels, listPublicVendorPosts } from "@/lib/vendor.functions";
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
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/reels")({
  head: () => ({ meta: [{ title: "Admin — Manage WoodReels & Feeds | CarpenterBullet" }] }),
  component: AdminReelsPage,
});

function AdminReelsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"reels" | "posts">("reels");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: reels, isLoading: reelsLoading } = useQuery({
    queryKey: ["admin-reels-list"],
    queryFn: () => listPublicVendorReels(),
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ["admin-posts-list"],
    queryFn: () => listPublicVendorPosts(),
  });

  // Local state for deleted items
  const [deletedIds, setDeletedIds] = useState<Record<string, boolean>>({});

  const handleDelete = (id: string, type: "reel" | "post") => {
    if (confirm(`Are you sure you want to remove this ${type}?`)) {
      setDeletedIds((prev) => ({ ...prev, [id]: true }));
      toast.success(`${type === "reel" ? "WoodReel" : "Work Post"} removed successfully.`);
    }
  };

  const filteredReels = (reels ?? [])
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Flame className="h-6 w-6 text-amber-500 fill-amber-500 animate-pulse" />
            WoodReels & Work Feed Control Panel
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage, moderate, and feature live carpentry video reels and craftsmen photo posts across CarpenterBullet.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/reels"
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 px-4 py-2 text-xs font-bold shadow-md transition"
          >
            <Plus className="h-4 w-4" /> Upload Reel as Admin
          </Link>
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

      {/* Search & Filter Bar */}
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
            <Video className="h-4 w-4" /> Carpentry Video Reels ({filteredReels.length})
          </button>
          <button
            onClick={() => setActiveTab("posts")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "posts"
                ? "bg-amber-500 text-zinc-950 shadow-sm"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Image className="h-4 w-4" /> Photo Work Posts ({filteredPosts.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, shop, city..."
            className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Content Grid */}
      {activeTab === "reels" ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredReels.map((reel: any) => (
            <div
              key={reel.id}
              className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[9/16] bg-black max-h-[280px] overflow-hidden group">
                  <video
                    src={reel.video_url}
                    poster={reel.thumbnail_url}
                    muted
                    controls
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 z-10">
                    <span className="bg-amber-500 text-zinc-950 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                      Reel ID: {reel.id.slice(0, 8)}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground line-clamp-1">
                      {reel.business_name}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">
                      Verified Shop
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-foreground line-clamp-2 leading-snug">
                    {reel.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-normal">
                    {reel.caption}
                  </p>

                  <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground pt-1">
                    <span className="flex items-center gap-1 text-red-500">
                      <Heart className="h-3.5 w-3.5 fill-red-500" /> {reel.applauds_count}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-500">
                      <Phone className="h-3.5 w-3.5" /> {reel.phone_number}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-border/40 flex items-center justify-between mt-3">
                <span className="text-[10px] text-muted-foreground">
                  City: {reel.city}, {reel.state}
                </span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(reel.id, "reel")}
                  className="rounded-xl text-xs py-1 px-3 h-8 cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete Reel
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post: any) => (
            <div
              key={post.id}
              className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {post.image_urls && post.image_urls.length > 0 && (
                  <div className="relative aspect-video bg-zinc-950 overflow-hidden">
                    <img src={post.image_urls[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground line-clamp-1">
                      {post.business_name}
                    </span>
                    <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      Club Member
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-foreground line-clamp-2 leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-normal">
                    {post.content}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-border/40 flex items-center justify-between mt-3">
                <span className="text-[10px] text-muted-foreground">
                  City: {post.city}, {post.state}
                </span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(post.id, "post")}
                  className="rounded-xl text-xs py-1 px-3 h-8 cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete Post
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
