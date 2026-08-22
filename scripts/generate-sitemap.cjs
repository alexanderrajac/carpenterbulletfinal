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

async function generateSitemap() {
  console.log("Generating sitemap.xml...");

  try {
    // 1. Fetch all approved products
    const { data: products, error: pErr } = await supabase
      .from("products")
      .select("slug, updated_at")
      .eq("is_approved", true);

    if (pErr) throw pErr;

    // 2. Fetch all approved/verified vendor profiles
    const { data: vendors, error: vErr } = await supabase
      .from("vendor_profiles")
      .select("id, updated_at")
      .eq("is_approved", true);

    if (vErr) throw vErr;

    // 3. Static Pages & Programmatic Local SEO Pages
    const staticPages = [
      { path: "", changefreq: "daily", priority: "1.0" },
      { path: "blog", changefreq: "daily", priority: "0.95" },
      { path: "blog/no-1-carpenter-guide-teak-wood-door-installation-villupuram", changefreq: "weekly", priority: "0.9" },
      { path: "blog/custom-modular-kitchen-wardrobe-vlog-tindivanam-vikravandi", changefreq: "weekly", priority: "0.9" },
      { path: "projects", changefreq: "daily", priority: "0.85" },
      { path: "services", changefreq: "daily", priority: "0.9" },
      { path: "shop", changefreq: "daily", priority: "0.9" },
      { path: "about", changefreq: "weekly", priority: "0.8" },
      { path: "auth", changefreq: "monthly", priority: "0.5" },
      { path: "cart", changefreq: "monthly", priority: "0.5" },
      { path: "wishlist", changefreq: "monthly", priority: "0.5" },
      { path: "privacy-policy", changefreq: "yearly", priority: "0.3" },
      { path: "terms-of-service", changefreq: "yearly", priority: "0.3" },

      // Programmatic Local SEO URLs for Villupuram District
      { path: "carpenters/villupuram/villupuram-town/door", changefreq: "daily", priority: "0.95" },
      { path: "carpenters/villupuram/tindivanam/door", changefreq: "daily", priority: "0.95" },
      { path: "carpenters/villupuram/gingee/door", changefreq: "daily", priority: "0.95" },
      { path: "carpenters/villupuram/marakkanam/cupboard", changefreq: "daily", priority: "0.9" },
      { path: "carpenters/villupuram/vikravandi/kitchen", changefreq: "daily", priority: "0.9" },
      { path: "carpenters/villupuram/mailam/lock", changefreq: "daily", priority: "0.9" },
      { path: "carpenters/villupuram/vanur/furniture-assembly", changefreq: "daily", priority: "0.9" },
      { path: "carpenters/villupuram/kandamangalam/shelf", changefreq: "daily", priority: "0.9" },
      { path: "carpenters/villupuram/kanai/door", changefreq: "daily", priority: "0.85" },
      { path: "carpenters/villupuram/koliyanur/door", changefreq: "daily", priority: "0.85" },
      { path: "carpenters/villupuram/olakkur/door", changefreq: "daily", priority: "0.85" },

      // Other Tamil Nadu Major Cities
      { path: "carpenters/chennai/ambattur/door", changefreq: "daily", priority: "0.85" },
      { path: "carpenters/chennai/ambattur/wardrobe", changefreq: "daily", priority: "0.85" },
      { path: "carpenters/kanchipuram/sriperumbudur/door", changefreq: "daily", priority: "0.85" },
    ];

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

    // Add dynamic product pages
    (products || []).forEach((prod) => {
      const lastMod = prod.updated_at ? new Date(prod.updated_at).toISOString().split('T')[0] : null;
      xml += `  <url>\n`;
      xml += `    <loc>${domain}/product/${prod.slug}</loc>\n`;
      if (lastMod) {
        xml += `    <lastmod>${lastMod}</lastmod>\n`;
      }
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    });

    // Add dynamic carpenter storefront profile pages
    (vendors || []).forEach((vendor) => {
      const lastMod = vendor.updated_at ? new Date(vendor.updated_at).toISOString().split('T')[0] : null;
      xml += `  <url>\n`;
      xml += `    <loc>${domain}/carpenter/${vendor.id}</loc>\n`;
      if (lastMod) {
        xml += `    <lastmod>${lastMod}</lastmod>\n`;
      }
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>\n`;

    // Write file to public/sitemap.xml
    const publicPath = path.resolve(__dirname, "../public/sitemap.xml");
    fs.writeFileSync(publicPath, xml, "utf-8");
    console.log(`✅ Success! Generated sitemap.xml with ${staticPages.length} static pages, ${products?.length ?? 0} products, and ${vendors?.length ?? 0} carpenters.`);
  } catch (err) {
    console.error("❌ Failed to generate sitemap.xml:", err.message);
  }
}

generateSitemap();
