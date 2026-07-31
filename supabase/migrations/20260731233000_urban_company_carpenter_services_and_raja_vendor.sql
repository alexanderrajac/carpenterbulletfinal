-- Migration: 20260731233000_urban_company_carpenter_services_and_raja_vendor.sql
-- Upsert 65 Urban Company Carpenter Services and seed Raja Carpenter (8248651695) in Kanchipuram District

-- 1. Create Raja Vendor Profile if not exists
INSERT INTO public.vendor_profiles (
  id,
  owner_name,
  business_name,
  phone_number,
  city,
  state,
  districts_covered,
  is_approved,
  bio,
  avatar_url,
  created_at
) VALUES (
  '82486516-9500-4000-8000-824865169500',
  'Raja',
  'Raja Carpenter Works & Doorstep Fitting',
  '8248651695',
  'Kanchipuram',
  'Tamil Nadu',
  ARRAY['Kanchipuram', 'Sriperumbudur', 'Chengalpattu', 'Chennai'],
  true,
  'Master Carpenter Raja with 15+ years experience in Kanchipuram district. Doorstep repair, door installation, wardrobe assembly, lock replacement, and custom woodwork.',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  now()
) ON CONFLICT (id) DO UPDATE SET
  phone_number = EXCLUDED.phone_number,
  city = EXCLUDED.city,
  districts_covered = EXCLUDED.districts_covered,
  is_approved = true;

-- 2. Create Service Area for Kanchipuram District
INSERT INTO public.service_areas (vendor_id, district, pincodes) VALUES
  ('82486516-9500-4000-8000-824865169500', 'Kanchipuram', ARRAY['631501', '631502', '631503', '602105', '603204'])
ON CONFLICT DO NOTHING;

