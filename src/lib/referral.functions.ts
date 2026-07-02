import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Helper to get untyped admin client for new tables not yet in generated types
async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

// ─── Generate a referral code for a vendor ───
export const generateReferralCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await getAdmin();

    // Check if code already exists
    const { data: existing } = await db
      .from("referral_codes")
      .select("code")
      .eq("vendor_id", context.userId)
      .maybeSingle();

    if (existing) return { code: existing.code };

    // Get vendor profile for name-based code
    const { data: profile } = await db
      .from("vendor_profiles")
      .select("owner_name, business_name")
      .eq("id", context.userId)
      .single();

    if (!profile) throw new Error("Vendor profile not found");

    // Generate code from name + random
    const namePart = (profile.owner_name || profile.business_name)
      .replace(/[^a-zA-Z]/g, "")
      .toUpperCase()
      .slice(0, 6);
    const randPart = Math.floor(Math.random() * 9000 + 1000);
    const code = `${namePart}${randPart}`;

    const { error } = await db.from("referral_codes").insert({
      vendor_id: context.userId,
      code,
    });

    if (error) {
      const altCode = `${namePart}${Math.floor(Math.random() * 90000 + 10000)}`;
      const { error: err2 } = await db.from("referral_codes").insert({
        vendor_id: context.userId,
        code: altCode,
      });
      if (err2) throw new Error(err2.message);
      return { code: altCode };
    }

    return { code };
  });

// ─── Validate a referral code ───
export const validateReferralCode = createServerFn({ method: "GET" })
  .inputValidator((input: { code: string }) =>
    z.object({ code: z.string().min(1).max(20) }).parse(input),
  )
  .handler(async ({ data }) => {
    const db = await getAdmin();
    const { data: ref, error } = await db
      .from("referral_codes")
      .select("code, vendor_profiles(business_name, owner_name, city)")
      .eq("code", data.code.toUpperCase())
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!ref) return { valid: false, referrer: null };

    return {
      valid: true,
      referrer: ref.vendor_profiles,
    };
  });

// ─── Apply referral during registration ───
export const applyReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string }) =>
    z.object({ code: z.string().min(1).max(20) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const db = await getAdmin();

    const { data: refCode } = await db
      .from("referral_codes")
      .select("vendor_id")
      .eq("code", data.code.toUpperCase())
      .single();

    if (!refCode) throw new Error("Invalid referral code");
    if (refCode.vendor_id === context.userId) throw new Error("Cannot refer yourself");

    const { error } = await db.from("referrals").insert({
      referrer_vendor_id: refCode.vendor_id,
      referred_vendor_id: context.userId,
      status: "pending",
      reward_cents: 10000,
    });

    if (error) {
      if (error.code === "23505") return { success: true, message: "Referral already applied" };
      throw new Error(error.message);
    }

    await db
      .from("vendor_profiles")
      .update({ referred_by_code: data.code.toUpperCase() })
      .eq("id", context.userId);

    return { success: true, message: "Referral applied successfully" };
  });

// ─── Get referral stats for a vendor ───
export const getReferralStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await getAdmin();

    const { data: refCode } = await db
      .from("referral_codes")
      .select("*")
      .eq("vendor_id", context.userId)
      .maybeSingle();

    const { data: referrals } = await db
      .from("referrals")
      .select("*, vendor_profiles!referrals_referred_vendor_id_fkey(business_name, owner_name, city, is_approved, created_at)")
      .eq("referrer_vendor_id", context.userId)
      .order("created_at", { ascending: false });

    const { data: payouts } = await db
      .from("referral_payouts")
      .select("*")
      .eq("vendor_id", context.userId)
      .order("created_at", { ascending: false });

    const allReferrals: any[] = referrals ?? [];
    const allPayouts: any[] = payouts ?? [];
    const pendingCount = allReferrals.filter((r: any) => r.status === "pending").length;
    const approvedCount = allReferrals.filter((r: any) => r.status === "approved").length;
    const totalEarned = allPayouts
      .filter((p: any) => p.status === "paid")
      .reduce((sum: number, p: any) => sum + p.amount_cents, 0);
    const pendingEarnings = allPayouts
      .filter((p: any) => p.status === "pending")
      .reduce((sum: number, p: any) => sum + p.amount_cents, 0);

    return {
      code: refCode?.code ?? null,
      totalReferrals: allReferrals.length,
      pendingCount,
      approvedCount,
      totalEarnedCents: totalEarned,
      pendingEarningsCents: pendingEarnings,
      referrals: allReferrals,
      payouts: allPayouts,
    };
  });

// ─── Get referral leaderboard ───
export const getReferralLeaderboard = createServerFn({ method: "GET" }).handler(async () => {
  const db = await getAdmin();
  const { data, error } = await db
    .from("referral_codes")
    .select("code, total_referrals, total_earnings_cents, vendor_profiles(business_name, owner_name, city, avatar_url)")
    .order("total_referrals", { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);
  return data ?? [];
});

// ─── Admin: Approve a referral and create payout ───
export const approveReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { referralId: string }) =>
    z.object({ referralId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const db = await getAdmin();

    const { data: adminRole } = await db
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) throw new Error("Admin only");

    const { data: referral } = await db
      .from("referrals")
      .select("*")
      .eq("id", data.referralId)
      .single();
    if (!referral) throw new Error("Referral not found");

    await db
      .from("referrals")
      .update({ status: "approved" })
      .eq("id", data.referralId);

    await db.from("referral_payouts").insert({
      vendor_id: referral.referrer_vendor_id,
      referral_id: data.referralId,
      amount_cents: referral.reward_cents,
      reason: "carpenter_referral",
      status: "pending",
    });

    return { success: true };
  });

// ─── Admin: Get all referrals for management ───
export const listAllReferrals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await getAdmin();

    const { data: adminRole } = await db
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) throw new Error("Admin only");

    const { data, error } = await db
      .from("referrals")
      .select(`
        *,
        referrer:vendor_profiles!referrals_referrer_vendor_id_fkey(business_name, owner_name, city),
        referred:vendor_profiles!referrals_referred_vendor_id_fkey(business_name, owner_name, city, is_approved)
      `)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  });
