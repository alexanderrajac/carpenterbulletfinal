import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — CarpenterBullet" },
      { name: "description", content: "Privacy Policy and data practices for CarpenterBullet." },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" /> Back to workshop
      </Link>

      <article className="prose prose-zinc dark:prose-invert max-w-none space-y-6">
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl border-b border-border pb-4">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground">Last updated: June 11, 2026</p>

        <p className="leading-relaxed">
          At CarpenterBullet, we build heirloom-grade furniture designed to last generations. We
          value the trust you place in us, and we are committed to protecting your personal data
          with the same integrity we apply to our carpentry.
        </p>

        <section className="space-y-3 pt-4">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            1. Information We Collect
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            When you purchase our custom furniture or create an account at CarpenterBullet, we
            collect the information you provide:
          </p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>
              <strong>Account Data:</strong> Name, email address, password.
            </li>
            <li>
              <strong>Order Data:</strong> Shipping address, billing address, phone number, and UPI
              UTR details for payment verification.
            </li>
            <li>
              <strong>Analytics Data:</strong> IP address, browser type, and navigation activity to
              improve site performance.
            </li>
          </ul>
        </section>

        <section className="space-y-3 pt-4 border-t border-border">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            2. How We Use Your Data
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your information is used strictly to craft and deliver your orders and manage your
            account:
          </p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>
              To verify payments (matching UPI Transaction Ref/UTR details to complete checkout).
            </li>
            <li>To ship custom hand-built items to your shipping address.</li>
            <li>To send critical updates regarding order status and account authentication.</li>
            <li>To optimize shop features and user experience.</li>
          </ul>
        </section>

        <section className="space-y-3 pt-4 border-t border-border">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            3. Information Sharing
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We never sell or rent your information. We share your data only with third-party
            services essential to running CarpenterBullet:
          </p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>
              <strong>Supabase:</strong> For secure database management, user accounts, and
              authentication.
            </li>
            <li>
              <strong>Delivery Partners:</strong> Local and national freight carriers to ship heavy
              furniture to your address.
            </li>
          </ul>
        </section>

        <section className="space-y-3 pt-4 border-t border-border">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            4. Security of Your Data
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We store passwords securely using industry-standard hashing protocols provided by
            Supabase. Although no digital storage is 100% secure, we implement state-of-the-art
            security guidelines to protect your personal details against unauthorized access.
          </p>
        </section>

        <section className="space-y-3 pt-4 border-t border-border">
          <h2 className="font-display text-2xl font-semibold text-foreground">5. Your Rights</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Depending on your jurisdiction, you have the right to request access to, correction of,
            or deletion of your personal data stored in our system. You can update your profile
            information in the CarpenterBullet account dashboard or contact us directly.
          </p>
        </section>

        <section className="space-y-3 pt-4 border-t border-border">
          <h2 className="font-display text-2xl font-semibold text-foreground">6. Contact Us</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            If you have questions about this policy or our data practices, please reach out to us
            at:
            <br />
            <span className="font-medium text-foreground block mt-1">
              support@carpenterbullet.com
            </span>
          </p>
        </section>
      </article>
    </div>
  );
}
