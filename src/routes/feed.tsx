import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listPublicVendorPosts } from "@/lib/vendor.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  Phone,
  Heart,
  Share2,
  Sparkles,
  Award,
  Store,
  MessageCircle,
  MapPin,
  Flame,
  Search,
  CheckCircle2,
  Bookmark,
  Plus,
  X,
  Upload,
  Lock,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const postsQO = queryOptions({
  queryKey: ["public-vendor-posts"],
  queryFn: () => listPublicVendorPosts(),
});

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "Craftsmen Work Feed — Instagram-Style Project Showcase | CarpenterBullet" },
      {
        name: "description",
        content:
          "Explore real-time woodcraft updates, custom furniture photos, and workshop project showcases posted directly by verified master carpenters across India.",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(postsQO);
  },
  component: FeedPage,
});

function FeedPage() {
  const { data: initialPosts } = useSuspenseQuery(postsQO);
  const [postsList, setPostsList] = useState<any[]>(initialPosts);
  const [searchQuery, setSearchQuery] = useState("");
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [userLiked, setUserLiked] = useState<Record<string, boolean>>({});
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinPrompt, setShowJoinPrompt] = useState(false);
  const [isVendor, setIsVendor] = useState(false);
  const [vendorProfile, setVendorProfile] = useState<any>(null);

  // New post form state
  const [newPost, setNewPost] = useState({
    business_name: "",
    owner_name: "",
    phone_number: "",
    city: "",
    state: "Tamil Nadu",
    title: "",
    content: "",
    image_url: "",
    tags_str: "SolidTeak, CustomFurniture",
  });

  // Check if current logged-in user is a registered vendor/store creator
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.session.user.id)
          .then(({ data: roles }) => {
            const roleList = (roles ?? []).map((r) => r.role);
            if (roleList.includes("vendor")) {
              setIsVendor(true);
              supabase
                .from("vendor_profiles")
                .select("*")
                .eq("id", data.session.user.id)
                .maybeSingle()
                .then(({ data: vp }) => {
                  if (vp) {
                    setVendorProfile(vp);
                    setNewPost((prev) => ({
                      ...prev,
                      business_name: vp.business_name || "",
                      owner_name: vp.owner_name || "",
                      phone_number: vp.phone_number || "",
                      city: vp.city || "",
                      state: vp.state || "Tamil Nadu",
                    }));
                  }
                });
            }
          });
      }
    });
  }, []);

  const handleCreateButtonClick = () => {
    if (!isVendor) {
      setShowJoinPrompt(true);
    } else {
      setShowCreateModal(true);
    }
  };

  const filteredPosts = postsList.filter((p: any) => {
    const q = searchQuery.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.content?.toLowerCase().includes(q) ||
      p.business_name?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q)
    );
  });

  const toggleLike = (id: string, initialCount: number) => {
    const isLiked = userLiked[id];
    const count = likes[id] ?? initialCount;

    if (isLiked) {
      setUserLiked((prev) => ({ ...prev, [id]: false }));
      setLikes((prev) => ({ ...prev, [id]: count - 1 }));
    } else {
      setUserLiked((prev) => ({ ...prev, [id]: true }));
      setLikes((prev) => ({ ...prev, [id]: count + 1 }));
    }
  };

  const toggleBookmark = (id: string) => {
    setBookmarked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePublishPost = (e: React.FormEvent) => {
    e.preventDefault();
    const createdPost = {
      id: `post-user-${Date.now()}`,
      vendor_id: vendorProfile?.id || `user-${Date.now()}`,
      business_name: vendorProfile?.business_name || newPost.business_name || "Verified Workshop",
      owner_name: vendorProfile?.owner_name || newPost.owner_name || "Master Craftsman",
      city: vendorProfile?.city || newPost.city || "Madurai",
      state: vendorProfile?.state || newPost.state || "Tamil Nadu",
      phone_number: vendorProfile?.phone_number || newPost.phone_number || "+91 98421 00000",
      avatar_url: vendorProfile?.avatar_url || null,
      title: newPost.title,
      content: newPost.content,
      image_urls: [
        newPost.image_url || "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=1200&q=80",
      ],
      tags: newPost.tags_str.split(",").map((s) => s.trim()),
      applauds_count: 1,
      created_at: new Date().toISOString(),
    };

    setPostsList([createdPost, ...postsList]);
    setShowCreateModal(false);
    toast.success("📸 Work post published live on the Craftsmen Work Feed!");
  };

  const fieldCls =
    "w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20";

  return (
    <div className="bg-zinc-950 text-white min-h-screen py-6 select-none font-sans">
      <div className="mx-auto max-w-xl px-4">
        {/* Top Header */}
        <div className="flex items-center justify-between py-3 mb-4 border-b border-zinc-800">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display font-black text-xl tracking-tight text-amber-500 flex items-center gap-1">
              <Flame className="h-5 w-5 fill-amber-500 text-amber-500 animate-pulse" />
              CarpenterBullet
            </span>
            <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
              Work Feed
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateButtonClick}
              className="flex items-center gap-1.5 text-xs font-bold text-zinc-950 bg-amber-500 hover:bg-amber-400 px-3.5 py-1.5 rounded-full transition shadow-md cursor-pointer active:scale-95"
            >
              <Plus className="h-4 w-4" /> Create Post
            </button>
            <Link
              to="/reels"
              className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-amber-400 px-3.5 py-1.5 text-xs font-bold transition shadow-md"
            >
              🎥 Reels
            </Link>
          </div>
        </div>

        {/* Non-Vendor Creator Lock Prompt Modal */}
        <AnimatePresence>
          {showJoinPrompt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-zinc-950 border border-amber-500/30 rounded-3xl p-6 text-center max-w-sm w-full space-y-4 shadow-2xl"
              >
                <div className="mx-auto h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                  <Lock className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-white">Registered Stores Only</h3>
                  <p className="text-xs text-zinc-300 mt-2 leading-relaxed font-light">
                    Only registered workshop owners & master craftsmen can publish WoodReels and project posts. Open your digital shop to start posting work photos and receiving direct phone calls!
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    to="/join-carpenter"
                    onClick={() => setShowJoinPrompt(false)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3 text-xs shadow-lg transition active:scale-95"
                  >
                    <Store className="h-4 w-4" /> Register Workshop & Join Club
                  </Link>
                  <button
                    onClick={() => setShowJoinPrompt(false)}
                    className="text-xs text-zinc-400 hover:text-white py-1"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Create Post Modal (Registered Store Owners) */}
        <AnimatePresence>
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 text-white"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-amber-500" />
                    <h3 className="font-bold text-base">Publish Work Photo Post</h3>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {vendorProfile && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-center gap-3 text-xs">
                    <Store className="h-5 w-5 text-amber-500 shrink-0" />
                    <div>
                      <span className="font-bold text-amber-400 block">{vendorProfile.business_name}</span>
                      <span className="text-[10px] text-zinc-400">Verified Workshop • Tel: {vendorProfile.phone_number}</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handlePublishPost} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Project Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      placeholder="e.g. 9ft Teakwood Carved Main Entrance Door"
                      className={fieldCls}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Description & Joinery Details *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      placeholder="Describe wood finish, dimensions, lock fittings..."
                      className={fieldCls}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Photo Image URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={newPost.image_url}
                      onChange={(e) => setNewPost({ ...newPost, image_url: e.target.value })}
                      placeholder="https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf"
                      className={fieldCls}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Tags (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={newPost.tags_str}
                      onChange={(e) => setNewPost({ ...newPost, tags_str: e.target.value })}
                      placeholder="SolidTeak, CustomDoors"
                      className={fieldCls}
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-1.5"
                    >
                      📸 Publish Post Live
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Instagram Stories / Registered Workshop Spotlight Bar */}
        <div className="mb-6 overflow-x-auto no-scrollbar py-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-4">
            {postsList.map((p: any) => (
              <Link
                key={p.id}
                to="/carpenter/$id"
                params={{ id: p.vendor_id || "1" }}
                className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
              >
                <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-500 via-emerald-500 to-amber-300 group-hover:scale-105 transition duration-200">
                  <div className="h-14 w-14 rounded-full bg-zinc-900 border-2 border-zinc-950 overflow-hidden flex items-center justify-center font-bold text-amber-400">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Store className="h-6 w-6" />
                    )}
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-zinc-300 group-hover:text-amber-400 truncate max-w-[70px]">
                  {p.business_name.split(" ")[0]}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search custom furniture, wood species, city..."
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 py-2.5 pl-10 pr-4 text-xs text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
          />
        </div>

        {/* Feed Posts (Instagram Post Cards) */}
        <div className="space-y-8">
          {filteredPosts.map((post: any, idx: number) => {
            const isLiked = userLiked[post.id];
            const count = likes[post.id] ?? post.applauds_count;
            const isSaved = bookmarked[post.id];

            return (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-3xl border border-zinc-800 bg-zinc-900/90 overflow-hidden shadow-xl"
              >
                {/* Instagram Header */}
                <div className="p-4 flex items-center justify-between border-b border-zinc-800/60">
                  <div className="flex items-center gap-3">
                    <Link to="/carpenter/$id" params={{ id: post.vendor_id || "1" }}>
                      <div className="h-10 w-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 overflow-hidden">
                        {post.avatar_url ? (
                          <img src={post.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Store className="h-5 w-5" />
                        )}
                      </div>
                    </Link>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Link
                          to="/carpenter/$id"
                          params={{ id: post.vendor_id || "1" }}
                          className="font-bold text-sm text-white hover:text-amber-400 transition"
                        >
                          {post.business_name}
                        </Link>
                        <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 fill-amber-400/20" />
                      </div>
                      <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-amber-500" />
                        {post.city}, {post.state}
                      </p>
                    </div>
                  </div>

                  <a
                    href={`tel:${post.phone_number}`}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs px-3 py-1.5 transition shadow-sm"
                  >
                    <Phone className="h-3.5 w-3.5 fill-zinc-950" /> Call Tel
                  </a>
                </div>

                {/* Main Post Image */}
                {post.image_urls && post.image_urls.length > 0 && (
                  <div className="relative aspect-square sm:aspect-[4/3] bg-black overflow-hidden">
                    <img
                      src={post.image_urls[0]}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Instagram Action Icons Row */}
                <div className="p-4 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleLike(post.id, post.applauds_count)}
                      className="flex items-center gap-1.5 text-white transition active:scale-75"
                    >
                      <Heart
                        className={`h-6 w-6 ${
                          isLiked ? "fill-red-500 text-red-500" : "text-zinc-300 hover:text-white"
                        }`}
                      />
                    </button>

                    <a
                      href={`https://wa.me/${post.phone_number?.replace(/\D/g, "")}?text=Hi%20${encodeURIComponent(
                        post.business_name
                      )},%20I%20saw%20your%20project%20post%20on%20CarpenterBullet:%20${encodeURIComponent(
                        post.title
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-300 hover:text-white transition active:scale-90"
                    >
                      <MessageCircle className="h-6 w-6 text-green-500" />
                    </a>

                    <a
                      href={`tel:${post.phone_number}`}
                      className="text-emerald-400 hover:text-emerald-300 transition active:scale-90"
                      title="Call Workshop Tel"
                    >
                      <Phone className="h-5 w-5" />
                    </a>
                  </div>

                  <button
                    onClick={() => toggleBookmark(post.id)}
                    className="text-zinc-300 hover:text-white transition active:scale-90"
                  >
                    <Bookmark
                      className={`h-6 w-6 ${isSaved ? "fill-amber-400 text-amber-400" : ""}`}
                    />
                  </button>
                </div>

                {/* Likes Counter */}
                <div className="px-4 text-xs font-bold text-white">
                  {count} Applauds & Likes
                </div>

                {/* Title & Caption */}
                <div className="p-4 pt-2 space-y-2">
                  <p className="text-xs text-zinc-200 leading-relaxed font-light">
                    <span className="font-bold text-white mr-2">{post.business_name}</span>
                    <span className="font-bold text-amber-400 block mb-1">{post.title}</span>
                    {post.content}
                  </p>

                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    {(post.tags || []).map((tag: string) => (
                      <span key={tag} className="text-[10px] font-semibold text-amber-400">
                        #{tag}{" "}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
