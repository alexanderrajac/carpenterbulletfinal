import hero from "@/assets/hero.jpg";
import multiverseChair from "@/assets/multiverse_chair.png";
import p1 from "@/assets/p1-lounge-chair.jpg";
import p2 from "@/assets/p2-dining-table.jpg";
import p3 from "@/assets/p3-side-table.jpg";
import p4 from "@/assets/p4-floating-shelf.jpg";
import p5 from "@/assets/p5-bookshelf.jpg";
import p6 from "@/assets/p6-storage-trunk.jpg";
import p7 from "@/assets/p7-cutting-board.jpg";
import p8 from "@/assets/p8-serving-tray.jpg";
import p9 from "@/assets/p9-bowl-set.jpg";
import p10 from "@/assets/p10-chisel-set.jpg";
import p11 from "@/assets/p11-wood-plane.jpg";
import p12 from "@/assets/p12-tool-roll.jpg";
import { supabase } from "@/integrations/supabase/client";

const map: Record<string, string> = {
  "hero.jpg": hero,
  "p1-lounge-chair.jpg": p1,
  "p2-dining-table.jpg": p2,
  "p3-side-table.jpg": p3,
  "p4-floating-shelf.jpg": p4,
  "p5-bookshelf.jpg": p5,
  "p6-storage-trunk.jpg": p6,
  "p7-cutting-board.jpg": p7,
  "p8-serving-tray.jpg": p8,
  "p9-bowl-set.jpg": p9,
  "p10-chisel-set.jpg": p10,
  "p11-wood-plane.jpg": p11,
  "p12-tool-roll.jpg": p12,
};

export const heroImage = multiverseChair;

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dssi8rbh3";
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "carpenterbullet_uploads";

console.log("[Storage Debug] Cloud Name:", CLOUDINARY_CLOUD_NAME);
console.log("[Storage Debug] Upload Preset:", CLOUDINARY_UPLOAD_PRESET);

/**
 * Resolves an image URL or local asset key.
 * If CLOUDINARY_CLOUD_NAME is set and it's an external URL,
 * it routes it through Cloudinary Fetch API for optimization (auto format, quality, resizing).
 */
export function resolveImage(key: string | null | undefined, transformations?: string): string {
  if (!key || key.trim() === "") return p1;
  const mapped = map[key] ?? key.trim();

  if (CLOUDINARY_CLOUD_NAME && (mapped.startsWith("http://") || mapped.startsWith("https://"))) {
    const tx = transformations || "f_auto,q_auto";
    
    // If it's already a Cloudinary upload URL, inject the transformations directly
    if (mapped.includes("res.cloudinary.com") && mapped.includes("/upload/")) {
      return mapped.replace("/upload/", `/upload/${tx}/`);
    }
    
    // For Supabase or other external URLs, use the Fetch API
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/fetch/${tx}/${encodeURIComponent(mapped)}`;
  }
  return mapped;
}

/**
 * Uploads an image to Cloudinary if configured. Otherwise, uploads to Supabase storage.
 * Returns the public secure URL of the uploaded image.
 */
export async function uploadImage(file: File, path: string): Promise<string> {
  if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "woodverse");

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || "Cloudinary upload failed");
    }

    const data = await response.json();
    return data.secure_url;
  }

  // Fallback to Supabase upload
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { cacheControl: "3600", upsert: true });

  if (error) {
    throw new Error(error.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("product-images").getPublicUrl(path);

  return publicUrl;
}
