import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wrench, Sparkles, ShieldCheck } from "lucide-react";

interface CarpenterLoadingScreenProps {
  /** Force show/hide state */
  isLoading?: boolean;
  /** Minimum display duration in ms to avoid flash */
  minDurationMs?: number;
  /** Custom loading subtext */
  customText?: string;
  /** Callback fired when splash finishes exit animation */
  onFinished?: () => void;
}

const LOADING_PHRASES = [
  "Initializing WoodVerse Marketplace...",
  "Loading Teak & Hardwood Catalog...",
  "Connecting Certified Carpenters...",
  "Preparing Custom Furniture Studio...",
  "Almost ready...",
];

export function CarpenterLoadingScreen({
  isLoading = true,
  minDurationMs = 1200,
  customText,
  onFinished,
}: CarpenterLoadingScreenProps) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(15);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [mountTime] = useState(() => Date.now());

  useEffect(() => {
    // Progress increment timer
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95;
        const bump = Math.floor(Math.random() * 15) + 10;
        return Math.min(prev + bump, 95);
      });
    }, 180);

    // Text rotation timer
    const phraseInterval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length);
    }, 450);

    return () => {
      clearInterval(progressInterval);
      clearInterval(phraseInterval);
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const elapsed = Date.now() - mountTime;
      const remaining = Math.max(0, minDurationMs - elapsed);

      const timer = setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setVisible(false);
          onFinished?.();
        }, 300);
      }, remaining);

      return () => clearTimeout(timer);
    }
  }, [isLoading, minDurationMs, mountTime, onFinished]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="woodverse-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden bg-[#0A0704] text-amber-50 select-none"
        >
          {/* Ambient Warm Glow Effects */}
          <div className="absolute -top-40 -left-40 h-[450px] w-[450px] rounded-full bg-amber-600/15 blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 h-[450px] w-[450px] rounded-full bg-orange-700/15 blur-[120px] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.08)_0%,transparent_70%)] pointer-events-none" />

          {/* Subtly Animated Wood Ring Glow */}
          <div className="relative flex flex-col items-center max-w-sm px-6 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative mb-6"
            >
              {/* Outer Pulsing Aura */}
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-600/20 blur-xl animate-pulse" />

              {/* Insignia Box */}
              <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-b from-[#2A1B0E] to-[#160E07] border border-amber-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(251,191,36,0.3)]">
                <Wrench className="h-9 w-9 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-amber-950 shadow-md">
                  <Sparkles className="h-3.5 w-3.5 fill-current" />
                </div>
              </div>
            </motion.div>

            {/* Brand Title */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-1"
            >
              <span className="block text-[11px] font-extrabold uppercase tracking-[0.3em] text-amber-400/80">
                CarpenterBullet
              </span>
              <h1 className="font-display text-2xl font-black tracking-tight text-white drop-shadow-md">
                WOOD<span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">VERSE</span>
              </h1>
            </motion.div>

            {/* Micro-phrase updates */}
            <div className="h-7 mt-4 flex items-center justify-center">
              <motion.p
                key={phraseIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.25 }}
                className="text-xs font-medium text-amber-200/70"
              >
                {customText || LOADING_PHRASES[phraseIndex]}
              </motion.p>
            </div>

            {/* Progress Bar */}
            <div className="w-56 mt-4 space-y-2">
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-amber-950/80 border border-amber-500/20 p-[1px]">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.8)]"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut", duration: 0.2 }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-amber-400/60">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-amber-500/80" /> Verified Platform
                </span>
                <span>{progress}%</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Compact skeleton/spinner component for in-page section loading
 */
export function CarpenterSectionLoader({ text = "Loading details..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center">
      <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
        <Wrench className="h-6 w-6 animate-spin" style={{ animationDuration: "3s" }} />
      </div>
      <p className="text-sm font-medium text-muted-foreground animate-pulse">{text}</p>
    </div>
  );
}
