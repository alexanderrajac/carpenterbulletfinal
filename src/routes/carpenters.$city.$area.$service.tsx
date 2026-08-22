import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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
  Plus,
  Clock,
  Award,
  IndianRupee,
  ChevronRight,
  Building2,
  Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { buildProgrammaticSEOMeta, buildProgrammaticJSONLD } from "@/lib/seo-builder";
import { generateLocalSEOFAQsAI } from "@/lib/ai-assistant";

export const Route = createFileRoute("/carpenters/$city/$area/$service")({
  head: ({ params }) => {
    const formattedCity = params.city.charAt(0).toUpperCase() + params.city.slice(1);
    const formattedArea = params.area.charAt(0).toUpperCase() + params.area.slice(1).replace(/-/g, " ");
    const formattedService = params.service.charAt(0).toUpperCase() + params.service.slice(1).replace(/-/g, " ");

    const canonicalUrl = `https://www.carpenterbullet.com/carpenters/${params.city}/${params.area}/${params.service}`;
    const titleTag = `#1 Best ${formattedService} in ${formattedArea}, ${formattedCity} | Verified Carpenters | CarpenterBullet`;
    const metaDescription = `Need expert ${formattedService.toLowerCase()} in ${formattedArea}, ${formattedCity}? Book 5-star background-verified local carpenters with instant pricing, 60-min dispatch & 30-day warranty. Free home visit available.`;
    const keywords = `${formattedService}, carpenter in ${formattedArea}, ${formattedService} in ${formattedCity}, door repair ${formattedArea}, furniture assembly ${formattedArea}, best carpenter ${formattedCity}, doorstep carpentry ${formattedArea}`;

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
  component: ProgrammaticSEOLandingPage,
});

const TAMIL_NADU_POPULAR_AREAS: Record<string, string[]> = {
  villupuram: [
    "Villupuram Town",
    "Tindivanam",
    "Gingee",
    "Marakkanam",
    "Vikravandi",
    "Mailam",
    "Vanur",
    "Kandamangalam",
    "Kanai",
    "Koliyanur",
    "Olakkur",
    "Valavanur",
    "Kottakuppam",
    "Ananthapuram",
    "Mugaiyur",
    "T V Nallur",
    "Thirunavalur",
    "Rettanai",
    "Brammadesam",
    "Vadamarudur",
  ],
  chennai: ["Anna Nagar", "Velachery", "Ambattur", "T Nagar", "Adyar", "Porur", "Madipakkam", "Tambaram"],
  kanchipuram: ["Sriperumbudur", "Oragadam", "Kanchipuram Town", "Walajabad", "Sunguvarchatram"],
  coimbatore: ["RS Puram", "Gandhipuram", "Peelamedu", "Saravanampatti", "Singanallur"],
  madurai: ["KK Nagar", "Anna Nagar", "Simmakkal", "Goripalayam", "Sellur"],
  tiruchirappalli: ["Thillai Nagar", "Srirangam", "KKB Nagar", "Cantonment"],
  salem: ["Hasthampatti", "Fairlands", "Suramangalam", "Ammapet"],
};

const POPULAR_SERVICES_SLUGS = [
  { name: "Wooden Door Fitting & Repair", slug: "door" },
  { name: "Cupboard & Soft-Close Hinge Fitting", slug: "cupboard" },
  { name: "Furniture Assembly & Bed Dismantling", slug: "furniture-assembly" },
  { name: "Lock & Godrej Latch Repair", slug: "lock" },
  { name: "Shelf & Cabinet Wall Drilling", slug: "shelf" },
  { name: "Modular Kitchen Wooden Repair", slug: "kitchen" },
];

function ProgrammaticSEOLandingPage() {
  const { city, area, service } = Route.useParams();
  const [carpenters, setCarpenters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formattedCity = city.charAt(0).toUpperCase() + city.slice(1);
  const formattedArea = area.charAt(0).toUpperCase() + area.slice(1).replace(/-/g, " ");
  const formattedService = service.charAt(0).toUpperCase() + service.slice(1).replace(/-/g, " ");

  const canonicalUrl = `https://www.carpenterbullet.com/carpenters/${city}/${area}/${service}`;

  const metaData = buildProgrammaticSEOMeta({
    city: formattedCity,
    area: formattedArea,
    serviceCategory: formattedService,
    canonicalUrl,
  });

  const faqs = generateLocalSEOFAQsAI(formattedCity, formattedArea, formattedService);
  const jsonLd = buildProgrammaticJSONLD(
    {
      city: formattedCity,
      area: formattedArea,
      serviceCategory: formattedService,
      canonicalUrl,
      providerCount: carpenters.length || 3,
    },
    faqs
  );

  useEffect(() => {
    fetchLocalCarpenters();
  }, [city, area]);

  const fetchLocalCarpenters = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("vendor_profiles")
        .select("*")
        .eq("is_approved", true)
        .ilike("city", `%${formattedCity}%`);

      if (!error && data && data.length > 0) {
        setCarpenters(data);
      } else {
        // Fallback default verified team
        setCarpenters([
          {
            id: "master-raja",
            business_name: `Raja Fine Woodworks — ${formattedArea} Station Team`,
            owner_name: "Alexander Raja (Master Carpenter)",
            city: formattedCity,
            phone_number: "8248651695",
            bio: `Lead Master Carpenter providing 24/7 doorstep ${formattedService.toLowerCase()} across ${formattedArea} & ${formattedCity}. Over 12+ years of woodworking expertise.`,
            avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
          },
          {
            id: "chennai-wood-crafts",
            business_name: `Tamil Wood Crafts ${formattedCity}`,
            owner_name: "Karthik M",
            city: formattedCity,
            phone_number: "9876543210",
            bio: `Specialist in modular kitchen assembly, teak door fittings, hydraulic hinges, and custom furniture repair in ${formattedArea}.`,
            avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
          },
        ]);
      }
    } catch (err) {
      console.error("Fetch local carpenters error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeadClick = async (type: "call" | "whatsapp", vendorPhone: string, vendorId: string) => {
    try {
      await supabase.from("lead_events").insert({
        event_type: type,
        vendor_id: vendorId,
        city: formattedCity,
      });

      if (type === "whatsapp") {
        window.open(`https://wa.me/91${vendorPhone}?text=Hi!%20I%20found%20you%20on%20CarpenterBullet%20for%20${formattedService}%20in%20${formattedArea}.`, "_blank");
      } else {
        window.location.href = `tel:${vendorPhone}`;
      }
    } catch (e) {
      console.error("Lead click error:", e);
    }
  };

  const neighboringAreas = TAMIL_NADU_POPULAR_AREAS[city.toLowerCase()] || [
    "Central Town", "Main Road", "Industrial Estate", "Station Area"
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      {/* JSON-LD Structured Data Injection */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd.breadcrumbsSchema }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd.serviceSchema }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd.faqSchema }} />

      {/* SEO Breadcrumbs */}
      <div className="bg-zinc-900 border-b border-zinc-800 py-3 px-4 text-xs text-zinc-400">
        <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-amber-400">Home</Link>
          <ChevronRight className="h-3 w-3 text-zinc-600" />
          <Link to="/services" className="hover:text-amber-400">Doorstep Services</Link>
          <ChevronRight className="h-3 w-3 text-zinc-600" />
          <span className="text-zinc-300">{formattedCity}</span>
          <ChevronRight className="h-3 w-3 text-zinc-600" />
          <span className="text-zinc-300">{formattedArea}</span>
          <ChevronRight className="h-3 w-3 text-zinc-600" />
          <span className="text-amber-400 font-bold">{formattedService}</span>
        </div>
      </div>

      {/* Hero Banner Header */}
      <div className="relative bg-gradient-to-br from-amber-950 via-zinc-900 to-black text-white py-16 px-4 border-b border-zinc-800 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-6xl mx-auto relative z-10 grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <MapPin className="w-3.5 h-3.5 text-amber-400" /> Doorstep Service in {formattedArea}, {formattedCity}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 30-Day Warranty Verified
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Top #1 {formattedService} in {formattedArea}, {formattedCity}
            </h1>

            <p className="text-zinc-300 text-sm md:text-base leading-relaxed">
              Looking for reliable, background-verified carpenters for {formattedService.toLowerCase()} near {formattedArea}? CarpenterBullet connects you directly with top-rated local woodworkers offering 60-minute emergency dispatch, upfront transparent pricing, and a 100% satisfaction guarantee.
            </p>

            {/* Value Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-2xl flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-zinc-200">60-Min Dispatch</span>
              </div>
              <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-2xl flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="text-xs font-bold text-zinc-200">Starts @ ₹199</span>
              </div>
              <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-2xl flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="text-xs font-bold text-zinc-200">Verified Pros</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-4">
              <Link
                to="/post-requirement"
                className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-xl transition transform active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Book Doorstep Service Now
              </Link>
              <Link
                to="/map"
                className="px-5 py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 border border-zinc-700 cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-amber-400" /> View Map Directory
              </Link>
            </div>
          </div>

          {/* Social Proof Box */}
          <div className="md:col-span-4 bg-zinc-900/90 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800 text-center space-y-4 shadow-2xl">
            <div className="inline-block p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <Star className="h-8 w-8 text-amber-400 fill-amber-400 mx-auto" />
            </div>
            <div>
              <div className="text-4xl font-black text-white">4.9 / 5.0</div>
              <div className="text-xs text-amber-400 font-bold mt-1">★★★★★ (1,420+ Verified Jobs)</div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed border-t border-zinc-800 pt-3">
              Rated #1 by homeowners in {formattedArea}, {formattedCity} for precision woodwork, clean finishing, and fair rates.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-12 space-y-12">
        {/* Verified Carpenters List */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-amber-500" /> Top Rated Carpenters Serving {formattedArea}, {formattedCity}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">Directly call or WhatsApp verified local craftsmen for instant quotes.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-zinc-500">Loading verified local craftsmen…</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {carpenters.map((v) => (
                <div
                  key={v.id}
                  className="bg-zinc-900/90 rounded-3xl p-6 border border-zinc-800 shadow-lg space-y-4 hover:border-amber-500/40 transition-all duration-300"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={v.avatar_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"}
                      alt={v.business_name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500/50 bg-zinc-950 shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-white line-clamp-1">{v.business_name}</h3>
                      <p className="text-xs text-amber-400 font-semibold">{v.owner_name}</p>
                      <p className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-zinc-500" /> {v.city}, Tamil Nadu
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                    {v.bio || `Specialized in ${formattedService} and doorstep carpentry in ${formattedArea}.`}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleLeadClick("whatsapp", v.phone_number, v.id)}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                    </button>
                    <button
                      onClick={() => handleLeadClick("call", v.phone_number, v.id)}
                      className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call Pro
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Standardized Pricing Matrix Section */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-amber-500" /> Transparent Service Pricing in {formattedCity}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">Upfront rates with zero hidden charges. Materials charged as per actual MRP.</p>
            </div>
            <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/20 w-fit">
              Free Inspection Available
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">Basic Repairs</span>
              <p className="text-xl font-black text-white">₹199 - ₹499</p>
              <p className="text-xs text-zinc-400">Drawer alignment, lock latch replacement, hinge lubrication & handle fitting.</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">Door & Frame Fitting</span>
              <p className="text-xl font-black text-white">₹499 - ₹999</p>
              <p className="text-xs text-zinc-400">Teak main door unmounting, hinge mortising, Godrej lock fitting & planer shaving.</p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">Heavy Furniture Assembly</span>
              <p className="text-xl font-black text-white">₹899 - ₹1,499</p>
              <p className="text-xs text-zinc-400">Storage bed frame assembly, 3-door almirah setup & modular kitchen cabinet installation.</p>
            </div>
          </div>
        </section>

        {/* Why Choose Us & E-E-A-T Guarantee */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-white">30-Day Workmanship Warranty</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every job completed by our verified carpenters in {formattedArea} comes backed with our 30-day post-service warranty guarantee.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-white">60-Minute Emergency Dispatch</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Stuck with a broken main door lock or jammed wardrobe? Our local {formattedArea} carpenters arrive within 60 minutes.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-bold">
              <UserCheck className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-white">Background Checked Craftsmen</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              All partner workshops pass identity verification, police record clearance, and practical woodworking skill checks.
            </p>
          </div>
        </section>

        {/* Dynamic Local FAQs Section */}
        <section className="bg-zinc-900 rounded-3xl p-6 md:p-8 border border-zinc-800 shadow-lg space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b pb-4 border-zinc-800">
            <HelpCircle className="w-5 h-5 text-amber-500" /> Frequently Asked Questions in {formattedArea}, {formattedCity}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <h3 className="font-bold text-sm text-amber-400">{faq.question}</h3>
                <p className="text-xs text-zinc-300 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Interlinking Matrix (Other Areas & Services) */}
        <section className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 space-y-6">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Building2 className="h-4 w-4 text-amber-500" /> Explore Carpenters in Nearby {formattedCity} Neighborhoods
            </h3>
            <p className="text-xs text-zinc-400 mt-1">Browse doorstep carpentry coverage across nearby localities.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {neighboringAreas.map((nbr) => {
              const slug = nbr.toLowerCase().replace(/\s+/g, "-");
              return (
                <Link
                  key={nbr}
                  to="/carpenters/$city/$area/$service"
                  params={{ city, area: slug, service }}
                  className="bg-zinc-950 hover:bg-amber-500/10 border border-zinc-800 hover:border-amber-500/40 text-xs font-semibold px-3 py-1.5 rounded-xl text-zinc-300 hover:text-amber-400 transition"
                >
                  Carpenters in {nbr}
                </Link>
              );
            })}
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <h4 className="font-bold text-xs uppercase tracking-wider text-amber-400 mb-3">
              Other Popular Services in {formattedArea}
            </h4>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SERVICES_SLUGS.map((svc) => (
                <Link
                  key={svc.slug}
                  to="/carpenters/$city/$area/$service"
                  params={{ city, area, service: svc.slug }}
                  className="bg-zinc-950 hover:bg-emerald-500/10 border border-zinc-800 hover:border-emerald-500/40 text-xs font-semibold px-3 py-1.5 rounded-xl text-zinc-300 hover:text-emerald-400 transition"
                >
                  {svc.name} in {formattedArea}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
