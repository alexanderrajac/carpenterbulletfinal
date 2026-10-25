import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envContent = fs.readFileSync(".env", "utf-8");
const url = envContent.match(/SUPABASE_URL="?([^\s"]+)/)?.[1];
const key = envContent.match(/SUPABASE_SERVICE_ROLE_KEY="?([^\s"]+)/)?.[1];

if (!url || !key) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(url, key);

// 85+ Comprehensive Urban Company Carpenter Services (Pure Carpentry & Woodwork)
const SERVICES = [
  // Door Services
  {
    category: "Door",
    name: "Wooden door installation",
    description: "2 hrs 30 mins complete new wooden main door fitting with frame alignment",
    starts_at_cents: 69900,
    sort_order: 1,
    image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Door",
    name: "Door lock installation",
    description: "60 mins mortise / Godrej cylinder door lock installation with wood chiseling",
    starts_at_cents: 56900,
    sort_order: 2,
    image_url: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Door",
    name: "Door lock replacement",
    description: "30 mins replacement of old door handle lock, deadbolt or cylinder",
    starts_at_cents: 44900,
    sort_order: 3,
    image_url: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Door",
    name: "Door lock repair",
    description: "45 mins door lock repair, stuck bolt servicing and key alignment",
    starts_at_cents: 25900,
    sort_order: 4,
    image_url: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Door",
    name: "Major wooden door repair & trimming",
    description: "45 mins door bottom plane trimming to fix sticking or dragging on floor tiles",
    starts_at_cents: 29900,
    sort_order: 5,
    image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Door",
    name: "Minor wooden door repair",
    description: "30 mins minor latch alignment, strike plate adjustment or hinge tightening",
    starts_at_cents: 17900,
    sort_order: 6,
    image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Door",
    name: "Door hinge installation (upto 4 hinges)",
    description: "30 mins stainless steel / brass butt hinge installation on wooden door",
    starts_at_cents: 29900,
    sort_order: 7,
    image_url: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Door",
    name: "Door hinge installation (with dismantle)",
    description: "60 mins full door unmounting, hinge recess carving, and remounting",
    starts_at_cents: 31900,
    sort_order: 8,
    image_url: "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Door",
    name: "Overhead hydraulic door closer installation",
    description: "45 mins pneumatic / hydraulic overhead soft door closer installation",
    starts_at_cents: 26900,
    sort_order: 9,
    image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Door",
    name: "Door closer installation (wall-mounted / heavy)",
    description: "1 hr 30 mins heavy duty concealed or wall mounted door closer fitting",
    starts_at_cents: 49900,
    sort_order: 10,
    image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Door",
    name: "Wooden sliding door repair & roller replacement",
    description: "60 mins sliding door wheel track cleaning, alignment and roller replacement",
    starts_at_cents: 36900,
    sort_order: 11,
    image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Door",
    name: "Door accessory installation (latches, stoppers, chains)",
    description: "30 mins fitting of magnetic door stopper, safety chain, aldrop or tower bolt",
    starts_at_cents: 12900,
    sort_order: 12,
    image_url: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Door",
    name: "Door peephole & digital viewer installation",
    description: "30 mins precision drill and installation of optical / digital door eye viewer",
    starts_at_cents: 17900,
    sort_order: 13,
    image_url: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Door",
    name: "Mesh grill wooden door repair / replacement",
    description: "60 mins mosquito net / stainless wire mesh replacement for wooden frame door",
    starts_at_cents: 44900,
    sort_order: 14,
    image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  },

  // Cupboard & Drawer
  {
    category: "Cupboard & drawer",
    name: "Cupboard hydraulic hinge installation (upto 2)",
    description: "30 mins installation of soft-close 3D hydraulic hinges for wardrobes & cabinets",
    starts_at_cents: 17900,
    sort_order: 15,
    image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Cupboard & drawer",
    name: "Drawer channel repair (one set)",
    description: "30 mins repair and lubrication of stuck or misaligned drawer sliders",
    starts_at_cents: 16800,
    sort_order: 16,
    image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Cupboard & drawer",
    name: "Drawer channel replacement (telescopic / soft-close)",
    description: "45 mins heavy duty ball-bearing telescopic channel slider replacement",
    starts_at_cents: 24900,
    sort_order: 17,
    image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Cupboard & drawer",
    name: "Cupboard handle & knob installation",
    description: "30 mins fitting of designer handles, concealed profile handles or brass knobs",
    starts_at_cents: 8900,
    sort_order: 18,
    image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Cupboard & drawer",
    name: "Cupboard lock installation",
    description: "30 mins new key lock installation for wardrobe, almirah or office drawer",
    starts_at_cents: 24900,
    sort_order: 19,
    image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Cupboard & drawer",
    name: "Cupboard lock replacement",
    description: "30 mins removal of old lock and installation of high-security replacement lock",
    starts_at_cents: 16900,
    sort_order: 20,
    image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Cupboard & drawer",
    name: "Cupboard lock repair & latch fixing",
    description: "30 mins unjamming stuck wardrobe key lock, repairing loose latch and striker",
    starts_at_cents: 19900,
    sort_order: 21,
    image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Cupboard & drawer",
    name: "Additional internal wooden shelf addition",
    description: "60 mins cutting, edging and mounting an additional wooden shelf in cupboard",
    starts_at_cents: 34900,
    sort_order: 22,
    image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Cupboard & drawer",
    name: "Wardrobe clothes hanging oval rod installation",
    description: "30 mins heavy duty metal/wooden wardrobe hanging rod bracket fitting",
    starts_at_cents: 14900,
    sort_order: 23,
    image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
  },

  // Bed & Bedroom Woodwork
  {
    category: "Bed",
    name: "Bed support & wooden slat repair",
    description: "60 mins wooden bed support slat reinforcement and central beam repair",
    starts_at_cents: 45900,
    sort_order: 24,
    image_url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Bed",
    name: "Bed legs & headboard repair",
    description: "60 mins tightening wobbly bed legs, headboard bracing and silencing squeaks",
    starts_at_cents: 29900,
    sort_order: 25,
    image_url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Bed",
    name: "Hydraulic bed lift gas spring replacement",
    description: "60 mins replacement of dual hydraulic gas shock absorbers for storage bed",
    starts_at_cents: 49900,
    sort_order: 26,
    image_url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Bed",
    name: "Bunk bed ladder tightening & safety rail fix",
    description: "45 mins bunk bed wooden ladder reinforcement and safety rail alignment",
    starts_at_cents: 34900,
    sort_order: 27,
    image_url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
  },

  // Furniture Assembly
  {
    category: "Furniture assembly",
    name: "Single bed assembly",
    description: "45 mins complete unboxing, frame joinery and assembly for single bed",
    starts_at_cents: 44900,
    sort_order: 28,
    image_url: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Furniture assembly",
    name: "Double bed / King size bed assembly",
    description: "1 hr 15 mins complete assembly for king / queen size wooden cot",
    starts_at_cents: 59900,
    sort_order: 29,
    image_url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Furniture assembly",
    name: "Hydraulic bed assembly (with storage)",
    description: "2 hrs heavy hydraulic lift mechanism, storage box & bed frame assembly",
    starts_at_cents: 129900,
    sort_order: 30,
    image_url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Furniture assembly",
    name: "Study table / Computer desk assembly",
    description: "60 mins study table, workstation desk with drawers & keyboard tray setup",
    starts_at_cents: 44900,
    sort_order: 31,
    image_url: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Furniture assembly",
    name: "Standing desk (motorised / adjustable) assembly",
    description: "2 hrs height adjustable motorized standing desk and wooden top assembly",
    starts_at_cents: 99900,
    sort_order: 32,
    image_url: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Furniture assembly",
    name: "Coffee table assembly",
    description: "30 mins center table / tea table unboxing and assembly",
    starts_at_cents: 26900,
    sort_order: 33,
    image_url: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Furniture assembly",
    name: "Single door wardrobe assembly",
    description: "1 hr 30 mins single door almirah / tall storage cabinet assembly",
    starts_at_cents: 59900,
    sort_order: 34,
    image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Furniture assembly",
    name: "Double door wardrobe assembly",
    description: "2 hrs 2-door wooden wardrobe assembly with hinges and shelves",
    starts_at_cents: 84900,
    sort_order: 35,
    image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Furniture assembly",
    name: "Three door wardrobe assembly",
    description: "2 hrs 30 mins 3-door wardrobe complete assembly with drawer units",
    starts_at_cents: 94900,
    sort_order: 36,
    image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Furniture assembly",
    name: "Four door wardrobe assembly",
    description: "3 hrs large 4-door wardrobe complete assembly & alignment",
    starts_at_cents: 104900,
    sort_order: 37,
    image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Furniture assembly",
    name: "Office chair unboxing & ergonomic fitting",
    description: "30 mins executive / mesh ergonomic chair hydraulic lift and wheel assembly",
    starts_at_cents: 24900,
    sort_order: 38,
    image_url: "https://images.unsplash.com/photo-1580481077191-4d14210a47d2?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Furniture assembly",
    name: "Book shelf / bookcase assembly & wall anchor",
    description: "60 mins tall bookcase assembly with anti-topple wall safety anchor",
    starts_at_cents: 24900,
    sort_order: 39,
    image_url: "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Furniture assembly",
    name: "Shoe rack assembly (open / bench)",
    description: "30 mins wooden shoe rack / entryway bench assembly",
    starts_at_cents: 19900,
    sort_order: 40,
    image_url: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Furniture assembly",
    name: "Closed shoe cabinet assembly",
    description: "60 mins closed shoe cabinet with louvered doors and drawers assembly",
    starts_at_cents: 29900,
    sort_order: 41,
    image_url: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Furniture assembly",
    name: "TV entertainment unit / console assembly",
    description: "1 hr 30 mins media console assembly with cable management cutout",
    starts_at_cents: 54900,
    sort_order: 42,
    image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
  },

  // Kitchen & Dining Woodwork
  {
    category: "Kitchen & dining",
    name: "Modular kitchen hinge alignment & tightening (upto 6)",
    description: "45 mins alignment of sagging kitchen cabinet doors, adjusting soft-close tension",
    starts_at_cents: 24900,
    sort_order: 43,
    image_url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Kitchen & dining",
    name: "Kitchen basket channel slider repair / replacement",
    description: "45 mins stainless wire basket slider channel repair or replacement",
    starts_at_cents: 28900,
    sort_order: 44,
    image_url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Kitchen & dining",
    name: "Kitchen chimney wooden duct boxing fabrication",
    description: "2 hrs custom wooden casing box to conceal kitchen exhaust chimney pipe",
    starts_at_cents: 69900,
    sort_order: 45,
    image_url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Kitchen & dining",
    name: "Under-sink cabinet wooden moisture repair",
    description: "1 hr 30 mins replacing water-damaged bottom ply with marine grade plywood",
    starts_at_cents: 59900,
    sort_order: 46,
    image_url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Kitchen & dining",
    name: "Dining table leg tightening & wobble repair",
    description: "30 mins solid wood dining table corner bracket tightening and leveling",
    starts_at_cents: 21900,
    sort_order: 47,
    image_url: "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Kitchen & dining",
    name: "Dining chair joinery regluing & wobble fix (per chair)",
    description: "30 mins dismantling loose chair mortise joints, wood glue injection & clamp drying",
    starts_at_cents: 17900,
    sort_order: 48,
    image_url: "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80",
  },

  // Drill & Hang (Wall Mounting)
  {
    category: "Drill & hang",
    name: "Bathroom vanity mirror installation",
    description: "30 mins precision drill & heavy anchor wall mounting for bathroom vanity mirrors",
    starts_at_cents: 13900,
    sort_order: 49,
    image_url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Drill & hang",
    name: "Decorative wall mirror hanging (large / designer)",
    description: "45 mins heavy duty multi-anchor installation for full-length & designer wall mirrors",
    starts_at_cents: 24900,
    sort_order: 50,
    image_url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Drill & hang",
    name: "Wooden floating shelf installation (concealed bracket)",
    description: "45 mins solid wood floating shelf wall drilling and spirit-level alignment",
    starts_at_cents: 28900,
    sort_order: 51,
    image_url: "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Drill & hang",
    name: "Glass shelf bracket installation",
    description: "30 mins wall drill, chrome clamp bracket and glass shelf fitting",
    starts_at_cents: 13900,
    sort_order: 52,
    image_url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Drill & hang",
    name: "Bathroom holder & accessories fitting (upto 3)",
    description: "30 mins towel rod, soap dispenser, tumbler and robe hook drilling on tiles",
    starts_at_cents: 12900,
    sort_order: 53,
    image_url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Drill & hang",
    name: "Wall decor, frame & clock hanging (upto 3)",
    description: "20 mins photo frames, wall paintings or antique clock precision hanging",
    starts_at_cents: 12900,
    sort_order: 54,
    image_url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Drill & hang",
    name: "Wall/door hanger / coat rack installation",
    description: "30 mins multi-hook coat hanger wall or behind-the-door mounting",
    starts_at_cents: 19900,
    sort_order: 55,
    image_url: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Drill & hang",
    name: "Ceiling-mounted clothes hanger installation",
    description: "1 hr 30 mins 6-pipe pulley ceiling cloth drying hanger installation",
    starts_at_cents: 60000,
    sort_order: 56,
    image_url: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80",
  },

  // Window & Curtain
  {
    category: "Window & curtain",
    name: "Curtain rod installation (2 brackets)",
    description: "30 mins precision wall drilling and curtain rod mounting with finials",
    starts_at_cents: 19900,
    sort_order: 57,
    image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Window & curtain",
    name: "Shower curtain rod installation",
    description: "30 mins bathroom tension / bracket shower curtain rail fitting",
    starts_at_cents: 19900,
    sort_order: 58,
    image_url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Window & curtain",
    name: "Window blinds fitting (roller / zebra / venetian)",
    description: "45 mins manual window blinds wall or lintel bracket installation",
    starts_at_cents: 18900,
    sort_order: 59,
    image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Window & curtain",
    name: "Motorised blinds fitting & bracket mount",
    description: "60 mins automated motorized roller blinds bracket installation",
    starts_at_cents: 33900,
    sort_order: 60,
    image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Window & curtain",
    name: "Window AC wooden frame fabrication & fitting",
    description: "1 hr 30 mins custom solid wood AC frame fabrication and sealing",
    starts_at_cents: 32900,
    sort_order: 61,
    image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Window & curtain",
    name: "Window closing with plywood (post AC removal)",
    description: "1 hr 30 mins sealing AC window gap with waterproof plywood and beading",
    starts_at_cents: 16900,
    sort_order: 62,
    image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Window & curtain",
    name: "Wooden window hinge & stay latch repair",
    description: "30 mins window hinge replacement and casement stay latch fitting",
    starts_at_cents: 19900,
    sort_order: 63,
    image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  },

  // Furniture Repair & Restoration
  {
    category: "Furniture repair",
    name: "Plastic / rubber leg buffer installation (upto 4)",
    description: "30 mins sofa or table floor protection leg buffer fitting to stop scratching",
    starts_at_cents: 11900,
    sort_order: 64,
    image_url: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Furniture repair",
    name: "Chair castor wheels fitting (set of 5)",
    description: "30 mins office chair 360-degree roller wheel replacement",
    starts_at_cents: 11900,
    sort_order: 65,
    image_url: "https://images.unsplash.com/photo-1580481077191-4d14210a47d2?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Furniture repair",
    name: "Wooden sofa frame reinforcement & joint repair",
    description: "1 hr 15 mins strengthening cracked sofa wood rails and corner gussets",
    starts_at_cents: 49900,
    sort_order: 66,
    image_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Furniture repair",
    name: "Laminate / PVC edge banding re-pasting (upto 10ft)",
    description: "45 mins heat-activated re-pasting and trimming of peeled cabinet edges",
    starts_at_cents: 22900,
    sort_order: 67,
    image_url: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80",
  },

  // Pooja & Mandir Woodwork
  {
    category: "Pooja & mandir",
    name: "Teak wood pooja mandapam wall installation",
    description: "45 mins heavy anchor wall mounting for handcrafted wooden pooja temple",
    starts_at_cents: 24900,
    sort_order: 68,
    image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Pooja & mandir",
    name: "Brass pooja bell ceiling wooden pelmet & hook fitting",
    description: "30 mins ceiling hook drilling and wooden bell hanging pelmet installation",
    starts_at_cents: 19900,
    sort_order: 69,
    image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Pooja & mandir",
    name: "Mandir pull-out diya tray slider repair",
    description: "30 mins repair of sliding wood shelf used for lamps and camphor",
    starts_at_cents: 17900,
    sort_order: 70,
    image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
  },

  // Wood Polishing & Touch-up
  {
    category: "Wood polishing",
    name: "Wooden dining table surface scratch buffing & wax polish",
    description: "1 hr surface cleaning, micro-scratch buffing and premium beeswax polish",
    starts_at_cents: 49900,
    sort_order: 71,
    image_url: "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Wood polishing",
    name: "Main entrance wooden door varnish / PU touch-up",
    description: "2 hrs sanding and weather-proof polyurethane / Melamine clear coat for door",
    starts_at_cents: 89900,
    sort_order: 72,
    image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
  },

  // Child & Safety Woodwork
  {
    category: "Safety & child proof",
    name: "Child safety gate installation (staircase / doorway)",
    description: "45 mins pressure or hardware mounted safety baby gate installation",
    starts_at_cents: 69900,
    sort_order: 73,
    image_url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Safety & child proof",
    name: "Bed safety rail / fence installation",
    description: "30 mins baby safety guardrail attachment to wooden bed frame",
    starts_at_cents: 29900,
    sort_order: 74,
    image_url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Safety & child proof",
    name: "Child safety cabinet locks & corner guards fitting (upto 8)",
    description: "30 mins magnetic child-safe cupboard latches and soft corner cushions",
    starts_at_cents: 29900,
    sort_order: 75,
    image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80",
  },

  // On-Demand Carpenter by Time
  {
    category: "Carpenter on demand",
    name: "Quick Carpenter Visit (60 Mins — Minor Repairs)",
    description: "1 hr dedicated carpenter visit for multiple small fixes, tightening & adjustments",
    starts_at_cents: 29900,
    sort_order: 76,
    image_url: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Carpenter on demand",
    name: "Half-Day Dedicated Carpenter (4 Hours)",
    description: "4 hours of skilled carpentry work for multiple doors, wardrobes, and repairs",
    starts_at_cents: 89900,
    sort_order: 77,
    image_url: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Carpenter on demand",
    name: "Full-Day Master Carpenter (8 Hours)",
    description: "8 hours of comprehensive home carpentry overhaul by expert carpenter",
    starts_at_cents: 159900,
    sort_order: 78,
    image_url: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "At home consultation",
    name: "Book a Carpenter (At-Home Evaluation & Quote)",
    description: "Expert carpenter visits your home, inspects requirements, and provides detailed quote",
    starts_at_cents: 9900,
    sort_order: 79,
    image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
  },
];

