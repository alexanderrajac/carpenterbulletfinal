const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Read .env file manually
const envPath = path.resolve(__dirname, "../../.env");
const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || "";
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value;
  }
});

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const categories = [
  {
    slug: "wooden-furniture",
    name: "Wooden Furniture",
    description: "Premium handcrafted sofas, cots, dining tables, wardrobes and study tables.",
    image_url: "p1-lounge-chair.jpg",
  },
  {
    slug: "doors-windows",
    name: "Doors & Windows",
    description: "Main doors (Vasakal), room doors, windows, door frames and window frames.",
    image_url: "p4-floating-shelf.jpg",
  },
  {
    slug: "raw-woods",
    name: "Raw Woods",
    description: "High quality Teak, Neem, Poovarasam, Vengai and Mahogany hardwoods.",
    image_url: "hero.jpg",
  },
  {
    slug: "carpentry-services",
    name: "Carpentry Services",
    description: "Professional door repairs, lock/handle fitting, furniture repair and polishing.",
    image_url: "p11-wood-plane.jpg",
  },
  {
    slug: "wood-cutting-services",
    name: "Wood Cutting Services",
    description: "Custom wood cutting, precision plywood cutting, and state-of-the-art CNC cutting.",
    image_url: "p7-cutting-board.jpg",
  },
  {
    slug: "hardware-store",
    name: "Hardware Store",
    description: "Premium door locks, designer handles, heavy duty hinges, screws and brackets.",
    image_url: "p12-tool-roll.jpg",
  },
  {
    slug: "wood-paints-finishing",
    name: "Wood Paints & Finishing",
    description: "Professional grade wood paints, polishes, varnishes, thinners and primers.",
    image_url: "p8-serving-tray.jpg",
  },
];

