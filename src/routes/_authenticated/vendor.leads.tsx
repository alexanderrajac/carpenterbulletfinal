import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  MessageSquare,
  MapPin,
  IndianRupee,
  Calendar,
  Clock,
  Send,
  CheckCircle2,
  Phone,
  Filter,
  ShieldCheck,
  User,
  Sparkles,
  Plus,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generateVendorQuoteDraftAI } from "@/lib/ai-assistant";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/vendor/leads")({
  component: VendorLeadsPage,
});

function VendorLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [crmFilter, setCrmFilter] = useState("ALL");
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);

  // Quote Form State
  const [quoteForm, setQuoteForm] = useState({
    priceCents: 250000,
    laborCents: 100000,
    materialsCents: 150000,
    estimatedDays: 2,
    materialsDescription: "Includes soft-close hydraulic hinges and stainless steel hardware.",
    warrantyMonths: 6,
    notes: "Direct doorstep service with 6 months warranty.",
  });

  const crmStatuses = ["ALL", "NEW", "CONTACTED", "QUOTED", "WON", "LOST", "COMPLETED"];

  useEffect(() => {
    fetchLeadsAndQuotes();
  }, [crmFilter]);

  const fetchLeadsAndQuotes = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from("job_requirements").select("*").order("created_at", { ascending: false });
      
      if (crmFilter !== "ALL") {
        query = query.eq("status", crmFilter);
      }

      const { data: reqs, error } = await query;
      if (!error && reqs) {
        setLeads(reqs);
        if (reqs.length > 0 && !selectedLead) {
          setSelectedLead(reqs[0]);
        }
      }

      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        const { data: myQuotes } = await supabase
          .from("quotes")
          .select("*")
          .eq("vendor_id", userData.user.id);
        if (myQuotes) setQuotes(myQuotes);
      }
    } catch (err) {
      console.error("Fetch leads error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyAIQuoteDraft = () => {
    if (!selectedLead) return;
    const aiDraft = generateVendorQuoteDraftAI({
      requirementTitle: selectedLead.title,
      serviceCategory: selectedLead.service_category,
      budgetMin: selectedLead.budget_min_cents / 100,
      budgetMax: selectedLead.budget_max_cents / 100,
      city: selectedLead.city,
    });

    setQuoteForm({
      priceCents: aiDraft.priceCents,
      laborCents: aiDraft.laborCents,
      materialsCents: aiDraft.materialsCents,
      estimatedDays: aiDraft.estimatedDays,
      materialsDescription: aiDraft.materialsDescription,
      warrantyMonths: aiDraft.warrantyMonths,
      notes: aiDraft.notes,
    });

    toast.success("AI Quote draft generated!");
  };

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("job_requirements")
        .update({ status: newStatus })
        .eq("id", leadId);

      if (error) throw error;

      toast.success(`Lead status updated to ${newStatus}`);
      fetchLeadsAndQuotes();
    } catch (err: any) {
      toast.error(err.message || "Failed to update lead status");
    }
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    setIsSubmittingQuote(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) {
        toast.error("Please login as vendor to submit quotes.");
        return;
      }

      const { error } = await supabase.from("quotes").upsert({
        requirement_id: selectedLead.id,
        vendor_id: userData.user.id,
        price_cents: Number(quoteForm.priceCents),
        labor_cents: Number(quoteForm.laborCents),
        materials_cents: Number(quoteForm.materialsCents),
        estimated_days: Number(quoteForm.estimatedDays),
        materials_description: quoteForm.materialsDescription,
        warranty_months: Number(quoteForm.warrantyMonths),
        notes: quoteForm.notes,
        status: "submitted",
      });

      if (error) throw error;

      await supabase
        .from("job_requirements")
        .update({ status: "QUOTED" })
        .eq("id", selectedLead.id);

      toast.success("Quote submitted to customer successfully!");
      fetchLeadsAndQuotes();
    } catch (err: any) {
      console.error("Submit quote error:", err);
      toast.error(err.message || "Failed to submit quote.");
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Vendor CRM & RFQ Pipeline
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight mt-0.5">
            Customer Leads & Quote Marketplace
          </h1>
        </div>

        {/* CRM Status Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {crmStatuses.map((st) => (
            <button
              key={st}
              onClick={() => setCrmFilter(st)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                crmFilter === st
                  ? "bg-amber-600 text-white shadow"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Loading leads...</div>
      ) : leads.length === 0 ? (
        <div className="p-12 text-center border border-dashed rounded-2xl bg-card">
          <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <h3 className="font-bold text-base">No Customer Leads in Pipeline</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Check back soon as customers post new carpentry requirements in your city.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Leads Feed */}
          <div className="lg:col-span-5 space-y-3">
            {leads.map((lead) => {
              const isSelected = selectedLead?.id === lead.id;
              const hasQuoted = quotes.some((q) => q.requirement_id === lead.id);

              return (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-card border-amber-500 shadow-md ring-2 ring-amber-500/20"
                      : "bg-card/50 border-border hover:border-amber-500/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-foreground">
                      {lead.requirement_number}
                    </span>
                    <div className="flex items-center gap-1">
                      {hasQuoted && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          Quoted
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 uppercase">
                        {lead.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-sm line-clamp-1">{lead.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{lead.description}</p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mt-3 pt-2 border-t border-border/50">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-600" /> {lead.area}, {lead.city}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      ₹{lead.budget_min_cents / 100} - ₹{lead.budget_max_cents / 100}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Selected Lead Action & Quote Submission Form */}
          <div className="lg:col-span-7">
            {selectedLead && (
              <div className="bg-card rounded-2xl p-6 border border-border shadow-sm space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      {selectedLead.service_category}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Status:</span>
                      <select
                        value={selectedLead.status}
                        onChange={(e) => handleUpdateStatus(selectedLead.id, e.target.value)}
                        className="bg-muted text-xs font-bold px-2.5 py-1 rounded-lg border border-border"
                      >
                        {crmStatuses.filter((s) => s !== "ALL").map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <h2 className="text-xl font-bold mt-2">{selectedLead.title}</h2>
                  <p className="text-xs text-muted-foreground mt-1.5">{selectedLead.description}</p>

                  <div className="grid grid-cols-2 gap-3 mt-4 p-3.5 rounded-xl bg-muted/40 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">CUSTOMER NAME</span>
                      <span className="font-bold">{selectedLead.customer_name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">CUSTOMER PHONE</span>
                      <span className="font-bold font-mono text-emerald-600">{selectedLead.customer_phone}</span>
                    </div>
                  </div>
                </div>

                <hr className="border-border" />

                {/* Quote Submission Form */}
                <form onSubmit={handleSubmitQuote} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                      <Send className="w-4 h-4 text-amber-600" /> Submit Official Quote to Customer
                    </h3>
                    <button
                      type="button"
                      onClick={handleApplyAIQuoteDraft}
                      className="px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1 border border-amber-500/20"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Auto-Fill AI Draft
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Total Quote Price (₹)</label>
                      <input
                        type="number"
                        required
                        value={quoteForm.priceCents / 100}
                        onChange={(e) => setQuoteForm({ ...quoteForm, priceCents: Number(e.target.value) * 100 })}
                        className="w-full rounded-xl border border-border bg-background p-2.5 text-xs font-bold text-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Labor Cost (₹)</label>
                      <input
                        type="number"
                        value={quoteForm.laborCents / 100}
                        onChange={(e) => setQuoteForm({ ...quoteForm, laborCents: Number(e.target.value) * 100 })}
                        className="w-full rounded-xl border border-border bg-background p-2.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Materials Cost (₹)</label>
                      <input
                        type="number"
                        value={quoteForm.materialsCents / 100}
                        onChange={(e) => setQuoteForm({ ...quoteForm, materialsCents: Number(e.target.value) * 100 })}
                        className="w-full rounded-xl border border-border bg-background p-2.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Est. Execution Days</label>
                      <input
                        type="number"
                        required
                        value={quoteForm.estimatedDays}
                        onChange={(e) => setQuoteForm({ ...quoteForm, estimatedDays: Number(e.target.value) })}
                        className="w-full rounded-xl border border-border bg-background p-2.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Warranty (Months)</label>
                      <input
                        type="number"
                        value={quoteForm.warrantyMonths}
                        onChange={(e) => setQuoteForm({ ...quoteForm, warrantyMonths: Number(e.target.value) })}
                        className="w-full rounded-xl border border-border bg-background p-2.5 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Materials & Hardware Breakdown</label>
                    <textarea
                      rows={2}
                      value={quoteForm.materialsDescription}
                      onChange={(e) => setQuoteForm({ ...quoteForm, materialsDescription: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background p-2.5 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingQuote}
                    className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2"
                  >
                    {isSubmittingQuote ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Send Quote to Customer
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
