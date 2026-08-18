-- Migration: 20260818100000_carpenterbullet_upgrade_layer.sql
-- CarpenterBullet Additive Upgrade Layer (Zero Breakage)

-- 1. EXTEND VENDOR PROFILES TABLE (ADDITIVE COLUMNS)
ALTER TABLE public.vendor_profiles ADD COLUMN IF NOT EXISTS availability_status TEXT NOT NULL DEFAULT 'AVAILABLE';
ALTER TABLE public.vendor_profiles ADD COLUMN IF NOT EXISTS verification_badge TEXT NOT NULL DEFAULT 'VERIFIED';
ALTER TABLE public.vendor_profiles ADD COLUMN IF NOT EXISTS response_rate_pct INTEGER NOT NULL DEFAULT 98;
ALTER TABLE public.vendor_profiles ADD COLUMN IF NOT EXISTS response_time_minutes INTEGER NOT NULL DEFAULT 15;
ALTER TABLE public.vendor_profiles ADD COLUMN IF NOT EXISTS completed_jobs_count INTEGER NOT NULL DEFAULT 12;
ALTER TABLE public.vendor_profiles ADD COLUMN IF NOT EXISTS carpenter_score NUMERIC(3,1) NOT NULL DEFAULT 4.8;
ALTER TABLE public.vendor_profiles ADD COLUMN IF NOT EXISTS hardware_store_partner BOOLEAN NOT NULL DEFAULT false;

-- 2. CREATE JOB REQUIREMENTS (RFQ MARKETPLACE)
CREATE TABLE IF NOT EXISTS public.job_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  whatsapp_number TEXT,
  service_category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  city TEXT NOT NULL,
  area TEXT NOT NULL,
  budget_min_cents INTEGER DEFAULT 0,
  budget_max_cents INTEGER DEFAULT 0,
  urgency TEXT NOT NULL DEFAULT 'normal', -- 'emergency', 'urgent', 'normal', 'flexible'
  preferred_date DATE,
  photos TEXT[] DEFAULT '{}',
  measurements TEXT,
  status TEXT NOT NULL DEFAULT 'NEW', -- 'NEW', 'CONTACTED', 'QUOTED', 'WON', 'LOST', 'COMPLETED'
  matched_vendor_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.job_requirements TO anon, authenticated;
GRANT ALL ON public.job_requirements TO service_role;
ALTER TABLE public.job_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public create job requirements" ON public.job_requirements
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Users view own requirements or matched vendors" ON public.job_requirements
  FOR SELECT TO anon, authenticated
  USING (
    customer_id = auth.uid()
    OR auth.uid() = ANY(matched_vendor_ids)
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND (role = 'vendor' OR role = 'admin'))
  );

CREATE POLICY "Users and vendors update requirements" ON public.job_requirements
  FOR UPDATE TO authenticated
  USING (
    customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND (role = 'vendor' OR role = 'admin'))
  );

-- 3. CREATE QUOTES TABLE
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES public.job_requirements(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  labor_cents INTEGER DEFAULT 0,
  materials_cents INTEGER DEFAULT 0,
  estimated_days INTEGER NOT NULL DEFAULT 1,
  materials_description TEXT,
  warranty_months INTEGER DEFAULT 6,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'submitted', -- 'submitted', 'accepted', 'rejected'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(requirement_id, vendor_id)
);