async function seedServices() {
  console.log(`Starting seed of ${SERVICES.length} Urban Company carpenter services...`);

  // Clear existing services to ensure fresh seed
  const { error: delErr } = await supabase
    .from("services")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (delErr) {
    console.error("Error clearing existing services:", delErr);
  } else {
    console.log("Cleared old services successfully.");
  }

  // Insert all services
  const { data: insertedServices, error: insErr } = await supabase
    .from("services")
    .insert(SERVICES)
    .select();

  if (insErr) {
    console.error("Error inserting services:", insErr);
    process.exit(1);
  }

  console.log(`Successfully inserted ${insertedServices.length} carpenter services!`);

  // Link all services to Raja Wood Works (8e1ec1ef-3ec5-4d9f-bc9f-94dd85d9a1ab)
  const rajaId = "8e1ec1ef-3ec5-4d9f-bc9f-94dd85d9a1ab";
  const carpenterServicesLinks = insertedServices.map((s) => ({
    vendor_id: rajaId,
    service_id: s.id,
    custom_price_cents: s.starts_at_cents,
    is_active: true,
  }));

  // Clean old links and insert
  await supabase.from("carpenter_services").delete().eq("vendor_id", rajaId);
  const { error: linkErr } = await supabase
    .from("carpenter_services")
    .insert(carpenterServicesLinks);

  if (linkErr) {
    console.warn("Notice: carpenter_services link:", linkErr.message);
  } else {
    console.log(`Linked all ${carpenterServicesLinks.length} services to Master Carpenter Raja!`);
  }

  console.log("Services seed completed successfully!");
}

seedServices();
