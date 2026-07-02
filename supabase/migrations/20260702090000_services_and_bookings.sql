-- ==========================================
-- SERVICES & BOOKINGS SCHEMA
-- ==========================================

-- 1. Master services table (seeded from services.csv)
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  starts_at_cents INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.services TO anon, authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Services are public" ON public.services FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage services" ON public.services FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));


-- 2. Which services each carpenter offers
CREATE TABLE IF NOT EXISTS public.carpenter_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  custom_price_cents INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, service_id)
);

GRANT SELECT ON public.carpenter_services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.carpenter_services TO authenticated;
GRANT ALL ON public.carpenter_services TO service_role;
ALTER TABLE public.carpenter_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Carpenter services are public" ON public.carpenter_services FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Vendors manage own services" ON public.carpenter_services FOR ALL TO authenticated
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());


-- 3. Service coverage areas (vendor ↔ district/pincode mapping)
CREATE TABLE IF NOT EXISTS public.service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  district TEXT NOT NULL,
  pincodes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(vendor_id, district)
);

GRANT SELECT ON public.service_areas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.service_areas TO authenticated;
GRANT ALL ON public.service_areas TO service_role;
ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service areas are public" ON public.service_areas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Vendors manage own areas" ON public.service_areas FOR ALL TO authenticated
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());


-- 4. Service bookings
CREATE TABLE IF NOT EXISTS public.service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES public.vendor_profiles(id) ON DELETE SET NULL,
  service_id UUID NOT NULL REFERENCES public.services(id),
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_date DATE NOT NULL,
  scheduled_slot TEXT NOT NULL DEFAULT 'morning',
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  address JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_cents INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.service_bookings TO authenticated;
GRANT ALL ON public.service_bookings TO service_role;
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view own bookings" ON public.service_bookings
  FOR SELECT TO authenticated
  USING (
    customer_id = auth.uid()
    OR vendor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Customers create bookings" ON public.service_bookings
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Vendors and admins update bookings" ON public.service_bookings
  FOR UPDATE TO authenticated
  USING (
    vendor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE TRIGGER service_bookings_updated_at BEFORE UPDATE ON public.service_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 5. Service reviews
CREATE TABLE IF NOT EXISTS public.service_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.service_bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(booking_id)
);

GRANT SELECT ON public.service_reviews TO anon, authenticated;
GRANT INSERT ON public.service_reviews TO authenticated;
GRANT ALL ON public.service_reviews TO service_role;
ALTER TABLE public.service_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are public" ON public.service_reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Customers create reviews" ON public.service_reviews FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());


-- 6. Seed the 31 services from services.csv
INSERT INTO public.services (category, name, description, starts_at_cents, sort_order) VALUES
  ('Wooden Door', 'Combo for Wooden Door', 'All-in-one door repair combo package', 9900, 1),
  ('Wooden Door', 'New Door Installation', 'Full installation of a new wooden door', 99900, 2),
  ('Wooden Door', 'Door Repair', 'Fix issues with existing wooden doors', 9900, 3),
  ('Wooden Door', 'Door Locks & Latches Repair', 'Repair broken or faulty door locks and latches', 9900, 4),
  ('Wooden Door', 'Door Lock Replace/Install', 'Replace or install new door locks', 12900, 5),
  ('Wooden Door', 'Door Hinges Repair/Replacement', 'Fix or replace door hinges', 19900, 6),
  ('Wooden Door', 'Door Accessories & Mesh Installation', 'Install mesh stoppers and other accessories', 12900, 7),
  ('Cupboard & Drawer', 'Combo for Cupboard & Drawer', 'Full cupboard and drawer repair combo', 14900, 8),
  ('Cupboard & Drawer', 'Cupboard Repair & Installation', 'Repair or install cupboards', 8900, 9),
  ('Cupboard & Drawer', 'Cupboard & Drawer Locks', 'Fix or install locks for cupboards and drawers', 7900, 10),
  ('Cupboard & Drawer', 'Drawer Repair & Installation', 'Repair or install drawers', 8900, 11),
  ('Decor & Mirror', 'Combo for Decor Installation', 'Combined decor installation package', 20800, 12),
  ('Decor & Mirror', 'Decor Installation Small', 'Install items up to 8x8 inch like frames clocks and key holders', 7900, 13),
  ('Decor & Mirror', 'Decor Installation Large', 'Install items above 8x8 inch', 12900, 14),
  ('Decor & Mirror', 'Mirror Installation', 'Professional mirror fitting at home', 14900, 15),
  ('Decor & Mirror', 'Ceiling Hook/Fastener Installation', 'For lights planters swings and hangers', 9900, 16),
  ('Shelf & Cabinet', 'Combo for Shelves & Cabinets', 'Shelf and cabinet combo package', 9900, 17),
  ('Shelf & Cabinet', 'Shelf Installation', 'Wall shelf installation with drill and fitting', 9900, 18),
  ('Shelf & Cabinet', 'Wall Cabinet Assembly & Installation', 'Assemble and mount wall cabinets', 19900, 19),
  ('Shelf & Cabinet', 'Bathroom Mirror Cabinet Installation', 'Install mirror cabinets in bathrooms', 49900, 20),
  ('Lock & Hinge', 'Door Locks & Latches Repair', 'Repair door locks and latches', 9900, 21),
  ('Lock & Hinge', 'Door Lock Replace/Install', 'Replace or install door locks', 12900, 22),
  ('Lock & Hinge', 'Cupboard & Drawer Locks', 'Repair or install cupboard locks', 7900, 23),
  ('Curtain & Window', 'Curtain Rod & Blind Installation', 'Install curtain rods and window blinds', 9900, 24),
  ('Curtain & Window', 'Window Repair', 'Fix broken or stiff windows', 14900, 25),
  ('Furniture Repair', 'General Furniture Repair', 'Fix and restore your furniture at home', 14900, 26),
  ('Furniture Repair', 'Broken Furniture Repair', 'Repair badly damaged furniture pieces', 19900, 27),
  ('Furniture Assembly', 'Furniture Assembly On Demand', '30-minute furniture assembly service', 19900, 28),
  ('Furniture Assembly', 'Full-Day Carpenter Booking', '8 hours of carpentry service', 99900, 29),
  ('Furniture Assembly', 'Custom Furniture Making', 'Carpenter visits to discuss and quote custom work', 0, 30)
ON CONFLICT DO NOTHING;
