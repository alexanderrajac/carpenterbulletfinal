import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  MapPin,
  Wrench,
  Star,
  ShieldCheck,
  CheckCircle2,
  Phone,
  MessageSquare,
  Sparkles,
  HelpCircle,
  ArrowRight,
  UserCheck,
  Clock,
  Award,
  ChevronRight,
  Check,
  Compass,
  Hammer,
  Shield,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { resolveImage } from "@/lib/product-images";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/carpenters/$city/$area")({
  head: ({ params }) => {
    const formattedCity = params.city.charAt(0).toUpperCase() + params.city.slice(1);
    const formattedArea = params.area.charAt(0).toUpperCase() + params.area.slice(1).replace(/-/g, " ");

    const canonicalUrl = `https://www.carpenterbullet.com/carpenters/${params.city}/${params.area}`;
    const titleTag = `#1 Best Carpenters in ${formattedArea}, ${formattedCity} | Doorstep in 20-30 Mins | CarpenterBullet`;
    const metaDescription = `Need an expert carpenter in ${formattedArea}, ${formattedCity}? Book 5-star verified master carpenters with upfront rate card from ₹89, 30-min arrival across ${formattedArea} & 30-day warranty. Free home visit available.`;
    const keywords = `carpenter in ${formattedArea}, carpenter near me, best carpenter ${formattedArea}, carpenter in ${formattedCity}, door repair ${formattedArea}, furniture assembly ${formattedArea}, cupboard repair ${formattedArea}, lock fitting ${formattedArea}, carpenter contact number ${formattedArea}, Justdial carpenter ${formattedArea}`;

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
  component: LocalAreaCarpentersPage,
});

// Area intelligence database for top South Chennai / Tamil Nadu localities
interface AreaData {
  pincode: string;
  landmarks: string[];
  responseTime: string;
  activeCarpenters: number;
  popularStreets: string;
}

const LOCAL_AREA_INTELLIGENCE: Record<string, AreaData> = {
  vandalur: {
    pincode: "600048",
    landmarks: ["Vandalur Zoo (Arignar Anna Zoological Park)", "Crescent Institute (B.S. Abdur Rahman University)", "Otteri Junction", "Kolapakkam", "Vandalur-Kelambakkam Road", "GST Road"],
    responseTime: "15 to 25 mins",
    activeCarpenters: 5,
    popularStreets: "Vandalur Flyover, Anna Nagar Vandalur, Crescent Main Road, Kolapakkam Road",
  },
  perungalathur: {
    pincode: "600063",
    landmarks: ["New Perungalathur Bus Stand", "Peerkankaranai", "Srinivasa Nagar", "Kamaraj Nagar", "GKM College Road", "GST Road Flyover"],
    responseTime: "15 to 25 mins",
    activeCarpenters: 6,
    popularStreets: "Gandhi Road, Krishna Nagar, Kalaignar Nedunsalai, Bharathi Nagar",
  },
  urapakkam: {
    pincode: "603210",
    landmarks: ["Karanai Puducherry Road", "Priya Nagar", "Revathipuram", "Urapakkam Railway Station", "Mahalakshmi Nagar", "GST Road"],
    responseTime: "20 to 30 mins",
    activeCarpenters: 4,
    popularStreets: "Priya Nagar 1st & 2nd Main Rd, Railway Station Rd, Shanthi Nagar",
  },
  tambaram: {
    pincode: "600045",
    landmarks: ["Tambaram Railway Junction", "Tambaram West Market", "Tambaram Sanatorium", "MEPZ Special Economic Zone", "Mudichur Road", "Selaiyur Link"],
    responseTime: "15 to 20 mins",
    activeCarpenters: 8,
    popularStreets: "Kakkan Street, Shanmugam Road, Rajaji Road, Gandhi Road",
  },
  guduvanchery: {
    pincode: "603202",
    landmarks: ["Nandivaram", "Mahindra World City Link", "Kayarambedu", "Vallancherry", "Guduvanchery Bus Stand", "EB Colony"],
    responseTime: "20 to 30 mins",
    activeCarpenters: 5,
    popularStreets: "Nandivaram Main Rd, Govindarajapuram, SRM University Road",
  },
  chromepet: {
    pincode: "600044",
    landmarks: ["MIT Campus", "Radhanagar", "Hasthinapuram", "CLRI Nagar", "Chromepet Station", "GST Road"],
    responseTime: "15 to 25 mins",
    activeCarpenters: 6,
    popularStreets: "Station Road, Radhanagar Main Rd, Nehru Nagar, Hasthinapuram Main Rd",
  },
  pallavaram: {
    pincode: "600043",
    landmarks: ["Zamin Pallavaram", "Old Trunk Road", "Keelkattalai Link Road", "Tirusulam Airport Corridor"],
    responseTime: "20 to 30 mins",
    activeCarpenters: 5,
    popularStreets: "Cantt Road, Darga Road, Anna Salai Pallavaram",
  },
  selaiyur: {
    pincode: "600073",
    landmarks: ["Camp Road Junction", "Bharat University", "Agaramthen Road", "Madambakkam Link"],
    responseTime: "15 to 25 mins",
    activeCarpenters: 5,
    popularStreets: "Velachery Main Road Selaiyur, Indira Nagar, Tellus Avenue",
  },
  medavakkam: {
    pincode: "600100",
    landmarks: ["Medavakkam Koot Road", "Perumbakkam Link", "Velachery Main Road", "Sowmya Nagar"],
    responseTime: "20 to 30 mins",
    activeCarpenters: 5,
    popularStreets: "Perumbakkam Main Rd, Vadakkupattu Rd, United Colony",
  },
  mudichur: {
    pincode: "600048",
    landmarks: ["Mudichur Main Road", "Mannivakkam Junction", "Varadharajapuram", "Old Mudichur"],
    responseTime: "15 to 25 mins",
    activeCarpenters: 4,
    popularStreets: "Mudichur High Road, Attai Company Stop, Mahalakshmi Nagar",
  },
};

