import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  MapPin,
  Phone,
  MessageSquare,
  ShieldCheck,
  Star,
  CheckCircle2,
  Wrench,
  Search,
  ChevronRight,
  Sparkles,
  Clock,
  Award,
} from "lucide-react";
import { buildVillupuramGeoJSONLD } from "@/lib/seo-builder";
import logoUrl from "@/assets/logo.jpg";

export const Route = createFileRoute("/villupuram")({
  head: () => {
    const geoSchema = buildVillupuramGeoJSONLD();
    return {
      meta: [
        { title: "No. 1 Carpenter in Villupuram District | Best Carpenters & Woodwork Services" },
        {
          name: "description",
          content:
            "Looking for the No. 1 Carpenter in Villupuram District? Doorstep carpentry services across Villupuram Town, Tindivanam, Gingee, Mailam, Vanur, Vikravandi & all villages. Instant quotes & verified master artisans.",
        },
        {
          name: "keywords",
          content:
            "No 1 carpenter in Villupuram, best carpenter Villupuram district, carpenter in Tindivanam, wood repair Gingee, door lock fitting Mailam, wardrobe maker Vikravandi, carpentry services Villupuram, WoodVerse",
        },
        { property: "og:title", content: "No. 1 Carpenter in Villupuram District — Verified Doorstep Service" },
        { property: "og:description", content: "Book top-rated local carpenters in Villupuram, Tindivanam, Gingee & all villages. 100% pricing guarantee, instant door repair & custom furniture." },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: geoSchema,
        },
      ],
    };
  },
  component: VillupuramSEOPage,
});

const VILLUPURAM_LOCATIONS = [
  { name: "Villupuram Town (HQ)", area: "Central HQ", type: "City", count: 48, status: "Active Now" },
  { name: "Tindivanam", area: "Northern Highway Hub", type: "Taluk / Town", count: 36, status: "Active Now" },
  { name: "Gingee", area: "Fort & Heritage Block", type: "Taluk / Town", count: 28, status: "Active Now" },
  { name: "Marakkanam", area: "Coastal ECR Belt", type: "Town", count: 19, status: "Active Now" },
  { name: "Vikravandi", area: "Highway Industrial Belt", type: "Taluk / Town", count: 24, status: "Active Now" },
  { name: "Mailam", area: "Temple Town Block", type: "Block / Village", count: 21, status: "Active Now" },
  { name: "Vanur", area: "Pondicherry Border Belt", type: "Taluk / Block", count: 18, status: "Active Now" },
  { name: "Kandamangalam", area: "East Agricultural Belt", type: "Block / Village", count: 16, status: "Active Now" },
  { name: "Kanai", area: "West Villupuram Suburb", type: "Block / Village", count: 14, status: "Active Now" },
  { name: "Koliyanur", area: "South Villupuram Cluster", type: "Block / Village", count: 15, status: "Active Now" },
  { name: "Olakkur", area: "North Tindivanam Block", type: "Block / Village", count: 12, status: "Active Now" },
  { name: "Valavanur", area: "Pondy Highway Town", type: "Town", count: 22, status: "Active Now" },
  { name: "Kottakuppam", area: "Auroville Border Town", type: "Town", count: 17, status: "Active Now" },
  { name: "Ananthapuram", area: "Gingee Road Town", type: "Town", count: 11, status: "Active Now" },
  { name: "Mugaiyur", area: "South West Block", type: "Block / Village", count: 10, status: "Active Now" },
  { name: "T.V. Nallur", area: "Trichy Road Block", type: "Block / Village", count: 13, status: "Active Now" },
  { name: "Thirunavalur", area: "Ulundurpet Border", type: "Block / Village", count: 11, status: "Active Now" },
  { name: "Rettanai", area: "Tindivanam Rural", type: "Village", count: 8, status: "Active Now" },
  { name: "Brammadesam", area: "Marakkanam Rural", type: "Village", count: 7, status: "Active Now" },
  { name: "Vadamarudur", area: "Kandamangalam Cluster", type: "Village", count: 6, status: "Active Now" },
];

const VILLUPURAM_RATE_CARD = [
  { service: "Wooden Door Frame Repair & Refitting", rate: "₹499 - ₹799", time: "1 - 2 Hours" },
  { service: "Door Lock, Latch & Hinge Replacement", rate: "₹299 - ₹459", time: "30 Mins" },
  { service: "Custom Wardrobe & Cupboard Assembly", rate: "₹1,499 - ₹2,999", time: "Same Day" },
  { service: "Teak & Rosewood Furniture Polishing", rate: "₹85 / sq.ft", time: "Custom" },
  { service: "Modular Kitchen Plywood Repair", rate: "₹699 - ₹1,299", time: "2 - 4 Hours" },
  { service: "Window Frame & Mesh Fitting", rate: "₹399 - ₹699", time: "1 Hour" },
];

