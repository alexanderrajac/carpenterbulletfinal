import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  image_url: string | null;
  quantity: number;
  customizations?: any;
  vendor_id?: string | null;
  vendor_name?: string | null;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (id: string, customizations?: any, vendorId?: string | null) => void;
  setQty: (id: string, qty: number, customizations?: any, vendorId?: string | null) => void;
  clear: () => void;
  totalCents: () => number;
  totalCount: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, qty = 1) =>
        set((s) => {
          const existing = s.items.find(
            (i) => i.id === item.id && i.vendor_id === item.vendor_id && JSON.stringify(i.customizations) === JSON.stringify(item.customizations)
          );
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.id === item.id && i.vendor_id === item.vendor_id && JSON.stringify(i.customizations) === JSON.stringify(item.customizations)
                  ? { ...i, quantity: i.quantity + qty }
                  : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, quantity: qty }] };
        }),
      remove: (id, customizations, vendorId = null) =>
        set((s) => ({
          items: s.items.filter(
            (i) => !(i.id === id && i.vendor_id === vendorId && JSON.stringify(i.customizations) === JSON.stringify(customizations))
          ),
        })),
      setQty: (id, qty, customizations, vendorId = null) =>
        set((s) => ({
          items: s.items
            .map((i) =>
              i.id === id && i.vendor_id === vendorId && JSON.stringify(i.customizations) === JSON.stringify(customizations)
                ? { ...i, quantity: Math.max(1, qty) }
                : i,
            )
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [] }),
      totalCents: () => get().items.reduce((sum, i) => sum + i.price_cents * i.quantity, 0),
      totalCount: () => get().items.reduce((n, i) => n + i.quantity, 0),
    }),
    { name: "woodverse-cart" },
  ),
);
