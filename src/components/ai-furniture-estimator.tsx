import { useState } from "react";
import { Sparkles, Calculator, Hammer, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "@/lib/format";
import { Link } from "@tanstack/react-router";

export function AiFurnitureEstimator() {
  const [prompt, setPrompt] = useState("6x7 ft plywood wardrobe with mahogany finish");
  const [estimating, setEstimating] = useState(false);
  const [result, setResult] = useState<{
    materials: { name: string; qty: string; estCost: number }[];
    labourDays: number;
    labourCost: number;
    complexity: "Simple" | "Moderate" | "Intricate";
    totalEstimateCents: number;
  } | null>({
    materials: [
      { name: '18mm Commercial Plywood (BWP Grade)', qty: '4 Sheets (8x4 ft)', estCost: 1440000 },
      { name: '0.8mm Wood Veneer / Laminate Sheet', qty: '4 Sheets', estCost: 480000 },
      { name: 'Soft-close Hinges & Drawer Runners', qty: '1 Set', estCost: 350000 },
      { name: 'Adhesives, Screws & Hardware Fittings', qty: '1 Kit', estCost: 180000 },
    ],
    labourDays: 3,
    labourCost: 750000,
    complexity: "Moderate",
    totalEstimateCents: 3200000,
  });

  const handleEstimate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setEstimating(true);
    setResult(null);

    setTimeout(() => {
      // Deterministic realistic calculation based on user prompt keywords
      const pLower = prompt.toLowerCase();
      let totalCents = 2500000;
      let complexity: "Simple" | "Moderate" | "Intricate" = "Moderate";
      let days = 3;

      if (pLower.includes("teak") || pLower.includes("solid wood") || pLower.includes("carved")) {
        totalCents = 6500000;
        complexity = "Intricate";
        days = 5;
      } else if (pLower.includes("table") || pLower.includes("chair") || pLower.includes("shelf")) {
        totalCents = 1800000;
        complexity = "Simple";
        days = 2;
      } else if (pLower.includes("kitchen") || pLower.includes("modular")) {
        totalCents = 12000000;
        complexity = "Intricate";
        days = 7;
      }

      setResult({
        materials: [
          { name: pLower.includes("teak") ? "Solid CP Teak Hardwood" : "18mm Waterproof Plywood", qty: "3-5 Sheets/Planks", estCost: Math.round(totalCents * 0.45) },
          { name: "Premium Hardware, Hinges & Handles", qty: "1 Complete Set", estCost: Math.round(totalCents * 0.15) },
          { name: "Wood Stain, Polyurethane Polish & Sealant", qty: "2 Liters", estCost: Math.round(totalCents * 0.10) },
        ],
        labourDays: days,
        labourCost: Math.round(totalCents * 0.30),
        complexity,
        totalEstimateCents: totalCents,
      });
      setEstimating(false);
    }, 600);
  };

  return (
    <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-luxury overflow-hidden relative">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1.5 border border-primary/20">
          <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" /> AI Project Cost Estimator
        </span>
      </div>
      <h3 className="font-display text-2xl font-semibold text-foreground">
        Instant Furniture & Woodwork Cost Estimator
      </h3>
      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
        Describe your project dimensions and wood material to generate an instant breakdown of timber quantity, artisan labour days, and estimated cost.
      </p>

      <form onSubmit={handleEstimate} className="mt-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. 6x7 ft plywood wardrobe or 6-seater teak dining table"
            className="w-full rounded-2xl border border-border/80 bg-muted/30 py-3.5 pl-4 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
          />
          <Calculator className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <button
          type="submit"
          disabled={estimating}
          className="shrink-0 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-6 py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
        >
          {estimating ? "Calculating..." : "Generate Estimate"}
          <Sparkles className="h-4 w-4" />
        </button>
      </form>

      {/* Preset Quick Buttons */}
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="text-muted-foreground self-center font-medium">Try:</span>
        {[
          "6x7 ft Plywood Wardrobe",
          "6-Seater Teak Dining Table",
          "Modular Kitchen Cabinets",
          "Solid Teak Main Door",
        ].map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              setPrompt(preset);
              const event = { preventDefault: () => {} } as any;
              handleEstimate(event);
            }}
            className="px-2.5 py-1 rounded-lg border border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Result Display */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-6 border-t border-border/60 pt-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Material & Quantity Breakdown
                </h4>
                <div className="space-y-2">
                  {result.materials.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl border border-border/40 bg-muted/20 text-xs">
                      <div>
                        <span className="font-semibold text-foreground">{m.name}</span>
                        <span className="text-muted-foreground ml-2">({m.qty})</span>
                      </div>
                      <span className="font-mono font-bold text-foreground">{formatPrice(m.estCost)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">Estimated Budget</span>
                  <div className="font-display text-3xl font-bold text-primary mt-1">
                    {formatPrice(result.totalEstimateCents)}
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Artisan Labour ({result.labourDays} days):</span>
                      <span className="font-mono font-semibold text-foreground">{formatPrice(result.labourCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Project Complexity:</span>
                      <span className="font-bold text-amber-600 dark:text-amber-500">{result.complexity}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-primary/20">
                  <Link
                    to="/services"
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Request Carpenter Quote <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