const VERIFIED_CARPENTERS = [
  {
    id: "vpm-1",
    name: "Master Arumugam Achari",
    shop: "Sri Vinayaga Teak Wood Works",
    location: "East Pondy Road, Villupuram Town",
    experience: "22+ Years Exp",
    rating: 4.9,
    reviews: 148,
    specialty: "Teak Wood Doors & Main Entrance Framing",
    phone: "+919876543210",
    badge: "No. 1 Master Artisan",
  },
  {
    id: "vpm-2",
    name: "Murugan & Sons",
    shop: "Murugan Modular Wood Crafts",
    location: "Gingee Road, Tindivanam",
    experience: "16+ Years Exp",
    rating: 4.8,
    reviews: 112,
    specialty: "Modular Kitchen Plywood & Wardrobes",
    phone: "+919876543211",
    badge: "Top Rated in Tindivanam",
  },
  {
    id: "vpm-3",
    name: "Gingee Raja Carpenter",
    shop: "Fort City Interior Carpenters",
    location: "Near Bus Stand, Gingee",
    experience: "18+ Years Exp",
    rating: 4.9,
    reviews: 94,
    specialty: "Furniture Repair & Polish",
    phone: "+919876543212",
    badge: "No. 1 in Gingee",
  },
];

function VillupuramSEOPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");

  const filteredLocations = VILLUPURAM_LOCATIONS.filter((loc) => {
    const matchesSearch =
      loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.area.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "All" || loc.type.includes(selectedType);
    return matchesSearch && matchesType;
  });

  return (
    <div className="bg-wood-pattern min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-amber-950/40 via-background to-background py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Villupuram District #1 Carpenter Network
          </div>
          <h1 className="font-display text-3xl font-extrabold sm:text-5xl lg:text-6xl tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
            No. 1 Carpenter Service in <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 bg-clip-text text-transparent italic font-serif">
              Villupuram District & All Villages
            </span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Need urgent carpentry repair, door fitting, or custom furniture in Villupuram Town, Tindivanam, Gingee, Mailam, Vanur, or Vikravandi? Connect directly with 100+ verified master artisans with transparent doorstep rate cards.
          </p>

          {/* Quick Call & WhatsApp Action Banner */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="tel:+919876543210"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-amber-600 px-8 py-4 text-base font-extrabold text-white shadow-xl hover:bg-amber-700 transition active:scale-95 cursor-pointer"
            >
              <Phone className="h-5 w-5" /> Call Villupuram Helpline: +91 98765 43210
            </a>
            <a
              href="https://wa.me/919876543210?text=Hi%20CarpenterBullet,%20I%20need%20a%20carpenter%20in%20Villupuram%20district."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-8 py-4 text-base font-extrabold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition active:scale-95 cursor-pointer"
            >
              <MessageSquare className="h-5 w-5" /> Instant WhatsApp Booking
            </a>
          </div>

          {/* Trust indicators */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto border-t border-border/40 pt-8 text-left">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Verified Artisans</p>
                <p className="text-[11px] text-muted-foreground">Aadhaar & Police Verified</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">30-Min Arrival</p>
                <p className="text-[11px] text-muted-foreground">Fastest in Villupuram</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Fixed Rate Card</p>
                <p className="text-[11px] text-muted-foreground">No Hidden Costs</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">4.9/5 Google Rating</p>
                <p className="text-[11px] text-muted-foreground">400+ Local Reviews</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Village & Town Directory Filter */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-border/60 pb-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Villupuram District Towns & Village Directory
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Select your area in Villupuram district to find nearest active doorstep carpenters.
              </p>
            </div>

            {/* Type Switcher */}
            <div className="flex gap-2 flex-wrap">
              {["All", "City", "Town", "Block"].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    selectedType === t
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search village name (e.g. Mailam, Gingee, Vikravandi, Olakkur)..."
              className="w-full rounded-2xl border border-border bg-card py-3 pl-11 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all shadow-sm"
            />
          </div>

          {/* Location Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLocations.map((loc) => (
              <div
                key={loc.name}
                className="group p-5 rounded-2xl border border-border/60 bg-card hover:border-amber-500/40 hover:shadow-md transition duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      {loc.type}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      {loc.status}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground mt-2 group-hover:text-amber-600 transition-colors">
                    {loc.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{loc.area}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    <strong className="text-foreground font-mono">{loc.count}</strong> Verified Carpenters
                  </span>
                  <a
                    href="tel:+919876543210"
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:underline cursor-pointer"
                  >
                    Book Now <ChevronRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Verified Master Carpenters */}
        <section className="space-y-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Top Ranked Master Carpenters in Villupuram
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Connect directly with high-rated local workshop owners in Villupuram District.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VERIFIED_CARPENTERS.map((carp) => (
              <div
                key={carp.id}
                className="rounded-3xl border border-border/80 bg-card p-6 shadow-luxury space-y-4 hover:border-primary/40 transition duration-300 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600">
                      {carp.badge}
                    </span>
                    <h3 className="font-display text-lg font-bold text-foreground mt-2">{carp.name}</h3>
                    <p className="text-xs text-muted-foreground font-medium">{carp.shop}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full shrink-0">
                    <Star className="h-3.5 w-3.5 fill-current" /> {carp.rating}
                  </div>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground pt-2 border-t border-border/40">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>{carp.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wrench className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>Specialty: {carp.specialty}</span>
                  </div>
                </div>

                <div className="pt-3 flex gap-2">
                  <a
                    href={`tel:${carp.phone}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90 transition active:scale-95 cursor-pointer"
                  >
                    <Phone className="h-3.5 w-3.5" /> Call Now
                  </a>
                  <a
                    href={`https://wa.me/${carp.phone.replace("+", "")}?text=Hi%20${encodeURIComponent(carp.name)},%20I%20found%20you%20on%20CarpenterBullet.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition active:scale-95 cursor-pointer"
                    title="WhatsApp Chat"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Villupuram Transparent Rate Card */}
        <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/60 pb-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Villupuram District Standard Carpentry Rate Card (INR)
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Fixed doorstep prices verified across Villupuram, Tindivanam & Gingee workshops.
              </p>
            </div>
            <Link
              to="/services"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline shrink-0"
            >
              View Full Rate Card →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {VILLUPURAM_RATE_CARD.map((rc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 rounded-2xl bg-muted/40 border border-border/40 hover:border-amber-500/30 transition"
              >
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{rc.service}</h4>
                  <span className="text-[11px] text-muted-foreground">Est. Time: {rc.time}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-sm font-extrabold text-amber-600 dark:text-amber-400">
                    {rc.rate}
                  </span>
                  <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">
                    Fixed Price
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Local SEO Content Section for Google Rank #1 */}
        <section className="prose prose-amber dark:prose-invert max-w-none bg-card p-8 rounded-3xl border border-border/60">
          <h2>Why CarpenterBullet is the No. 1 Carpentry Service in Villupuram District</h2>
          <p>
            Villupuram is a crucial commercial and cultural crossroads in Tamil Nadu, connecting Pondicherry, Cuddalore, Kallakurichi, and Chennai. Homeowners across Villupuram town (East Pondy Road, West Street, Salamedu), Tindivanam, Gingee, and Marakkanam demand high-grade teak wood craftsmanship, durable BWP plywood modular kitchens, and swift emergency door repair services.
          </p>

          <h3>Comprehensive Services Offered Across All Villupuram Villages:</h3>
          <ul>
            <li><strong>Door & Window Fitting</strong>: Burmese Teak double entrance doors, flush doors, and aluminum slide windows in Mailam, Vanur, and Kandamangalam.</li>
            <li><strong>Modular Kitchen & Cupboard Assembly</strong>: Boiling Water Proof (BWP) 710 plywood cabinets with soft-close Blum/Hettich hinges in Tindivanam and Vikravandi.</li>
            <li><strong>Furniture Restoration & Polish</strong>: Polyurethane (PU) and melamine wood polishing for antique Rosewood dining tables and teak cots in Gingee.</li>
            <li><strong>Lock & Hinge Replacement</strong>: Mortise locks, Godrej night latches, and concealed hinges installed within 30 minutes in Villupuram town.</li>
          </ul>

          <p className="text-sm font-semibold text-muted-foreground">
            Searching for "No 1 carpenter in Villupuram" or "carpenter near me in Tindivanam / Gingee / Mailam"? CarpenterBullet guarantees background-verified craftsmen, doorstep arrival, and transparent rate cards across all 20+ sub-districts and villages.
          </p>
        </section>
      </div>
    </div>
  );
}
