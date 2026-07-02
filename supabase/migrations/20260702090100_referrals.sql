-- ==========================================
-- REFERRAL SYSTEM SCHEMA
-- ==========================================

-- 1. Referral codes (one per carpenter)
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL UNIQUE REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  total_referrals INTEGER NOT NULL DEFAULT 0,
  total_earnings_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.referral_codes TO anon, authenticated;
GRANT ALL ON public.referral_codes TO service_role;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Referral codes are public" ON public.referral_codes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Vendors manage own referral code" ON public.referral_codes FOR ALL TO authenticated
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());


-- 2. Individual referral tracking
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  referred_vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  reward_cents INTEGER NOT NULL DEFAULT 10000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referred_vendor_id)
);

GRANT SELECT ON public.referrals TO authenticated;
GRANT INSERT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own referrals" ON public.referrals FOR SELECT TO authenticated
  USING (
    referrer_vendor_id = auth.uid()
    OR referred_vendor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "System creates referrals" ON public.referrals FOR INSERT TO authenticated
  WITH CHECK (referred_vendor_id = auth.uid());
CREATE POLICY "Admins manage referrals" ON public.referrals FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));


-- 3. Referral reward payouts ledger
CREATE TABLE IF NOT EXISTS public.referral_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES public.referrals(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL,
  reason TEXT NOT NULL DEFAULT 'carpenter_referral',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.referral_payouts TO authenticated;
GRANT ALL ON public.referral_payouts TO service_role;
ALTER TABLE public.referral_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vendors view own payouts" ON public.referral_payouts FOR SELECT TO authenticated
  USING (
    vendor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Admins manage payouts" ON public.referral_payouts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));


-- 4. Add referral_code field to vendor_profiles for tracking who referred them
ALTER TABLE public.vendor_profiles ADD COLUMN IF NOT EXISTS referred_by_code TEXT;
ALTER TABLE public.vendor_profiles ADD COLUMN IF NOT EXISTS services_offered TEXT[] DEFAULT '{}';
ALTER TABLE public.vendor_profiles ADD COLUMN IF NOT EXISTS districts_covered TEXT[] DEFAULT '{}';
ALTER TABLE public.vendor_profiles ADD COLUMN IF NOT EXISTS availability TEXT[] DEFAULT ARRAY['Mon','Tue','Wed','Thu','Fri','Sat'];