const CHENNAI_SOUTH_AREAS = [
  { name: "Vandalur", slug: "vandalur", pincode: "600048" },
  { name: "Perungalathur", slug: "perungalathur", pincode: "600063" },
  { name: "Urapakkam", slug: "urapakkam", pincode: "603210" },
  { name: "Tambaram", slug: "tambaram", pincode: "600045" },
  { name: "Guduvanchery", slug: "guduvanchery", pincode: "603202" },
  { name: "Chromepet", slug: "chromepet", pincode: "600044" },
  { name: "Pallavaram", slug: "pallavaram", pincode: "600043" },
  { name: "Selaiyur", slug: "selaiyur", pincode: "600073" },
  { name: "Medavakkam", slug: "medavakkam", pincode: "600100" },
  { name: "Mudichur", slug: "mudichur", pincode: "600048" },
  { name: "Mannivakkam", slug: "mannivakkam", pincode: "600048" },
  { name: "Porur", slug: "porur", pincode: "600116" },
  { name: "Velachery", slug: "velachery", pincode: "600042" },
];

const LOCAL_SERVICES_RATE_CARD = [
  {
    name: "Wooden Door Fitting & Plane Trimming",
    price: "₹179 - ₹299",
    time: "30 - 45 mins",
    desc: "Door bottom scraping, alignment, hinges, strike plate adjustment & lock fitting",
    slug: "door",
    icon: "🚪",
  },
  {
    name: "Godrej / Mortise Door Lock Fitting",
    price: "₹249 - ₹569",
    time: "30 - 60 mins",
    desc: "Complete mortise lock chiseling, cylinder replacement, handle repair & night latch fitting",
    slug: "lock",
    icon: "🔒",
  },
  {
    name: "Cupboard & Modular Wardrobe Hinge Repair",
    price: "₹179 - ₹249",
    time: "30 mins",
    desc: "Soft-close hydraulic 3D hinge installation, drawer telescopic channel replacement",
    slug: "cupboard",
    icon: "🗄️",
  },
  {
    name: "Bed Assembly & Hydraulic Lift Repair",
    price: "₹449 - ₹1,299",
    time: "45 - 90 mins",
    desc: "King/Queen storage bed unboxing, gas lift spring replacement, slat reinforcement",
    slug: "bed",
    icon: "🛏️",
  },
  {
    name: "Modular Kitchen Wooden Cabinet Repair",
    price: "₹249 - ₹699",
    time: "45 - 90 mins",
    desc: "Sagging cupboard door alignment, chimney wooden duct boxing, under-sink moisture repair",
    slug: "kitchen",
    icon: "🍳",
  },
  {
    name: "Wall Drilling & Floating Shelf / Mirror Mount",
    price: "₹129 - ₹289",
    time: "20 - 45 mins",
    desc: "Concealed floating shelves, heavy vanity mirrors, wall frames, ceiling cloth hangers",
    slug: "shelf",
    icon: "🔨",
  },
];

