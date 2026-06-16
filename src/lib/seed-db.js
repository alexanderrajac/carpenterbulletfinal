import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const mainDepartments = [
  {
    slug: "raw-wood",
    name: "Raw Wood",
    description:
      "Sustainably sourced seasoned hardwoods: Teak, Neem, Mahogany, Vengai, and quality plywood sheets.",
    image_url: "hero.jpg",
  },
  {
    slug: "wood-processing",
    name: "Wood Processing",
    description:
      "State-of-the-art CNC routing, precision sizing, lumber planing, and custom wood cutting.",
    image_url: "p7-cutting-board.jpg",
  },
  {
    slug: "furniture",
    name: "Furniture",
    description:
      "Premium handcrafted solid wood sofa frames, cots, dining tables, wardrobes, and TV consoles.",
    image_url: "p1-lounge-chair.jpg",
  },
  {
    slug: "construction-woodwork",
    name: "Construction Woodwork",
    description:
      "Traditional main doors (Vasakal), room doors, wooden windows, and heavy duty door frames.",
    image_url: "p4-floating-shelf.jpg",
  },
  {
    slug: "hardware",
    name: "Hardware",
    description:
      "Premium brass mortise locks, designer handles, heavy duty hinges, screws and woodworking glues.",
    image_url: "p12-tool-roll.jpg",
  },
  {
    slug: "carpenter-services",
    name: "Carpenter Services",
    description:
      "On-demand home carpentry repair, door locks fitting, cupboard repairs, and mirror installations.",
    image_url: "p11-wood-plane.jpg",
  },
  {
    slug: "interior-design",
    name: "Interior Design",
    description:
      "Modular kitchen design, custom wardrobe planning, and professional 3D space layouts.",
    image_url: "p5-bookshelf.jpg",
  },
  {
    slug: "manufacturing-network",
    name: "Manufacturing Network",
    description:
      "Commercial scale furniture manufacturing, hotel contracting, and bulk woodwork orders.",
    image_url: "p2-dining-table.jpg",
  },
];

