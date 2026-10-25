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

// Precise image assignment by service name and category
const IMAGE_RULES = [
  // Door locks
  { pattern: /lock/i, url: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80" },
  // Door trimming & repair
  { pattern: /trimming|scraping|plane|minor.*door/i, url: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80" },
  // Door hinges & closers
  { pattern: /closer/i, url: "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=800&q=80" },
  { pattern: /door hinge/i, url: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80" },
  { pattern: /sliding door/i, url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80" },
  { pattern: /mesh grill/i, url: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80" },
  { pattern: /peephole|digital viewer/i, url: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80" },
  { pattern: /door accessory|stopper/i, url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80" },
  { pattern: /wooden door installation|combo for wooden door/i, url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80" },

  // Cupboard & Drawer
  { pattern: /drawer channel/i, url: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80" },
  { pattern: /handle|knob/i, url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80" },
  { pattern: /cupboard hinge|hydraulic hinge/i, url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80" },
  { pattern: /shelf addition|hanging.*rod/i, url: "https://images.unsplash.com/photo-1558997519-83ea9252def8?auto=format&fit=crop&w=800&q=80" },

  // Bed
  { pattern: /hydraulic bed|gas spring/i, url: "https://images.unsplash.com/photo-1540518614846-7ede433c4ef5?auto=format&fit=crop&w=800&q=80" },
  { pattern: /bunk bed/i, url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80" },
  { pattern: /bed support|slat|headboard/i, url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80" },

  // Furniture Assembly
  { pattern: /single bed|double bed|cot assembly/i, url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80" },
  { pattern: /study table|standing desk|standing table/i, url: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80" },
  { pattern: /wardrobe assembly/i, url: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80" },
  { pattern: /office chair/i, url: "https://images.unsplash.com/photo-1580481077191-4d14210a47d2?auto=format&fit=crop&w=800&q=80" },
  { pattern: /book shelf|bookcase/i, url: "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80" },
  { pattern: /shoe rack|shoe cabinet/i, url: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80" },
  { pattern: /coffee table/i, url: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80" },
  { pattern: /tv entertainment/i, url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80" },

  // Kitchen & Dining
  { pattern: /modular kitchen|kitchen basket|kitchen cabinet/i, url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80" },
  { pattern: /kitchen chimney|under-sink/i, url: "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=800&q=80" },
  { pattern: /dining table|dining chair/i, url: "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=800&q=80" },

  // Drill & Hang
  { pattern: /bathroom vanity|mirror/i, url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80" },
  { pattern: /floating shelf|glass shelf/i, url: "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80" },
  { pattern: /wall decor|frame|clock/i, url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80" },
  { pattern: /clothes hanger|ceiling-mounted/i, url: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80" },
  { pattern: /bathroom holder|towel rod/i, url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80" },

  // Window & Curtain
  { pattern: /curtain rod|shower curtain/i, url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80" },
  { pattern: /blinds/i, url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80" },
  { pattern: /ac frame|window closing|window hinge/i, url: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80" },

  // Furniture Repair & Restoration
  { pattern: /sofa frame/i, url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80" },
  { pattern: /chair castor|buffer/i, url: "https://images.unsplash.com/photo-1580481077191-4d14210a47d2?auto=format&fit=crop&w=800&q=80" },
  { pattern: /edge banding/i, url: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80" },

  // Pooja & Mandir
  { pattern: /pooja|mandapam|mandir|bell/i, url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80" },

  // Wood Polishing
  { pattern: /polish|varnish|buffing/i, url: "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=800&q=80" },

  // Child Safety
  { pattern: /safety gate|bed safety|child safety/i, url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80" },

  // Carpenter on demand
  { pattern: /quick carpenter|half-day|full-day|consultation/i, url: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=800&q=80" },
];

async function updateServiceImages() {
  console.log("Updating service images in Supabase...");
  const { data: services, error } = await supabase.from("services").select("id, name, category, image_url");
  if (error) throw error;

  let updatedCount = 0;
  for (const s of services) {
    let matchedUrl = null;
    for (const rule of IMAGE_RULES) {
      if (rule.pattern.test(s.name) || rule.pattern.test(s.category)) {
        matchedUrl = rule.url;
        break;
      }
    }

    if (matchedUrl && matchedUrl !== s.image_url) {
      await supabase.from("services").update({ image_url: matchedUrl }).eq("id", s.id);
      updatedCount++;
    }
  }

  console.log(`Successfully updated ${updatedCount} service images with curated HD photography!`);
}

updateServiceImages();
