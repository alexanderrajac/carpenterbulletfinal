import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getService, searchNearbyCarpenters, createServiceBooking } from "@/lib/services.functions";
import { formatPrice } from "@/lib/format";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Calendar,
  Clock,
  User,
  Phone,
  Hammer,
  Star,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  StickyNote,
  MessageCircle,
} from "lucide-react";
import { resolveImage } from "@/lib/product-images";

export const Route = createFileRoute("/book-service/$serviceId")({
  head: () => ({
    meta: [
      { title: "Book Service — CarpenterBullet WoodVerse" },
      { name: "description", content: "Book a verified carpenter service near you." },
    ],
  }),
  component: BookServicePage,
});

const TAMIL_NADU_DISTRICTS = [
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore",
  "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kancheepuram",
  "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
  "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai",
  "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi",
  "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
  "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur",
  "Vellore", "Viluppuram", "Virudhunagar",
];

const TIME_PERIODS = [
  {
    id: "morning",
    label: "Morning",
    range: "8:30 AM – 12:30 PM",
    icon: "🌅",
    slots: [
      "08:30 AM – 09:30 AM",
      "09:30 AM – 10:30 AM",
      "10:30 AM – 11:30 AM",
      "11:30 AM – 12:30 PM",
    ],
  },
  {
    id: "afternoon",
    label: "Afternoon",
    range: "1:00 PM – 5:00 PM",
    icon: "☀️",
    slots: [
      "01:00 PM – 02:00 PM",
      "02:00 PM – 03:00 PM",
      "03:00 PM – 04:00 PM",
      "04:00 PM – 05:00 PM",
    ],
  },
  {
    id: "evening",
    label: "Evening",
    range: "5:00 PM – 9:00 PM",
    icon: "🌆",
    slots: [
      "05:00 PM – 06:00 PM",
      "06:00 PM – 07:00 PM",
      "07:00 PM – 08:00 PM",
      "08:00 PM – 09:00 PM",
    ],
  },
];