const products = [
  // Wooden Furniture
  {
    category_slug: "wooden-furniture",
    slug: "modern-sofa",
    name: "Handcrafted Sofa",
    description: "Elegant and comfortable solid hardwood sofa frame, customizable wood selection.",
    price_cents: 89000,
    image_url: "p1-lounge-chair.jpg",
    featured: true,
    stock: 12,
  },
  {
    category_slug: "wooden-furniture",
    slug: "hardwood-cot",
    name: "Premium Cot / Bed Frame",
    description: "Robust and timeless wooden cot built with traditional joinery, lifetime guarantee.",
    price_cents: 120000,
    image_url: "p2-dining-table.jpg",
    featured: true,
    stock: 8,
  },
  {
    category_slug: "wooden-furniture",
    slug: "classic-bureau",
    name: "Wooden Bureau / Cabinet",
    description: "Spacious storage cabinet with hand-carved panels and premium hardware finish.",
    price_cents: 75000,
    image_url: "p5-bookshelf.jpg",
    featured: false,
    stock: 6,
  },
  {
    category_slug: "wooden-furniture",
    slug: "dressing-table",
    name: "Artisan Dressing Table",
    description: "Beautiful dressing vanity with solid wood frames, mirror, and storage drawers.",
    price_cents: 48000,
    image_url: "p3-side-table.jpg",
    featured: false,
    stock: 10,
  },
  {
    category_slug: "wooden-furniture",
    slug: "dining-table-custom",
    name: "Handmade Dining Table",
    description: "6-seater solid hardwood dining table built for generations of family gatherings.",
    price_cents: 145000,
    image_url: "p2-dining-table.jpg",
    featured: true,
    stock: 5,
  },
  {
    category_slug: "wooden-furniture",
    slug: "tv-unit",
    name: "Classic TV Console / Unit",
    description: "Modern layout entertainment center with cable management and premium shelving.",
    price_cents: 38000,
    image_url: "p6-storage-trunk.jpg",
    featured: false,
    stock: 15,
  },
  {
    category_slug: "wooden-furniture",
    slug: "wardrobe",
    name: "Master Bedroom Wardrobe",
    description: "Full size premium wooden wardrobe with shelves, hanging space, and security locks.",
    price_cents: 180000,
    image_url: "p5-bookshelf.jpg",
    featured: true,
    stock: 4,
  },
  {
    category_slug: "wooden-furniture",
    slug: "study-table",
    name: "Ergonomic Study Table",
    description: "Dedicated workspace desk made of premium hardwoods with drawers and cable routing.",
    price_cents: 32000,
    image_url: "p3-side-table.jpg",
    featured: false,
    stock: 20,
  },

  // Doors & Windows
  {
    category_slug: "doors-windows",
    slug: "main-door-vasakal",
    name: "Main Door (Vasakal)",
    description: "Traditional solid main door frame with decorative carvings. Represents safety and premium craft.",
    price_cents: 65000,
    image_url: "p4-floating-shelf.jpg",
    featured: true,
    stock: 14,
  },
  {
    category_slug: "doors-windows",
    slug: "room-door",
    name: "Interior Room Door",
    description: "High quality solid room doors, engineered for sound insulation and smooth action.",
    price_cents: 22000,
    image_url: "p6-storage-trunk.jpg",
    featured: false,
    stock: 35,
  },
  {
    category_slug: "doors-windows",
    slug: "window",
    name: "Wooden Window Frame & Shutters",
    description: "Traditional window units with adjustable shutters and secure iron bar installations.",
    price_cents: 18000,
    image_url: "p4-floating-shelf.jpg",
    featured: false,
    stock: 40,
  },
  {
    category_slug: "doors-windows",
    slug: "door-frame",
    name: "Solid Door Frame",
    description: "Standard size frames built from heavy local hardwoods, resistant to termites and wrap.",
    price_cents: 12000,
    image_url: "p4-floating-shelf.jpg",
    featured: false,
    stock: 50,
  },
  {
    category_slug: "doors-windows",
    slug: "window-frame",
    name: "Solid Window Frame",
    description: "Precisely grooved wood window frames ready for installation in brickwork.",
    price_cents: 9500,
    image_url: "p4-floating-shelf.jpg",
    featured: false,
    stock: 60,
  },

  // Raw Woods
  {
    category_slug: "raw-woods",
    slug: "teak-wood",
    name: "Teak Wood (Raw)",
    description: "Top-grade raw Teak wood planks, renowned for high oil content, tensile strength and durability.",
    price_cents: 28000,
    image_url: "hero.jpg",
    featured: true,
    stock: 200,
  },
  {
    category_slug: "raw-woods",
    slug: "veppamaram-neem",
    name: "Veppamaram (Neem Wood)",
    description: "Medicinal and natural pest-resistant neem wood logs, dried and seasoned.",
    price_cents: 12000,
    image_url: "hero.jpg",
    featured: false,
    stock: 150,
  },
  {
    category_slug: "raw-woods",
    slug: "poovarasam-wood",
    name: "Poovarasam Wood (Portia Tree)",
    description: "Strong local hardwood popular for making carts, doors, and long-lasting house structures.",
    price_cents: 15000,
    image_url: "hero.jpg",
    featured: false,
    stock: 120,
  },
  {
    category_slug: "raw-woods",
    slug: "vengai-wood",
    name: "Vengai Wood",
    description: "Highly auspicious wood used for doors and thresholds, exceptional durability.",
    price_cents: 22000,
    image_url: "hero.jpg",
    featured: true,
    stock: 90,
  },
  {
    category_slug: "raw-woods",
    slug: "mahogany-wood",
    name: "Mahogany Wood",
    description: "Fine grained reddish-brown raw lumber blocks, ideal for high-end cabinetry and instrument making.",
    price_cents: 18000,
    image_url: "hero.jpg",
    featured: false,
    stock: 110,
  },
  {
    category_slug: "raw-woods",
    slug: "plywood-sheet",
    name: "Commercial Plywood Sheets",
    description: "Waterproof, boiling water resistant grade plywood sheets, multiple thicknesses.",
    price_cents: 3500,
    image_url: "p7-cutting-board.jpg",
    featured: false,
    stock: 500,
  },

  // Carpentry Services
  {
    category_slug: "carpentry-services",
    slug: "door-repair",
    name: "Door Repair Service",
    description: "Repair swollen doors, fix alignments, replace hinges, and eliminate squeaks.",
    price_cents: 1500,
    image_url: "p11-wood-plane.jpg",
    featured: false,
    stock: 99,
  },
  {
    category_slug: "carpentry-services",
    slug: "lock-fitting",
    name: "Lock Fitting Service",
    description: "Professional installation of main door mortise locks, smart locks, or room locks.",
    price_cents: 1200,
    image_url: "p10-chisel-set.jpg",
    featured: true,
    stock: 99,
  },
  {
    category_slug: "carpentry-services",
    slug: "handle-fitting",
    name: "Handle & Hardware Fitting",
    description: "Precision installation of drawer slides, pull handles, hinges and tower bolts.",
    price_cents: 800,
    image_url: "p12-tool-roll.jpg",
    featured: false,
    stock: 99,
  },
  {
    category_slug: "carpentry-services",
    slug: "furniture-repair",
    name: "Furniture Repair & Upholstery",
    description: "Fixing loose dining chair joints, broken drawers, structural re-reinforcements.",
    price_cents: 2500,
    image_url: "p1-lounge-chair.jpg",
    featured: true,
    stock: 99,
  },
  {
    category_slug: "carpentry-services",
    slug: "furniture-assembly",
    name: "Furniture Assembly Service",
    description: "Assembly of flat-pack cots, modular wardrobes, office desks, and kitchen systems.",
    price_cents: 1800,
    image_url: "p5-bookshelf.jpg",
    featured: false,
    stock: 99,
  },
  {
    category_slug: "carpentry-services",
    slug: "wood-polishing",
    name: "Wood Polishing & Refinishing",
    description: "Hand-rubbed lacquer, polyurethane spray, or classic French polish for premium look.",
    price_cents: 5000,
    image_url: "p8-serving-tray.jpg",
    featured: true,
    stock: 99,
  },

  // Wood Cutting Services
  {
    category_slug: "wood-cutting-services",
    slug: "custom-wood-cutting",
    name: "Custom Wood Cutting",
    description: "Straight line rip cuts, cross cuts on solid wood logs to your precise dimensions.",
    price_cents: 900,
    image_url: "p7-cutting-board.jpg",
    featured: false,
    stock: 99,
  },
  {
    category_slug: "wood-cutting-services",
    slug: "plywood-cutting",
    name: "Plywood Size Cutting",
    description: "Panel saw cutting for plywood boards with zero chipping on edges.",
    price_cents: 600,
    image_url: "p7-cutting-board.jpg",
    featured: false,
    stock: 99,
  },
  {
    category_slug: "wood-cutting-services",
    slug: "cnc-cutting",
    name: "CNC Routing & Cutting",
    description: "Precision computer-controlled carving for complex 2D and 3D designs, jali patterns.",
    price_cents: 4500,
    image_url: "p7-cutting-board.jpg",
    featured: true,
    stock: 99,
  },

  // Hardware Store
  {
    category_slug: "hardware-store",
    slug: "door-locks-hardware",
    name: "Premium Mortise Door Lock",
    description: "Heavy duty brass body security lock set with handles and computerised keys.",
    price_cents: 3200,
    image_url: "p12-tool-roll.jpg",
    featured: true,
    stock: 120,
  },
  {
    category_slug: "hardware-store",
    slug: "handles-hardware",
    name: "Designer Cabinet Handles",
    description: "Solid brass pull handles in matte gold or black finish for cupboards.",
    price_cents: 450,
    image_url: "p8-serving-tray.jpg",
    featured: false,
    stock: 350,
  },
  {
    category_slug: "hardware-store",
    slug: "hinges-hardware",
    name: "Heavy Duty Brass Hinges",
    description: "4-inch brass ball bearing hinges for main door installations.",
    price_cents: 600,
    image_url: "p12-tool-roll.jpg",
    featured: false,
    stock: 400,
  },
  {
    category_slug: "hardware-store",
    slug: "screws-hardware",
    name: "Self-Tapping Wood Screws",
    description: "Box of 100 high quality stainless steel wood screws, multiple sizes available.",
    price_cents: 350,
    image_url: "p12-tool-roll.jpg",
    featured: false,
    stock: 500,
  },
  {
    category_slug: "hardware-store",
    slug: "nails-hardware",
    name: "Galvanized Wood Nails",
    description: "1kg box of standard wire nails for framing and general carpentry work.",
    price_cents: 200,
    image_url: "p12-tool-roll.jpg",
    featured: false,
    stock: 300,
  },
  {
    category_slug: "hardware-store",
    slug: "brackets-hardware",
    name: "Heavy Duty Corner Brackets",
    description: "L-shaped steel shelf support brackets, black powder coated finish.",
    price_cents: 550,
    image_url: "p4-floating-shelf.jpg",
    featured: false,
    stock: 180,
  },

  // Wood Paints & Finishing
  {
    category_slug: "wood-paints-finishing",
    slug: "wood-paint-finish",
    name: "Premium Wood Paint (1L)",
    description: "Aqueous polyurethane wood paint offering exceptional gloss and weather resistance.",
    price_cents: 1250,
    image_url: "p8-serving-tray.jpg",
    featured: true,
    stock: 80,
  },
  {
    category_slug: "wood-paints-finishing",
    slug: "polish-finish",
    name: "French Wood Polish (Touchwood)",
    description: "Classic spirit-based wood polish to restore shine to heirloom pieces.",
    price_cents: 950,
    image_url: "p8-serving-tray.jpg",
    featured: false,
    stock: 120,
  },
  {
    category_slug: "wood-paints-finishing",
    slug: "varnish-finish",
    name: "Clear Wood Varnish (1L)",
    description: "Tough clear coat varnish to shield wood from scratch, water, and heat stains.",
    price_cents: 1100,
    image_url: "p8-serving-tray.jpg",
    featured: false,
    stock: 90,
  },
  {
    category_slug: "wood-paints-finishing",
    slug: "thinner-finish",
    name: "Premium Paint Thinner (1L)",
    description: "High purity diluting agent for wood paint, lacquer, and clear coatings.",
    price_cents: 450,
    image_url: "p8-serving-tray.jpg",
    featured: false,
    stock: 150,
  },
  {
    category_slug: "wood-paints-finishing",
    slug: "turpentine-finish",
    name: "Double Rectified Turpentine (1L)",
    description: "Natural organic solvent derived from pine resin for thinning oil paints and varnishes.",
    price_cents: 550,
    image_url: "p8-serving-tray.jpg",
    featured: false,
    stock: 130,
  },
  {
    category_slug: "wood-paints-finishing",
    slug: "primer-finish",
    name: "Wood Primer (White/Pink, 1L)",
    description: "Sanding wood primer basecoat designed to seal porous grain before final coat painting.",
    price_cents: 800,
    image_url: "p8-serving-tray.jpg",
    featured: false,
    stock: 110,
  },
];