function LocalAreaCarpentersPage() {
  const { city, area } = Route.useParams();
  const navigate = useNavigate();

  const formattedCity = city.charAt(0).toUpperCase() + city.slice(1);
  const formattedArea = area.charAt(0).toUpperCase() + area.slice(1).replace(/-/g, " ");

  const areaSlug = area.toLowerCase().replace(/[^a-z0-9]/g, "");
  const areaInfo = LOCAL_AREA_INTELLIGENCE[areaSlug] || {
    pincode: "600048",
    landmarks: ["Main Bus Stand", "Railway Station", "GST Road Corridor", "Market Area"],
    responseTime: "20 to 30 mins",
    activeCarpenters: 5,
    popularStreets: "Main Road, Gandhi Street, Station Road",
  };

  const canonicalUrl = `https://www.carpenterbullet.com/carpenters/${city}/${area}`;

  // Structured Data (JSON-LD)
  const jsonLdLocalBusiness = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `CarpenterBullet — Verified Carpenters in ${formattedArea}`,
    "image": "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=80",
    "telephone": "+918248651695",
    "priceRange": "₹89 - ₹1599",
    "url": canonicalUrl,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": formattedArea,
      "addressRegion": formattedCity,
      "postalCode": areaInfo.pincode,
      "addressCountry": "IN",
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "12.8924",
      "longitude": "80.0827",
    },
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
    "areaServed": [
      {
        "@type": "AdministrativeArea",
        "name": `${formattedArea}, ${formattedCity}`,
      },
    ],
  };

  const jsonLdFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `How fast can a carpenter arrive in ${formattedArea}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Our verified local master carpenters reach any address in ${formattedArea} within ${areaInfo.responseTime}. Same-day and emergency doorstep visits are readily available.`,
        },
      },
      {
        "@type": "Question",
        "name": `How much does a carpenter charge for door repair in ${formattedArea}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Door repair and plane trimming in ${formattedArea} starts at just ₹179. Godrej / mortise door lock replacement starts at ₹249. Fixed rate card with zero hidden charges.`,
        },
      },
      {
        "@type": "Question",
        "name": `Why is CarpenterBullet better than Justdial in ${formattedArea}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Unlike Justdial, which sells your phone number to 5-10 random agencies who spam you with calls, CarpenterBullet connects you directly with Master Carpenter Raja with fixed upfront prices, police-verified credentials, and a 30-day workmanship warranty.`,
        },
      },
    ],
  };

  const jsonLdBreadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.carpenterbullet.com" },
      { "@type": "ListItem", "position": 2, "name": "Carpenters", "item": "https://www.carpenterbullet.com/services" },
      { "@type": "ListItem", "position": 3, "name": formattedCity, "item": `https://www.carpenterbullet.com/carpenters/${city}/tambaram` },
      { "@type": "ListItem", "position": 4, "name": formattedArea, "item": canonicalUrl },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      {/* JSON-LD Schemas */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdLocalBusiness) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumbs) }} />

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="bg-zinc-900/90 border-b border-zinc-800 py-3 px-4 text-xs text-zinc-400">
        <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-amber-400">Home</Link>
          <ChevronRight className="h-3 w-3 text-zinc-600" />
          <Link to="/services" className="hover:text-amber-400">Services</Link>
          <ChevronRight className="h-3 w-3 text-zinc-600" />
          <span className="text-zinc-300">{formattedCity}</span>
          <ChevronRight className="h-3 w-3 text-zinc-600" />
          <span className="text-amber-400 font-bold">{formattedArea} ({areaInfo.pincode})</span>
        </div>
      </nav>

      {/* Hero Section — Hyper-Local Header */}
      <section className="relative bg-gradient-to-br from-amber-950 via-zinc-900 to-black text-white py-14 px-4 border-b border-zinc-800 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-6xl mx-auto relative z-10 grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <MapPin className="w-3.5 h-3.5 text-amber-400" /> Verified Doorstep Service in {formattedArea} ({areaInfo.pincode})
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping inline-block mr-1" />
                {areaInfo.activeCarpenters} Carpenters Active Now
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Best Carpenters in {formattedArea}, {formattedCity}
            </h1>

            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed font-light max-w-2xl">
              Door repair, Godrej lock replacement, modular kitchen cupboard hinges, and solid wood furniture assembly. 
              <span className="text-amber-400 font-semibold"> Direct doorstep arrival in {areaInfo.responseTime} across {formattedArea}.</span> Fixed rate card with 30-Day Workmanship Guarantee.
            </p>

            {/* Quick Metrics Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl">
                <span className="text-xs text-zinc-400 block">Avg Arrival</span>
                <span className="text-sm font-bold text-amber-400 flex items-center gap-1 mt-0.5">
                  <Clock className="h-3.5 w-3.5" /> {areaInfo.responseTime}
                </span>
              </div>
              <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl">
                <span className="text-xs text-zinc-400 block">Pricing</span>
                <span className="text-sm font-bold text-emerald-400 mt-0.5 block">Starts ₹89</span>
              </div>
              <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl">
                <span className="text-xs text-zinc-400 block">Warranty</span>
                <span className="text-sm font-bold text-blue-400 flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="h-3.5 w-3.5" /> 30 Days
                </span>
              </div>
              <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl">
                <span className="text-xs text-zinc-400 block">Rating</span>
                <span className="text-sm font-bold text-yellow-400 flex items-center gap-1 mt-0.5">
                  <Star className="h-3.5 w-3.5 fill-current" /> 4.9★ (1.4k+)
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 pt-4">
              <a
                href={`https://wa.me/918248651695?text=${encodeURIComponent(
                  `Hello Master Carpenter Raja, I need a carpenter at ${formattedArea}, ${formattedCity} (${areaInfo.pincode}). Please let me know your arrival time.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-6 py-3.5 rounded-full shadow-lg transition-transform hover:scale-105 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" /> WhatsApp Carpenter Raja (Instant)
              </a>

              <a
                href="tel:8248651695"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-sm font-bold px-6 py-3.5 rounded-full shadow-lg transition-transform hover:scale-105 cursor-pointer"
              >
                <Phone className="w-4 h-4" /> Call 8248651695
              </a>

              <Link
                to="/services"
                className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-semibold px-5 py-3.5 rounded-full border border-zinc-700 transition cursor-pointer"
              >
                View Full Rate Card <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Carpenter Profile Spotlight */}
          <div className="md:col-span-4 bg-zinc-900/90 border border-amber-500/30 rounded-3xl p-6 shadow-2xl relative">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 overflow-hidden shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
                  alt={`Master Carpenter Raja in ${formattedArea}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Lead Craftsman</span>
                <h3 className="font-display font-bold text-base text-white">Alexander Raja C</h3>
                <p className="text-xs text-zinc-400">15+ Years Master Experience</p>
                <div className="flex items-center gap-1 text-xs text-amber-400 font-bold mt-1">
                  <Star className="h-3 w-3 fill-current" /> 4.9 (480+ local jobs in {formattedArea})
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-800 space-y-2 text-xs text-zinc-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Police Background Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Carries complete power tools & hardware spare kits</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Serves {formattedArea} ({areaInfo.pincode}) daily</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800/80">
              <p className="text-[11px] text-zinc-400 italic">
                "Direct carpenter booking. No intermediary agency commission."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-16">
        {/* Local Area Coverage & Landmarks */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-white">
                Doorstep Coverage in {formattedArea} ({areaInfo.pincode})
              </h2>
              <p className="text-xs text-zinc-400">Fastest arrival across all residential colonies & apartments</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 space-y-2">
              <span className="font-bold text-amber-400 block text-xs uppercase tracking-wider">Key Landmarks Covered:</span>
              <ul className="space-y-1.5 text-zinc-300">
                {areaInfo.landmarks.map((landmark, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{landmark}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 space-y-2">
              <span className="font-bold text-emerald-400 block text-xs uppercase tracking-wider">Popular Residential Streets Covered:</span>
              <p className="text-zinc-300 leading-relaxed">
                {areaInfo.popularStreets}. Carpenters on bike with complete mobile toolkit reach your location within {areaInfo.responseTime}.
              </p>
              <div className="pt-2">
                <span className="text-[11px] text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-full inline-block border border-zinc-800">
                  📍 Covering all apartments, gated communities & individual houses
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Services & Transparent Rate Card */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Transparent Rates</span>
              <h2 className="font-display text-2xl font-bold text-white mt-1">
                Popular Carpentry Services in {formattedArea}
              </h2>
              <p className="text-xs text-zinc-400">Fixed rate card — no hidden surprises or brokerage fees</p>
            </div>
            <Link
              to="/services"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              View all 80 services <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LOCAL_SERVICES_RATE_CARD.map((svc) => (
              <div
                key={svc.name}
                className="bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{svc.icon}</span>
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                      {svc.price}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white">{svc.name}</h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{svc.desc}</p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {svc.time}
                  </span>
                  <Link
                    to="/carpenters/$city/$area/$service"
                    params={{ city, area, service: svc.slug }}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    Details & Book <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Justdial vs CarpenterBullet Comparison Matrix */}
        <section className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Why Residents Prefer Us</span>
            <h2 className="font-display text-2xl font-bold text-white">
              CarpenterBullet vs Justdial & Urban Company in {formattedArea}
            </h2>
            <p className="text-xs text-zinc-400">
              See why over 1,400+ households in {formattedArea} choose CarpenterBullet direct booking
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="py-3 px-4 font-semibold">Feature</th>
                  <th className="py-3 px-4 font-bold text-amber-400 bg-amber-500/10 rounded-t-xl">CarpenterBullet</th>
                  <th className="py-3 px-4 font-semibold">Justdial / Sulekha</th>
                  <th className="py-3 px-4 font-semibold">Urban Company</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                <tr>
                  <td className="py-3.5 px-4 font-medium text-white">Phone Privacy</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-semibold bg-amber-500/5">🔒 100% Private (Zero Spam Calls)</td>
                  <td className="py-3.5 px-4 text-red-400">❌ Number sold to 5-10 unknown agents</td>
                  <td className="py-3.5 px-4 text-zinc-300">App Required</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-white">Direct Carpenter Contact</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-semibold bg-amber-500/5">✅ Speak directly with Master Raja</td>
                  <td className="py-3.5 px-4 text-red-400">❌ Middleman commission brokers</td>
                  <td className="py-3.5 px-4 text-zinc-300">❌ Random assigned third-party</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-white">Pricing Transparency</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-semibold bg-amber-500/5">✅ Fixed rate card from ₹89</td>
                  <td className="py-3.5 px-4 text-red-400">❌ Hidden bargaining, arbitrary quotes</td>
                  <td className="py-3.5 px-4 text-zinc-300">High markup platform fees</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-white">Doorstep Warranty</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-semibold bg-amber-500/5">✅ 30-Day Workmanship Guarantee</td>
                  <td className="py-3.5 px-4 text-red-400">❌ No warranty after payment</td>
                  <td className="py-3.5 px-4 text-zinc-300">Limited 30 days</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-white">Arrival Time in {formattedArea}</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-semibold bg-amber-500/5">⚡ {areaInfo.responseTime} Guaranteed</td>
                  <td className="py-3.5 px-4 text-red-400">❌ Unpredictable (Hours or Next day)</td>
                  <td className="py-3.5 px-4 text-zinc-300">Scheduled slots only</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Local FAQ Accordion */}
        <section className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Common Questions</span>
            <h2 className="font-display text-2xl font-bold text-white">
              Carpentry Services in {formattedArea} — FAQs
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: `How quickly can a carpenter reach my house in ${formattedArea}?`,
                a: `Our master carpenters are stationed locally in ${formattedArea} and reach any apartment or individual house in ${areaInfo.responseTime}. For emergencies like stuck locks or broken doors, priority immediate dispatch is available.`,
              },
              {
                q: `What are the charges for carpentry work in ${formattedArea}?`,
                a: `Our doorstep rate card starts at just ₹89 for minor repairs, ₹179 for door plane trimming, ₹249 for lock replacement, and ₹449 for bed/cot assembly. We provide an exact upfront estimate before starting work.`,
              },
              {
                q: `Do your carpenters bring their own tools and spare parts?`,
                a: `Yes, Master Carpenter Raja and our technicians arrive with professional cordless power drills, chisels, planers, soft-close hydraulic hinges, door stoppers, screws, and adhesives.`,
              },
              {
                q: `Is there a warranty on woodwork and repairs in ${formattedArea}?`,
                a: `Every service completed through CarpenterBullet comes with a 30-Day Workmanship Guarantee. If any issue reoccurs within 30 days, we fix it free of charge.`,
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-2">
                <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>{faq.q}</span>
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Nearby Localities Interlinking Hub */}
        <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-4">
          <h3 className="font-semibold text-sm text-white">
            Looking for Carpenters in Adjacent South Chennai Areas?
          </h3>
          <p className="text-xs text-zinc-400">
            We provide 30-minute doorstep carpentry across the entire GST Road and South Chennai corridor:
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {CHENNAI_SOUTH_AREAS.filter((a) => a.slug !== areaSlug).map((loc) => (
              <Link
                key={loc.slug}
                to="/carpenters/$city/$area"
                params={{ city: "chennai", area: loc.slug }}
                className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 hover:text-amber-400 hover:border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <MapPin className="h-3 w-3 text-amber-500" />
                <span>Carpenter in {loc.name} ({loc.pincode})</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
