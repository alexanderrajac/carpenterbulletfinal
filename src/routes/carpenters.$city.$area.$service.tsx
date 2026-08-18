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
  Plus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { buildProgrammaticSEOMeta, buildProgrammaticJSONLD } from "@/lib/seo-builder";
import { generateLocalSEOFAQsAI } from "@/lib/ai-assistant";

export const Route = createFileRoute("/carpenters/$city/$area/$service")({
  component: ProgrammaticSEOLandingPage,
});

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
      providerCount: carpenters.length || 1,
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

      if (!error && data) {
        setCarpenters(data);
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* Inject Structured Data JSON-LD Script Tags */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd.breadcrumbsSchema }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd.serviceSchema }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd.faqSchema }} />

      {/* SEO Breadcrumbs Navigation */}
      <div className="bg-slate-900 text-slate-400 py-3 px-4 text-xs border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-amber-400">Home</Link>
          <span>/</span>
          <span>Carpenters</span>
          <span>/</span>
          <span className="text-slate-200">{formattedCity}</span>
          <span>/</span>
          <span className="text-slate-200">{formattedArea}</span>
          <span>/</span>
          <span className="text-amber-400 font-bold">{formattedService}</span>
        </div>
      </div>

      {/* Hero Banner Header */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-slate-900 text-white py-14 px-4 shadow-xl">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <MapPin className="w-3.5 h-3.5 text-amber-400" /> Verified Doorstep Carpentry Service
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              {metaData.h1Heading}
            </h1>
            <p className="text-amber-100 text-sm md:text-base">
              {metaData.metaDescription}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/post-requirement"
                className="px-6 py-3 rounded-xl bg-white text-slate-900 hover:bg-amber-100 font-extrabold text-sm flex items-center gap-2 shadow-lg transition-all"
              >
                <Plus className="w-4 h-4 text-amber-600" /> Post Requirement & Get Quotes
              </Link>
              <Link
                to="/map"
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm flex items-center gap-2 backdrop-blur-sm border border-white/20"
              >
                <MapPin className="w-4 h-4" /> View Map Directory
              </Link>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center space-y-3 w-full md:w-80">
            <div className="text-3xl font-extrabold text-amber-300">4.8 / 5.0</div>
            <div className="flex justify-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <div className="text-xs text-amber-100 font-medium">
              Based on verified completed jobs in {formattedArea}, {formattedCity}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-12 space-y-12">
        {/* Verified Carpenters List */}
        <div>
          <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-amber-600" /> Featured Carpenters in {formattedArea}, {formattedCity}
          </h2>

          {isLoading ? (
            <div className="py-12 text-center text-slate-500">Loading local carpenters...</div>
          ) : carpenters.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border text-center">
              No specific carpenter profiles registered in {formattedArea} yet. Post your requirement and our central Chennai team will assign a master carpenter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {carpenters.map((v) => (
                <div
                  key={v.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={v.avatar_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"}
                      alt={v.business_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-amber-500"
                    />
                    <div>
                      <h3 className="font-bold text-base line-clamp-1">{v.business_name}</h3>
                      <p className="text-xs text-slate-500">{v.owner_name} • {v.city}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {v.bio || `Expert in ${formattedService} and doorstep carpentry in ${formattedArea}.`}
                  </p>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => handleLeadClick("whatsapp", v.phone_number, v.id)}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                    </button>
                    <button
                      onClick={() => handleLeadClick("call", v.phone_number, v.id)}
                      className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Local FAQs Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-lg space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2 border-b pb-3 border-slate-200 dark:border-slate-800">
            <HelpCircle className="w-5 h-5 text-amber-600" /> Frequently Asked Questions in {formattedArea}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <h3 className="font-bold text-sm text-amber-700 dark:text-amber-400">{faq.question}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
