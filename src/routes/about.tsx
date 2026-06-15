import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, Award, ShieldCheck, HardHat, Heart } from "lucide-react";
import founderUrl from "@/assets/founder.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — CarpenterBullet" },
      { name: "description", content: "Learn about the heritage, craftsmanship, and founder of CarpenterBullet." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Back button */}
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10 group"
      >
        <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" /> 
        Back to workshop
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left column: Image showcase */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative group perspective-container">
            {/* Decorative mesh background */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-emerald-500/10 to-amber-500/10 opacity-70 blur-xl group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Frame for the founder image */}
            <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/50 p-3 shadow-xl backdrop-blur-sm card-3d-interactive transform transition-all duration-500 hover:scale-[1.02]">
              <img 
                src={founderUrl} 
                alt="CarpenterBullet Founder Alexander Raja" 
                className="w-full aspect-[3/4] object-cover rounded-2xl shadow-inner bg-muted grayscale hover:grayscale-0 transition-all duration-700 ease-out" 
              />
              {/* Badge overlay */}
              <div className="absolute bottom-6 right-6 bg-background/90 backdrop-blur-md px-4 py-2 rounded-xl border border-border shadow-md flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500 fill-current" />
                <span className="text-xs font-bold tracking-wide uppercase text-foreground">Founder & Craftsman</span>
              </div>
            </div>
          </div>
          
          {/* Subtle caption */}
          <p className="text-xs text-center text-muted-foreground italic">
            Standing alongside custom handcrafted solid wood wardrobe panel carvings.
          </p>
        </div>

        {/* Right column: Backstory & details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Our Legacy</span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
              Crafting Heritage, <br />
              One Joint at a Time
            </h1>
          </div>

          <p className="text-base text-muted-foreground leading-relaxed">
            Welcome to <strong>CarpenterBullet</strong>. What started in the dusty corner of a local carpentry workshop has evolved into a premier online gallery showcasing South Indian woodcraft. Founded by master artisan <strong>Alexander Raja</strong>, we preserve age-old woodworking traditions for modern spaces.
          </p>

          <p className="text-sm text-muted-foreground leading-relaxed">
            We specialize in bespoke carpentry solutions — from heirloom-grade home furniture to intricately carved wardrobes, traditional Tamil rebate wedging (Sakkai Rebate Joints), and majestic solid wood temple door panels. Our hand-carved wardrobes are forged from heavy, sustainable timbers like Teak and Rosewood, celebrating deep-grained textures and natural finishes.
          </p>

          {/* Features grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5 pt-4">
            <div className="p-4 rounded-2xl border border-border bg-card/30 flex gap-3.5">
              <Award className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-foreground">Heirloom Wood Selection</h4>
                <p className="text-xs text-muted-foreground mt-1">We carve exclusively with grade-A logs of Teak, Rosewood, and Walnut.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-border bg-card/30 flex gap-3.5">
              <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-foreground">Sakkai Rebate Wedges</h4>
                <p className="text-xs text-muted-foreground mt-1">Our joint systems rely on traditional Tamil wedge techniques, built to never loosen.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-border bg-card/30 flex gap-3.5">
              <HardHat className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-foreground">Custom Commissioning</h4>
                <p className="text-xs text-muted-foreground mt-1">Order wardrobes, doors, or tables custom-fit to your room's dimensions.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-border bg-card/30 flex gap-3.5">
              <Heart className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-foreground">Artisan Direct Support</h4>
                <p className="text-xs text-muted-foreground mt-1">Buying directly supports local workshop wood-carvers and hand-finishers.</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border">
            <Link 
              to="/shop" 
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 shadow-md transition"
            >
              Explore the Catalog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
