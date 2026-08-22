import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  fetchAllBlogs,
  createOrUpdateBlog,
  deleteBlog,
  BlogPost,
} from "@/lib/blog.functions";
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  Star,
  CheckCircle,
  XCircle,
  Video,
  BookOpen,
  Search,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/blog")({
  head: () => ({ meta: [{ title: "Admin — Blog & Vlog Control Center" }] }),
  component: AdminBlogControlPage,
});

function AdminBlogControlPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);

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

  const handleToggleFeatured = async (post: BlogPost) => {
    const updated = await createOrUpdateBlog({
      ...post,
      isFeatured: !post.isFeatured,
    });
    toast.success(
      updated.isFeatured
        ? `"${post.title}" is now featured on the homepage.`
        : `"${post.title}" removed from featured spotlight.`
    );
    loadBlogs();
  };

  const handleToggleStatus = async (post: BlogPost) => {
    const nextStatus = post.status === "published" ? "draft" : "published";
    await createOrUpdateBlog({
      ...post,
      status: nextStatus,
    });
    toast.success(`Post status updated to ${nextStatus.toUpperCase()}`);
    loadBlogs();
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      await deleteBlog(id);
      toast.success("Blog post deleted cleanly.");
      loadBlogs();
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost?.title || !editingPost?.summary) {
      toast.error("Please fill in title and summary.");
      return;
    }

    await createOrUpdateBlog(editingPost);
    toast.success("Blog/Vlog post saved successfully!");
    setModalOpen(false);
    setEditingPost(null);
    loadBlogs();
  };

  const filteredBlogs = blogs.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.villupuramLocation && b.villupuramLocation.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === "all" || b.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-3xl border border-border/60 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5" />
            SEO & Content Control Engine
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mt-1">
            Carpenter Blog & Video Vlog Control Panel
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage carpenter guides, video vlogs, Google Rank #1 SEO metadata, and featured homepage spotlights.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingPost({
              title: "",
              summary: "",
              content: "",
              category: "Wood Care",
              isVlog: false,
              authorName: "Admin Artisan",
              authorRole: "Head Woodcraft Editor",
              villupuramLocation: "Villupuram Town",
              featuredImage: "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1000&auto=format&fit=crop",
              status: "published",
              isFeatured: false,
              readTime: "5 min read",
              tags: ["Villupuram", "Teak Wood"],
            });
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs font-bold text-primary-foreground shadow-md hover:opacity-90 transition active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" /> Create Blog / Vlog
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card p-4 rounded-2xl border border-border/40">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, author, or Villupuram area..."
            className="w-full rounded-xl border border-border bg-muted/40 py-2 pl-9 pr-3 text-xs outline-none focus:border-primary transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {["all", "published", "draft"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl capitalize transition cursor-pointer ${
                filterStatus === st
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-luxury">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading blogs...</div>
        ) : filteredBlogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border/60 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-4">Post Info</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Author / Area</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Featured</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredBlogs.map((post) => (
                  <tr key={post.id} className="hover:bg-muted/30 transition">
                    <td className="p-4 max-w-xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="h-10 w-10 rounded-xl object-cover shrink-0 border border-border/40 bg-muted"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate">{post.title}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            slug: /{post.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      {post.isVlog ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-600 text-white font-extrabold text-[10px]">
                          <Video className="h-3 w-3" /> VLOG
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-foreground font-extrabold text-[10px]">
                          <BookOpen className="h-3 w-3" /> BLOG
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <p className="font-semibold text-foreground">{post.authorName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        📍 {post.villupuramLocation || "Villupuram District"}
                      </p>
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => handleToggleStatus(post)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] cursor-pointer transition ${
                          post.status === "published"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {post.status === "published" ? (
                          <>
                            <CheckCircle className="h-3 w-3" /> Published
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" /> Draft
                          </>
                        )}
                      </button>
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => handleToggleFeatured(post)}
                        className={`p-1.5 rounded-xl cursor-pointer transition ${
                          post.isFeatured
                            ? "bg-amber-500 text-white shadow-sm"
                            : "bg-muted text-muted-foreground hover:bg-accent"
                        }`}
                        title="Toggle Featured Homepage Spotlight"
                      >
                        <Star className="h-4 w-4 fill-current" />
                      </button>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingPost(post);
                            setModalOpen(true);
                          }}
                          className="p-2 rounded-xl bg-muted hover:bg-accent text-foreground transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-muted-foreground">No blogs found.</div>
        )}
      </div>

      {/* Edit / Create Modal */}
      {modalOpen && editingPost && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card w-full max-w-2xl rounded-3xl border border-border shadow-2xl p-6 sm:p-8 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <h2 className="font-display text-xl font-bold">
                {editingPost.id ? "Edit Blog / Vlog" : "Create New Blog / Vlog Post"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">Title</label>
                <input
                  type="text"
                  value={editingPost.title || ""}
                  onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                  placeholder="e.g. No. 1 Carpenter Guide to Teak Wood Door Fitting in Villupuram"
                  className="w-full rounded-xl border border-border bg-muted/30 p-2.5 outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-foreground block mb-1">Category</label>
                  <select
                    value={editingPost.category || "Wood Care"}
                    onChange={(e) => setEditingPost({ ...editingPost, category: e.target.value as any })}
                    className="w-full rounded-xl border border-border bg-muted/30 p-2.5 outline-none focus:border-primary"
                  >
                    <option value="Wood Care">Wood Care</option>
                    <option value="Modular Kitchen">Modular Kitchen</option>
                    <option value="Teak & Timber">Teak & Timber</option>
                    <option value="Door Repair">Door Repair</option>
                    <option value="Villupuram Local Tips">Villupuram Local Tips</option>
                    <option value="Custom Furniture">Custom Furniture</option>
                    <option value="Interior Design">Interior Design</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">Is Video Vlog?</label>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-foreground block mb-1">Author Carpenter Name</label>
                  <input
                    type="text"
                    value={editingPost.authorName || ""}
                    onChange={(e) => setEditingPost({ ...editingPost, authorName: e.target.value })}
                    className="w-full rounded-xl border border-border bg-muted/30 p-2.5 outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">Villupuram Location</label>
                  <input
                    type="text"
                    value={editingPost.villupuramLocation || ""}
                    onChange={(e) => setEditingPost({ ...editingPost, villupuramLocation: e.target.value })}
                    placeholder="e.g. Villupuram Town, Tindivanam, Gingee"
                    className="w-full rounded-xl border border-border bg-muted/30 p-2.5 outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Featured Image URL</label>
                <input
                  type="text"
                  value={editingPost.featuredImage || ""}
                  onChange={(e) => setEditingPost({ ...editingPost, featuredImage: e.target.value })}
                  className="w-full rounded-xl border border-border bg-muted/30 p-2.5 outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Summary (Meta Description)</label>
                <textarea
                  value={editingPost.summary || ""}
                  onChange={(e) => setEditingPost({ ...editingPost, summary: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-border bg-muted/30 p-2.5 outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Main Article Content (Markdown format supported)</label>
                <textarea
                  value={editingPost.content || ""}
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                  rows={6}
                  className="w-full rounded-xl border border-border bg-muted/30 p-2.5 outline-none focus:border-primary font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-accent text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:opacity-90 transition"
                >
                  Save Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
