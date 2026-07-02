-- 1. CREATE VENDOR_OFFERS TABLE
CREATE TABLE IF NOT EXISTS public.vendor_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  stock INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, vendor_id)
);

-- 2. MIGRATE EXISTING PRODUCT PRICES AND STOCK TO VENDOR_OFFERS
-- For every product with a vendor_id, migrate it to vendor_offers
INSERT INTO public.vendor_offers (product_id, vendor_id, price_cents, stock)
SELECT id, vendor_id, price_cents, stock FROM public.products
WHERE vendor_id IS NOT NULL
ON CONFLICT (product_id, vendor_id) DO NOTHING;

-- Also migrate platform-direct products (where vendor_id is NULL) so that everything has an offer
INSERT INTO public.vendor_offers (product_id, vendor_id, price_cents, stock)
SELECT id, NULL, price_cents, stock FROM public.products
WHERE vendor_id IS NULL
ON CONFLICT (product_id, vendor_id) DO NOTHING;

-- Make price_cents and stock nullable in products table to reflect that they are no longer strictly required
ALTER TABLE public.products ALTER COLUMN price_cents DROP NOT NULL;
ALTER TABLE public.products ALTER COLUMN stock DROP NOT NULL;

-- 3. ENABLE RLS AND SET GRANTS FOR VENDOR_OFFERS
ALTER TABLE public.vendor_offers ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.vendor_offers TO anon, authenticated;
GRANT ALL ON public.vendor_offers TO service_role;

-- 4. CREATE RLS POLICIES FOR VENDOR_OFFERS
DROP POLICY IF EXISTS "Vendor offers are viewable by everyone" ON public.vendor_offers;
CREATE POLICY "Vendor offers are viewable by everyone" ON public.vendor_offers
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Vendors manage own offers" ON public.vendor_offers;
CREATE POLICY "Vendors manage own offers" ON public.vendor_offers
  FOR ALL TO authenticated
  USING (
    vendor_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'vendor')
  )
  WITH CHECK (
    vendor_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'vendor')
  );

DROP POLICY IF EXISTS "Admins manage all offers" ON public.vendor_offers;
CREATE POLICY "Admins manage all offers" ON public.vendor_offers
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 5. ATTACH UPDATED_AT TRIGGER
DROP TRIGGER IF EXISTS vendor_offers_updated_at ON public.vendor_offers;
CREATE TRIGGER vendor_offers_updated_at BEFORE UPDATE ON public.vendor_offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
