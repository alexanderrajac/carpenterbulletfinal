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
    slug: "construction-furniture",
    name: "Construction Furniture",
    description: "Handcrafted wooden frames, main doors, and ventilation fittings for your home construction.",
    image_url: "p4-floating-shelf.jpg",
  },
  {
    slug: "furnitures",
    name: "Furnitures",
    description: "Premium wooden sofas, cots, cabinets, windows and doors for your home.",
    image_url: "p1-lounge-chair.jpg",
  },
  {
    slug: "fittings",
    name: "Fittings",
    description: "Essential assembly hardware, glue, hinges, and sandpaper for carpentry projects.",
    image_url: "p12-tool-roll.jpg",
  },
  {
    slug: "paints",
    name: "Paints & Finishing",
    description: "Professional thinners, primers, turpentines, and application brushes for wood painting.",
    image_url: "p8-serving-tray.jpg",
  },
];

const products = [
  // Construction Furniture
  {
    category_slug: "construction-furniture",
    slug: "room-vasakal",
    name: "Room Vasakal (Door Frame)",
    description: "Solid room door frame (Vasakal). Standard size 7x3 feet. Available in multiple wood types (Teak Wood, Veppam Maram, Poovarasam Wood).",
    price_cents: 15000,
    image_url: "p4-floating-shelf.jpg",
    featured: true,
    stock: 25,
  },
  {
    category_slug: "construction-furniture",
    slug: "jannal-frame",
    name: "Jannal (Window Frame)",
    description: "Handcrafted window frame with security bar slots. Available in 4x3 feet and 3x3 feet sizes, and multiple wood types.",
    price_cents: 12000,
    image_url: "p4-floating-shelf.jpg",
    featured: true,
    stock: 30,
  },
  {
    category_slug: "construction-furniture",
    slug: "ventilator",
    name: "Ventilator Frame",
    description: "Standard 2x1 feet ventilation frame. Perfect for bathrooms and utility areas. Available in multiple wood types.",
    price_cents: 4500,
    image_url: "p4-floating-shelf.jpg",
    featured: false,
    stock: 40,
  },
  {
    category_slug: "construction-furniture",
    slug: "garden-vasakal",
    name: "Garden (Thotta) Vasakal",
    description: "Durable outer door frame with keelpadi (sill). Designed for garden and backyard entries. Customizable wood types and Sakkai rebate options.",
    price_cents: 18000,
    image_url: "p4-floating-shelf.jpg",
    featured: false,
    stock: 15,
  },
  {
    category_slug: "construction-furniture",
    slug: "main-vasakal",
    name: "Main Vasakal (Main Door Frame)",
    description: "Auspicious and heavy main entry door frame with elegant moldings. Customizable wood types and Sakkai rebate options.",
    price_cents: 35000,
    image_url: "p4-floating-shelf.jpg",
    featured: true,
    stock: 10,
  },

  // Furnitures
  {
    category_slug: "furnitures",
    slug: "jannal-kadhavu",
    name: "Jannal Kadhavu (Window Shutters)",
    description: "Traditional wooden window shutters with adjustable louvers or solid panels. Customizable wood types.",
    price_cents: 9000,
    image_url: "p4-floating-shelf.jpg",
    featured: false,
    stock: 50,
  },
  {
    category_slug: "furnitures",
    slug: "main-door",
    name: "Main Door Leaf",
    description: "Heavy solid wood main door shutter with gorgeous natural grains. Customizable wood types.",
    price_cents: 45000,
    image_url: "p1-lounge-chair.jpg",
    featured: true,
    stock: 12,
  },
  {
    category_slug: "furnitures",
    slug: "sofa-wooden",
    name: "Wooden Sofa Frame",
    description: "Solid wood sofa frame designed for comfort and durability. Customizable wood types.",
    price_cents: 68000,
    image_url: "p1-lounge-chair.jpg",
    featured: true,
    stock: 15,
  },
  {
    category_slug: "furnitures",
    slug: "cot-wooden",
    name: "Wooden Cot / Bed Frame",
    description: "Sturdy wooden cot constructed with traditional interlocking joinery. Customizable wood types.",
    price_cents: 95000,
    image_url: "p2-dining-table.jpg",
    featured: true,
    stock: 8,
  },
  {
    category_slug: "furnitures",
    slug: "bureau-wooden",
    name: "Wooden Bureau / Cabinet",
    description: "Handcrafted wooden wardrobe with drawers, shelves, and secure locking systems. Customizable wood types.",
    price_cents: 75000,
    image_url: "p5-bookshelf.jpg",
    featured: false,
    stock: 10,
  },

  // Fittings
  {
    category_slug: "fittings",
    slug: "fevicol-glue",
    name: "Fevicol SH Wood Adhesive (1kg)",
    description: "Premium synthetic resin adhesive for strong bonding of wood, plywood, laminates, and veneers.",
    price_cents: 2500,
    image_url: "p12-tool-roll.jpg",
    featured: true,
    stock: 100,
  },
  {
    category_slug: "fittings",
    slug: "nails-2inch",
    name: "Galvanized Wood Nails (2-inch, 1kg)",
    description: "Strong, corrosion-resistant 2-inch wire nails ideal for framing and cabinet assembly.",
    price_cents: 1500,
    image_url: "p12-tool-roll.jpg",
    featured: false,
    stock: 150,
  },
  {
    category_slug: "fittings",
    slug: "sandpaper-sheets",
    name: "Emery Sandpaper Sheets (Pack of 5)",
    description: "Coarse, medium, and fine grit sandpaper sheets for smoothing wooden surfaces before finishing.",
    price_cents: 500,
    image_url: "p12-tool-roll.jpg",
    featured: false,
    stock: 300,
  },
  {
    category_slug: "fittings",
    slug: "hinges-hardware",
    name: "Heavy Duty Brass Hinges (4-inch, Pair)",
    description: "Premium brass ball-bearing hinges for smooth, squeak-free door installations.",
    price_cents: 1200,
    image_url: "p12-tool-roll.jpg",
    featured: true,
    stock: 200,
  },

  // Paints
  {
    category_slug: "paints",
    slug: "paint-thinner",
    name: "Premium Paint Thinner (1L)",
    description: "High-grade solvent for diluting wood paints, lacquer, varnishes, and cleaning brushes.",
    price_cents: 4500,
    image_url: "p8-serving-tray.jpg",
    featured: false,
    stock: 80,
  },
  {
    category_slug: "paints",
    slug: "turpentine-solvent",
    name: "Pure Turpentine Solvent (1L)",
    description: "Double-rectified turpentine oil for thinning oil-based primers, paints, and wood polishes.",
    price_cents: 5500,
    image_url: "p8-serving-tray.jpg",
    featured: false,
    stock: 90,
  },
  {
    category_slug: "paints",
    slug: "primer-white",
    name: "White Wood Primer (1L)",
    description: "Excellent hiding power white undercoat primer to seal porous wood grains.",
    price_cents: 8000,
    image_url: "p8-serving-tray.jpg",
    featured: true,
    stock: 70,
  },
  {
    category_slug: "paints",
    slug: "paint-brush-2inch",
    name: "Shed-Resistant Paint Brush (2-inch)",
    description: "High-quality synthetic bristles with wood handle for smooth paint and polish application.",
    price_cents: 3000,
    image_url: "p8-serving-tray.jpg",
    featured: true,
    stock: 120,
  },
];

async function seed() {
  try {
    console.log("Seeding categories and products...");

    // 1. Delete existing order items, orders, products and categories to prevent FK errors
    const { error: d3 } = await supabase.from("order_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (d3) throw d3;

    const { error: d4 } = await supabase.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (d4) throw d4;

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
