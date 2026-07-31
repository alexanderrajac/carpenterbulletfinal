import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { listPublicVendorReels } from "@/lib/vendor.functions";
import {
  Phone,
  Heart,
  Share2,
  Volume2,
  VolumeX,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
  Store,
  MessageCircle,
  MapPin,
  Flame,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

const reelsQO = queryOptions({
  queryKey: ["public-vendor-reels"],
  queryFn: () => listPublicVendorReels(),
});

export const Route = createFileRoute("/reels")({
  head: () => ({
    meta: [
      { title: "WoodReels — Live Carpentry & Woodcraft Short Videos | CarpenterBullet" },
      {
        name: "description",
        content:
          "Watch master carpenters in action! Short woodworking videos, teakwood carving timelapses, lathe turning, custom door fitting, and direct shop contacts across India.",
      },
      { property: "og:title", content: "WoodReels — CarpenterBullet Woodcraft Video Showcase" },
      {
        property: "og:description",
        content: "Watch real carpentry timelapses and call master craftsmen directly on CarpenterBullet.",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(reelsQO);
  },
  component: ReelsPage,
});

function ReelsPage() {
  const { data: reels } = useSuspenseQuery(reelsQO);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [userLiked, setUserLiked] = useState<Record<string, boolean>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const currentReel = reels[currentIndex] || reels[0];

  useEffect(() => {
    reels.forEach((r: any, idx: number) => {
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
  }, [currentIndex, reels]);

  const handleNext = () => {
    if (currentIndex < reels.length - 1) {
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

  const handleShare = (reel: any) => {
    if (navigator.share) {
      navigator.share({
        title: reel.title,
        text: `Watch ${reel.business_name} on CarpenterBullet: ${reel.title}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Reel link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden select-none">
      {/* Structured Data for SEO / Video indexing */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoObject",
            name: currentReel.title,
            description: currentReel.caption,
            thumbnailUrl: [currentReel.thumbnail_url],
            uploadDate: currentReel.created_at,
            contentUrl: currentReel.video_url,
          }),
        }}
      />

      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display font-black text-xl tracking-tight text-amber-500 flex items-center gap-1.5">
            <Flame className="h-5 w-5 animate-pulse text-amber-500 fill-amber-500" />
            CarpenterBullet
          </span>
          <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
            WoodReels
          </span>
        </Link>
        
        <div className="flex items-center gap-3">
          <Link
            to="/feed"
            className="text-xs font-semibold text-zinc-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 transition"
          >
            📸 Work Feed
          </Link>
          <button
            onClick={() => setMuted(!muted)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition"
            aria-label="Toggle Sound"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Video Reel Container */}
      <div className="relative w-full max-w-md h-[88vh] sm:h-[840px] sm:rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl flex items-center justify-center">
        {reels.map((reel: any, index: number) => {
          const isActive = index === currentIndex;
          return (
            <motion.div
              key={reel.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 0.95 }}
              transition={{ duration: 0.3 }}
              className={`absolute inset-0 w-full h-full flex items-center justify-center ${
                isActive ? "pointer-events-auto z-10" : "pointer-events-none z-0"
              }`}
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

              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none" />

              {/* Right Action Buttons */}
              <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-5">
                {/* Like Button */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => toggleLike(reel.id, reel.applauds_count)}
                    className={`p-3 rounded-full backdrop-blur-md transition transform active:scale-75 ${
                      userLiked[reel.id]
                        ? "bg-red-500/20 text-red-500 border border-red-500/40"
                        : "bg-black/40 text-white border border-white/20 hover:bg-black/60"
                    }`}
                  >
                    <Heart
                      className={`h-6 w-6 ${userLiked[reel.id] ? "fill-red-500 text-red-500" : ""}`}
                    />
                  </button>
                  <span className="text-[11px] font-bold text-white mt-1 shadow-sm">
                    {likes[reel.id] ?? reel.applauds_count}
                  </span>
                </div>

                {/* Call Shop Tel Button */}
                <div className="flex flex-col items-center">
                  <a
                    href={`tel:${reel.phone_number}`}
                    className="p-3 rounded-full bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 transition transform active:scale-90 border border-emerald-400/40"
                    title="Call Workshop Tel"
                  >
                    <Phone className="h-6 w-6 animate-pulse" />
                  </a>
                  <span className="text-[10px] font-bold text-emerald-400 mt-1 uppercase tracking-wider">
                    Call Shop
                  </span>
                </div>

                {/* WhatsApp Button */}
                <div className="flex flex-col items-center">
                  <a
                    href={`https://wa.me/${reel.phone_number?.replace(/\D/g, "")}?text=Hi%20${encodeURIComponent(
                      reel.business_name
                    )},%20I%20saw%20your%20woodworking%20reel%20on%20CarpenterBullet:%20${encodeURIComponent(
                      reel.title
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 transition transform active:scale-90 border border-green-400/40"
                  >
                    <MessageCircle className="h-6 w-6" />
                  </a>
                  <span className="text-[10px] font-bold text-green-400 mt-1 uppercase tracking-wider">
                    WhatsApp
                  </span>
                </div>

                {/* Share Button */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => handleShare(reel)}
                    className="p-3 rounded-full bg-black/40 text-white border border-white/20 hover:bg-black/60 backdrop-blur-md transition"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  <span className="text-[10px] font-bold text-zinc-300 mt-1">Share</span>
                </div>
              </div>

              {/* Bottom Details */}
              <div className="absolute left-0 right-16 bottom-4 z-20 p-5 space-y-3">
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
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded">
                        <Award className="h-2.5 w-2.5" /> Club Member
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-300 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-amber-400" />
                      {reel.city}, {reel.state} • Master: {reel.owner_name}
                    </p>
                  </div>
                </div>

                <div>
                  <h2 className="font-bold text-sm text-white leading-tight drop-shadow">
                    {reel.title}
                  </h2>
                  <p className="text-xs text-zinc-300 leading-normal mt-1 line-clamp-2 drop-shadow font-light">
                    {reel.caption}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {(reel.tags || []).map((t: string) => (
                    <span key={t} className="text-[10px] text-amber-400 font-semibold bg-black/40 px-2 py-0.5 rounded-full border border-amber-500/20">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Up / Down Navigation Controls */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-2 rounded-full bg-black/50 text-white disabled:opacity-30 hover:bg-black/80 backdrop-blur-md transition border border-white/10"
            aria-label="Previous Reel"
          >
            <ChevronUp className="h-5 w-5" />
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-black/80 backdrop-blur-md transition border border-white/10"
            aria-label="Next Reel"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
