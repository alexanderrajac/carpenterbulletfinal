import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Wrench,
  MapPin,
  IndianRupee,
  Calendar,
  Image as ImageIcon,
  Ruler,
  Clock,
  Phone,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Send,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { analyzeRequirementAI } from "@/lib/ai-assistant";
import { toast } from "sonner";

export const Route = createFileRoute("/post-requirement")({
  component: PostRequirementPage,
});

function PostRequirementPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    serviceCategory: "Wooden Door",
    title: "",
    description: "",
    city: "Chennai",
    area: "Ambattur",
    budgetMin: "1000",
    budgetMax: "5000",
    urgency: "normal",
    preferredDate: new Date().toISOString().split("T")[0],
    measurements: "",
    customerName: "",
    customerPhone: "",
    whatsappNumber: "",
    photoUrl: "",
  });

  const categories = [
    "Wooden Door",
    "Cupboard & Drawer",
    "Furniture Assembly",
    "Furniture Repair",
    "Shelf & Cabinet",
    "Lock & Hinge",
    "Decor & Mirror",
    "Curtain & Window",
    "Modular Kitchen",
    "Full-Day Carpenter",
  ];

  const urgencyOptions = [
    { value: "emergency", label: "Emergency (Within 2 Hours)", badge: "⚡ Ultra Fast" },
    { value: "urgent", label: "Urgent (Today / 24 Hours)", badge: "🔥 Priority" },
    { value: "normal", label: "Normal (Within 2-5 Days)", badge: "👍 Standard" },
    { value: "flexible", label: "Flexible Schedule", badge: "📅 Relaxed" },
  ];

  const aiAnalysis = analyzeRequirementAI({
    service: formData.serviceCategory,
    description: formData.description,
    location: `${formData.area}, ${formData.city}`,
    budgetMin: Number(formData.budgetMin),
    budgetMax: Number(formData.budgetMax),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.customerPhone) {
      toast.error("Please fill in all required fields (Title, Description, Phone Number)");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();

      const requirementNumber = `RFQ-${Date.now().toString().slice(-6)}`;
      const photosArray = formData.photoUrl ? [formData.photoUrl] : [];

      const { data, error } = await supabase
        .from("job_requirements")
        .insert({
          requirement_number: requirementNumber,
          customer_id: userData.user?.id || null,
          customer_name: formData.customerName || "Local Customer",
          customer_phone: formData.customerPhone,
          whatsapp_number: formData.whatsappNumber || formData.customerPhone,
          service_category: formData.serviceCategory,
          title: formData.title,
          description: formData.description,
          city: formData.city,
          area: formData.area,
          budget_min_cents: Number(formData.budgetMin || 0) * 100,
          budget_max_cents: Number(formData.budgetMax || 0) * 100,
          urgency: formData.urgency,
          preferred_date: formData.preferredDate,
          photos: photosArray,
          measurements: formData.measurements,
          status: "NEW",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Requirement posted successfully! Local carpenters will submit quotes shortly.");
      navigate({ to: "/requirements" });
    } catch (err: any) {
      console.error("RFQ Submit Error:", err);
      toast.error(err.message || "Failed to post requirement. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 text-white py-12 px-4 shadow-md">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/30 text-amber-200 border border-amber-400/30 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            CarpenterBullet Direct RFQ Marketplace
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Post Your Carpentry Requirement
          </h1>
          <p className="text-amber-100 text-base md:text-lg max-w-2xl mx-auto">
            Get instant competitive quotes from background-verified local carpenters & custom woodwork specialists near you.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 max-w-md mx-auto">
          {[
            { num: 1, label: "Service & Details" },
            { num: 2, label: "Budget & Urgency" },
            { num: 3, label: "Contact & Post" },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(s.num)}
                className={`w-9 h-9 rounded-full font-bold text-sm flex items-center justify-center transition-all ${
                  step === s.num
                    ? "bg-amber-600 text-white shadow-lg ring-4 ring-amber-500/20"
                    : step > s.num
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                }`}
              >
                {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
              </button>
              <span className={`text-xs font-medium hidden sm:inline ${step === s.num ? "text-amber-600 dark:text-amber-400 font-bold" : "text-slate-500"}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-xl border border-slate-200 dark:border-slate-800">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2 border-b pb-3 border-slate-200 dark:border-slate-800">
                <Wrench className="w-5 h-5 text-amber-600" /> 1. Service & Requirement Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Service Category</label>
                  <select
                    value={formData.serviceCategory}
                    onChange={(e) => setFormData({ ...formData, serviceCategory: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm focus:ring-2 focus:ring-amber-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Requirement Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 3-Door Wardrobe Repair / New Door Fitting"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Detailed Description *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your requirement in detail (e.g., 'Need a 7x6 wardrobe in Ambattur. Hinges broken and drawer channel replacement needed within 10 days.')"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <Ruler className="w-4 h-4 text-slate-400" /> Measurements / Dimensions (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 7ft x 6ft / 32inch x 80inch"
                    value={formData.measurements}
                    onChange={(e) => setFormData({ ...formData, measurements: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-slate-400" /> Photo URL / Unsplash Link (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formData.photoUrl}
                    onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* AI Categorization Preview */}
              {formData.description.length > 10 && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                    <Sparkles className="w-4 h-4" /> AI Requirement Categorization
                  </div>
                  <p>{aiAnalysis.summaryText}</p>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm flex items-center gap-2 shadow-lg transition-all"
                >
                  Next: Budget & Schedule <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2 border-b pb-3 border-slate-200 dark:border-slate-800">
                <IndianRupee className="w-5 h-5 text-amber-600" /> 2. Budget, Location & Urgency
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Area / Locality</label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Estimated Budget Range (₹)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={formData.budgetMin}
                      onChange={(e) => setFormData({ ...formData, budgetMin: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="text-slate-400">to</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={formData.budgetMax}
                      onChange={(e) => setFormData({ ...formData, budgetMax: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" /> Preferred Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Urgency Level</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {urgencyOptions.map((urg) => (
                    <label
                      key={urg.value}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                        formData.urgency === urg.value
                          ? "border-amber-600 bg-amber-500/10 font-bold"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="urgency"
                          value={urg.value}
                          checked={formData.urgency === urg.value}
                          onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                          className="accent-amber-600"
                        />
                        <span className="text-xs font-semibold">{urg.label}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {urg.badge}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm flex items-center gap-2 shadow-lg"
                >
                  Next: Contact Details <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2 border-b pb-3 border-slate-200 dark:border-slate-800">
                <Phone className="w-5 h-5 text-amber-600" /> 3. Contact Info & Post Requirement
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Your Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Phone Number (For Quotes) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-500" /> WhatsApp Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="WhatsApp number for instant quote alerts"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Requirement Summary Card */}
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 space-y-2 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span>Requirement Summary</span>
                  <span className="text-amber-600 dark:text-amber-400">{formData.serviceCategory}</span>
                </div>
                <p className="font-semibold text-sm">{formData.title || "Untitled Requirement"}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{formData.description}</p>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 pt-1">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-amber-600" /> {formData.area}, {formData.city}</span>
                  <span className="flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5 text-emerald-600" /> ₹{formData.budgetMin} - ₹{formData.budgetMax}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>Your contact info is shared only with verified carpenters submitting quotes. Zero spam guarantee.</span>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-extrabold text-sm flex items-center gap-2 shadow-xl hover:shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Post Requirement Now
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </form>
      </div>
    </div>
  );
}
