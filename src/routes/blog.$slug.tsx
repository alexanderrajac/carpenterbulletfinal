import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  getBlogBySlug,
  generateBlogJSONLD,
  BlogPost,
  fetchAllBlogs,
} from "@/lib/blog.functions";
import {
  ArrowLeft,
  Clock,
  Eye,
  Heart,
  Share2,
  Phone,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Video,
  BookOpen,
  Sparkles,
  ChevronRight,
  List,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = await getBlogBySlug(params.slug);
    return { post };
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post;
    if (!post) return { meta: [{ title: "Blog Not Found | CarpenterBullet" }] };

    const schemaJson = generateBlogJSONLD(post);
    return {
      meta: [
        { title: `${post.metaTitle || post.title} | CarpenterBullet Blog` },
        {
          name: "description",
          content: post.metaDescription || post.summary,
        },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.summary },
        { property: "og:image", content: post.featuredImage },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: schemaJson,
        },
      ],
    };
  },
  component: BlogDetailPage,
});

function BlogDetailPage() {
  const { post } = Route.useLoaderData();
  const navigate = useNavigate();
  const [likes, setLikes] = useState(post?.likes || 0);
  const [liked, setLiked] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    if (post) {
      fetchAllBlogs().then((all) => {
        setRelatedPosts(all.filter((b) => b.slug !== post.slug).slice(0, 3));
      });
    }
  }, [post]);

  if (!post) {
    return (
      <div className="mx-auto max-w-xl py-20 px-4 text-center space-y-4">
        <h1 className="font-display text-3xl font-bold">Blog Article Not Found</h1>
        <p className="text-muted-foreground">
          The requested guide or vlog post could not be found.
        </p>
        <Link
          to="/blog"
          className="inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Return to Blog Hub
        </Link>
      </div>
    );
  }

  const handleLike = () => {
    if (!liked) {
      setLikes((prev) => prev + 1);
      setLiked(true);
      toast.success("Thank you for liking this carpenter guide!");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.summary,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="bg-wood-pattern min-h-screen pb-20">
      {/* Top Bar Navigation */}
      <div className="border-b border-border/40 bg-card/60 backdrop-blur-md sticky top-16 z-30">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Blogs & Vlogs
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold hover:bg-accent cursor-pointer transition"
            >
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
            <button
              onClick={handleLike}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition ${
                liked
                  ? "bg-red-500 text-white"
                  : "border border-border bg-card hover:bg-accent text-foreground"
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} /> {likes}
            </button>
          </div>
        </div>
      </div>

      <article className="mx-auto max-w-4xl px-4 py-10 space-y-8">
        {/* Header Metadata */}
        <header className="space-y-4 text-center sm:text-left">
          <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
            <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-extrabold uppercase tracking-wider">
              {post.category}
            </span>
            {post.isVlog && (
              <span className="px-3 py-1 rounded-full bg-amber-600 text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-1">
                <Video className="h-3 w-3" /> Video Vlog
              </span>
            )}
            {post.villupuramLocation && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                📍 {post.villupuramLocation}
              </span>
            )}
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-foreground leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-muted-foreground pt-2 border-b border-border/40 pb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                {post.authorName.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-foreground">{post.authorName}</p>
                <p className="text-[10px] text-muted-foreground">{post.authorRole}</p>
              </div>
            </div>

            <span className="opacity-40">|</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Published {post.publishedAt}
            </span>
            <span className="opacity-40">|</span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> {post.views} Views
            </span>
          </div>
        </header>

        {/* Video Vlog Embed Section (if videoUrl present) */}
        {post.isVlog && post.videoUrl && (
          <div className="rounded-3xl overflow-hidden border border-amber-500/40 shadow-2xl bg-black aspect-video relative">
            <iframe
              src={post.videoUrl}
              title={post.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full border-0"
            />
          </div>
        )}

        {/* Featured Banner Image if not Vlog */}
        {!post.isVlog && post.featuredImage && (
          <div className="rounded-3xl overflow-hidden border border-border/60 shadow-xl aspect-[16/9] bg-muted">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Article Summary Box */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm leading-relaxed text-foreground font-medium italic border-l-4 border-l-amber-600">
          "{post.summary}"
        </div>

        {/* Main Content Body */}
        <div className="prose prose-amber dark:prose-invert max-w-none bg-card p-6 sm:p-10 rounded-3xl border border-border/60 shadow-luxury space-y-6 text-foreground">
          {post.content.split("\n\n").map((paragraph, index) => {
            if (paragraph.startsWith("### ")) {
              return (
                <h3 key={index} className="font-display text-2xl font-bold text-foreground mt-6 mb-3">
                  {paragraph.replace("### ", "")}
                </h3>
              );
            }
            if (paragraph.startsWith("#### ")) {
              return (
                <h4 key={index} className="font-display text-lg font-bold text-foreground mt-4 mb-2">
                  {paragraph.replace("#### ", "")}
                </h4>
              );
            }
            if (paragraph.startsWith("> ")) {
              return (
                <blockquote key={index} className="border-l-4 border-amber-500 pl-4 py-2 my-4 italic text-muted-foreground bg-muted/30 rounded-r-xl">
                  {paragraph.replace("> ", "")}
                </blockquote>
              );
            }
            return (
              <p key={index} className="text-base text-foreground/90 leading-relaxed">
                {paragraph}
              </p>
            );
          })}
        </div>

        {/* Author Carpenter Direct Quote & Contact Card */}
        <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 font-extrabold text-2xl shrink-0">
                {post.authorName.charAt(0)}
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Verified Local Master Carpenter
                </span>
                <h3 className="font-display text-xl font-bold text-foreground mt-1">
                  {post.authorName}
                </h3>
                <p className="text-xs text-muted-foreground">{post.authorRole} • {post.villupuramLocation || "Villupuram District"}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <a
                href="tel:+919876543210"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-3 text-xs font-extrabold text-white hover:bg-amber-700 transition active:scale-95 cursor-pointer shadow-md"
              >
                <Phone className="h-4 w-4" /> Call Artisan Directly
              </a>
              <a
                href={`https://wa.me/919876543210?text=Hi%20${encodeURIComponent(post.authorName)},%20I%20read%20your%20blog%20"${encodeURIComponent(post.title)}"%20and%20need%20carpentry%20work.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-3 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition active:scale-95 cursor-pointer"
              >
                <MessageSquare className="h-4 w-4" /> WhatsApp Quote
              </a>
            </div>
          </div>
        </section>

        {/* Related Articles Section */}
        {relatedPosts.length > 0 && (
          <section className="space-y-4 pt-8">
            <h3 className="font-display text-2xl font-bold text-foreground">
              More Carpenter Guides & Vlogs
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {relatedPosts.map((rel) => (
                <Link
                  key={rel.id}
                  to="/blog/$slug"
                  params={{ slug: rel.slug }}
                  className="group block p-4 rounded-2xl border border-border/60 bg-card hover:border-amber-500/40 transition duration-200"
                >
                  <div className="aspect-video rounded-xl overflow-hidden mb-3 bg-muted">
                    <img
                      src={rel.featuredImage}
                      alt={rel.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-amber-600 uppercase">
                    {rel.category}
                  </span>
                  <h4 className="font-display text-sm font-bold text-foreground line-clamp-2 mt-1 group-hover:text-amber-600 transition-colors">
                    {rel.title}
                  </h4>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}