function BookServicePage() {
  const { serviceId } = Route.useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [authed, setAuthed] = useState(false);

  // Compute Quick Dates
  const todayObj = new Date();
  const todayStr = todayObj.toISOString().split("T")[0];
  const tomorrowObj = new Date(todayObj.getTime() + 86400000);
  const tomorrowStr = tomorrowObj.toISOString().split("T")[0];
  const dayAfterObj = new Date(todayObj.getTime() + 86400000 * 2);
  const dayAfterStr = dayAfterObj.toISOString().split("T")[0];

  const quickDates = [
    {
      id: "today",
      label: "Today",
      dateStr: todayStr,
      displayDate: todayObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      badge: "⚡ Available",
    },
    {
      id: "tomorrow",
      label: "Tomorrow",
      dateStr: tomorrowStr,
      displayDate: tomorrowObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    },
    {
      id: "dayAfter",
      label: dayAfterObj.toLocaleDateString("en-US", { weekday: "short" }),
      dateStr: dayAfterStr,
      displayDate: dayAfterObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    },
  ];

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);

  // Form state
  const [address, setAddress] = useState({
    line1: "", line2: "", city: "", district: "", pincode: "",
  });
  const [schedule, setSchedule] = useState({
    date: tomorrowStr,
    slot: "10:30 AM – 11:30 AM",
  });
  const [selectedPeriod, setSelectedPeriod] = useState<string>("morning");
  const [customTime, setCustomTime] = useState("");
  const [isCustomTime, setIsCustomTime] = useState(false);

  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  // Queries
  const fetchService = useServerFn(getService);
  const { data: service, isLoading: serviceLoading } = useQuery({
    queryKey: ["service", serviceId],
    queryFn: () => fetchService({ data: { id: serviceId } }),
  });

  const fetchCarpenters = useServerFn(searchNearbyCarpenters);
  const { data: carpenters, isLoading: carpentersLoading, refetch: refetchCarpenters } = useQuery({
    queryKey: ["nearby-carpenters", serviceId, address.district],
    queryFn: () => fetchCarpenters({ data: { serviceId, district: address.district } }),
    enabled: !!address.district && step >= 3,
  });

  const selectedCarpenter = carpenters?.find((c: any) => c.vendor_id === selectedVendor);

  const submitBooking = useServerFn(createServiceBooking);
  const bookingMutation = useMutation({
    mutationFn: () =>
      submitBooking({
        data: {
          service_id: serviceId,
          vendor_id: selectedVendor!,
          scheduled_date: schedule.date,
          scheduled_slot: schedule.slot,
          customer_name: customer.name,
          customer_phone: customer.phone,
          address,
          notes: notes || undefined,
        },
      }),
    onSuccess: (result) => {
      const fullBookingItem = {
        id: result.booking.id || `bk-${Date.now()}`,
        booking_number: result.booking.booking_number,
        service_id: serviceId,
        vendor_id: selectedVendor,
        scheduled_date: schedule.date,
        scheduled_slot: schedule.slot,
        customer_name: customer.name,
        customer_phone: customer.phone,
        address,
        total_cents: result.booking.total_cents || service?.starts_at_cents || 19900,
        status: result.booking.status || "pending",
        created_at: new Date().toISOString(),
        services: {
          id: serviceId,
          name: result.serviceName || service?.name || "Carpentry Service",
          category: service?.category || "General Carpentry",
        },
        vendor_profiles: selectedCarpenter?.profile || {
          id: selectedVendor,
          business_name: selectedCarpenter?.profile?.business_name || "raja wood works",
          owner_name: selectedCarpenter?.profile?.owner_name || "Raja C",
          phone_number: selectedCarpenter?.profile?.phone_number || "8248651695",
          city: address.city || "Kanchipuram",
        },
      };

      try {
        const stored = JSON.parse(localStorage.getItem("cb_user_bookings") || "[]");
        localStorage.setItem("cb_user_bookings", JSON.stringify([fullBookingItem, ...stored]));
      } catch (e) {}

      setConfirmedBooking(fullBookingItem);
      toast.success(`Booking confirmed! Reference: ${result.booking.booking_number}`);
      setStep(5); // success step
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create booking");
    },
  });

  // Minimum date = tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const canProceedStep = (s: number) => {
    switch (s) {
      case 1: return !!address.line1 && !!address.city && !!address.district && !!address.pincode;
      case 2: return !!schedule.date && !!schedule.slot;
      case 3: return !!selectedVendor;
      case 4: return !!customer.name && !!customer.phone && customer.phone.length >= 10;
      default: return true;
    }
  };

  const fieldCls =
    "w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200";

  if (serviceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-wood-pattern">
        <Hammer className="h-8 w-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-wood-pattern">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Service not found</h2>
          <Link to="/services" className="text-primary text-sm mt-2 inline-block">← Back to services</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-wood-pattern min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back button */}
        <Link
          to="/services"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to services
        </Link>

        {/* Service Summary Card */}
        <div className="mb-8 p-5 rounded-2xl border border-border bg-card/80 backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-primary font-bold">{service.category}</span>
              <h1 className="font-display text-xl sm:text-2xl font-semibold mt-1">{service.name}</h1>
              <p className="text-xs text-muted-foreground mt-1">{service.description}</p>
            </div>
            <span className="shrink-0 bg-primary/10 text-primary text-sm font-bold px-3 py-1.5 rounded-full font-mono">
              {formatPrice(service.starts_at_cents)}
            </span>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center gap-1 overflow-x-auto pb-2">
          {["Location", "Schedule", "Carpenter", "Confirm", "Done"].map((label, idx) => {
            const stepNum = idx + 1;
            const isActive = step === stepNum;
            const isDone = step > stepNum;
            return (
              <div key={label} className="flex items-center gap-1 shrink-0">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isDone
                      ? "bg-emerald-500 text-white"
                      : isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : stepNum}
                </div>
                <span className={`text-[10px] font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {label}
                </span>
                {idx < 4 && <div className={`h-px w-6 ${isDone ? "bg-emerald-500" : "bg-border"}`} />}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm"
          >
            {/* Step 1: Location */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" /> Service Location
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">Where should the carpenter come?</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Address Line 1 *</label>
                  <input required value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} placeholder="e.g. 45, 2nd Cross Street, Anna Nagar" className={fieldCls} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Address Line 2</label>
                  <input value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} placeholder="Landmark, apartment name..." className={fieldCls} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">District *</label>
                    <select value={address.district} onChange={(e) => setAddress({ ...address, district: e.target.value })} className={fieldCls}>
                      <option value="">Select district</option>
                      {TAMIL_NADU_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">City *</label>
                    <input required value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} placeholder="e.g. Chennai" className={fieldCls} />
                  </div>
                </div>
                <div className="w-1/2">
                  <label className="text-xs text-muted-foreground mb-1 block">Pincode *</label>
                  <input required value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} placeholder="e.g. 600040" maxLength={6} className={fieldCls} />
                </div>
              </div>
            )}

            {/* Step 2: Schedule (Urban Company Style) */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" /> Select Date & Time Slot
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Verified doorstep carpenter visit with 30-day service warranty.
                  </p>
                </div>

                {/* 1. Quick Date Selector */}
                <div>
                  <label className="text-xs font-semibold text-foreground mb-2 flex items-center justify-between">
                    <span>1. Choose Date</span>
                    <span className="text-[11px] text-muted-foreground font-normal">
                      Selected: {schedule.date}
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                    {quickDates.map((qd) => {
                      const isSelected = schedule.date === qd.dateStr;
                      return (
                        <button
                          key={qd.id}
                          type="button"
                          onClick={() => setSchedule({ ...schedule, date: qd.dateStr })}
                          className={`relative p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20 text-foreground"
                              : "border-border bg-card/60 hover:bg-muted/40 text-muted-foreground"
                          }`}
                        >
                          {qd.badge && (
                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-600 text-[9px] font-bold text-white px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                              {qd.badge}
                            </span>
                          )}
                          <span className="text-xs font-bold block">{qd.label}</span>
                          <span className="text-[11px] opacity-80 block mt-0.5">{qd.displayDate}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Or pick custom calendar date */}
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="date"
                      min={todayStr}
                      value={schedule.date}
                      onChange={(e) => setSchedule({ ...schedule, date: e.target.value })}
                      className={`${fieldCls} py-2 text-xs`}
                    />
                  </div>
                </div>

                {/* 2. Time Slot Selection */}
                <div className="space-y-3 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span>2. Choose Arrival Time Slot</span>
                    </label>
                    <span className="text-[11px] text-primary font-mono font-medium">
                      {schedule.slot}
                    </span>
                  </div>

                  {/* Period Filter Tabs */}
                  <div className="flex rounded-xl bg-muted/60 p-1 gap-1">
                    {TIME_PERIODS.map((period) => (
                      <button
                        key={period.id}
                        type="button"
                        onClick={() => {
                          setSelectedPeriod(period.id);
                          setIsCustomTime(false);
                          if (period.slots.length > 0) {
                            setSchedule({ ...schedule, slot: period.slots[0] });
                          }
                        }}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          selectedPeriod === period.id && !isCustomTime
                            ? "bg-card text-foreground shadow-xs font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span>{period.icon}</span>
                        <span>{period.label}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setIsCustomTime(true)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isCustomTime
                          ? "bg-card text-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>⏱️</span>
                      <span>Exact Time</span>
                    </button>
                  </div>

                  {/* Period Specific Slots */}
                  {!isCustomTime ? (
                    <div className="grid grid-cols-2 gap-2">
                      {TIME_PERIODS.find((p) => p.id === selectedPeriod)?.slots.map((slotTime) => {
                        const isSelected = schedule.slot === slotTime;
                        return (
                          <button
                            key={slotTime}
                            type="button"
                            onClick={() => setSchedule({ ...schedule, slot: slotTime })}
                            className={`p-3 rounded-xl border text-center transition-all cursor-pointer text-xs font-medium ${
                              isSelected
                                ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/30 font-semibold"
                                : "border-border bg-card/60 hover:bg-muted/40 text-muted-foreground"
                            }`}
                          >
                            <span className="flex items-center justify-center gap-1.5">
                              <Clock className={`h-3 w-3 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                              {slotTime}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* Custom Exact Time Picker */
                    <div className="p-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 space-y-2">
                      <label className="text-xs font-medium text-foreground block">
                        Specify Your Preferred Arrival Time
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="time"
                          value={customTime}
                          onChange={(e) => {
                            setCustomTime(e.target.value);
                            if (e.target.value) {
                              const [h, m] = e.target.value.split(":");
                              const hour = parseInt(h, 10);
                              const ampm = hour >= 12 ? "PM" : "AM";
                              const formattedHour = hour % 12 || 12;
                              const timeStr = `${String(formattedHour).padStart(2, "0")}:${m} ${ampm} (Preferred Time)`;
                              setSchedule({ ...schedule, slot: timeStr });
                            }
                          }}
                          className={`${fieldCls} py-2 text-sm`}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Carpenter Raja will arrive promptly at your designated time.
                      </p>
                    </div>
                  )}

                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                    <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />
                    <span>
                      Standard 30-day CarpenterBullet warranty on all service visits.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Carpenter Selection */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                    <Hammer className="h-5 w-5 text-primary" /> Choose a Carpenter
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Available carpenters in {address.district} for this service
                  </p>
                </div>

                {carpentersLoading ? (
                  <div className="py-12 text-center">
                    <Hammer className="h-8 w-8 text-amber-500 animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground mt-3">Finding carpenters near you...</p>
                  </div>
                ) : !carpenters || carpenters.length === 0 ? (
                  <div className="py-12 text-center bg-muted/20 rounded-2xl border border-border/60">
                    <Hammer className="mx-auto h-10 w-10 text-muted-foreground/40" />
                    <p className="mt-3 text-sm text-muted-foreground">No carpenters available in {address.district} for this service yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">We're onboarding carpenters daily. Please try again soon.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {carpenters.map((c: any) => (
                      <button
                        key={c.vendor_id}
                        type="button"
                        onClick={() => setSelectedVendor(c.vendor_id)}
                        className={`w-full text-left p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                          selectedVendor === c.vendor_id
                            ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                            : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 overflow-hidden shrink-0">
                            {c.profile.avatar_url ? (
                              <img src={resolveImage(c.profile.avatar_url)} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Hammer className="h-6 w-6" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-foreground truncate">{c.profile.business_name}</h3>
                            <p className="text-xs text-muted-foreground">by {c.profile.owner_name}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <MapPin className="h-3 w-3" /> {c.profile.city}, {c.profile.state}
                              </span>
                              {c.avg_rating && (
                                <span className="text-[10px] text-amber-600 flex items-center gap-0.5 font-semibold">
                                  <Star className="h-3 w-3 fill-current" /> {c.avg_rating} ({c.review_count})
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-bold text-primary font-mono">
                              {formatPrice(c.custom_price_cents ?? service.starts_at_cents)}
                            </span>
                            {selectedVendor === c.vendor_id && (
                              <CheckCircle2 className="h-5 w-5 text-primary mt-1 ml-auto" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Confirm Details */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" /> Your Details & Confirm
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">We'll share these with the carpenter for coordination.</p>
                </div>

                {!authed && (
                  <div className="p-4 bg-muted/40 border border-border rounded-2xl text-center space-y-3">
                    <p className="text-xs text-muted-foreground">Please sign in to complete your booking.</p>
                    <Link
                      to="/auth"
                      search={{ redirect: `/book-service/${serviceId}` }}
                      className="inline-flex items-center gap-1.5 justify-center rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 shadow-sm"
                    >
                      Sign In <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Your Name *</label>
                    <input required value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="Full name" className={fieldCls} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Phone Number *</label>
                    <input required type="tel" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} placeholder="e.g. 9876543210" className={fieldCls} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                    <StickyNote className="h-3 w-3" /> Additional Notes (optional)
                  </label>
                  <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions for the carpenter..." className={fieldCls} />
                </div>

                {/* Booking Summary */}
                <div className="p-5 bg-muted/30 border border-border rounded-2xl space-y-3 text-xs">
                  <h4 className="font-semibold text-sm text-foreground border-b border-border/40 pb-2">Booking Summary</h4>
                  <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span className="font-medium text-foreground">{service.name}</span></div>
                  
                  {selectedCarpenter && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Selected Carpenter</span>
                      <span className="font-medium text-primary">
                        {selectedCarpenter.profile.business_name} ({selectedCarpenter.profile.owner_name})
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span className="font-medium">{address.city}, {address.district}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-semibold text-foreground">{schedule.date}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Arrival Time Slot</span><span className="font-semibold text-primary">{schedule.slot}</span></div>
                  
                  <div className="border-t border-border/60 pt-3 mt-1 space-y-2">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Base Service Price</span>
                      <span>{service.starts_at_cents === 0 ? "Get Quote" : formatPrice(service.starts_at_cents)}</span>
                    </div>
                    {selectedCarpenter && selectedCarpenter.custom_price_cents !== null && selectedCarpenter.custom_price_cents !== service.starts_at_cents && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Carpenter Custom Rate</span>
                        <span>{formatPrice(selectedCarpenter.custom_price_cents)}</span>
                      </div>
                    )}
                    <div className="border-t border-border pt-2 flex justify-between">
                      <span className="font-bold text-sm text-foreground">Estimated Total</span>
                      <span className="font-bold text-base text-primary font-mono">
                        {formatPrice(selectedCarpenter?.custom_price_cents ?? service.starts_at_cents)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-2 bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/10 p-2.5 rounded-xl">
                    <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" /> 
                    <span>Pay directly via Cash or UPI to {selectedCarpenter?.profile.owner_name || "the carpenter"} after service completion</span>
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: Success & WhatsApp Receipt */}
            {step === 5 && (
              <div className="text-center py-6 space-y-5">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"
                >
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </motion.div>
                
                <div>
                  <h2 className="font-display text-2xl font-semibold">Booking Confirmed! 🎉</h2>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                    Your appointment has been reserved. Master Carpenter Raja will arrive during your selected time slot.
                  </p>
                </div>

                {/* Appointment Pass */}
                <div className="mx-auto max-w-md p-5 rounded-2xl border border-primary/20 bg-primary/5 text-left text-xs space-y-2.5">
                  <div className="flex justify-between border-b border-border/40 pb-2">
                    <span className="text-muted-foreground">Booking ID</span>
                    <span className="font-mono font-bold text-foreground">{confirmedBooking?.booking_number || "CB-BOOKED"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service</span>
                    <span className="font-semibold text-foreground">{service.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assigned Carpenter</span>
                    <span className="font-semibold text-primary">Master Carpenter Raja C (8248651695)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium text-foreground">{schedule.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Arrival Slot</span>
                    <span className="font-bold text-primary">{schedule.slot}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/40 pt-2">
                    <span className="text-muted-foreground">Total to Pay (Doorstep)</span>
                    <span className="font-mono font-bold text-sm text-primary">
                      {formatPrice(selectedCarpenter?.custom_price_cents ?? service.starts_at_cents)}
                    </span>
                  </div>
                </div>

                {/* WhatsApp Carpenter Action */}
                <div className="pt-2">
                  <a
                    href={`https://wa.me/918248651695?text=${encodeURIComponent(
                      `Hello Master Carpenter Raja, I have booked ${service.name} on CarpenterBullet WoodVerse.\n\n📅 Date: ${schedule.date}\n⏰ Arrival Slot: ${schedule.slot}\n📍 Address: ${address.line1}, ${address.city}, ${address.district}\n🔖 Reference: ${confirmedBooking?.booking_number || "CB-BOOKING"}\n\nPlease confirm arrival.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-6 py-3 shadow-md transition-all cursor-pointer"
                  >
                    <MessageCircle className="h-4 w-4" /> Chat with Carpenter Raja on WhatsApp
                  </a>
                </div>

                <div className="flex gap-3 justify-center pt-2">
                  <Link
                    to="/services"
                    className="rounded-full border border-border bg-card px-5 py-2 text-xs font-semibold hover:bg-accent transition cursor-pointer"
                  >
                    Book Another Service
                  </Link>
                  <Link
                    to="/profile"
                    className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-md hover:opacity-95 transition cursor-pointer"
                  >
                    View My Bookings
                  </Link>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            {step < 5 && (
              <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setStep(Math.max(1, step - 1))}
                  disabled={step === 1}
                  className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer transition flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    disabled={!canProceedStep(step)}
                    className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-95 disabled:opacity-40 cursor-pointer transition flex items-center gap-1"
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => bookingMutation.mutate()}
                    disabled={!canProceedStep(4) || !authed || bookingMutation.isPending}
                    className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 disabled:opacity-40 cursor-pointer transition flex items-center gap-1"
                  >
                    {bookingMutation.isPending ? (
                      <Hammer className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Confirm Booking
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
