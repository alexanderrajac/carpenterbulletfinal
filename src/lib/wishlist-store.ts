import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WishlistItem = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  image_url: string | null;
  categories?: { name: string } | null;
};

type WishlistState = {
  items: WishlistItem[];
  toggle: (item: WishlistItem) => void;
  has: (id: string) => boolean;
  clear: () => void;
  count: () => number;
};

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) =>
        set((s) => {
          const exists = s.items.some((i) => i.id === item.id);
          if (exists) {
            return { items: s.items.filter((i) => i.id !== item.id) };
          }
          return { items: [...s.items, item] };
        }),
      has: (id) => get().items.some((i) => i.id === id),
      clear: () => set({ items: [] }),
      count: () => get().items.length,
    }),
    { name: "woodverse-wishlist" },
  ),
);