// Physical products for other departments
const physicalProducts = [
  // Furniture
  {
    category_slug: "furniture",
    slug: "handcrafted-sofa-frame",
    name: "Handcrafted Sofa Frame",
    description:
      "Solid hardwood sofa frame built with traditional wood joinery. Sturdy and custom sizes.",
    price_cents: 8900000,
    image_url: "p1-lounge-chair.jpg",
    featured: true,
    stock: 12,
  },
  {
    category_slug: "furniture",
    slug: "teak-bed-frame",
    name: "Premium Cot / Bed Frame",
    description:
      "A robust and timeless solid wood bed frame, crafted for a lifetime of comfortable sleep.",
    price_cents: 12000000,
    image_url: "p2-dining-table.jpg",
    featured: true,
    stock: 8,
  },
  {
    category_slug: "furniture",
    slug: "wooden-cabinet",
    name: "Solid Wood Storage Cabinet",
    description:
      "Artisan storage bureau featuring hand-carved panels, adjustable shelving, and premium latches.",
    price_cents: 7500000,
    image_url: "p5-bookshelf.jpg",
    featured: false,
    stock: 6,
  },

  // Raw Wood
  {
    category_slug: "raw-wood",
    slug: "premium-teak-logs",
    name: "Teak Wood Planks (Grade A)",
    description:
      "Top-grade raw Teak wood seasoned blocks, highly resistant to rot, termites, and warp.",
    price_cents: 2800000,
    image_url: "hero.jpg",
    featured: true,
    stock: 200,
  },
  {
    category_slug: "raw-wood",
    slug: "seasoned-neem-lumber",
    name: "Neem Wood Blocks (Raw)",
    description:
      "Seasoned neem lumber blocks, naturally anti-bacterial and insect repellent, ideal for construction.",
    price_cents: 1200000,
    image_url: "hero.jpg",
    featured: false,
    stock: 150,
  },

  // Wood Processing
  {
    category_slug: "wood-processing",
    slug: "cnc-router-cutting",
    name: "CNC Precision Carving",
    description:
      "Computerized carving for decorative panels, partition jali work, and 3D reliefs on wood.",
    price_cents: 450000,
    image_url: "p7-cutting-board.jpg",
    featured: true,
    stock: 99,
  },

  // Construction Woodwork
  {
    category_slug: "construction-woodwork",
    slug: "carved-main-door",
    name: "Main Door (Vasakal)",
    description:
      "Incredibly heavy solid entrance door frame featuring exquisite traditional carvings.",
    price_cents: 6500000,
    image_url: "p4-floating-shelf.jpg",
    featured: true,
    stock: 14,
  },

  // Hardware
  {
    category_slug: "hardware",
    slug: "brass-mortise-lock",
    name: "Premium Mortise Door Lock",
    description: "Heavy duty double-action lock with brass handles and computer-cut dimple keys.",
    price_cents: 320000,
    image_url: "p12-tool-roll.jpg",
    featured: true,
    stock: 120,
  },

  // Interior Design
  {
    category_slug: "interior-design",
    slug: "modular-kitchen-consultation",
    name: "Modular Kitchen Design Consult",
    description:
      "A professional design consultation for customized modular kitchen structures and fittings.",
    price_cents: 0, // Get Quote
    image_url: "p5-bookshelf.jpg",
    featured: true,
    stock: 99,
  },

  // Manufacturing Network
  {
    category_slug: "manufacturing-network",
    slug: "commercial-carpentry-contracting",
    name: "Commercial Woodwork Contracting",
    description:
      "Bulk manufacturing and installations for hotels, apartments, and corporate offices.",
    price_cents: 0, // Get Quote
    image_url: "p2-dining-table.jpg",
    featured: false,
    stock: 99,
  },
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function parsePriceToCents(startsAt) {
  const clean = startsAt.replace(/[^\d]/g, "");
  if (!clean) return 0; // "Quote"
  return parseInt(clean, 10) * 100;
}

async function seed() {
  try {
    const csvPath = path.resolve(__dirname, "../../services.csv");
    if (!fs.existsSync(csvPath)) {
      throw new Error(`services.csv file not found at ${csvPath}`);
    }

    console.log("Parsing services.csv...");
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const header = lines.shift();

    const services = lines
      .map((line, idx) => {
        const parts = line.split(",");
        if (parts.length >= 4) {
          const category = parts[0].trim();
          const name = parts[1].trim();
          const startsAt = parts[parts.length - 1].trim();
          const description = parts
            .slice(2, parts.length - 1)
            .join(",")
            .trim();
          return { category, name, description, startsAt };
        }
        return null;
      })
      .filter(Boolean);

    console.log(`Parsed ${services.length} services from CSV.`);

    // 1. Delete existing records
    console.log("Cleaning up old database records...");
    const { error: d2 } = await supabase
      .from("products")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (d2) throw d2;

    const { error: d1 } = await supabase
      .from("categories")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (d1) throw d1;

    console.log("Database clean.");

    // 2. Insert main departments
    console.log("Inserting main departments...");
    const { data: catRows, error: catErr } = await supabase
      .from("categories")
      .insert(mainDepartments)
      .select();

    if (catErr) throw catErr;
    console.log(`Inserted ${catRows.length} main categories.`);

    const categoryNameToId = {};
    const categorySlugToId = {};
    catRows.forEach((row) => {
      categoryNameToId[row.name] = row.id;
      categorySlugToId[row.slug] = row.id;
    });

    // 3. Insert physical products
    console.log("Preparing physical products...");
    const productsToInsert = physicalProducts.map((p) => {
      const catId = categorySlugToId[p.category_slug];
      if (!catId) {
        throw new Error(`Category ID not found for: ${p.category_slug}`);
      }
      return {
        category_id: catId,
        slug: p.slug,
        name: p.name,
        description: p.description,
        price_cents: p.price_cents,
        image_url: p.image_url,
        stock: p.stock,
        featured: p.featured,
      };
    });

    // 4. Insert service items (from CSV) under Carpenter Services category
    console.log("Preparing service items from services.csv...");
    const serviceCategoryId = categorySlugToId["carpenter-services"];
    if (!serviceCategoryId) {
      throw new Error("Carpenter Services category ID not found");
    }

    const categoryImages = {
      "Wooden Door": "p4-floating-shelf.jpg",
      "Cupboard & Drawer": "p5-bookshelf.jpg",
      "Decor & Mirror": "p3-side-table.jpg",
      "Shelf & Cabinet": "p4-floating-shelf.jpg",
      "Lock & Hinge": "p12-tool-roll.jpg",
      "Curtain & Window": "p6-storage-trunk.jpg",
      "Furniture Repair": "p1-lounge-chair.jpg",
      "Furniture Assembly": "p11-wood-plane.jpg",
    };

    services.forEach((s) => {
      productsToInsert.push({
        category_id: serviceCategoryId,
        slug: `service-${slugify(s.category)}-${slugify(s.name)}`,
        name: s.name,
        // Prepend the subcategory metadata tag to description so it can be parsed cleanly on the client side
        description: `[Subcategory: ${s.category}] ${s.description}`,
        price_cents: parsePriceToCents(s.startsAt),
        image_url: categoryImages[s.category] || "hero.jpg",
        stock: 9999,
        featured: s.name.startsWith("Combo"),
      });
    });

    console.log(`Inserting ${productsToInsert.length} total products/services...`);
    const { data: prodRows, error: prodErr } = await supabase
      .from("products")
      .insert(productsToInsert)
      .select();

    if (prodErr) throw prodErr;
    console.log(`Inserted ${prodRows.length} total products/services successfully.`);
    console.log("Database seeded successfully with all departments and services!");
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
