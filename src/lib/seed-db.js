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

const categoryDescriptions = {
  "Wooden Door": "Door installation, locks, hinge replacements, stoppers and mesh installation.",
  "Cupboard & Drawer": "Cupboard adjustments, drawer slides, cabinet hinges and locking systems.",
  "Decor & Mirror": "Hanging frames, mounting mirrors, key holders, clocks, and ceiling fasteners.",
  "Shelf & Cabinet": "Wall shelf mounting, assembly and installation of bathroom cabinets and shelves.",
  "Lock & Hinge": "Installing, replacing, and repairing locks, cabinet latches, and heavy hinges.",
  "Curtain & Window": "Fitting curtain rods, window blinds, locks, and sash frame alignment repair.",
  "Furniture Repair": "Fixing dining chairs, broken bed frames, table re-alignments, and polishing.",
  "Furniture Assembly": "Flatpack furniture assembly, wardrobes, bed builds, and custom carpentry quotes.",
};

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function parsePriceToCents(startsAt) {
  const clean = startsAt.replace(/[^\d]/g, "");
  if (!clean) return 0; // "Quote" represents free consultation/quote based estimation
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
    const lines = csvContent.split("\n").map(l => l.trim()).filter(Boolean);
    const header = lines.shift(); // Remove category,name,description,starts_at header

    const services = lines.map((line, idx) => {
      const parts = line.split(",");
      if (parts.length >= 4) {
        const category = parts[0].trim();
        const name = parts[1].trim();
        const startsAt = parts[parts.length - 1].trim();
        const description = parts.slice(2, parts.length - 1).join(",").trim();
        return { category, name, description, startsAt };
      }
      console.warn(`Line ${idx + 2} in CSV is invalid: "${line}"`);
      return null;
    }).filter(Boolean);

    console.log(`Parsed ${services.length} services from CSV.`);

    // 1. Delete existing products and categories
    console.log("Cleaning up old database records...");
    const { error: d2 } = await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (d2) throw d2;

    const { error: d1 } = await supabase.from("categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (d1) throw d1;

    console.log("Old database records cleaned successfully.");

    // 2. Insert new categories
    const uniqueCategoryNames = [...new Set(services.map(s => s.category))];
    const categoriesData = uniqueCategoryNames.map(name => {
      const slug = slugify(name);
      return {
        slug,
        name,
        description: categoryDescriptions[name] || `Handcrafted ${name.toLowerCase()} services.`,
        image_url: categoryImages[name] || "hero.jpg"
      };
    });

    console.log("Inserting new categories...");
    const { data: catRows, error: catErr } = await supabase
      .from("categories")
      .insert(categoriesData)
      .select();
    
    if (catErr) throw catErr;
    console.log(`Inserted ${catRows.length} categories.`);

    // Map category names to inserted database UUIDs
    const categoryNameToId = {};
    catRows.forEach(row => {
      categoryNameToId[row.name] = row.id;
    });

    // 3. Insert service items as products
    const productsData = services.map(s => {
      const catId = categoryNameToId[s.category];
      if (!catId) {
        throw new Error(`Database category ID not found for: ${s.category}`);
      }
      return {
        category_id: catId,
        slug: `${slugify(s.category)}-${slugify(s.name)}`,
        name: s.name,
        description: s.description,
        price_cents: parsePriceToCents(s.startsAt),
        image_url: categoryImages[s.category] || "hero.jpg",
        stock: 9999, // Carpentry services have unlimited stock/capacity
        featured: s.name.startsWith("Combo") // Auto-feature package combos
      };
    });

    console.log("Inserting service items...");
    const { data: prodRows, error: prodErr } = await supabase
      .from("products")
      .insert(productsData)
      .select();
    
    if (prodErr) throw prodErr;
    console.log(`Inserted ${prodRows.length} services successfully.`);
    console.log("Database seeded successfully with services.csv!");

  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
