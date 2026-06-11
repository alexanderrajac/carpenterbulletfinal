import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((input: { category?: string; search?: string; featured?: boolean }) =>
    z
      .object({
        category: z.string().optional(),
        search: z.string().optional(),
        featured: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("products")
      .select("*, categories(slug, name)")
      .order("created_at", { ascending: false });
    if (data.featured) q = q.eq("featured", true);
    if (data.search) q = q.ilike("name", `%${data.search}%`);
    if (data.category && data.category !== "all") {
      const { data: cat } = await supabaseAdmin
        .from("categories")
        .select("id")
        .eq("slug", data.category)
        .maybeSingle();
      if (cat) q = q.eq("category_id", cat.id);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => z.object({ slug: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("products")
      .select("*, categories(slug, name)")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

const OrderInput = z.object({
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().min(1).max(100),
        wood_type: z.string().optional(),
      }),
    )
    .min(1)
    .max(50),
  shipping: z.object({
    full_name: z.string().min(1).max(120),
    address: z.string().min(1).max(240),
    city: z.string().min(1).max(120),
    postal_code: z.string().min(1).max(20),
    country: z.string().min(1).max(80),
  }),
});

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.infer<typeof OrderInput>) => OrderInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ids = data.items.map((i) => i.product_id);
    const { data: products, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id, name, price_cents, image_url, stock")
      .in("id", ids);
    if (pErr || !products) throw new Error(pErr?.message ?? "Products not found");

    let total = 0;
    const lineItems = data.items.map((i) => {
      const p = products.find((x) => x.id === i.product_id);
      if (!p) throw new Error("Product unavailable");

      let price = p.price_cents;
      let name = p.name;

      if (i.wood_type) {
        const multipliers: Record<string, number> = {
          "Teak Wood": 1.5,
          "Vengai": 1.3,
          "Poovarasam": 1.2,
          "Mahogany": 1.1,
          "Veppamaram": 1.0,
        };
        const mult = multipliers[i.wood_type] ?? 1.0;
        price = Math.round(p.price_cents * mult);
        name = `${p.name} (${i.wood_type})`;
      }

      total += price * i.quantity;
      return {
        product_id: p.id,
        quantity: i.quantity,
        unit_price_cents: price,
        product_name: name,
        product_image_url: p.image_url,
      };
    });

    const { data: order, error: oErr } = await context.supabase
      .from("orders")
      .insert({
        user_id: context.userId,
        total_cents: total,
        status: "pending",
        shipping_address: data.shipping,
      })
      .select()
      .single();
    if (oErr || !order) throw new Error(oErr?.message ?? "Failed to create order");

    const { error: iErr } = await context.supabase
      .from("order_items")
      .insert(lineItems.map((li) => ({ ...li, order_id: order.id })));
    if (iErr) throw new Error(iErr.message);

    return { orderId: order.id, total };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    return (data ?? []).map((r) => r.role);
  });
