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

const FURNITURE_CATEGORY_ID = "12c3ae1f-b8cb-499a-8adc-d2189f47465c";
const VENDOR_ID = "8e1ec1ef-3ec5-4d9f-bc9f-94dd85d9a1ab"; // Raja Wood Works

const FURNITURE_ITEMS = [
  {
    name: "Solid Burma Teak King Size Storage Bed (Hydraulic Lift)",
    slug: "solid-teak-king-storage-bed-hydraulic",
    description: "Handcrafted 100% solid Burma teak wood king size cot with smooth German hydraulic lift mechanism and expansive termite-treated underbed box storage. Finished in satin matte PU clear lacquer.",
    price_cents: 4899900, // ₹48,999
    image_url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    stock: 8,
    featured: true,
  },
  {
    name: "Solid Teak Wood 3-Door Artisan Wardrobe with Drawer & Mirror",
    slug: "solid-teak-3-door-artisan-wardrobe",
    description: "Spacious 3-door solid teak wood wardrobe featuring internal full-length mirror, secret lockable drawer, heavy-duty soft-close hydraulic hinges, and brass pull handles.",
    price_cents: 4250000, // ₹42,500
    image_url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=80",
    stock: 5,
    featured: true,
  },
  {
    name: "Royal 6-Seater Solid Teak Dining Table Set with Cushioned Chairs",
    slug: "royal-6-seater-teak-dining-table-set",
    description: "Generous 6-seater solid teakwood dining table featuring thick legs, beveled edge detailing, and 6 matching ergonomically curved dining chairs with water-resistant fabric cushion upholstery.",
    price_cents: 3699900, // ₹36,999
    image_url: "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=1200&q=80",
    stock: 7,
    featured: true,
  },
  {
    name: "Ergonomic Teak Study & Workstation Desk with 3 Drawers",
    slug: "ergonomic-teak-study-workstation-desk",
    description: "Modern minimalist home office executive computer desk built with seasoned teak. Features 3 telescopic soft-close drawers, concealed wire grommet pass-through, and brass hardware.",
    price_cents: 1850000, // ₹18,500
    image_url: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1200&q=80",
    stock: 12,
    featured: false,
  },
  {
    name: "Traditional Chettinad Teak Rocking Chair (Aadu Naarkali)",
    slug: "chettinad-teak-rocking-chair",
    description: "Iconic South Indian heirloom rocking chair hand-carved in seasoned teakwood. Contoured slat backrest, wide armrests, and smooth gliding curved runners designed for ultimate porch relaxation.",
    price_cents: 1420000, // ₹14,200
    image_url: "https://images.unsplash.com/photo-1580481077191-4d14210a47d2?auto=format&fit=crop&w=1200&q=80",
    stock: 9,
    featured: true,
  },
  {
    name: "Hand-Carved Solid Teak Wood Pooja Mandir (Temple Mandapam)",
    slug: "hand-carved-teak-pooja-mandir-mandapam",
    description: "Exquisite sacred home temple handcrafted from pure seasoned teak with traditional Gopuram crown, brass bell hooks, pull-out bhog/diya wooden shelf, and deep storage drawers for pooja samagri.",
    price_cents: 2200000, // ₹22,000
    image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    stock: 6,
    featured: true,
  },
  {
    name: "Mid-Century Modern 6-Foot TV Console & Entertainment Unit",
    slug: "mid-century-modern-6ft-tv-console",
    description: "Low-profile solid hardwood entertainment credenza with natural woven rattan cane cabinet panels, open media shelf for set-top box/consoles, and concealed cable passages.",
    price_cents: 1999900, // ₹19,999
    image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    stock: 10,
    featured: false,
  },
  {
    name: "Solid Teak Center Coffee Table with Beveled Tempered Glass",
    slug: "solid-teak-coffee-table-tempered-glass",
    description: "Heavy solid teakwood living room center table with a lower slatted shelf for magazines and a 10mm toughened beveled glass inset top. Treated against moisture and heat stains.",
    price_cents: 980000, // ₹9,800
    image_url: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1200&q=80",
    stock: 15,
    featured: false,
  },
  {
    name: "Solid Wood 3-Door Louvered Shoe Rack with Padded Bench",
    slug: "solid-wood-3-door-louvered-shoe-rack-bench",
    description: "Space-saving entryway shoe storage organizer with breathable slatted louver doors, holds up to 18 pairs of shoes, topped with a high-density charcoal gray upholstered seating bench.",
    price_cents: 890000, // ₹8,900
    image_url: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=80",
    stock: 14,
    featured: false,
  },
  {
    name: "Tall 5-Tier Solid Wood Library Bookshelf & Display Rack",
    slug: "tall-5-tier-solid-wood-library-bookshelf",
    description: "Floor-standing open bookcase built with solid seasoned neem and teak frames. Extra-sturdy 30mm thick shelves capable of holding heavy encyclopedia sets and decorative artifacts.",
    price_cents: 1540000, // ₹15,400
    image_url: "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=1200&q=80",
    stock: 8,
    featured: false,
  },
  {
    name: "Solid Teak Vanity Dressing Table with LED Backlit Mirror & Stool",
    slug: "solid-teak-vanity-dressing-table-led-mirror",
    description: "Luxury solid wood makeup dressing console featuring warm-LED backlit border mirror, dual jewelry organizer drawers with felt lining, and an accompanying upholstered vanity stool.",
    price_cents: 1780000, // ₹17,800
    image_url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80",
    stock: 6,
    featured: false,
  },
  {
    name: "Scandinavian Solid Ash Wood Lounge Armchair with Linen Cushions",
    slug: "scandinavian-solid-ash-lounge-armchair",
    description: "Deep-seat accent lounge chair crafted with solid steam-bent hardwood curves, exposed finger-joint joinery, and premium natural linen removable cushion covers.",
    price_cents: 1250000, // ₹12,500
    image_url: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=80",
    stock: 11,
    featured: true,
  },
  {
    name: "Solid Wood Fold-Out Home Bar Cabinet & Wine Storage",
    slug: "solid-wood-fold-out-home-bar-cabinet",
    description: "Artisan wooden cocktail bar bureau that opens to reveal 16-bottle wine rack lattice, hanging stemware racks, lockable liquor cabinet, and a water-resistant fold-out serving counter.",
    price_cents: 2600000, // ₹26,000
    image_url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80",
    stock: 4,
    featured: true,
  },
  {
    name: "Solid Teak Bedside Table / Nightstand with Drawers (Set of 2)",
    slug: "solid-teak-bedside-nightstand-set-of-2",
    description: "Pair of matching solid teakwood bedside tables with 2 smooth gliding drawers each, tapered legs, and antique brass knobs. Perfect companion for any bedroom decor.",
    price_cents: 950000, // ₹9,500 (Set of 2)
    image_url: "https://images.unsplash.com/photo-1532323544230-7191fd51bc1b?auto=format&fit=crop&w=1200&q=80",
    stock: 12,
    featured: false,
  },
  {
    name: "Heritage Chettinad Solid Wood Diwan Bed with Bolster Cushions",
    slug: "heritage-chettinad-solid-wood-diwan-bed",
    description: "Traditional Tamil Nadu heritage daybed handcrafted from reclaimed seasoned teak with turned wooden corner pillars, slatted mattress foundation, and regal Indian bolster cushions.",
    price_cents: 2850000, // ₹28,500
    image_url: "https://images.unsplash.com/photo-1540518614846-7ede433c4ef5?auto=format&fit=crop&w=1200&q=80",
    stock: 5,
    featured: true,
  },
  {
    name: "Solid Hardwood Round Nesting Coffee Tables (Set of 3)",
    slug: "solid-hardwood-round-nesting-tables-set-of-3",
    description: "Set of 3 graduated solid wooden accent tables with natural woodgrain tops and sleek tapered tripod legs. Nests compactly together or scatters throughout your living space.",
    price_cents: 690000, // ₹6,900
    image_url: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1200&q=80",
    stock: 20,
    featured: false,
  },
];

