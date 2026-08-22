import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  fetchAllBlogs,
  createOrUpdateBlog,
  BlogPost,
} from "@/lib/blog.functions";
import {
  Plus,
  BookOpen,
  Video,
  Sparkles,
  CheckCircle,
  Eye,
  Heart,
  Hammer,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/vendor/blog")({
  head: () => ({ meta: [{ title: "My Blogs & Video Vlogs — Workshop Panel" }] }),
  component: VendorBlogPage,
});

function VendorBlogPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Partial<BlogPost>>({
    title: "",
    summary: "",
    content: "",
    category: "Wood Care",
    isVlog: false,
    authorName: "My Workshop Carpenter",
    authorRole: "Master Carpenter",
    villupuramLocation: "Villupuram Town",
    featuredImage: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1000&auto=format&fit=crop",
    status: "published",
    tags: ["Villupuram", "Carpentry Tips"],
  });

  const loadBlogs = () => {
    setLoading(true);
    fetchAllBlogs().then((res) => {
      setBlogs(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost.title || !editingPost.summary) {
      toast.error("Please provide title and summary.");
      return;
    }

    await createOrUpdateBlog(editingPost);
    toast.success("Your Blog/Vlog post has been published successfully!");
    setModalOpen(false);
    loadBlogs();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-3xl border border-border/60 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5" />
            Carpenter Content Studio
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mt-1">
            Publish Woodworking Blogs & Video Vlogs
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Share your carpentry craftsmanship, video project walkthroughs, and boost your workshop search ranking in Villupuram district.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-amber-700 transition active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" /> Publish Blog / Vlog
        </button>
      </div>

      {/* Posts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="py-12 text-center text-muted-foreground col-span-2">Loading your blogs...</div>
        ) : blogs.length > 0 ? (
          blogs.map((post) => (
            <div
              key={post.id}
              className="p-5 rounded-3xl border border-border bg-card shadow-sm space-y-3 hover:border-amber-500/40 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-600">
                    {post.category}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    ● {post.status.toUpperCase()}
                  </span>
                </div>

                <h3 className="font-display text-base font-bold text-foreground mt-2 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {post.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1 font-mono">
                  <Eye className="h-3.5 w-3.5" /> {post.views} Views
                </span>
                <Link
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="font-bold text-amber-600 hover:underline"
                >
                  View Public Link →
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-muted-foreground col-span-2">
            You haven't created any blog or vlog posts yet. Click "Publish Blog / Vlog" to get started!
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card w-full max-w-xl rounded-3xl border border-border shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <h2 className="font-display text-lg font-bold">Publish New Blog / Vlog</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">Title</label>
                <input
                  type="text"
                  value={editingPost.title}
                  onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                  placeholder="e.g. 5 Signs Your Teak Door Frame Needs Anti-Termite Polish"
                  className="w-full rounded-xl border border-border bg-muted/30 p-2.5 outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-foreground block mb-1">Category</label>
                  <select
                    value={editingPost.category}
                    onChange={(e) => setEditingPost({ ...editingPost, category: e.target.value as any })}
                    className="w-full rounded-xl border border-border bg-muted/30 p-2.5 outline-none focus:border-primary"
                  >
                    <option value="Wood Care">Wood Care</option>
                    <option value="Modular Kitchen">Modular Kitchen</option>
                    <option value="Teak & Timber">Teak & Timber</option>
                    <option value="Door Repair">Door Repair</option>
                    <option value="Villupuram Local Tips">Villupuram Local Tips</option>
                    <option value="Custom Furniture">Custom Furniture</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">Type</label>
                  <select
                    value={editingPost.isVlog ? "true" : "false"}
                    onChange={(e) => setEditingPost({ ...editingPost, isVlog: e.target.value === "true" })}
                    className="w-full rounded-xl border border-border bg-muted/30 p-2.5 outline-none focus:border-primary"
                  >
                    <option value="false">Article (Written)</option>
                    <option value="true">Video Vlog</option>
                  </select>
                </div>
              </div>

              {editingPost.isVlog && (
                <div>
                  <label className="font-bold text-foreground block mb-1">Video Embed URL (YouTube/Vimeo)</label>
                  <input
                    type="text"
                    value={editingPost.videoUrl || ""}
                    onChange={(e) => setEditingPost({ ...editingPost, videoUrl: e.target.value })}
                    placeholder="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                    className="w-full rounded-xl border border-border bg-muted/30 p-2.5 outline-none focus:border-primary"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-foreground block mb-1">Target Villupuram Town / Village</label>
                <input
                  type="text"
                  value={editingPost.villupuramLocation || ""}
                  onChange={(e) => setEditingPost({ ...editingPost, villupuramLocation: e.target.value })}
                  placeholder="e.g. Tindivanam, Gingee, Villupuram Town"
                  className="w-full rounded-xl border border-border bg-muted/30 p-2.5 outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Short Summary</label>
                <textarea
                  value={editingPost.summary}
                  onChange={(e) => setEditingPost({ ...editingPost, summary: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-border bg-muted/30 p-2.5 outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Full Article Content</label>
                <textarea
                  value={editingPost.content}
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                  rows={5}
                  className="w-full rounded-xl border border-border bg-muted/30 p-2.5 outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-accent font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 transition"
                >
                  Publish Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
