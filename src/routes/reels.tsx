import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listPublicVendorReels } from "@/lib/vendor.functions";
import { supabase } from "@/integrations/supabase/client";
import { uploadMediaFile } from "@/lib/product-images";
import {
  Phone,
  Heart,
  Share2,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Store,
  MapPin,
  Flame,
  Music,
  Send,
  Plus,
  X,
  CheckCircle2,
  Upload,
  ArrowLeft,
  Lock,
  MessageSquare,
  Loader2,
  Sparkles,
  Zap,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Bookmark,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
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
  const [feedFilter, setFeedFilter] = useState<"foryou" | "latest" | "top">("foryou");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"up" | "down">("up");
  const [muted, setMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTimeStr, setCurrentTimeStr] = useState("0:00");
  const [durationStr, setDurationStr] = useState("0:00");
  const [showPlayPauseBadge, setShowPlayPauseBadge] = useState<"play" | "pause" | null>(null);

  const [likes, setLikes] = useState<Record<string, number>>({});
  const [userLiked, setUserLiked] = useState<Record<string, boolean>>({});
  const [following, setFollowing] = useState<Record<string, boolean>>({});
  const [savedReels, setSavedReels] = useState<Record<string, boolean>>({});
  const [showHeartAnim, setShowHeartAnim] = useState<string | null>(null);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showJoinPrompt, setShowJoinPrompt] = useState(false);
  const [showCommentDrawer, setShowCommentDrawer] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const [commentsMap, setCommentsMap] = useState<Record<string, any[]>>({
    "reel-1": [
      { id: "c1", name: "Anand R.", text: "Awesome teakwood polish! Do you make custom dining tables?", time: "2h ago" },
      { id: "c2", name: "Priya M.", text: "Loved the lathe turning precision 🪵🔥", time: "5h ago" },
    ],
    "reel-2": [
      { id: "c3", name: "Karthik N.", text: "Beautiful mandapam carving. What wood grade is used?", time: "1h ago" }
    ],
  });
  const [newComment, setNewComment] = useState("");

  const [isVendor, setIsVendor] = useState(false);
  const [vendorProfile, setVendorProfile] = useState<any>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  // Gesture refs
  const touchStartY = useRef<number | null>(null);
  const isScrollingRef = useRef(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  // Load persistent storage for user reels, likes, follows
  useEffect(() => {
    try {
      const storedReels = localStorage.getItem("cb_user_reels");
      if (storedReels) {
        const parsed = JSON.parse(storedReels);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setReelsList((prev) => {
            const existingIds = new Set(prev.map((r) => r.id));
            const newItems = parsed.filter((r) => !existingIds.has(r.id));
            return [...newItems, ...prev];
          });
        }
      }
      const storedLikes = localStorage.getItem("cb_liked_reels");
      if (storedLikes) {
        setUserLiked(JSON.parse(storedLikes));
      }
      const storedFollows = localStorage.getItem("cb_followed_vendors");
      if (storedFollows) {
        setFollowing(JSON.parse(storedFollows));
      }
      const storedSaved = localStorage.getItem("cb_saved_reels");
      if (storedSaved) {
        setSavedReels(JSON.parse(storedSaved));
      }
    } catch (e) {}
  }, []);

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
    tags_str: "Woodworking, CustomFurniture, Teakwood",
  });

  // Algorithm Recommendation Sort Engine
  const sortedReels = useMemo(() => {
    const list = [...reelsList];
    if (feedFilter === "latest") {
      return list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }
    if (feedFilter === "top") {
      return list.sort((a, b) => (b.applauds_count || 0) - (a.applauds_count || 0));
    }
    // "foryou" algorithm score
    return list.sort((a, b) => {
      const scoreA = (a.applauds_count || 1) * 3;
      const scoreB = (b.applauds_count || 1) * 3;
      return scoreB - scoreA;
    });
  }, [reelsList, feedFilter]);

  // Reset index when feed filter changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [feedFilter]);

  const handleVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingVideo(true);
    toast.info("Uploading video clip directly to Cloudinary...");

    try {
      const uploadedUrl = await uploadMediaFile(file, "woodreels");
      setNewReel((prev) => ({ ...prev, video_url: uploadedUrl }));
      toast.success("✅ Video clip uploaded successfully to Cloudinary!");
    } catch (err) {
      console.error("Video Upload error", err);
      toast.error("Video upload failed. Please try a different MP4 clip.");
    } finally {
      setIsUploadingVideo(false);
    }
  };

  // Check if current logged-in user is a registered vendor/store creator or admin
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.session.user.id)
          .then(({ data: roles }) => {
            const roleList = (roles ?? []).map((r) => r.role);
            if (roleList.includes("vendor") || roleList.includes("admin")) {
              setIsVendor(true);
              supabase
                .from("vendor_profiles")
                .select("*")
                .eq("id", data.session.user.id)
                .maybeSingle()
                .then(({ data: vp }) => {
                  if (vp) {
                    setVendorProfile(vp);
                    setNewReel((prev) => ({
                      ...prev,
                      business_name: vp.business_name || "Official Workshop",
                      owner_name: vp.owner_name || "Admin Craftsman",
                      phone_number: vp.phone_number || "+91 98400 00000",
                      city: vp.city || "Chennai",
                      state: vp.state || "Tamil Nadu",
                    }));
                  } else {
                    setNewReel((prev) => ({
                      ...prev,
                      business_name: "CarpenterBullet Verified Workshop",
                      owner_name: "Master Artisan",
                      phone_number: "+91 98400 00000",
                      city: "Chennai",
                      state: "Tamil Nadu",
                    }));
                  }
                });
            }
          });
      }
    });
  }, []);

  // Lock body scroll while Reels is mounted
  useEffect(() => {
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = origOverflow;
    };
  }, []);

  // Sync muted state & Video playback
  useEffect(() => {
    sortedReels.forEach((r: any, idx: number) => {
      const v = videoRefs.current[r.id];
      if (v) {
        v.muted = muted;
        if (idx === currentIndex) {
          v.currentTime = 0;
          v.play().then(() => setIsPlaying(true)).catch(() => {
            v.muted = true;
            v.play().then(() => setIsPlaying(true)).catch(() => {});
          });
        } else {
          v.pause();
          v.currentTime = 0;
        }
      }
    });
  }, [currentIndex, sortedReels, muted]);

  // Keyboard controls (ArrowUp, ArrowDown, Space, M, L)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showUploadModal || showJoinPrompt || showCommentDrawer) return;
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === "input" || targetTag === "textarea") return;

      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === " " || e.key === "k" || e.key === "K") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleSound();
      } else if (e.key === "l" || e.key === "L") {
        e.preventDefault();
        const reel = sortedReels[currentIndex];
        if (reel) {
          toggleLike(reel.id, reel.applauds_count || 0);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, sortedReels, muted, isPlaying, showUploadModal, showJoinPrompt, showCommentDrawer]);

  const toggleSound = (id?: string) => {
    const targetId = id || sortedReels[currentIndex]?.id;
    const v = videoRefs.current[targetId];
    const newMuted = !muted;
    setMuted(newMuted);
    if (v) {
      v.muted = newMuted;
      if (!newMuted) {
        v.play().catch(() => {});
      }
    }
    toast.success(newMuted ? "🔇 Audio Muted" : "🔊 Sound Unmuted!");
  };

  const togglePlayPause = (id?: string) => {
    const targetId = id || sortedReels[currentIndex]?.id;
    const v = videoRefs.current[targetId];
    if (!v) return;

    if (v.paused) {
      v.play().catch(() => {});
      setIsPlaying(true);
      setShowPlayPauseBadge("play");
    } else {
      v.pause();
      setIsPlaying(false);
      setShowPlayPauseBadge("pause");
    }
    setTimeout(() => setShowPlayPauseBadge(null), 800);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleTimeUpdate = (id: string) => {
    const v = videoRefs.current[id];
    if (v && v.duration) {
      setProgress((v.currentTime / v.duration) * 100);
      setCurrentTimeStr(formatTime(v.currentTime));
      setDurationStr(formatTime(v.duration));
    }
  };

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
    e.stopPropagation();
    const v = videoRefs.current[id];
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    if (v && v.duration) {
      v.currentTime = percentage * v.duration;
      setProgress(percentage * 100);
    }
  };

  const handleNext = () => {
    setDirection("up");
    if (currentIndex < sortedReels.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    setDirection("down");
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Debounced desktop trackpad / wheel scroll
  const handleWheel = (e: React.WheelEvent) => {
    if (showUploadModal || showJoinPrompt || showCommentDrawer) return;
    if (isScrollingRef.current) return;

    if (Math.abs(e.deltaY) > 25) {
      isScrollingRef.current = true;
      if (e.deltaY > 0) {
        handleNext();
      } else {
        handlePrev();
      }
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 400);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    if (diff > 40) {
      handleNext();
    } else if (diff < -40) {
      handlePrev();
    }
    touchStartY.current = null;
  };

  const handleUploadButtonClick = () => {
    if (!isVendor) {
      setShowJoinPrompt(true);
    } else {
      setShowUploadModal(true);
    }
  };

  const handleDoubleTap = (id: string, count: number) => {
    setShowHeartAnim(id);
    setTimeout(() => setShowHeartAnim(null), 900);
    if (!userLiked[id]) {
      const nextLiked = { ...userLiked, [id]: true };
      setUserLiked(nextLiked);
      setLikes((prev) => ({ ...prev, [id]: (likes[id] ?? count) + 1 }));
      try {
        localStorage.setItem("cb_liked_reels", JSON.stringify(nextLiked));
      } catch (e) {}
    }
  };

  const toggleLike = (id: string, initialCount: number) => {
    const isLiked = userLiked[id];
    const count = likes[id] ?? initialCount;
    const nextLiked = { ...userLiked, [id]: !isLiked };

    setUserLiked(nextLiked);
    setLikes((prev) => ({ ...prev, [id]: isLiked ? count - 1 : count + 1 }));

    try {
      localStorage.setItem("cb_liked_reels", JSON.stringify(nextLiked));
    } catch (e) {}
  };

  const toggleBookmark = (id: string) => {
    const isSaved = savedReels[id];
    const nextSaved = { ...savedReels, [id]: !isSaved };
    setSavedReels(nextSaved);
    toast.success(isSaved ? "Removed from Saved WoodReels" : "Saved to your Bookmarks! 🔖");

    try {
      localStorage.setItem("cb_saved_reels", JSON.stringify(nextSaved));
    } catch (e) {}
  };

  const toggleFollow = (storeName: string) => {
    const isFollowing = following[storeName];
    const nextFollowing = { ...following, [storeName]: !isFollowing };
    setFollowing(nextFollowing);
    toast.success(isFollowing ? `Unfollowed ${storeName}` : `Now Following ${storeName}! ✨`);

    try {
      localStorage.setItem("cb_followed_vendors", JSON.stringify(nextFollowing));
    } catch (e) {}
  };

  const handleAddComment = (e: React.FormEvent, reelId: string) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const currentComments = commentsMap[reelId] || [];
    const commentObj = {
      id: `c-${Date.now()}`,
      name: vendorProfile?.business_name || "Furniture Enthusiast",
      text: newComment,
      time: "Just now",
    };

    setCommentsMap({
      ...commentsMap,
      [reelId]: [commentObj, ...currentComments],
    });
    setNewComment("");
    toast.success("Comment & Inquiry submitted!");
  };

  const handleWhatsAppInquiry = (reel: any) => {
    const text = encodeURIComponent(
      `Hello ${reel.business_name}! I saw your carpentry reel on WoodReels: "${reel.title}". I am interested in custom furniture work. Please share pricing and details!`
    );
    const cleanPhone = (reel.phone_number || "").replace(/[^0-9]/g, "");
    const phone = cleanPhone ? (cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone) : "919842188210";
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  };

  const handleShare = (reel: any) => {
    if (navigator.share) {
      navigator
        .share({
          title: reel.title,
          text: `Watch ${reel.business_name} on CarpenterBullet WoodReels: ${reel.title}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("WoodReel link copied to clipboard!");
    }
  };

  const toggleFullscreenMode = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handlePublishReel = (e: React.FormEvent) => {
    e.preventDefault();
    const createdItem = {
      id: `reel-user-${Date.now()}`,
      vendor_id: vendorProfile?.id || `user-${Date.now()}`,
      business_name: vendorProfile?.business_name || newReel.business_name || "Verified Workshop",
      owner_name: vendorProfile?.owner_name || newReel.owner_name || "Master Craftsman",
      city: vendorProfile?.city || newReel.city || "Chennai",
      state: vendorProfile?.state || newReel.state || "Tamil Nadu",
      phone_number: vendorProfile?.phone_number || newReel.phone_number || "+91 98400 00000",
      avatar_url: vendorProfile?.avatar_url || null,
      title: newReel.title,
      caption: newReel.caption,
      video_url:
        newReel.video_url || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      thumbnail_url:
        newReel.thumbnail_url || "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80",
      tags: newReel.tags_str.split(",").map((s) => s.trim()),
      applauds_count: 1,
      created_at: new Date().toISOString(),
    };

    // Save persistently to localStorage & state
    try {
      const stored = JSON.parse(localStorage.getItem("cb_user_reels") || "[]");
      localStorage.setItem("cb_user_reels", JSON.stringify([createdItem, ...stored]));
    } catch (err) {}

    setReelsList([createdItem, ...reelsList]);
    setCurrentIndex(0);
    setShowUploadModal(false);
    toast.success("🚀 Reel published! Your carpentry video is live on WoodReels!");
  };

  const currentReel = sortedReels[currentIndex] || sortedReels[0];
  const fieldCls =
    "w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20";

  // Instagram / TikTok vertical slide animation variants
  const slideVariants = {
    initial: (dir: "up" | "down") => ({
      y: dir === "up" ? "100%" : "-100%",
      opacity: 1,
    }),
    animate: {
      y: "0%",
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 32 },
    },
    exit: (dir: "up" | "down") => ({
      y: dir === "up" ? "-100%" : "100%",
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 32 },
    }),
  };

  const quickInquiries = [
    "💰 Request Price Quote",
    "📏 Custom Dimensions Inquiry",
    "🚚 Delivery & Installation in my City",
    "📞 Call Me Back Regarding Order",
  ];

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-50 h-[100dvh] w-screen bg-zinc-950 text-white flex items-center justify-center overflow-hidden select-none font-sans"
    >
      {/* Desktop Ambient Cinematic Blurred Background */}
      {currentReel && (
        <div className="hidden sm:block absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-30 filter blur-3xl scale-125 transition-all duration-700">
          <video
            src={currentReel.video_url}
            poster={currentReel.thumbnail_url}
            loop
            muted
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
      )}

      {/* Top Glassmorphic Navigation Bar */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between p-3.5 sm:px-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-full bg-zinc-900/80 border border-white/10 group-hover:bg-zinc-800 transition">
            <ArrowLeft className="h-4 w-4 text-white group-hover:text-amber-400 transition" />
          </div>
          <span className="font-display font-black text-lg tracking-tight text-amber-500 flex items-center gap-1.5 drop-shadow">
            <Flame className="h-5 w-5 animate-pulse text-amber-500 fill-amber-500" />
            WoodReels
          </span>
        </Link>

        {/* Feed Algorithm Filters */}
        <div className="flex items-center bg-black/70 backdrop-blur-xl rounded-full border border-white/15 p-1 shadow-2xl">
          <button
            onClick={() => setFeedFilter("foryou")}
            className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition flex items-center gap-1 cursor-pointer ${
              feedFilter === "foryou"
                ? "bg-amber-500 text-zinc-950 shadow-md scale-105"
                : "text-zinc-300 hover:text-white"
            }`}
          >
            <Sparkles className="h-3 w-3" /> For You
          </button>
          <button
            onClick={() => setFeedFilter("latest")}
            className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition flex items-center gap-1 cursor-pointer ${
              feedFilter === "latest"
                ? "bg-amber-500 text-zinc-950 shadow-md scale-105"
                : "text-zinc-300 hover:text-white"
            }`}
          >
            <Zap className="h-3 w-3" /> Latest
          </button>
          <button
            onClick={() => setFeedFilter("top")}
            className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition flex items-center gap-1 cursor-pointer ${
              feedFilter === "top"
                ? "bg-amber-500 text-zinc-950 shadow-md scale-105"
                : "text-zinc-300 hover:text-white"
            }`}
          >
            <Flame className="h-3 w-3" /> Top 🔥
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleUploadButtonClick}
            className="flex items-center gap-1 text-xs font-black text-zinc-950 bg-amber-500 hover:bg-amber-400 px-3.5 py-1.5 rounded-full transition shadow-xl active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[3]" />{" "}
            <span className="hidden sm:inline">Upload Reel</span>
            <span className="sm:hidden">Upload</span>
          </button>

          <button
            onClick={() => toggleSound(currentReel?.id)}
            className="p-2.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white backdrop-blur-md border border-zinc-700/60 transition shrink-0 cursor-pointer"
            aria-label="Toggle Sound"
            title="Mute / Unmute (Press M)"
          >
            {muted ? (
              <VolumeX className="h-4 w-4 text-amber-400 animate-pulse" />
            ) : (
              <Volume2 className="h-4 w-4 text-emerald-400 animate-bounce" />
            )}
          </button>

          <button
            onClick={toggleFullscreenMode}
            className="hidden sm:flex p-2.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white backdrop-blur-md border border-zinc-700/60 transition cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Floating Upload FAB for Mobile */}
      <button
        onClick={handleUploadButtonClick}
        className="sm:hidden fixed bottom-6 right-5 z-40 h-14 w-14 rounded-full bg-amber-500 text-zinc-950 shadow-2xl flex items-center justify-center border-2 border-amber-300 active:scale-90 transition cursor-pointer"
        aria-label="Upload Reel Mobile"
      >
        <Plus className="h-7 w-7 stroke-[3]" />
      </button>

      {/* Non-Vendor Join Workshop Lock Modal */}
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
                  Only registered workshop owners & master craftsmen can publish WoodReels and project posts. Open your digital shop to start posting video reels and direct phone leads!
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
                  className="text-xs text-zinc-400 hover:text-white py-1 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

              {vendorProfile && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-center gap-3 text-xs">
                  <Store className="h-5 w-5 text-amber-500 shrink-0" />
                  <div>
                    <span className="font-bold text-amber-400 block">{vendorProfile.business_name}</span>
                    <span className="text-[10px] text-zinc-400">
                      Verified Workshop • Tel: {vendorProfile.phone_number}
                    </span>
                  </div>
                </div>
              )}

              <form onSubmit={handlePublishReel} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Reel Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newReel.title}
                    onChange={(e) => setNewReel({ ...newReel, title: e.target.value })}
                    placeholder="e.g. Turning Teakwood Table Leg on Lathe Machine 🪵⚡"
                    className={fieldCls}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Caption / Story *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={newReel.caption}
                    onChange={(e) => setNewReel({ ...newReel, caption: e.target.value })}
                    placeholder="Watch hand-carving Teakwood bed frame in our workshop..."
                    className={fieldCls}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    📹 Video Clip File Upload *
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileSelect}
                      disabled={isUploadingVideo}
                      className="w-full text-xs text-zinc-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-zinc-950 hover:file:bg-amber-400 cursor-pointer disabled:opacity-50"
                    />
                    {isUploadingVideo && <Loader2 className="h-5 w-5 text-amber-400 animate-spin shrink-0" />}
                  </div>
                  <label className="text-[10px] text-zinc-400 block mb-0.5">Or paste direct Cloudinary / MP4 video link:</label>
                  <input
                    type="url"
                    required
                    value={newReel.video_url}
                    onChange={(e) => setNewReel({ ...newReel, video_url: e.target.value })}
                    placeholder="https://res.cloudinary.com/... or MP4 video URL"
                    className={fieldCls}
                  />
                </div>

                {/* Video Live Preview Box */}
                {newReel.video_url && (
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-2 overflow-hidden">
                    <span className="text-[10px] font-bold text-amber-400 block mb-1">Live Video Preview</span>
                    <video
                      src={newReel.video_url}
                      controls
                      className="w-full max-h-40 object-cover rounded-xl bg-black"
                    />
                  </div>
                )}

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
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-1.5 cursor-pointer"
                  >
                    🚀 Publish Reel Live
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Instagram Comments & Workshop Inquiry Drawer */}
      <AnimatePresence>
        {showCommentDrawer && currentReel && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-5 w-full max-w-md shadow-2xl h-[75vh] flex flex-col justify-between text-white"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-amber-500" />
                  <div>
                    <h3 className="font-bold text-sm">Comments & Shop Inquiries</h3>
                    <p className="text-[10px] text-zinc-400">{currentReel.business_name} • {currentReel.city}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCommentDrawer(false)}
                  className="p-1 rounded-full text-zinc-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Quick Inquiry Buttons */}
              <div className="py-2.5 overflow-x-auto flex gap-1.5 border-b border-zinc-800 scrollbar-none shrink-0">
                {quickInquiries.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNewComment(q)}
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 whitespace-nowrap transition active:scale-95 cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto py-3 space-y-4">
                {(
                  commentsMap[currentReel.id] || [
                    {
                      id: "sample-1",
                      name: "Rajesh S.",
                      text: "Beautiful hand carving! Can I order custom teak wood dimensions?",
                      time: "1h ago",
                    },
                    {
                      id: "sample-2",
                      name: "Kavitha M.",
                      text: "What is the delivery timeline for Coimbatore location?",
                      time: "3h ago",
                    },
                  ]
                ).map((c: any) => (
                  <div key={c.id} className="flex gap-3 items-start">
                    <div className="h-8 w-8 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/30">
                      {c.name.charAt(0)}
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex-1 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{c.name}</span>
                        <span className="text-[10px] text-zinc-500">{c.time}</span>
                      </div>
                      <p className="text-zinc-300 font-light">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Direct WhatsApp Lead & Comment Form */}
              <div className="pt-3 border-t border-zinc-800 space-y-2">
                <button
                  type="button"
                  onClick={() => handleWhatsAppInquiry(currentReel)}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4" /> Send Direct WhatsApp Inquiry to Workshop
                </button>

                <form onSubmit={(e) => handleAddComment(e, currentReel.id)} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Ask workshop a question..."
                    className="flex-1 rounded-full border border-zinc-800 bg-zinc-900 py-2.5 px-4 text-xs text-white outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="p-2.5 rounded-full bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 transition cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Full-Screen Reel Frame (Mobile View Container) */}
      <div className="relative w-full max-w-md h-full sm:h-[94vh] sm:rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl flex items-center justify-center z-10">
        <AnimatePresence initial={false} custom={direction}>
          {sortedReels.map((reel: any, index: number) => {
            if (index !== currentIndex) return null;
            const isLiked = userLiked[reel.id];
            const isSaved = savedReels[reel.id];
            const count = likes[reel.id] ?? reel.applauds_count;
            const isFollowing = following[reel.business_name];
            const commentCount = (commentsMap[reel.id] || []).length + 2;

            return (
              <motion.div
                key={reel.id}
                custom={direction}
                variants={slideVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="absolute inset-0 w-full h-full"
                onDoubleClick={() => handleDoubleTap(reel.id, reel.applauds_count)}
              >
                {/* Scrubbable Video Progress Bar */}
                <div
                  onClick={(e) => handleScrub(e, reel.id)}
                  className="absolute top-0 left-0 right-0 z-30 h-1.5 bg-white/20 cursor-pointer group"
                >
                  <div
                    className="h-full bg-amber-500 transition-all duration-100 ease-linear group-hover:bg-amber-400"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <video
                  ref={(el) => {
                    videoRefs.current[reel.id] = el;
                  }}
                  src={reel.video_url}
                  poster={reel.thumbnail_url}
                  loop
                  playsInline
                  onTimeUpdate={() => handleTimeUpdate(reel.id)}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => togglePlayPause(reel.id)}
                />

                {/* Center Play / Pause Indicator Badge Fade */}
                <AnimatePresence>
                  {showPlayPauseBadge && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1.2, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="absolute inset-0 m-auto h-20 w-20 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center z-40 pointer-events-none"
                    >
                      {showPlayPauseBadge === "play" ? (
                        <Play className="h-10 w-10 text-white fill-white ml-1" />
                      ) : (
                        <Pause className="h-10 w-10 text-white fill-white" />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Muted Audio Prompt Banner */}
                {muted && (
                  <div
                    onClick={() => toggleSound(reel.id)}
                    className="absolute top-16 left-0 right-0 mx-auto w-fit z-30 bg-black/75 backdrop-blur-md border border-amber-500/40 text-amber-300 text-[11px] font-bold px-3.5 py-1 rounded-full shadow-xl cursor-pointer animate-bounce flex items-center gap-1.5"
                  >
                    <VolumeX className="h-3.5 w-3.5" /> Tap anywhere to unmute audio 🔊
                  </div>
                )}

                {/* Double-tap Heart Explosion */}
                <AnimatePresence>
                  {showHeartAnim === reel.id && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1.5, opacity: 1 }}
                      exit={{ scale: 2.2, opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 m-auto h-24 w-24 flex items-center justify-center z-40 pointer-events-none"
                    >
                      <Heart className="h-24 w-24 fill-red-500 text-red-500 drop-shadow-2xl" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/40 pointer-events-none" />

                {/* Clean Right Side Action Bar */}
                <div className="absolute right-3 bottom-20 z-20 flex flex-col items-center gap-4">
                  {/* Like Button */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => toggleLike(reel.id, reel.applauds_count)}
                      className={`p-3 rounded-full backdrop-blur-md transition transform active:scale-75 cursor-pointer ${
                        isLiked
                          ? "bg-red-500/20 text-red-500 border border-red-500/40 shadow-lg"
                          : "bg-zinc-900/70 text-white border border-white/20 hover:bg-zinc-800"
                      }`}
                    >
                      <Heart className={`h-6 w-6 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                    </button>
                    <span className="text-[11px] font-bold text-white mt-1 drop-shadow">{count}</span>
                  </div>

                  {/* Comment / Inquiry Button */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => setShowCommentDrawer(true)}
                      className="p-3 rounded-full bg-zinc-900/70 text-white border border-white/20 hover:bg-zinc-800 backdrop-blur-md transition active:scale-90 cursor-pointer"
                    >
                      <MessageSquare className="h-6 w-6" />
                    </button>
                    <span className="text-[10px] font-bold text-zinc-300 mt-1">{commentCount}</span>
                  </div>

                  {/* WhatsApp Direct Lead */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => handleWhatsAppInquiry(reel)}
                      className="p-3 rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-500 transition transform active:scale-90 border border-emerald-400 cursor-pointer"
                      title="WhatsApp Inquiry"
                    >
                      <MessageCircle className="h-6 w-6 fill-white" />
                    </button>
                    <span className="text-[10px] font-bold text-emerald-400 mt-1 uppercase tracking-wider">
                      Chat
                    </span>
                  </div>

                  {/* Direct Phone Call */}
                  <div className="flex flex-col items-center">
                    <a
                      href={`tel:${reel.phone_number}`}
                      className="p-3 rounded-full bg-amber-500 text-zinc-950 shadow-lg hover:bg-amber-400 transition transform active:scale-90 border border-amber-300"
                      title="Call Workshop Tel"
                    >
                      <Phone className="h-5 w-5 fill-zinc-950" />
                    </a>
                    <span className="text-[10px] font-bold text-amber-400 mt-1 uppercase tracking-wider">
                      Call
                    </span>
                  </div>

                  {/* Bookmark Save Button */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => toggleBookmark(reel.id)}
                      className={`p-3 rounded-full backdrop-blur-md transition cursor-pointer ${
                        isSaved
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                          : "bg-zinc-900/70 text-white border border-white/20 hover:bg-zinc-800"
                      }`}
                    >
                      <Bookmark className={`h-5 w-5 ${isSaved ? "fill-amber-400" : ""}`} />
                    </button>
                  </div>

                  {/* Share Button */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => handleShare(reel)}
                      className="p-3 rounded-full bg-zinc-900/70 text-white border border-white/20 hover:bg-zinc-800 backdrop-blur-md transition cursor-pointer"
                    >
                      <Share2 className="h-5 w-5" />
                    </button>
                    <span className="text-[10px] font-bold text-zinc-300 mt-1">Share</span>
                  </div>
                </div>

                {/* Bottom Metadata & Audio Ticker */}
                <div className="absolute left-0 right-16 bottom-3 z-20 p-4 space-y-2.5">
                  {/* Store Header & Follow Button */}
                  <div className="flex items-center gap-2.5">
                    <Link to="/carpenter/$id" params={{ id: reel.vendor_id || "1" }}>
                      <div className="h-10 w-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold overflow-hidden shrink-0 shadow-md">
                        {reel.avatar_url ? (
                          <img src={reel.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Store className="h-5 w-5" />
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Link
                          to="/carpenter/$id"
                          params={{ id: reel.vendor_id || "1" }}
                          className="font-bold text-xs sm:text-sm text-white drop-shadow truncate hover:text-amber-400 transition"
                        >
                          {reel.business_name}
                        </Link>
                        <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 fill-amber-400/20 shrink-0" />
                        <button
                          onClick={() => toggleFollow(reel.business_name)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition cursor-pointer ${
                            isFollowing
                              ? "bg-zinc-800 text-zinc-300 border-zinc-700"
                              : "bg-white text-zinc-950 border-white hover:bg-zinc-200"
                          }`}
                        >
                          {isFollowing ? "Following ✓" : "+ Follow"}
                        </button>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-zinc-300 flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="h-3 w-3 text-amber-400 shrink-0" />
                        {reel.city}, {reel.state} • Master: {reel.owner_name}
                      </p>
                    </div>
                  </div>

                  {/* Reel Caption */}
                  <div>
                    <h2 className="font-bold text-xs sm:text-sm text-white leading-tight drop-shadow">
                      {reel.title}
                    </h2>
                    <p className="text-[11px] sm:text-xs text-zinc-300 leading-snug mt-0.5 line-clamp-2 drop-shadow font-light">
                      {reel.caption}
                    </p>
                  </div>

                  {/* Tags */}
                  {reel.tags && reel.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {reel.tags.map((tag: string, tidx: number) => (
                        <span
                          key={tidx}
                          className="text-[9px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Audio Ticker + Duration Indicator */}
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() => toggleSound(reel.id)}
                      className="flex items-center gap-2 text-[10px] text-zinc-300 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 w-fit cursor-pointer hover:border-amber-500/40 transition"
                    >
                      <Music className="h-3 w-3 text-amber-400 animate-spin" />
                      <span className="truncate max-w-[160px] font-mono text-[9px]">
                        Original Sound — {reel.business_name}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-zinc-400 bg-black/40 px-2 py-0.5 rounded-md border border-white/5">
                      {currentTimeStr} / {durationStr}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Vertical Chevron Navigation Controls */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2.5">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-2 rounded-full bg-zinc-900/80 text-white disabled:opacity-30 hover:bg-zinc-800 backdrop-blur-md border border-white/10 transition cursor-pointer"
            title="Previous Reel (ArrowUp)"
          >
            <ChevronUp className="h-5 w-5" />
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-full bg-zinc-900/80 text-white hover:bg-zinc-800 backdrop-blur-md border border-zinc-700/60 transition cursor-pointer"
            title="Next Reel (ArrowDown)"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