async function seedFurniture() {
  console.log(`Seeding ${FURNITURE_ITEMS.length} furniture products into category ${FURNITURE_CATEGORY_ID}...`);

  for (const item of FURNITURE_ITEMS) {
    // 1. Upsert product
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("slug", item.slug)
      .maybeSingle();

    let productId = existing?.id;

    if (productId) {
      await supabase
        .from("products")
        .update({
          name: item.name,
          description: item.description,
          price_cents: item.price_cents,
          image_url: item.image_url,
          stock: item.stock,
          featured: item.featured,
          category_id: FURNITURE_CATEGORY_ID,
          is_approved: true,
        })
        .eq("id", productId);
      console.log(`Updated product: ${item.name}`);
    } else {
      const { data: inserted, error: pErr } = await supabase
        .from("products")
        .insert({
          category_id: FURNITURE_CATEGORY_ID,
          slug: item.slug,
          name: item.name,
          description: item.description,
          price_cents: item.price_cents,
          image_url: item.image_url,
          stock: item.stock,
          featured: item.featured,
          is_approved: true,
        })
        .select("id")
        .single();

      if (pErr) {
        console.error(`Failed to insert product ${item.name}:`, pErr);
        continue;
      }
      productId = inserted.id;
      console.log(`Inserted product: ${item.name}`);
    }

    // 2. Upsert vendor offer for Raja Wood Works
    const { data: offer } = await supabase
      .from("vendor_offers")
      .select("id")
      .eq("product_id", productId)
      .eq("vendor_id", VENDOR_ID)
      .maybeSingle();

    if (offer) {
      await supabase
        .from("vendor_offers")
        .update({
          price_cents: item.price_cents,
          stock: item.stock,
          is_active: true,
        })
        .eq("id", offer.id);
    } else {
      await supabase.from("vendor_offers").insert({
        product_id: productId,
        vendor_id: VENDOR_ID,
        price_cents: item.price_cents,
        stock: item.stock,
        is_active: true,
      });
    }
  }

  console.log("All furniture products seeded and linked to vendor successfully!");
}

seedFurniture();
