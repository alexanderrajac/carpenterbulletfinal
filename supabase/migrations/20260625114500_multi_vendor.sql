-- 1. ADD 'vendor' ROLE TO app_role ENUM (PG 12+ supports IF NOT EXISTS for enum values)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor';

-- 2. CREATE VENDOR PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.vendor_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL UNIQUE,
  owner_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  workshop_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  upi_payout_id TEXT NOT NULL,
  bio TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ENABLE RLS AND SET GRANTS
GRANT SELECT ON public.vendor_profiles TO anon, authenticated;
GRANT ALL ON public.vendor_profiles TO service_role;
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES FOR VENDOR PROFILES
CREATE POLICY "Vendor profiles are viewable by everyone" ON public.vendor_profiles 
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Vendors can update their own profile" ON public.vendor_profiles 
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can create their own vendor profile" ON public.vendor_profiles 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- 5. UPDATE PRODUCTS WITH VENDOR RELATIONSHIP
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendor_profiles(id) ON DELETE SET NULL;

-- 6. PRODUCT RLS UPDATE (Allow vendors to edit only their own products)
DROP POLICY IF EXISTS "Admins manage products" ON public.products;

CREATE POLICY "Admins manage all products" ON public.products 
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Vendors manage own products" ON public.products 
  FOR ALL TO authenticated
  USING (
    vendor_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'vendor')
  )
  WITH CHECK (
    vendor_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'vendor')
  );

-- 7. UPDATE ORDER ITEMS TO ASSOCIATE VENDOR & TRACK FULFILLMENT STATUS
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendor_profiles(id) ON DELETE SET NULL;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS fulfillment_status TEXT NOT NULL DEFAULT 'pending';

-- 8. ORDER ITEMS RLS UPDATE (Allow vendors to view and fulfill their own items)
DROP POLICY IF EXISTS "View own order items" ON public.order_items;

CREATE POLICY "Admins and buyers view order items" ON public.order_items 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_id AND (
        o.user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
      )
    )
  );

CREATE POLICY "Vendors view own items" ON public.order_items 
  FOR SELECT TO authenticated 
  USING (vendor_id = auth.uid());

CREATE POLICY "Vendors update own items status" ON public.order_items 
  FOR UPDATE TO authenticated
  USING (vendor_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (vendor_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 9. ATTACH UPDATED_AT TRIGGER
CREATE TRIGGER vendor_profiles_updated_at BEFORE UPDATE ON public.vendor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