-- 3. Upsert 65 Urban Company Carpenter Services (starts_at_cents in paise = INR * 100)
INSERT INTO public.services (id, category, name, description, starts_at_cents, is_active, sort_order) VALUES
  -- Clothes hanger
  ('c0010000-0000-4000-8000-000000000001', 'Clothes hanger', 'Ceiling-mounted hanger installation', '1 hr 30 mins doorstep installation', 60000, true, 1),
  ('c0010000-0000-4000-8000-000000000002', 'Clothes hanger', 'Wall/door hanger installation', '30 mins wall or door hanger fitting', 19900, true, 2),

  -- Bed
  ('c0020000-0000-4000-8000-000000000001', 'Bed', 'Bed support repair', '60 mins wooden bed support and slat repair', 45900, true, 3),
  ('c0020000-0000-4000-8000-000000000002', 'Bed', 'Bed legs/Headboard repair', '60 mins bed legs and headboard tightening/repair', 29900, true, 4),

  -- Cupboard & drawer
  ('c0030000-0000-4000-8000-000000000001', 'Cupboard & drawer', 'Cupboard hinge installation (upto 2)', '30 mins cupboard hydraulic/normal hinge installation', 17900, true, 5),
  ('c0030000-0000-4000-8000-000000000002', 'Cupboard & drawer', 'Channel repair (one set)', '30 mins repair of drawer slider channels', 16800, true, 6),
  ('c0030000-0000-4000-8000-000000000003', 'Cupboard & drawer', 'Drawer channel replacement (one set)', '30 mins soft-close or telescopic channel replacement', 24900, true, 7),
  ('c0030000-0000-4000-8000-000000000004', 'Cupboard & drawer', 'Cupboard handle installation/replacement', '30 mins handle fitting for wardrobes and drawers', 8900, true, 8),
  ('c0030000-0000-4000-8000-000000000005', 'Cupboard & drawer', 'Cupboard lock installation', '30 mins new lock fitting for cupboard/wardrobe', 24900, true, 9),
  ('c0030000-0000-4000-8000-000000000006', 'Cupboard & drawer', 'Cupboard lock replacement', '30 mins replacement of old cupboard key lock', 16900, true, 10),
  ('c0030000-0000-4000-8000-000000000007', 'Cupboard & drawer', 'Cupboard lock repair', '30 mins repair of jam or stuck cupboard lock', 19900, true, 11),

  -- Door
  ('c0040000-0000-4000-8000-000000000001', 'Door', 'Door accessory installation', '30 mins door latch/chain/stopper/magnet fitting', 12900, true, 12),
  ('c0040000-0000-4000-8000-000000000002', 'Door', 'Peephole installation', '30 mins door eye peephole installation', 17900, true, 13),
  ('c0040000-0000-4000-8000-000000000003', 'Door', 'Wooden door installation', '2 hrs 30 mins complete new wooden main door fitting', 69900, true, 14),
  ('c0040000-0000-4000-8000-000000000004', 'Door', 'Major wooden door repair', '30 mins adjusting & plane trimming of stuck door', 29900, true, 15),
  ('c0040000-0000-4000-8000-000000000005', 'Door', 'Minor wooden door repair', '30 mins minor sticking or hinge alignment', 17900, true, 16),
  ('c0040000-0000-4000-8000-000000000006', 'Door', 'Door hinge installation (upto 4 hinges)', '30 mins wooden door hinge fitting', 29900, true, 17),
  ('c0040000-0000-4000-8000-000000000007', 'Door', 'Door hinge installation (with dismantle)', '60 mins door unmounting and hinge replacement', 31900, true, 18),
  ('c0040000-0000-4000-8000-000000000008', 'Door', 'Door lock installation', '60 mins mortise / godrej door lock installation', 56900, true, 19),
  ('c0040000-0000-4000-8000-000000000009', 'Door', 'Door lock replacement', '30 mins door cylinder / lock replacement', 44900, true, 20),
  ('c0040000-0000-4000-8000-000000000010', 'Door', 'Door lock repair', '1 hr 30 mins door lock repair & servicing', 25900, true, 21),
  ('c0040000-0000-4000-8000-000000000011', 'Door', 'Mesh grill door repair/replacement (Type A)', '60 mins mosquito net / mesh grill door fix', 44900, true, 22),
  ('c0040000-0000-4000-8000-000000000012', 'Door', 'Mesh grill door repair/replacement (Type B)', '60 mins standard mesh door adjustment', 26900, true, 23),
  ('c0040000-0000-4000-8000-000000000013', 'Door', 'Overhead door closer installation', '30 mins pneumatic door closer installation', 26900, true, 24),
  ('c0040000-0000-4000-8000-000000000014', 'Door', 'Door closer installation (wall-mounted)', '1 hr 30 mins heavy duty wall hydraulic door closer', 49900, true, 25),
  ('c0040000-0000-4000-8000-000000000015', 'Door', 'Wooden sliding door repair', '60 mins sliding door wheel track repair', 36900, true, 26),

  -- Drill & hang
  ('c0050000-0000-4000-8000-000000000001', 'Drill & hang', 'Bathroom holder & hanger installations', '30 mins towel rod and soap dish wall mounting', 12900, true, 27),
  ('c0050000-0000-4000-8000-000000000002', 'Drill & hang', 'Drill & hang (wall decor)', '10 mins wall clock / photo frame drilling & hanging', 12900, true, 28),
  ('c0050000-0000-4000-8000-000000000003', 'Drill & hang', 'Bathroom mirror installation', '30 mins vanity mirror wall drilling & mounting', 13900, true, 29),
  ('c0050000-0000-4000-8000-000000000004', 'Drill & hang', 'Glass shelf installation', '30 mins glass shelf wall bracket installation', 13900, true, 30),
  ('c0050000-0000-4000-8000-000000000005', 'Drill & hang', 'Wooden shelf installation', '60 mins heavy wooden shelf wall mounting', 28900, true, 31),
  ('c0050000-0000-4000-8000-000000000006', 'Drill & hang', 'Corner guard/safety lock installation', '30 mins child safety lock and corner fitting', 29900, true, 32),
  ('c0050000-0000-4000-8000-000000000007', 'Drill & hang', 'Bed fence installation', '30 mins baby safety bed railing installation', 29900, true, 33),
  ('c0050000-0000-4000-8000-000000000008', 'Drill & hang', 'Safety gate installation', '30 mins staircase / doorway safety gate installation', 69900, true, 34),

  -- Furniture repair
  ('c0060000-0000-4000-8000-000000000001', 'Furniture repair', 'Plastic buffer installation (upto 4)', '30 mins sofa / table leg buffer fitting', 11900, true, 35),
  ('c0060000-0000-4000-8000-000000000002', 'Furniture repair', 'Chair wheels fitting', '30 mins office chair castor wheel replacement', 11900, true, 36),

  -- Window & curtain
  ('c0070000-0000-4000-8000-000000000001', 'Window & curtain', 'Curtain blinds measurement', '60 mins expert window measurement for custom blinds', 11900, true, 37),
  ('c0070000-0000-4000-8000-000000000002', 'Window & curtain', 'Curtain rod installation (2 brackets)', '30 mins curtain rod wall mounting', 19900, true, 38),
  ('c0070000-0000-4000-8000-000000000003', 'Window & curtain', 'Shower curtain rod installation (2 brackets)', '30 mins bathroom shower curtain rod fitting', 19900, true, 39),
  ('c0070000-0000-4000-8000-000000000004', 'Window & curtain', 'Motorised blinds fitting (upto 5ft)', '30 mins automated motorised blinds installation', 33900, true, 40),
  ('c0070000-0000-4000-8000-000000000005', 'Window & curtain', 'Non-motorised blinds fitting (upto 5ft)', '30 mins zebra / roller blind installation', 18900, true, 41),
  ('c0070000-0000-4000-8000-000000000006', 'Window & curtain', 'Window AC frame installation', '1 hr 30 mins wooden AC frame fabrication & fitting', 32900, true, 42),
  ('c0070000-0000-4000-8000-000000000007', 'Window & curtain', 'Window closing (post AC removal)', '1 hr 30 mins sealing window gap after AC uninstallation', 16900, true, 43),
  ('c0070000-0000-4000-8000-000000000008', 'Window & curtain', 'Window hinge installation (upto 4)', '30 mins wooden window hinge replacement', 19900, true, 44),

  -- Furniture assembly
  ('c0080000-0000-4000-8000-000000000001', 'Furniture assembly', 'Single bed assembly', 'Complete unboxing & assembly for single bed', 44900, true, 45),
  ('c0080000-0000-4000-8000-000000000002', 'Furniture assembly', 'Double bed assembly', 'Complete assembly for king / queen size bed', 59900, true, 46),
  ('c0080000-0000-4000-8000-000000000003', 'Furniture assembly', 'Hydraulic bed assembly', 'Heavy hydraulic lift storage bed assembly', 129900, true, 47),
  ('c0080000-0000-4000-8000-000000000004', 'Furniture assembly', 'Study table assembly', 'Study table / computer desk setup', 44900, true, 48),
  ('c0080000-0000-4000-8000-000000000005', 'Furniture assembly', 'Coffee table assembly', 'Tea table / coffee table assembly', 26900, true, 49),
  ('c0080000-0000-4000-8000-000000000006', 'Furniture assembly', 'Cabinet assembly', 'Storage cabinet / sideboard assembly', 49900, true, 50),
  ('c0080000-0000-4000-8000-000000000007', 'Furniture assembly', 'Shelving unit assembly & installation', 'Wall shelf unit assembly and mounting', 19900, true, 51),
  ('c0080000-0000-4000-8000-000000000008', 'Furniture assembly', 'Mandir assembly & installation', '20 mins pooja mandapam assembly & wall mount', 19900, true, 52),
  ('c0080000-0000-4000-8000-000000000009', 'Furniture assembly', 'Double door wardrobe assembly', '2 hrs 2-door wooden wardrobe assembly', 84900, true, 53),
  ('c0080000-0000-4000-8000-000000000010', 'Furniture assembly', 'Three door wardrobe assembly', '2 hrs 30 mins 3-door wardrobe assembly', 94900, true, 54),
  ('c0080000-0000-4000-8000-000000000011', 'Furniture assembly', 'Office chair assembly', 'Ergonomic office chair unboxing & fitting', 24900, true, 55),
  ('c0080000-0000-4000-8000-000000000012', 'Furniture assembly', 'Book shelf/bookcase assembly & installation', 'Tall bookcase assembly & anti-topple wall anchor', 24900, true, 56),
  ('c0080000-0000-4000-8000-000000000013', 'Furniture assembly', 'Cot assembly', '30 mins wooden / metal cot assembly', 39900, true, 57),
  ('c0080000-0000-4000-8000-000000000014', 'Furniture assembly', 'Single door wardrobe assembly', '2 hrs single door almirah assembly', 59900, true, 58),
  ('c0080000-0000-4000-8000-000000000015', 'Furniture assembly', 'Table/chair wheel fitting', '15 mins castor wheel fitting for tables & chairs', 11900, true, 59),
  ('c0080000-0000-4000-8000-000000000016', 'Furniture assembly', 'Four door wardrobe assembly', '3 hrs large 4-door wardrobe complete assembly', 104900, true, 60),
  ('c0080000-0000-4000-8000-000000000017', 'Furniture assembly', 'Shoe rack assembly', 'Wooden / plastic shoe rack fitting', 19900, true, 61),
  ('c0080000-0000-4000-8000-000000000018', 'Furniture assembly', 'Standing table assembly', '2 hrs 30 mins height adjustable standing desk assembly', 99900, true, 62),
  ('c0080000-0000-4000-8000-000000000019', 'Furniture assembly', 'Shoe cabinet assembly', 'Closed shoe cabinet with drawer assembly', 29900, true, 63),

  -- At home consultation
  ('c0090000-0000-4000-8000-000000000001', 'At home consultation', 'Book a carpenter (evaluation + quote)', '20 mins expert visit and quote for larger jobs', 9900, true, 64)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  starts_at_cents = EXCLUDED.starts_at_cents,
  is_active = true;

-- 4. Link Raja Craftsman (8248651695) to offer ALL 65 carpenter services in Kanchipuram District
INSERT INTO public.carpenter_services (vendor_id, service_id, custom_price_cents, is_active)
SELECT 
  '82486516-9500-4000-8000-824865169500' AS vendor_id,
  id AS service_id,
  starts_at_cents AS custom_price_cents,
  true AS is_active
FROM public.services
ON CONFLICT (vendor_id, service_id) DO UPDATE SET
  is_active = true;
