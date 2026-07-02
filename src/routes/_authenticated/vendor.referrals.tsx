import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getReferralStats, generateReferralCode } from "@/lib/referral.functions";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Copy,
  Share2,
  Users,
  TrendingUp,
  Gift,
  CheckCircle2,
  Clock,
  Sparkles,
  Hammer,
  ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/vendor/referrals")({
  head: () => ({ meta: [{ title: "Referrals — Workshop Portal" }] }),
  component: VendorReferralsPage,
});

function VendorReferralsPage() {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const fetchStats = useServerFn(getReferralStats);
  const { data: stats, isLoading } = useQuery({
    queryKey: ["vendor-referral-stats"],
    queryFn: () => fetchStats(),
  });

  const genCode = useServerFn(generateReferralCode);
  const generateMutation = useMutation({
    mutationFn: () => genCode(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-referral-stats"] });
      toast.success("Referral code generated!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const referralLink = stats?.code
    ? `https://www.carpenterbullet.com/join-carpenter?ref=${stats.code}`
    : null;

  const copyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareWhatsApp = () => {
    if (!referralLink || !stats?.code) return;
    const msg = encodeURIComponent(
      `🪵 Join CarpenterBullet - India's #1 Carpenter Marketplace!\n\nRegister your workshop and get direct orders from customers.\n\n✅ Direct UPI payments\n✅ Zero commission on products\n✅ Get booked for services\n\nJoin now: ${referralLink}\n\nUse my code: ${stats.code}`,
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Hammer className="h-8 w-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-amber-500" /> Referral Program
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Invite fellow carpenters and earn ₹100 for each who joins and gets approved!
        </p>
      </div>

      {/* Referral Code Card */}
      {stats?.code ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-amber-500/5 to-transparent relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-primary/10 blur-[60px] pointer-events-none" />

          <div className="relative">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
              Your Referral Code
            </p>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl font-display font-bold text-primary tracking-wider">{stats.code}</span>
              <button
                onClick={copyLink}
                className="h-9 w-9 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-accent cursor-pointer transition"
                title="Copy link"
              >
                {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            {/* Referral Link */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-card/80 border border-border mb-4">
              <input
                readOnly
                value={referralLink || ""}
                className="flex-1 bg-transparent text-xs text-muted-foreground outline-none font-mono truncate"
              />
              <button
                onClick={copyLink}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 cursor-pointer transition"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* Share Buttons */}
            <div className="flex gap-3">
              <button
                onClick={shareWhatsApp}
                className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 cursor-pointer transition flex items-center justify-center gap-2"
              >
                <Share2 className="h-4 w-4" /> Share on WhatsApp
              </button>
              <button
                onClick={copyLink}
                className="px-6 py-3 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-accent cursor-pointer transition flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" /> Copy Link
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="p-6 rounded-3xl border border-border bg-card text-center space-y-4">
          <Gift className="mx-auto h-12 w-12 text-amber-500" />
          <div>
            <h3 className="font-semibold text-lg">Generate Your Referral Code</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Start earning ₹100 for every carpenter you bring to the platform.
            </p>
          </div>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="px-8 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-md hover:opacity-95 cursor-pointer transition disabled:opacity-50"
          >
            {generateMutation.isPending ? "Generating..." : "Generate Code"}
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Referrals", value: stats?.totalReferrals ?? 0, icon: Users, color: "text-blue-600" },
          { label: "Approved", value: stats?.approvedCount ?? 0, icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Pending", value: stats?.pendingCount ?? 0, icon: Clock, color: "text-amber-600" },
          { label: "Total Earned", value: formatPrice(stats?.totalEarnedCents ?? 0), icon: TrendingUp, color: "text-primary" },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl border border-border bg-card/60"
          >
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
            </div>
            <p className={`font-display text-xl font-bold ${s.color}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Referral Reward Info */}
      <div className="p-5 rounded-2xl border border-border bg-muted/20">
        <h3 className="font-semibold text-sm mb-3">How it works</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { step: "1", title: "Share Your Link", desc: "Send your referral link to fellow carpenters via WhatsApp" },
            { step: "2", title: "They Join & Get Approved", desc: "The carpenter registers and admin approves their workshop" },
            { step: "3", title: "You Earn ₹100", desc: "₹100 reward credited to your account for each approved referral" },
          ].map((s) => (
            <div key={s.step} className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                {s.step}
              </div>
              <div>
                <h4 className="text-sm font-semibold">{s.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referral History */}
      {stats?.referrals && stats.referrals.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3">Referral History</h3>
          <div className="space-y-2">
            {stats.referrals.map((ref: any, idx: number) => {
              const referred = ref.vendor_profiles;
              return (
                <motion.div
                  key={ref.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-card/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                      <Hammer className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{referred?.business_name || "Carpenter"}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {referred?.city || ""} · Joined {new Date(ref.created_at).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ref.status === "approved"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : ref.status === "reward_paid"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}
                    >
                      {ref.status === "approved" ? "Approved" : ref.status === "reward_paid" ? "Reward Paid" : "Pending"}
                    </span>
                    <p className="text-xs font-mono text-primary font-semibold mt-0.5">
                      +{formatPrice(ref.reward_cents)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
