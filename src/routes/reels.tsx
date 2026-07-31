import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listPublicVendorReels } from "@/lib/vendor.functions";
import {
  Phone,
  Heart,
  Share2,
  Volume2,
  VolumeX,
  Award,
  ChevronDown,
  ChevronUp,
  Store,
  MessageCircle,
  MapPin,
  Flame,
  Music,
  Send,
  Plus,
  X,
  CheckCircle2,
  Upload,
  ArrowLeft,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const reelsQO = queryOptions({
  queryKey: ["public-vendor-reels"],
  queryFn: () => listPublicVendorReels(),
});

export const Route = createFileRoute("/reels")({
  head: () => ({
    meta: [
      { title: "WoodReels — Fullscreen Carpentry Short Videos | CarpenterBullet" },
      {
        name: "description",
        content:
          "Watch master carpenters in action! Short woodworking videos, teakwood carving timelapses, lathe turning, custom door fitting, and direct shop telephone contacts across India.",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(reelsQO);
  },
  component: ReelsPage,
});

function ReelsPage() {
  const { data: initialReels } = useSuspenseQuery(reelsQO);
  const [reelsList, setReelsList] = useState<any[]>(initialReels);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [userLiked, setUserLiked] = useState<Record<string, boolean>>({});
  const [showHeartAnim, setShowHeartAnim] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  // Touch Swipe Gesture State
  const touchStartY = useRef<number | null>(null);

  // New reel upload form state
  const [newReel, setNewReel] = useState({
    business_name: "",
    owner_name: "",
    phone_number: "",
    city: "",
    state: "Tamil Nadu",
    title: "",
    caption: "",
    video_url: "",
    thumbnail_url: "",
    tags_str: "Woodworking, CustomFurniture",
  });

  // Lock body scroll while Reels is mounted so outer website does NOT scroll
  useEffect(() => {
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = origOverflow;
    };
  }, []);

  useEffect(() => {
    reelsList.forEach((r: any, idx: number) => {
      const v = videoRefs.current[r.id];
      if (v) {
        if (idx === currentIndex) {
          v.play().catch(() => {});
        } else {
          v.pause();
          v.currentTime = 0;
        }
      }
    });
  }, [currentIndex, reelsList]);

  const handleNext = () => {
    if (currentIndex < reelsList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Touch Swipe Handlers for Mobile vertical swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    if (diff > 50) {
      // Swiped UP -> Next reel
      handleNext();
    } else if (diff < -50) {
      // Swiped DOWN -> Previous reel
      handlePrev();
    }
    touchStartY.current = null;
  };

  const handleDoubleTap = (id: string, count: number) => {
    setShowHeartAnim(id);
    setTimeout(() => setShowHeartAnim(null), 900);
    if (!userLiked[id]) {
      setUserLiked((prev) => ({ ...prev, [id]: true }));
      setLikes((prev) => ({ ...prev, [id]: (likes[id] ?? count) + 1 }));
    }
  };

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

  const handleShare = (reel: any) => {
    if (navigator.share) {
      navigator.share({
        title: reel.title,
        text: `Watch ${reel.business_name} on CarpenterBullet: ${reel.title}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Reel link copied!");
    }
  };

  const handlePublishReel = (e: React.FormEvent) => {
    e.preventDefault();
    const createdItem = {
      id: `reel-user-${Date.now()}`,
      vendor_id: `user-${Date.now()}`,
      business_name: newReel.business_name || "Artisan Workshop",
      owner_name: newReel.owner_name || "Master Craftsman",
      city: newReel.city || "Chennai",
      state: newReel.state || "Tamil Nadu",
      phone_number: newReel.phone_number || "+91 98400 00000",
      title: newReel.title,
      caption: newReel.caption,
      video_url: newReel.video_url || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      thumbnail_url: newReel.thumbnail_url || "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80",
      tags: newReel.tags_str.split(",").map((s) => s.trim()),
      applauds_count: 1,
      created_at: new Date().toISOString(),
    };

    setReelsList([createdItem, ...reelsList]);
    setCurrentIndex(0);
    setShowUploadModal(false);
    toast.success("🚀 Reel published! Your carpentry video is live on WoodReels!");
  };

  const fieldCls =
    "w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20";

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-50 h-[100dvh] w-screen bg-black text-white flex items-center justify-center overflow-hidden select-none font-sans"
    >
      {/* Instagram Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between p-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent">
        <Link to="/" className="flex items-center gap-2">
          <ArrowLeft className="h-5 w-5 text-white mr-1 hover:text-amber-400 transition" />
          <span className="font-display font-black text-xl tracking-tight text-amber-500 flex items-center gap-1.5">
            <Flame className="h-5 w-5 animate-pulse text-amber-500 fill-amber-500" />
            CarpenterBullet
          </span>
          <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
            Reels
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-950 bg-amber-500 hover:bg-amber-400 px-3.5 py-1.5 rounded-full transition shadow-lg active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Upload Reel
          </button>
          <Link
            to="/feed"
            className="text-xs font-semibold text-zinc-200 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 px-3.5 py-1.5 rounded-full backdrop-blur-md border border-zinc-700/60 transition shadow-sm"
          >
            📸 Feed
          </Link>
          <button
            onClick={() => setMuted(!muted)}
            className="p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white backdrop-blur-md border border-zinc-700/60 transition"
            aria-label="Toggle Sound"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Upload Reel Modal Popup */}
      <AnimatePresence>
        {showUploadModal && (
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
                  <h3 className="font-bold text-base">Upload Carpentry Video Reel</h3>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handlePublishReel} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Shop / Workshop Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newReel.business_name}
                      onChange={(e) => setNewReel({ ...newReel, business_name: e.target.value })}
                      placeholder="e.g. Sri Woodcrafts"
                      className={fieldCls}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Craftsman Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newReel.owner_name}
                      onChange={(e) => setNewReel({ ...newReel, owner_name: e.target.value })}
                      placeholder="e.g. Ramesh Kumar"
                      className={fieldCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Shop Phone / Tel *
                    </label>
                    <input
                      type="tel"
                      required
                      value={newReel.phone_number}
                      onChange={(e) => setNewReel({ ...newReel, phone_number: e.target.value })}
                      placeholder="+91 98421 00000"
                      className={fieldCls}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={newReel.city}
                      onChange={(e) => setNewReel({ ...newReel, city: e.target.value })}
                      placeholder="e.g. Madurai"
                      className={fieldCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Reel Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newReel.title}
                    onChange={(e) => setNewReel({ ...newReel, title: e.target.value })}
                    placeholder="e.g. Lathe Turning Teak Dining Table Leg 🪵"
                    className={fieldCls}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Caption / Details *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={newReel.caption}
                    onChange={(e) => setNewReel({ ...newReel, caption: e.target.value })}
                    placeholder="Watch hand-carving Teakwood bed frame in our Madurai workshop..."
                    className={fieldCls}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    MP4 Video File URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={newReel.video_url}
                    onChange={(e) => setNewReel({ ...newReel, video_url: e.target.value })}
                    placeholder="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                    className={fieldCls}
                  />
                  <p className="text-[10px] text-zinc-400 mt-0.5">Paste direct link to video file or Cloudinary video link.</p>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={newReel.tags_str}
                    onChange={(e) => setNewReel({ ...newReel, tags_str: e.target.value })}
                    placeholder="WoodTurning, Teakwood, Carving"
                    className={fieldCls}
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-1.5"
                  >
                    🚀 Publish Reel Live
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Full-Screen Reel Frame */}
      <div className="relative w-full max-w-md h-full sm:h-[94vh] sm:rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl flex items-center justify-center">
        {reelsList.map((reel: any, index: number) => {
          const isActive = index === currentIndex;
          const isLiked = userLiked[reel.id];
          const count = likes[reel.id] ?? reel.applauds_count;

          return (
            <div
              key={reel.id}
              className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
                isActive ? "opacity-100 pointer-events-auto z-10" : "opacity-0 pointer-events-none z-0"
              }`}
              onDoubleClick={() => handleDoubleTap(reel.id, reel.applauds_count)}
            >
              <video
                ref={(el) => {
                  videoRefs.current[reel.id] = el;
                }}
                src={reel.video_url}
                poster={reel.thumbnail_url}
                loop
                muted={muted}
                playsInline
                className="w-full h-full object-cover"
                onClick={() => setMuted(!muted)}
              />

              {/* Double-tap Instagram Heart Explosion */}
              <AnimatePresence>
                {showHeartAnim === reel.id && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1.3, opacity: 1 }}
                    exit={{ scale: 1.8, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 m-auto h-24 w-24 flex items-center justify-center z-40 pointer-events-none"
                  >
                    <Heart className="h-24 w-24 fill-red-500 text-red-500 drop-shadow-2xl" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/40 pointer-events-none" />

              {/* Right Side Action Bar (Instagram Style) */}
              <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-5">
                {/* Like Button */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => toggleLike(reel.id, reel.applauds_count)}
                    className={`p-3 rounded-full backdrop-blur-md transition transform active:scale-75 ${
                      isLiked
                        ? "bg-red-500/20 text-red-500 border border-red-500/40"
                        : "bg-zinc-900/70 text-white border border-white/20 hover:bg-zinc-800"
                    }`}
                  >
                    <Heart className={`h-6 w-6 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                  </button>
                  <span className="text-[11px] font-bold text-white mt-1 shadow-sm">{count}</span>
                </div>

                {/* WhatsApp Direct */}
                <div className="flex flex-col items-center">
                  <a
                    href={`https://wa.me/${reel.phone_number?.replace(/\D/g, "")}?text=Hi%20${encodeURIComponent(
                      reel.business_name
                    )},%20I%20saw%20your%20woodworking%20reel%20on%20CarpenterBullet:%20${encodeURIComponent(
                      reel.title
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-full bg-green-600 text-white shadow-lg hover:bg-green-500 transition transform active:scale-90 border border-green-400/40"
                  >
                    <MessageCircle className="h-6 w-6" />
                  </a>
                  <span className="text-[10px] font-bold text-green-400 mt-1 uppercase tracking-wider">
                    WhatsApp
                  </span>
                </div>

                {/* Direct Phone Call Tel */}
                <div className="flex flex-col items-center">
                  <a
                    href={`tel:${reel.phone_number}`}
                    className="p-3 rounded-full bg-emerald-500 text-zinc-950 shadow-lg hover:bg-emerald-400 transition transform active:scale-90 border border-emerald-300"
                    title="Call Workshop Tel"
                  >
                    <Phone className="h-6 w-6 fill-zinc-950 animate-bounce" />
                  </a>
                  <span className="text-[10px] font-bold text-emerald-400 mt-1 uppercase tracking-wider">
                    Call Tel
                  </span>
                </div>

                {/* Share Button */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => handleShare(reel)}
                    className="p-3 rounded-full bg-zinc-900/70 text-white border border-white/20 hover:bg-zinc-800 backdrop-blur-md transition"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                  <span className="text-[10px] font-bold text-zinc-300 mt-1">Share</span>
                </div>
              </div>

              {/* Bottom Metadata & Audio Ticker (Instagram Style) */}
              <div className="absolute left-0 right-16 bottom-4 z-20 p-5 space-y-3">
                {/* Store Header */}
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold overflow-hidden shrink-0 shadow-md">
                    {reel.avatar_url ? (
                      <img src={reel.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Store className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-white drop-shadow line-clamp-1">
                        {reel.business_name}
                      </h3>
                      <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 fill-amber-400/20" />
                    </div>
                    <p className="text-[11px] text-zinc-300 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-amber-400" />
                      {reel.city}, {reel.state} • Master: {reel.owner_name}
                    </p>
                  </div>
                </div>

                {/* Reel Caption */}
                <div>
                  <h2 className="font-bold text-sm text-white leading-tight drop-shadow">
                    {reel.title}
                  </h2>
                  <p className="text-xs text-zinc-300 leading-normal mt-1 line-clamp-2 drop-shadow font-light">
                    {reel.caption}
                  </p>
                </div>

                {/* Audio Ticker */}
                <div className="flex items-center gap-2 text-[11px] text-zinc-300 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 w-fit">
                  <Music className="h-3.5 w-3.5 text-amber-400 animate-spin" />
                  <span className="truncate max-w-[200px] font-mono text-[10px]">
                    Original Sound — {reel.business_name} Woodcraft Ambient
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Up / Down Arrow Navigation */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-2 rounded-full bg-zinc-900/80 text-white disabled:opacity-30 hover:bg-zinc-800 backdrop-blur-md border border-white/10 transition"
          >
            <ChevronUp className="h-5 w-5" />
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-full bg-zinc-900/80 text-white hover:bg-zinc-800 backdrop-blur-md border border-white/10 transition"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
