import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Search,
  Video,
  BookOpen,
  Eye,
  Heart,
  Clock,
  User,
  Sparkles,
  Tag,
  ChevronRight,
  Filter,
  Play,
  ArrowUpRight,
} from "lucide-react";
import { fetchAllBlogs, BlogPost } from "@/lib/blog.functions";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Woodworking Blogs & Video Vlogs | CarpenterBullet" },
      {
        name: "description",
        content:
          "Explore master carpenter blogs, video vlogs, door fitting guides, modular kitchen tips, and local Villupuram woodworking tutorials.",
      },
      {
        name: "keywords",
        content:
          "woodworking blog, carpenter vlog, teak wood guide, door installation tips, modular kitchen blog, Villupuram carpenter video, WoodVerse",
      },
    ],
  }),
  component: BlogHubPage,
});

const CATEGORIES = [
  "All",
  "Wood Care",
  "Modular Kitchen",
  "Teak & Timber",
  "Door Repair",
  "Villupuram Local Tips",
  "Custom Furniture",
  "Interior Design",
];

function BlogHubPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState<"all" | "blog" | "vlog">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAllBlogs().then((res) => {
      setBlogs(res);
      setLoading(false);
    });
  }, []);

  const filteredBlogs = blogs.filter((post) => {
    if (post.status !== "published") return false;
    const matchesCategory =
      selectedCategory === "All" || post.category === selectedCategory;
    const matchesType =
      selectedType === "all" ||
      (selectedType === "vlog" && post.isVlog) ||
      (selectedType === "blog" && !post.isVlog);

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      post.title.toLowerCase().includes(q) ||
      post.summary.toLowerCase().includes(q) ||
      (post.tags && post.tags.some((t) => t.toLowerCase().includes(q))) ||
      (post.villupuramLocation && post.villupuramLocation.toLowerCase().includes(q));

    return matchesCategory && matchesType && matchesSearch;
  });

  const featuredPost = blogs.find((b) => b.isFeatured && b.status === "published") || blogs[0];

  return (
    <div className="bg-wood-pattern min-h-screen pb-20">
      {/* Header Banner */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-amber-950/40 via-background to-background py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Artisan Wood Knowledge & Video Vlogs
          </span>
          <h1 className="font-display text-3xl font-extrabold sm:text-5xl tracking-tight text-foreground max-w-3xl mx-auto">
            Carpenter Guides, Craft Vlogs & <br />
            <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 bg-clip-text text-transparent italic font-serif">
              Google Rank #1 SEO Tips
            </span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Written and recorded by South India's finest master carpenters. Learn teak wood identification, door frame restoration, and local Villupuram woodworking rates.
          </p>

          {/* Search bar */}
          <div className="mt-8 max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guides, vlogs, teak wood, door fitting, Villupuram..."
                className="w-full rounded-2xl border border-border/80 bg-card py-3.5 pl-11 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Featured Spotlight Article (if present) */}
        {featuredPost && !searchQuery && selectedCategory === "All" && (
          <section className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-card shadow-2xl transition hover:border-amber-500/50">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              <div className="lg:col-span-7 aspect-video lg:aspect-auto overflow-hidden relative">
                <img
                  src={featuredPost.featuredImage}
                  alt={featuredPost.title}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
                {featuredPost.isVlog && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="h-16 w-16 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-2xl animate-pulse">
                      <Play className="h-8 w-8 fill-current ml-1" />
                    </div>
                  </div>
                )}
                <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-600 text-white text-xs font-bold shadow-md">
                  ★ Featured Rank #1 Post
                </span>
              </div>

              <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      {featuredPost.category}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {featuredPost.readTime}
                    </span>
                  </div>

                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground leading-snug">
                    <Link to="/blog/$slug" params={{ slug: featuredPost.slug }} className="hover:text-amber-600 transition-colors">
                      {featuredPost.title}
                    </Link>
                  </h2>

                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {featuredPost.summary}
                  </p>
                </div>

                <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold text-sm">
                      {featuredPost.authorName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{featuredPost.authorName}</p>
                      <p className="text-[10px] text-muted-foreground">{featuredPost.authorRole}</p>
                    </div>
                  </div>

                  <Link
                    to="/blog/$slug"
                    params={{ slug: featuredPost.slug }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    Read Guide <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/60 pb-6">
          {/* Format switcher */}
          <div className="flex gap-2 p-1 rounded-2xl bg-muted/60 border border-border/40">
            <button
              onClick={() => setSelectedType("all")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                selectedType === "all"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Content
            </button>
            <button
              onClick={() => setSelectedType("blog")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedType === "blog"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" /> Articles & Guides
            </button>
            <button
              onClick={() => setSelectedType("vlog")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedType === "vlog"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Video className="h-3.5 w-3.5" /> Video Vlogs
            </button>
          </div>

          {/* Categories Pill Bar */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-1 md:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Blog Post Cards Grid */}
        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Loading Carpenter Blogs...</div>
        ) : filteredBlogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBlogs.map((post) => (
              <article
                key={post.id}
                className="group rounded-3xl border border-border/70 bg-card overflow-hidden shadow-luxury hover:border-amber-500/40 hover:shadow-2xl transition duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail Image */}
                  <div className="aspect-[16/10] overflow-hidden relative bg-muted">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {post.isVlog ? (
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[10px] font-extrabold shadow-md">
                        <Video className="h-3 w-3" /> VLOG
                      </span>
                    ) : (
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-background/90 text-foreground backdrop-blur-md text-[10px] font-extrabold shadow-md">
                        <BookOpen className="h-3 w-3" /> ARTICLE
                      </span>
                    )}

                    {post.villupuramLocation && (
                      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/70 text-amber-300 backdrop-blur-md text-[10px] font-bold">
                        📍 {post.villupuramLocation}
                      </span>
                    )}
                  </div>

                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                      <span className="font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                        {post.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {post.readTime}
                      </span>
                    </div>

                    <h3 className="font-display text-lg font-bold text-foreground leading-snug group-hover:text-amber-600 transition-colors line-clamp-2">
                      <Link to="/blog/$slug" params={{ slug: post.slug }}>
                        {post.title}
                      </Link>
                    </h3>

                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {post.summary}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-border/40 mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                      {post.authorName.charAt(0)}
                    </div>
                    <span className="text-xs font-semibold text-foreground truncate max-w-[120px]">
                      {post.authorName}
                    </span>
                  </div>

                  <Link
                    to="/blog/$slug"
                    params={{ slug: post.slug }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:underline"
                  >
                    View Post <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-16 text-center rounded-3xl border border-border bg-card space-y-4">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="font-display text-xl font-bold">No Blogs or Vlogs Found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search criteria or category filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
