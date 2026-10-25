const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load .env variables
const envPath = path.resolve(__dirname, "../.env");
if (!fs.existsSync(envPath)) {
  console.error("❌ No .env file found. Skipping sitemap generation.");
  process.exit(0);
}

const envContent = fs.readFileSync(envPath, "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const parts = line.split("=");
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join("=").trim().replace(/^"(.*)"$/, "$1");
    env[key] = val;
  }
});

const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase URL or Key missing. Skipping sitemap generation.");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const domain = "https://www.carpenterbullet.com";

// Comprehensive Area & Service Matrix for Programmatic SEO
const CITIES_AND_AREAS = {
  chennai: [
    "vandalur",
    "perungalathur",
    "urapakkam",
    "tambaram",
    "guduvanchery",
    "chromepet",
    "pallavaram",
    "selaiyur",
    "medavakkam",
    "mudichur",
    "mannivakkam",
    "porur",
    "velachery",
    "sholinganallur",
    "omr",
    "anna-nagar",
    "t-nagar",
    "adyar",
    "ambattur",
    "madipakkam",
  ],
  kanchipuram: [
    "sriperumbudur",
    "oragadam",
    "kanchipuram-town",
    "walajabad",
    "sunguvarchatram",
  ],
  chengalpattu: [
    "chengalpattu-town",
    "singaperumal-koil",
    "maraimalai-nagar",
    "mahindra-world-city",
  ],
  villupuram: [
    "villupuram-town",
    "tindivanam",
    "gingee",
    "marakkanam",
    "vikravandi",
    "mailam",
    "vanur",
    "kandamangalam",
  ],
};

const CORE_SERVICES = [
  "door",
  "lock",
  "cupboard",
  "bed",
  "furniture-assembly",
  "kitchen",
  "shelf",
];

async function generateSitemap() {
  console.log("Generating comprehensive programmatic sitemap.xml...");

  try {
    // 1. Fetch all approved products
    const { data: products, error: pErr } = await supabase
      .from("products")
      .select("slug, updated_at")
      .eq("is_approved", true);

    if (pErr) console.warn("Notice fetching products:", pErr.message);

    // 2. Fetch all approved/verified vendor profiles
    const { data: vendors, error: vErr } = await supabase
      .from("vendor_profiles")
      .select("id, updated_at")
      .eq("is_approved", true);

    if (vErr) console.warn("Notice fetching vendors:", vErr.message);

    // 3. Fetch all active services
    const { data: services, error: sErr } = await supabase
      .from("services")
      .select("id, created_at")
      .eq("is_active", true);

    if (sErr) console.warn("Notice fetching services:", sErr.message);

    // 4. Base Static High-Priority Pages
    const staticPages = [
      { path: "", changefreq: "daily", priority: "1.0" },
      { path: "carpenters/near-me", changefreq: "daily", priority: "1.0" },
      { path: "services", changefreq: "daily", priority: "1.0" },
      { path: "shop", changefreq: "daily", priority: "0.95" },
      { path: "blog", changefreq: "daily", priority: "0.95" },
      { path: "blog/coming-soon-handcrafted-wooden-watercan-amma-mom-design", changefreq: "daily", priority: "1.0" },
      { path: "blog/best-carpenter-in-perungalathur-vandalur-chennai-doorstep-services", changefreq: "daily", priority: "0.98" },
      { path: "blog/custom-wardrobe-modular-kitchen-carpenter-vandalur-guduvanchery", changefreq: "daily", priority: "0.95" },
      { path: "projects", changefreq: "daily", priority: "0.85" },
      { path: "about", changefreq: "weekly", priority: "0.8" },
      { path: "auth", changefreq: "monthly", priority: "0.5" },
      { path: "cart", changefreq: "monthly", priority: "0.5" },
      { path: "wishlist", changefreq: "monthly", priority: "0.5" },
      { path: "privacy-policy", changefreq: "yearly", priority: "0.3" },
      { path: "terms-of-service", changefreq: "yearly", priority: "0.3" },
    ];

    // 5. Build Programmatic Area Landing Pages (/carpenters/$city/$area)
    const programmaticPages = [];
    for (const [city, areas] of Object.entries(CITIES_AND_AREAS)) {
      for (const area of areas) {
        // High-Priority Local Hub Page
        programmaticPages.push({
          path: `carpenters/${city}/${area}`,
          changefreq: "daily",
          priority: ["vandalur", "perungalathur", "urapakkam", "tambaram"].includes(area) ? "1.0" : "0.95",
        });

        // Deep Service Landing Pages (/carpenters/$city/$area/$service)
        for (const service of CORE_SERVICES) {
          programmaticPages.push({
            path: `carpenters/${city}/${area}/${service}`,
            changefreq: "daily",
            priority: ["vandalur", "perungalathur", "urapakkam", "tambaram"].includes(area) ? "0.95" : "0.9",
          });
        }
      }
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Add static pages
    staticPages.forEach((page) => {
      xml += `  <url>\n`;
      xml += `    <loc>${domain}/${page.path}</loc>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    });

    // Add programmatic SEO local area and service pages
    programmaticPages.forEach((page) => {
      xml += `  <url>\n`;
      xml += `    <loc>${domain}/${page.path}</loc>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    });

    // Add service booking pages
    (services || []).forEach((svc) => {
      xml += `  <url>\n`;
      xml += `    <loc>${domain}/book-service/${svc.id}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.85</priority>\n`;
      xml += `  </url>\n`;
    });

    // Add dynamic product pages
    (products || []).forEach((prod) => {
      const lastMod = prod.updated_at ? new Date(prod.updated_at).toISOString().split("T")[0] : null;
      xml += `  <url>\n`;
      xml += `    <loc>${domain}/product/${prod.slug}</loc>\n`;
      if (lastMod) {
        xml += `    <lastmod>${lastMod}</lastmod>\n`;
      }
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.85</priority>\n`;
      xml += `  </url>\n`;
    });

    // Add dynamic carpenter profile pages
    (vendors || []).forEach((vendor) => {
      const lastMod = vendor.updated_at ? new Date(vendor.updated_at).toISOString().split("T")[0] : null;
      xml += `  <url>\n`;
      xml += `    <loc>${domain}/carpenter/${vendor.id}</loc>\n`;
      if (lastMod) {
        xml += `    <lastmod>${lastMod}</lastmod>\n`;
      }
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.75</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>\n`;

    // Write file to public/sitemap.xml
    const publicPath = path.resolve(__dirname, "../public/sitemap.xml");
    fs.writeFileSync(publicPath, xml, "utf-8");
    const totalUrls = staticPages.length + programmaticPages.length + (services?.length ?? 0) + (products?.length ?? 0) + (vendors?.length ?? 0);
    console.log(`✅ Success! Generated sitemap.xml with ${totalUrls} total URLs:`);
    console.log(`   - ${staticPages.length} core static pages`);
    console.log(`   - ${programmaticPages.length} programmatic local area & service landing pages`);
    console.log(`   - ${services?.length ?? 0} direct service booking pages`);
    console.log(`   - ${products?.length ?? 0} products`);
    console.log(`   - ${vendors?.length ?? 0} carpenter profiles`);
  } catch (err) {
    console.error("❌ Failed to generate sitemap.xml:", err.message);
  }
}

generateSitemap();
