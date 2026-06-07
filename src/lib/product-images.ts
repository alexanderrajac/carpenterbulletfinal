import hero from "@/assets/hero.jpg";
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

export const heroImage = hero;

export function resolveImage(key: string | null | undefined): string {
  if (!key) return p1;
  return map[key] ?? key;
}
