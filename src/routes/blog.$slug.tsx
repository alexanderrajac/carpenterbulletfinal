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
  Instagram,
  ExternalLink,
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

function renderInlineFormattedText(text: string) {
  // Parses **bold text** and [link text](url)
  const parts = text.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      const isExternal = linkMatch[2].startsWith("http");
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="font-semibold text-primary underline underline-offset-4 hover:text-amber-600 transition"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}

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

        {/* Video Vlog & Instagram Reel / Profile Embed Section */}
        {post.isVlog && post.videoUrl && (
          <>
            {post.videoUrl.includes("instagram.com") && !post.videoUrl.includes("/reel/") && !post.videoUrl.includes("/p/") ? (
              /* Instagram Profile & Artisan Spotlight Card */
              <div className="relative rounded-3xl overflow-hidden border border-amber-500/40 bg-zinc-950 p-5 sm:p-7 shadow-2xl text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative w-48 h-48 sm:w-60 sm:h-60 rounded-2xl overflow-hidden border-2 border-amber-500/50 shrink-0 bg-black shadow-xl group">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex items-end p-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-600/90 text-white text-[10px] font-bold">
                        <Instagram className="h-3.5 w-3.5" /> @business.raja.c
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-amber-500/20 border border-pink-500/30 text-[11px] font-bold text-pink-400">
                      <Sparkles className="h-3.5 w-3.5" /> Official Instagram Woodcraft Showcase
                    </div>
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-white leading-tight">
                      Watch Live Hand-Carving & Workshop Reels
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                      Follow Master Artisan Alexander Raja on his official Instagram profile <strong>@business.raja.c</strong> to watch live chisel detailing, woodturning, and workshop stories of the Amma wooden water bottle.
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                      <a
                        href={post.authorInstagram || "https://www.instagram.com/business.raja.c/"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-600 via-purple-600 to-amber-600 text-white font-extrabold text-xs shadow-lg hover:brightness-110 transition active:scale-95 cursor-pointer"
                      >
                        <Instagram className="h-4 w-4" /> Watch Reels on @business.raja.c <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <a
                        href="https://wa.me/918248651695?text=Hi%20Alexander%20Raja!%20I%20saw%20your%20Handcrafted%20Wooden%20Water%20Can%20with%20Amma%20design%20on%20Instagram%20(@business.raja.c).%20I%20want%20to%20pre-order%20the%20Collector's%20Edition!"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg transition active:scale-95 cursor-pointer"
                      >
                        <MessageSquare className="h-4 w-4" /> Pre-Order on WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Video Container for Reels, YouTube, MP4 */
              <div className="rounded-3xl overflow-hidden border border-amber-500/40 shadow-2xl bg-zinc-950 p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/20 to-pink-500/20 text-amber-400 border border-amber-500/30">
                      {post.videoUrl.includes("instagram.com") ? (
                        <Instagram className="h-4 w-4 text-pink-400" />
                      ) : (
                        <Video className="h-4 w-4 text-amber-400" />
                      )}
                    </span>
                    <div>
                      <h3 className="font-bold text-sm text-white">
                        {post.videoUrl.includes("instagram.com")
                          ? "Instagram Reel & Craft Video"
                          : "Master Carpenter Video Vlog"}
                      </h3>
                      <p className="text-[11px] text-zinc-400">
                        Live woodworking by {post.authorName}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    HD 1080p
                  </span>
                </div>

                {/* Video container */}
                <div
                  className={`mx-auto rounded-2xl overflow-hidden border border-zinc-800 bg-black relative shadow-inner ${
                    post.videoUrl.includes("instagram.com")
                      ? "w-full max-w-sm sm:max-w-md aspect-[9/16] sm:aspect-[4/5]"
                      : "w-full aspect-video"
                  }`}
                >
                  {post.videoUrl.endsWith(".mp4") || post.videoUrl.includes("commondatastorage") ? (
                    <video
                      src={post.videoUrl}
                      controls
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <iframe
                      src={
                        post.videoUrl.includes("instagram.com") && !post.videoUrl.includes("/embed")
                          ? `${post.videoUrl.replace(/\/$/, "")}/embed`
                          : post.videoUrl
                      }
                      title={post.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full border-0"
                    />
                  )}
                </div>

                {/* Interactive actions under video */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {post.videoUrl.includes("instagram.com") && (
                    <a
                      href={post.videoUrl.replace(/\/embed.*$/, "")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-pink-600 via-purple-600 to-amber-600 text-white font-extrabold text-xs shadow-md hover:brightness-110 transition active:scale-95 cursor-pointer"
                    >
                      <Instagram className="h-4 w-4" /> Watch on Instagram (@business.raja.c)
                    </a>
                  )}
                  <a
                    href={`https://wa.me/918248651695?text=Hi%20Alexander%20Raja!%20I%20saw%20your%20woodworking%20video%20"${encodeURIComponent(post.title)}"%20on%20CarpenterBullet.%20I%20want%20to%20order/book.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition active:scale-95 cursor-pointer"
                  >
                    <MessageSquare className="h-4 w-4" /> Contact Master Artisan on WhatsApp
                  </a>
                </div>
              </div>
            )}
          </>
        )}

        {/* Featured Showcase Media Card */}
        {post.featuredImage && (
          <div className="relative rounded-3xl overflow-hidden border border-amber-500/20 shadow-xl bg-card">
            <div className="max-h-[460px] w-full overflow-hidden flex items-center justify-center bg-black/5 dark:bg-black/40">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="max-h-[460px] w-auto mx-auto object-contain transition-transform duration-700 hover:scale-102"
              />
            </div>
          </div>
        )}

        {/* Article Summary Box */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm sm:text-base leading-relaxed text-foreground font-medium italic border-l-4 border-l-amber-600">
          "{post.summary}"
        </div>

        {/* Main Content Body with Rich Markdown Support */}
        <div className="bg-card p-6 sm:p-10 rounded-3xl border border-border/60 shadow-luxury space-y-6 text-foreground">
          {post.content.split("\n\n").map((paragraph, index) => {
            const trimmed = paragraph.trim();
            if (!trimmed) return null;

            // Heading 3
            if (trimmed.startsWith("### ")) {
              return (
                <h3 key={index} className="font-display text-2xl font-bold text-foreground mt-8 mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                  {trimmed.replace("### ", "")}
                </h3>
              );
            }

            // Heading 4
            if (trimmed.startsWith("#### ")) {
              return (
                <h4 key={index} className="font-display text-lg font-bold text-amber-600 dark:text-amber-400 mt-6 mb-2">
                  {trimmed.replace("#### ", "")}
                </h4>
              );
            }

            // Blockquote
            if (trimmed.startsWith("> ")) {
              return (
                <blockquote key={index} className="border-l-4 border-amber-500 pl-4 py-3 my-4 italic text-foreground/90 bg-amber-500/10 rounded-r-2xl text-sm sm:text-base leading-relaxed">
                  {trimmed.split("\n").map((line, li) => (
                    <p key={li} className={li > 0 ? "mt-2" : ""}>
                      {renderInlineFormattedText(line.replace(/^>\s*/, ""))}
                    </p>
                  ))}
                </blockquote>
              );
            }

            // Table
            if (trimmed.includes("|") && trimmed.includes("---")) {
              const lines = trimmed.split("\n").filter((l) => l.trim().startsWith("|"));
              if (lines.length >= 2) {
                const headerCols = lines[0].split("|").map((c) => c.trim()).filter(Boolean);
                const rowLines = lines.slice(2);
                return (
                  <div key={index} className="my-6 overflow-x-auto rounded-2xl border border-border/80 shadow-md">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] sm:text-xs font-bold tracking-wider border-b border-border/60">
                        <tr>
                          {headerCols.map((col, ci) => (
                            <th key={ci} className="py-3 px-4 font-bold">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 bg-card">
                        {rowLines.map((row, ri) => {
                          const cols = row.split("|").map((c) => c.trim()).filter(Boolean);
                          return (
                            <tr key={ri} className="hover:bg-muted/20 transition-colors">
                              {cols.map((col, ci) => (
                                <td key={ci} className="py-3 px-4 text-foreground/90 leading-relaxed font-medium">
                                  {renderInlineFormattedText(col)}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              }
            }

            // Lists
            if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || /^\d+\.\s/.test(trimmed)) {
              const items = trimmed.split("\n").filter((l) => l.trim().length > 0);
              return (
                <ul key={index} className="space-y-2.5 my-4 text-sm sm:text-base text-foreground/90">
                  {items.map((item, ii) => {
                    const cleanItem = item.replace(/^[-*]\s+|\d+\.\s+/, "");
                    return (
                      <li key={ii} className="flex items-start gap-2.5">
                        <span className="h-2 w-2 rounded-full bg-amber-500 mt-2 shrink-0" />
                        <div className="flex-1 leading-relaxed">
                          {renderInlineFormattedText(cleanItem)}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              );
            }

            // Regular Paragraph
            return (
              <p key={index} className="text-base text-foreground/90 leading-relaxed">
                {renderInlineFormattedText(trimmed)}
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
                  Verified Master Artisan & Founder
                </span>
                <h3 className="font-display text-xl font-bold text-foreground mt-1">
                  {post.authorName}
                </h3>
                <p className="text-xs text-muted-foreground">{post.authorRole} • {post.villupuramLocation || "Perungalathur, Vandalur & Chennai"}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 w-full sm:w-auto justify-center sm:justify-end">
              <a
                href={post.authorInstagram || "https://www.instagram.com/business.raja.c/"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-amber-600 px-4 py-2.5 text-xs font-extrabold text-white hover:brightness-110 transition active:scale-95 cursor-pointer shadow-md"
              >
                <Instagram className="h-4 w-4" /> Instagram (@business.raja.c)
              </a>
              <a
                href="tel:+918248651695"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-amber-700 transition active:scale-95 cursor-pointer shadow-md"
              >
                <Phone className="h-4 w-4" /> Call Artisan
              </a>
              <a
                href={`https://wa.me/918248651695?text=Hi%20Alexander%20Raja!%20I%20saw%20your%20"${encodeURIComponent(post.title)}"%20on%20CarpenterBullet.%20I%20want%20to%20order/pre-order!`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition active:scale-95 cursor-pointer"
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
