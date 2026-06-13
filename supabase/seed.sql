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
