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

-- Seed Products
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
  '5a34246b-456b-4c4e-a68b-aa0f80f29910',
  'oak-dining-table',
  'Oak Dining Table',
  'Six-seater dining table in solid white oak with hand-shaped tapered legs.',
  245000,
  'p2-dining-table.jpg',
  '4ce842c5-cf31-4f57-9b9d-bab1f5369aae',
  5,
  true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, slug, name, description, price_cents, image_url, category_id, stock, featured) VALUES (
  'd26a3be5-ffbe-433c-be0f-913952d501d9',
  'live-edge-side-table',
  'Live-Edge Side Table',
  'Single-slab walnut with natural raw edge on blackened steel hairpin legs.',
  68000,
  'p3-side-table.jpg',
  '4ce842c5-cf31-4f57-9b9d-bab1f5369aae',
  12,
  false
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
  '46b9420a-7e7c-4b45-b4d2-f9111b554236',
  'modular-bookshelf',
  'Modular Bookshelf',
  'Customizable cube system in warm oak. Stack, mix, expand.',
  145000,
  'p5-bookshelf.jpg',
  '36a38db3-e497-4547-98df-56bb96155fd4',
  9,
  false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, slug, name, description, price_cents, image_url, category_id, stock, featured) VALUES (
  '7a590bce-f219-465a-9601-8d8a48408a24',
  'cedar-storage-trunk',
  'Cedar Storage Trunk',
  'Aromatic cedar trunk with brass hardware and leather straps.',
  92000,
  'p6-storage-trunk.jpg',
  '36a38db3-e497-4547-98df-56bb96155fd4',
  7,
  false
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
  '16c1a944-2dd1-4359-a3be-25d8bd1a9521',
  'walnut-serving-tray',
  'Walnut Serving Tray',
  'Hand-finished walnut with vegetable-tanned leather handles.',
  16800,
  'p8-serving-tray.jpg',
  '625b9da8-0c57-4e76-87cd-e8ef59e0c1cc',
  22,
  false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, slug, name, description, price_cents, image_url, category_id, stock, featured) VALUES (
  '87d80e4c-2819-4105-97f3-22216445fefe',
  'olive-bowl-set',
  'Olive Wood Bowl Set',
  'Trio of nesting bowls turned from single olive blocks.',
  22400,
  'p9-bowl-set.jpg',
  '625b9da8-0c57-4e76-87cd-e8ef59e0c1cc',
  18,
  true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, slug, name, description, price_cents, image_url, category_id, stock, featured) VALUES (
  '99e372b9-e998-40f8-9d0f-5a7749a8725b',
  'chisel-set',
  'Hand-Forged Chisel Set',
  'Six high-carbon chisels with walnut handles. Sharpened in-house.',
  34500,
  'p10-chisel-set.jpg',
  '3d0064f4-cbb8-4eef-b852-cbd0d5f5ac9d',
  15,
  false
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

INSERT INTO public.products (id, slug, name, description, price_cents, image_url, category_id, stock, featured) VALUES (
  '06301ebb-cf46-4c05-99e4-27defa724ff5',
  'leather-tool-roll',
  'Leather Tool Roll',
  'Full-grain bridle leather with brass buckles. Holds 12 tools.',
  18900,
  'p12-tool-roll.jpg',
  '3d0064f4-cbb8-4eef-b852-cbd0d5f5ac9d',
  30,
  false
) ON CONFLICT (id) DO NOTHING;

