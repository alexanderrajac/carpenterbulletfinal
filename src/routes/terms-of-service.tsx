import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/terms-of-service")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — CarpenterBullet" },
      { name: "description", content: "Terms of service and purchasing terms for CarpenterBullet Handcrafted Carpentry." },
    ],
  }),
  component: TermsOfServicePage,
});

function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="h-4 w-4" /> Back to workshop
      </Link>
      
      <article className="prose prose-zinc dark:prose-invert max-w-none space-y-6">
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl border-b border-border pb-4">Terms & Conditions</h1>
        <p className="text-sm text-muted-foreground">Last updated: June 11, 2026</p>
        
        <p className="leading-relaxed">
          Welcome to CarpenterBullet. By accessing our site, registering an account, or purchasing our handcrafted carpentry items, you agree to comply with and be bound by the following terms and conditions.
        </p>

        <section className="space-y-3 pt-4">
          <h2 className="font-display text-2xl font-semibold text-foreground">1. Account Registration</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            To make purchases and view orders, you must create a CarpenterBullet account. You agree to provide accurate information and keep your login credentials confidential. You are solely responsible for all activities that occur under your account.
          </p>
        </section>

        <section className="space-y-3 pt-4 border-t border-border">
          <h2 className="font-display text-2xl font-semibold text-foreground">2. Custom Carpentry & Product Variations</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Our furniture, kitchenware, and tools are built by hand in small batches using natural solid hardwoods:
          </p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li><strong>Natural Materials:</strong> Hardwoods contain unique grain patterns, knots, color variations, and natural texture variations. These are not flaws but signs of genuine wood.</li>
            <li><strong>Craftsmanship:</strong> Because each piece is individual, slight variations in dimension and finish might occur.</li>
            <li><strong>Finishing:</strong> We use hand-rubbed oil finishes that require periodic care as outlined in the care manuals.</li>
          </ul>
        </section>

        <section className="space-y-3 pt-4 border-t border-border">
          <h2 className="font-display text-2xl font-semibold text-foreground">3. Payments & Order Verification</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Payments are made via UPI QR codes (INR equivalent) or our supported gateway mechanisms.
          </p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li><strong>UTR Verification:</strong> For UPI payments, you must submit the correct 12-digit transaction reference number (UTR).</li>
            <li><strong>Verification Window:</strong> Orders will only be processed and scheduled for crafting once the transaction ID is verified manually or programmatically. If a UTR is invalid or unmatched, the order will remain on hold or be cancelled.</li>
          </ul>
        </section>

        <section className="space-y-3 pt-4 border-t border-border">
          <h2 className="font-display text-2xl font-semibold text-foreground">4. Shipping & Delivery</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Our items are heavy, solid hardwood. Shipping times range from 3-5 days for ready-made tools to several weeks for custom furniture items.
            <br /><br />
            We require clear, accessible shipping paths and information. Large shipments will be shipped via specialized furniture freight partners. Delivery dates are estimates and might vary due to material sourcing or carrier delays.
          </p>
        </section>

        <section className="space-y-3 pt-4 border-t border-border">
          <h2 className="font-display text-2xl font-semibold text-foreground">5. Returns, Cancellations & Lifetime Warranty</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            <strong>Lifetime Warranty:</strong> We offer a lifetime warranty on structural joints and wood craftsmanship under normal household conditions. This warranty does not cover damage from moisture, direct sunlight, accidents, or misuse.
            <br /><br />
            <strong>Returns & Cancellations:</strong> Because furniture is custom-made or made in small batches, orders cancelled after crafting has begun might be subject to a restocking fee. Custom orders are non-refundable once shipped.
          </p>
        </section>

        <section className="space-y-3 pt-4 border-t border-border">
          <h2 className="font-display text-2xl font-semibold text-foreground">6. Limitation of Liability</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            CarpenterBullet and its master carpenters shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use our products.
          </p>
        </section>
      </article>
    </div>
  );
}