GRANT SELECT, INSERT, UPDATE ON public.quotes TO anon, authenticated;
GRANT ALL ON public.quotes TO service_role;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public view quotes for requirement" ON public.quotes
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Vendors create quotes" ON public.quotes
  FOR INSERT TO authenticated
  WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Vendors update own quotes" ON public.quotes
  FOR UPDATE TO authenticated
  USING (vendor_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 4. CREATE PROJECTS TABLE (BEFORE/AFTER PORTFOLIO)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  city TEXT NOT NULL,
  area TEXT NOT NULL,
  before_image_url TEXT,
  after_image_url TEXT NOT NULL,
  gallery_images TEXT[] DEFAULT '{}',
  duration_days INTEGER DEFAULT 3,
  price_range_text TEXT,
  materials_used TEXT[] DEFAULT '{}',
  customer_review_rating INTEGER CHECK (customer_review_rating BETWEEN 1 AND 5),
  customer_review_text TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.projects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Projects are public" ON public.projects FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Vendors manage own projects" ON public.projects FOR ALL TO authenticated
  USING (vendor_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (vendor_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 5. CREATE LEAD EVENTS TABLE (CALL/WHATSAPP/QUOTE CLICK ANALYTICS)
CREATE TABLE IF NOT EXISTS public.lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'call', 'whatsapp', 'quote_request', 'callback'
  vendor_id UUID REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES public.job_requirements(id) ON DELETE CASCADE,
  customer_phone TEXT,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.lead_events TO anon, authenticated;
GRANT ALL ON public.lead_events TO service_role;
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create lead events" ON public.lead_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Vendors view own lead events" ON public.lead_events FOR SELECT TO authenticated
  USING (vendor_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 6. PROGRAMMATIC SEO TABLES
CREATE TABLE IF NOT EXISTS public.seo_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  area TEXT NOT NULL,
  district TEXT NOT NULL,
  pincode TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(city, area)
);

GRANT SELECT ON public.seo_locations TO anon, authenticated;
GRANT ALL ON public.seo_locations TO service_role;
ALTER TABLE public.seo_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SEO locations public" ON public.seo_locations FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.seo_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url_path TEXT UNIQUE NOT NULL, -- e.g. '/carpenters/chennai/ambattur/wardrobe'
  city TEXT NOT NULL,
  area TEXT NOT NULL,
  service_category TEXT NOT NULL,
  title_tag TEXT NOT NULL,
  meta_description TEXT NOT NULL,
  h1_heading TEXT NOT NULL,
  intro_content TEXT NOT NULL,
  faqs JSONB DEFAULT '[]'::jsonb,
  is_indexed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.seo_pages TO anon, authenticated;
GRANT ALL ON public.seo_pages TO service_role;
ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SEO pages public" ON public.seo_pages FOR SELECT TO anon, authenticated USING (true);

-- 7. SEED INITIAL SEO LOCATIONS & PORTFOLIO PROJECTS
INSERT INTO public.seo_locations (city, area, district, pincode) VALUES
  ('Chennai', 'Ambattur', 'Chennai', '600053'),
  ('Chennai', 'Anna Nagar', 'Chennai', '600040'),
  ('Chennai', 'Velachery', 'Chennai', '600042'),
  ('Chennai', 'Tambaram', 'Chennai', '600045'),
  ('Chennai', 'Adyar', 'Chennai', '600020'),
  ('Chennai', 'Porur', 'Chennai', '600116'),
  ('Kanchipuram', 'Sriperumbudur', 'Kanchipuram', '602105'),
  ('Kanchipuram', 'Chengalpattu', 'Kanchipuram', '603204')
ON CONFLICT DO NOTHING;

-- Seed Sample Project for Raja Carpenter
INSERT INTO public.projects (
  vendor_id, slug, title, description, category, city, area,
  before_image_url, after_image_url, duration_days, price_range_text, materials_used, customer_review_rating, customer_review_text, featured
) VALUES (
  '82486516-9500-4000-8000-824865169500',
  'custom-teak-wardrobe-ambattur',
  'Custom 3-Door Teak Wardrobe with Hydraulic Storage',
  'Designed, fabricated, and installed a 7x6 ft heavy-duty teak wood wardrobe with soft-close drawers and concealed LED strip channels in Ambattur.',
  'Cupboard & drawer',
  'Chennai',
  'Ambattur',
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
  5,
  '₹35,000 - ₹42,000',
  ARRAY['Greenply BWP Plywood', 'Teak Wood Veneer', 'Hettich Soft-Close Hinges'],
  5,
  'Raja sir completed the entire wardrobe work within 5 days with flawless finishing! Highly recommended.',
  true
) ON CONFLICT (slug) DO NOTHING;

-- Triggers for updated_at
CREATE TRIGGER job_requirements_updated_at BEFORE UPDATE ON public.job_requirements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER quotes_updated_at BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER seo_pages_updated_at BEFORE UPDATE ON public.seo_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
