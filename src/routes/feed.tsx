import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listPublicVendorPosts } from "@/lib/vendor.functions";
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
  ArrowLeft,
  Search,
  ThumbsUp,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const postsQO = queryOptions({
  queryKey: ["public-vendor-posts"],
  queryFn: () => listPublicVendorPosts(),
});

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "Craftsmen Work Feed — Project Updates & Photos | CarpenterBullet" },
      {
        name: "description",
        content:
          "Explore real-time woodcraft updates, custom furniture photos, and workshop project showcases posted directly by verified master carpenters across India.",
      },
      { property: "og:title", content: "CarpenterBullet — LinkedIn-Style Woodwork Feed" },
      {
        property: "og:description",
        content: "Discover real carpentry progress, solid wood creations, and call workshops directly.",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(postsQO);
  },
  component: FeedPage,
});

function FeedPage() {
  const { data: posts } = useSuspenseQuery(postsQO);
  const [searchQuery, setSearchQuery] = useState("");
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [userLiked, setUserLiked] = useState<Record<string, boolean>>({});

  const filteredPosts = posts.filter((p: any) => {
    const q = searchQuery.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.content?.toLowerCase().includes(q) ||
      p.business_name?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q)
    );
  });

  const toggleLike = (id: string, initialCount: number) => {
    const currentIsLiked = userLiked[id];
    const currentCount = likes[id] ?? initialCount;

    if (currentIsLiked) {
      setUserLiked((prev) => ({ ...prev, [id]: false }));
      setLikes((prev) => ({ ...prev, [id]: currentCount - 1 }));
    } else {
      setUserLiked((prev) => ({ ...prev, [id]: true }));
      setLikes((prev) => ({ ...prev, [id]: currentCount + 1 }));
    }
  };

  return (
    <div className="bg-wood-pattern min-h-screen py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
          Back to marketplace
        </Link>

        {/* Page Banner */}
        <div className="relative rounded-3xl overflow-hidden border border-border/60 bg-gradient-to-br from-amber-950 via-zinc-900 to-amber-900 text-white p-6 sm:p-10 mb-8 shadow-xl">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3.5 py-1 text-xs font-semibold text-amber-400 tracking-wide uppercase mb-3">
                <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                Live Workshop Feed
              </span>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
                Craftsmen Work Feed
              </h1>
              <p className="mt-2 text-zinc-300 text-xs sm:text-sm max-w-xl font-light leading-relaxed">
                LinkedIn for Master Carpenters. Scroll live project updates, wood carving photos, and workshop progress across India. Call workshops directly with 0% brokerage.
              </p>
            </div>

            <Link
              to="/reels"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-5 py-3 text-xs sm:text-sm shadow-lg transition transform active:scale-95 shrink-0"
            >
              🎥 Watch WoodReels
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8 relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by furniture type, wood species, city, or workshop..."
            className="w-full rounded-2xl border border-border bg-card py-3 pl-11 pr-4 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 shadow-sm"
          />
        </div>

        {/* Feed Posts List */}
        <div className="space-y-6">
          {filteredPosts.map((post: any, idx: number) => {
            const isLiked = userLiked[post.id];
            const count = likes[post.id] ?? post.applauds_count;

            return (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-3xl border border-border bg-card shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Post Header */}
                <div className="p-5 sm:p-6 pb-3 flex items-center justify-between border-b border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 font-bold overflow-hidden shrink-0">
                      {post.avatar_url ? (
                        <img src={post.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Store className="h-6 w-6 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-base text-foreground">
                          {post.business_name}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          <Award className="h-3 w-3" /> Club Member
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-zinc-400" />
                        {post.city}, {post.state} • Master Craftsman: {post.owner_name}
                      </p>
                    </div>
                  </div>

                  <a
                    href={`tel:${post.phone_number}`}
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 transition shadow-sm"
                  >
                    <Phone className="h-3.5 w-3.5" /> Call Shop Tel
                  </a>
                </div>

                {/* Post Content & Title */}
                <div className="p-5 sm:p-6 space-y-3">
                  <h2 className="font-display text-lg font-bold text-foreground leading-snug">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed font-light">
                    {post.content}
                  </p>

                  {/* Post Image Gallery */}
                  {post.image_urls && post.image_urls.length > 0 && (
                    <div className="rounded-2xl overflow-hidden border border-border/60 mt-3 grid gap-2">
                      <img
                        src={post.image_urls[0]}
                        alt={post.title}
                        className="w-full max-h-[420px] object-cover hover:scale-101 transition-transform duration-300"
                      />
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2">
                    {(post.tags || []).map((tag: string) => (
                      <span
                        key={tag}
                        className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Post Footer & Call Actions */}
                <div className="px-5 sm:px-6 py-4 bg-muted/20 border-t border-border/40 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleLike(post.id, post.applauds_count)}
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                        isLiked
                          ? "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400"
                          : "bg-card border-border hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      <ThumbsUp className={`h-4 w-4 ${isLiked ? "fill-amber-500" : ""}`} />
                      <span>{count} Applauds</span>
                    </button>

                    <a
                      href={`tel:${post.phone_number}`}
                      className="sm:hidden inline-flex items-center gap-1 text-xs font-bold text-emerald-600"
                    >
                      <Phone className="h-3.5 w-3.5" /> Call Shop
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/${post.phone_number?.replace(/\D/g, "")}?text=Hi%20${encodeURIComponent(
                        post.business_name
                      )},%20I%20saw%20your%20project%20post%20on%20CarpenterBullet:%20${encodeURIComponent(
                        post.title
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3.5 py-2 transition shadow-sm"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Quote
                    </a>
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