async function seed() {
  try {
    console.log("Seeding categories and products...");

    // 1. Delete existing products and categories
    const { error: d2 } = await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (d2) throw d2;

    const { error: d1 } = await supabase.from("categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (d1) throw d1;

    console.log("Deleted old categories and products.");

    // 2. Insert new categories
    const { data: catData, error: catErr } = await supabase
      .from("categories")
      .insert(categories)
      .select();
    
    if (catErr) throw catErr;
    console.log(`Successfully inserted ${catData.length} categories.`);

    // Map slug to UUID
    const slugToId = {};
    catData.forEach((c) => {
      slugToId[c.slug] = c.id;
    });

    // 3. Insert new products
    const finalProducts = products.map((p) => {
      const catId = slugToId[p.category_slug];
      if (!catId) {
        throw new Error(`Category UUID not found for slug: ${p.category_slug}`);
      }
      return {
        slug: p.slug,
        name: p.name,
        description: p.description,
        price_cents: p.price_cents,
        image_url: p.image_url,
        category_id: catId,
        featured: p.featured,
        stock: p.stock,
      };
    });

    const { data: prodData, error: prodErr } = await supabase
      .from("products")
      .insert(finalProducts)
      .select();
    
    if (prodErr) throw prodErr;
    console.log(`Successfully inserted ${prodData.length} products.`);
    
    console.log("Database seeded successfully!");
  } catch (err) {
    console.error("Error seeding database:", err);
    process.exit(1);
  }
}

seed();
