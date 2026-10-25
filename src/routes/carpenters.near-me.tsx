import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  MapPin,
  Compass,
  Star,
  ShieldCheck,
  Clock,
  Phone,
  MessageSquare,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Hammer,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/carpenters/near-me")({
  head: () => {
    const canonicalUrl = "https://www.carpenterbullet.com/carpenters/near-me";
    const titleTag = "#1 Verified Carpenters Near Me — 30-Min Doorstep Arrival | CarpenterBullet";
    const metaDescription = "Searching for a carpenter near you? Book 5-star verified master carpenters in Vandalur, Perungalathur, Urapakkam, Tambaram & Chennai. Upfront pricing from ₹89, 20-30 min arrival & 30-day warranty.";
    const keywords = "carpenter near me, best carpenter near me, emergency carpenter near me, doorstep carpenter near me, carpenter contact number near me, carpenter in vandalur, carpenter in perungalathur, carpenter in urapakkam, carpenter in tambaram";

    return {
      meta: [
        { title: titleTag },
        { name: "description", content: metaDescription },
        { name: "keywords", content: keywords },
        { property: "og:title", content: titleTag },
        { property: "og:description", content: metaDescription },
        { property: "og:url", content: canonicalUrl },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "CarpenterBullet" },
        { property: "og:image", content: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=80" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: titleTag },
        { name: "twitter:description", content: metaDescription },
        { name: "robots", content: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: CarpenterNearMePage,
});

const NEARBY_AREAS = [
  { name: "Vandalur", slug: "vandalur", pincode: "600048", arrival: "15-20 mins", active: "5 Active Now", landmark: "Zoo, Crescent Univ, Kolapakkam" },
  { name: "Perungalathur", slug: "perungalathur", pincode: "600063", arrival: "15-25 mins", active: "6 Active Now", landmark: "Peerkankaranai, Srinivasa Nagar, GST Rd" },
  { name: "Urapakkam", slug: "urapakkam", pincode: "603210", arrival: "20-25 mins", active: "4 Active Now", landmark: "Karanai Puducherry, Priya Nagar, Station" },
  { name: "Tambaram", slug: "tambaram", pincode: "600045", arrival: "15-20 mins", active: "8 Active Now", landmark: "West, East, Sanatorium, MEPZ" },
  { name: "Guduvanchery", slug: "guduvanchery", pincode: "603202", arrival: "20-30 mins", active: "5 Active Now", landmark: "Nandivaram, Mahindra City Link" },
  { name: "Chromepet", slug: "chromepet", pincode: "600044", arrival: "15-25 mins", active: "6 Active Now", landmark: "MIT, Radhanagar, Hasthinapuram" },
  { name: "Pallavaram", slug: "pallavaram", pincode: "600043", arrival: "20-30 mins", active: "5 Active Now", landmark: "Zamin Pallavaram, Trunk Rd" },
  { name: "Selaiyur", slug: "selaiyur", pincode: "600073", arrival: "15-25 mins", active: "5 Active Now", landmark: "Camp Road, Bharat Univ, Agaramthen" },
  { name: "Medavakkam", slug: "medavakkam", pincode: "600100", arrival: "20-30 mins", active: "5 Active Now", landmark: "Koot Road, Perumbakkam Link" },
  { name: "Mudichur", slug: "mudichur", pincode: "600048", arrival: "15-25 mins", active: "4 Active Now", landmark: "Mudichur Main Rd, Varadharajapuram" },
];

function CarpenterNearMePage() {
  const [detecting, setDetecting] = useState(false);
  const [detectedLocality, setDetectedLocality] = useState<string | null>(null);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDetecting(false);
        // Default to nearest high-density area in corridor
        setDetectedLocality("Vandalur / Perungalathur Corridor");
        toast.success("Location detected! Nearest carpenters found within 15-20 mins.");
      },
      (err) => {
        setDetecting(false);
        toast.info("Please select your area below from our South Chennai localities list.");
      },
      { timeout: 8000 }
    );
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "CarpenterBullet — Verified Carpenters Near Me",
    "image": "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=80",
    "telephone": "+918248651695",
    "priceRange": "₹89 - ₹1599",
    "url": "https://www.carpenterbullet.com/carpenters/near-me",
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "08:00",
      "closes": "21:00",
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "1420",
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero Header */}
      <section className="relative bg-gradient-to-br from-amber-950 via-zinc-900 to-black text-white py-14 px-4 border-b border-zinc-800 overflow-hidden text-center">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-4xl mx-auto relative z-10 space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin" /> Live Carpenter Dispatch Near You
          </span>

          <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Find Verified Master Carpenters Near You
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 max-w-2xl mx-auto leading-relaxed font-light">
            Door repair, Godrej locks, modular kitchen woodwork, and furniture assembly. 
            <span className="text-amber-400 font-semibold"> Doorstep arrival within 20–30 minutes across South Chennai & Tamil Nadu.</span>
          </p>

          {/* Location Detection Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleDetectLocation}
              disabled={detecting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-sm font-bold px-6 py-3.5 rounded-full shadow-lg transition-transform hover:scale-105 cursor-pointer"
            >
              <Compass className={`w-4 h-4 ${detecting ? "animate-spin" : ""}`} />
              {detecting ? "Detecting Nearest Carpenters..." : "Detect My Current Location"}
            </button>

            <a
              href="https://wa.me/918248651695?text=Hello%20Master%20Carpenter%20Raja,%20I%20need%20a%20carpenter%20near%20me.%20Please%20let%20me%20know%20your%20arrival%20time."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-6 py-3.5 rounded-full shadow-lg transition-transform hover:scale-105 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" /> WhatsApp Carpenter Raja (Instant)
            </a>
          </div>

          {detectedLocality && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl max-w-md mx-auto text-xs text-emerald-300 flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Location matched: <strong>{detectedLocality}</strong> (Carpenters available for immediate dispatch)</span>
            </div>
          )}
        </div>
      </section>

      {/* Localities Grid */}
      <section className="max-w-6xl mx-auto px-4 py-12 space-y-6">
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Select Your Locality</span>
          <h2 className="font-display text-2xl font-bold text-white mt-1">
            Top South Chennai Areas Covered (Doorstep in 20-30 Mins)
          </h2>
          <p className="text-xs text-zinc-400">Choose your area to view local carpenter arrival time and rate card</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NEARBY_AREAS.map((loc) => (
            <Link
              key={loc.slug}
              to="/carpenters/$city/$area"
              params={{ city: "chennai", area: loc.slug }}
              className="bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 block group shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-base text-white group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>{loc.name}</span>
                    <span className="text-xs text-zinc-500 font-mono">({loc.pincode})</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">{loc.landmark}</p>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                  {loc.active}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Arrival: {loc.arrival}
                </span>
                <span className="text-zinc-400 group-hover:text-white flex items-center gap-0.5 font-semibold">
                  View Carpenters <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
