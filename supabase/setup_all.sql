-- ==========================================
-- 1. DATABASE SCHEMA (MIGRATION Part 1)
-- ==========================================

-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by owner" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles updatable by owner" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles insertable by owner" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are public" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  image_url TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are public" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  status TEXT NOT NULL DEFAULT 'pending',
  shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users create own orders" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Order items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  product_name TEXT NOT NULL,
  product_image_url TEXT
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own order items" ON public.order_items FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.orders o 
    WHERE o.id = order_id AND (
      o.user_id = auth.uid() OR 
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    )
  )
);
CREATE POLICY "Create own order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
);


-- ==========================================
-- 2. SECURITY GRANTS & REVOKES (MIGRATION Part 2)
-- ==========================================
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;


-- ==========================================
-- 3. SEED DATA (PRODUCTS & CATEGORIES)
-- ==========================================

-- Seed Categories
INSERT INTO public.categories (id, slug, name, description, image_url) VALUES (
  '4ce842c5-cf31-4f57-9b9d-bab1f5369aae',
  'furniture',
  'Furniture',
  'Heirloom-grade seating, tables, and statement pieces',
  'p1-lounge-chair.jpg'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.categories (id, slug, name, description, image_url) VALUES (
  '36a38db3-e497-4547-98df-56bb96155fd4',
  'storage',
  'Storage',
  'Shelves, trunks, and modular systems',
  'p4-floating-shelf.jpg'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.categories (id, slug, name, description, image_url) VALUES (
  '625b9da8-0c57-4e76-87cd-e8ef59e0c1cc',
  'kitchen',
  'Kitchen',
  'Boards, bowls, and serving essentials',
  'p7-cutting-board.jpg'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.categories (id, slug, name, description, image_url) VALUES (
  '3d0064f4-cbb8-4eef-b852-cbd0d5f5ac9d',
  'tools',
  'Tools',
  'Hand-forged instruments for the craft',
  'p10-chisel-set.jpg'
) ON CONFLICT (id) DO NOTHING;

-- Seed Products (1 product per category)
INSERT INTO public.products (id, slug, name, description, price_cents, image_url, category_id, stock, featured) VALUES (
  '76dde256-e569-42b4-a2ff-7565056dd95b',
  'walnut-lounge-chair',
  'Walnut Lounge Chair',
  'Solid American walnut frame with hand-stitched leather cushion. Built to last generations.',
  189000,
  'p1-lounge-chair.jpg',
  '4ce842c5-cf31-4f57-9b9d-bab1f5369aae',
  8,
  true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, slug, name, description, price_cents, image_url, category_id, stock, featured) VALUES (
  '9d9e018f-645b-4833-81e4-ecde5b3112d3',
  'floating-oak-shelf',
  'Floating Oak Shelf',
  'Wall-mounted oak shelf with hand-finished brass brackets. Two sizes.',
  18500,
  'p4-floating-shelf.jpg',
  '36a38db3-e497-4547-98df-56bb96155fd4',
  25,
  true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, slug, name, description, price_cents, image_url, category_id, stock, featured) VALUES (
  'ca5e88c5-430b-46ee-a0ea-9d142f4da4d0',
  'maple-cutting-board',
  'Maple End-Grain Board',
  'Self-healing end-grain maple cutting board with juice groove.',
  12500,
  'p7-cutting-board.jpg',
  '625b9da8-0c57-4e76-87cd-e8ef59e0c1cc',
  40,
  true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, slug, name, description, price_cents, image_url, category_id, stock, featured) VALUES (
  '8ca6d543-0196-4f82-afb6-36b315035758',
  'brass-wood-plane',
  'Brass Wood Plane',
  'Brass-bodied smoothing plane with walnut tote. Heirloom tool.',
  42000,
  'p11-wood-plane.jpg',
  '3d0064f4-cbb8-4eef-b852-cbd0d5f5ac9d',
  10,
  true
) ON CONFLICT (id) DO NOTHING;

-- Wooden Cup Category
INSERT INTO public.categories (id, slug, name, description, image_url) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'wooden-cup',
  'Wooden Cup',
  'Handcrafted wooden cups, mugs, and drinkware carved from premium hardwoods',
  'p9-bowl-set.jpg'
) ON CONFLICT (id) DO NOTHING;

-- Wooden Cup Product
INSERT INTO public.products (id, slug, name, description, price_cents, image_url, category_id, stock, featured) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'hand-carved-teak-cup',
  'Hand-Carved Teak Cup',
  'Exquisitely hand-carved teak wood drinking cup with natural food-safe finish. Each piece is unique with its own grain pattern.',
  4500,
  'p9-bowl-set.jpg',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  30,
  true
) ON CONFLICT (id) DO NOTHING;

