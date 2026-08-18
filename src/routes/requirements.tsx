import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  FileText,
  MapPin,
  IndianRupee,
  Calendar,
  Phone,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Wrench,
  Award,
  ChevronRight,
  UserCheck,
  ArrowRight,
  Plus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/requirements")({
  component: RequirementsPage,
});

function RequirementsPage() {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [quotesMap, setQuotesMap] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequirementsAndQuotes();
  }, []);

  const fetchRequirementsAndQuotes = async () => {
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();

      let query = supabase
        .from("job_requirements")
        .select("*")
        .order("created_at", { ascending: false });

      if (userData?.user?.id) {
        query = query.eq("customer_id", userData.user.id);
      }

      const { data: reqs, error: reqErr } = await query;
      if (reqErr) throw reqErr;

      setRequirements(reqs || []);
      if (reqs && reqs.length > 0) {
        setSelectedReqId(reqs[0].id);

        const reqIds = reqs.map((r) => r.id);
        const { data: quotes, error: qErr } = await supabase
          .from("quotes")
          .select("*, vendor_profiles(*)")
          .in("requirement_id", reqIds);

        if (!qErr && quotes) {
          const mapped: Record<string, any[]> = {};
          quotes.forEach((q) => {
            if (!mapped[q.requirement_id]) mapped[q.requirement_id] = [];
            mapped[q.requirement_id].push(q);
          });
          setQuotesMap(mapped);
        }
      }
    } catch (err: any) {
      console.error("Fetch requirements error:", err);
      toast.error("Failed to load posted requirements.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeadClick = async (type: "call" | "whatsapp", vendorPhone: string, vendorId: string) => {
    try {
      await supabase.from("lead_events").insert({
        event_type: type,
        vendor_id: vendorId,
        requirement_id: selectedReqId,
        customer_phone: "",
        city: "Chennai",
      });

      if (type === "whatsapp") {
        window.open(`https://wa.me/91${vendorPhone}?text=Hi!%20I%20saw%20your%20quote%20on%20CarpenterBullet%20and%20would%20like%20to%20discuss%20my%20carpentry%20requirement.`, "_blank");
      } else {
        window.location.href = `tel:${vendorPhone}`;
      }
    } catch (e) {
      console.error("Lead click error:", e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      <div className="bg-slate-900 text-white py-10 px-4 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Customer Dashboard
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
              Your Posted Requirements & Quotes
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Compare transparent quotes, material specs, and lead responses from local carpenters.
            </p>
          </div>
          <Link
            to="/post-requirement"
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg w-fit"
          >
            <Plus className="w-4 h-4" /> Post New Requirement
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">Loading your requirements...</div>
        ) : requirements.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-lg font-bold">No Requirements Posted Yet</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mt-1 mb-6">
              Post your carpentry or custom woodwork requirement to receive instant quotes from top-rated local craftsmen.
            </p>
            <Link
              to="/post-requirement"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md"
            >
              Post Requirement Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Requirements List */}
            <div className="lg:col-span-5 space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                Posted Jobs ({requirements.length})
              </h2>
              {requirements.map((req) => {
                const quotes = quotesMap[req.id] || [];
                const isSelected = selectedReqId === req.id;
                return (
                  <div
                    key={req.id}
                    onClick={() => setSelectedReqId(req.id)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-white dark:bg-slate-900 border-amber-600 shadow-lg ring-2 ring-amber-500/20"
                        : "bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-amber-500/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {req.requirement_number}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {quotes.length} Quote(s) Received
                      </span>
                    </div>

                    <h3 className="font-bold text-base line-clamp-1">{req.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{req.description}</p>

                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-600" /> {req.area}, {req.city}
                      </span>
                      <span className="flex items-center gap-1">
                        <IndianRupee className="w-3.5 h-3.5 text-emerald-600" /> ₹{req.budget_min_cents / 100} - ₹{req.budget_max_cents / 100}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Selected Requirement & Received Quotes Detail */}
            <div className="lg:col-span-7 space-y-6">
              {(() => {
                const currentReq = requirements.find((r) => r.id === selectedReqId);
                const quotes = quotesMap[selectedReqId || ""] || [];
                if (!currentReq) return null;

                return (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                          {currentReq.service_category}
                        </span>
                        <span className="text-xs text-slate-400">
                          Posted on {new Date(currentReq.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h2 className="text-2xl font-extrabold mt-1">{currentReq.title}</h2>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{currentReq.description}</p>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">LOCATION</span>
                          <span className="font-bold flex items-center gap-1"><MapPin className="w-3 h-3 text-amber-600" /> {currentReq.area}, {currentReq.city}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">BUDGET RANGE</span>
                          <span className="font-bold flex items-center gap-1"><IndianRupee className="w-3 h-3 text-emerald-600" /> ₹{currentReq.budget_min_cents / 100} - ₹{currentReq.budget_max_cents / 100}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">URGENCY</span>
                          <span className="font-bold uppercase text-amber-600">{currentReq.urgency}</span>
                        </div>
                      </div>
                    </div>

                    <hr className="border-slate-200 dark:border-slate-800" />

                    <div>
                      <h3 className="text-base font-bold flex items-center gap-2 mb-4">
                        <Award className="w-5 h-5 text-amber-600" /> Vendor Quotations ({quotes.length})
                      </h3>

                      {quotes.length === 0 ? (
                        <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
                          No vendor quotes submitted yet. Verified carpenters in {currentReq.city} are reviewing your requirement and will reply shortly.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {quotes.map((q) => {
                            const vendor = q.vendor_profiles;
                            return (
                              <div
                                key={q.id}
                                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-4 shadow-sm hover:shadow-md transition-all"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-200 dark:border-slate-700">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={vendor?.avatar_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"}
                                      alt={vendor?.business_name}
                                      className="w-10 h-10 rounded-full object-cover border border-amber-500"
                                    />
                                    <div>
                                      <h4 className="font-bold text-sm flex items-center gap-1.5">
                                        {vendor?.business_name || "Verified Carpenter"}
                                        <UserCheck className="w-4 h-4 text-emerald-500" />
                                      </h4>
                                      <p className="text-xs text-slate-500">{vendor?.city || "Chennai"} • {vendor?.owner_name || "Master Carpenter"}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-xs text-slate-400">Quoted Price</span>
                                    <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                      ₹{q.price_cents / 100}
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-xs">
                                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                    <span className="text-slate-400 block text-[10px]">COMPLETION TIME</span>
                                    <span className="font-bold flex items-center gap-1"><Clock className="w-3 h-3 text-amber-600" /> {q.estimated_days} Day(s)</span>
                                  </div>
                                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                    <span className="text-slate-400 block text-[10px]">WARRANTY</span>
                                    <span className="font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-600" /> {q.warranty_months || 6} Months</span>
                                  </div>
                                </div>

                                {q.materials_description && (
                                  <div className="text-xs p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
                                    <strong className="block mb-0.5">Materials & Scope:</strong>
                                    {q.materials_description}
                                  </div>
                                )}

                                <div className="flex items-center gap-3 pt-2">
                                  <button
                                    onClick={() => handleLeadClick("whatsapp", vendor?.phone_number || "8248651695", vendor?.id)}
                                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Carpenter
                                  </button>
                                  <button
                                    onClick={() => handleLeadClick("call", vendor?.phone_number || "8248651695", vendor?.id)}
                                    className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
                                  >
                                    <Phone className="w-3.5 h-3.5" /> Call Now
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
