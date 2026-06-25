import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertVendor(supabase: ReturnType<typeof Object>, userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "vendor")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: vendor only");
}

const VendorProductInput = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "lowercase, numbers, dashes"),
  name: z.string().min(1).max(160),
  description: z.string().max(4000).default(""),
  price_cents: z.number().int().min(0).max(100_000_000),
  image_url: z.string().max(500).nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  stock: z.number().int().min(0).max(100000),
  featured: z.boolean().default(false),
  seo_keywords: z.string().nullable().optional(),
  customizations: z.any().nullable().optional(),
});

export const vendorUpsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.infer<typeof VendorProductInput>) => VendorProductInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertVendor(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const productData = {
      ...data,
      vendor_id: context.userId // Force product to belong to this vendor
    };

    if (data.id) {
      // Confirm product belongs to this vendor before updating
      const { data: existing } = await supabaseAdmin
        .from("products")
        .select("vendor_id")
        .eq("id", data.id)
        .maybeSingle();
      if (!existing || existing.vendor_id !== context.userId) {
        throw new Error("Unauthorized: product does not belong to you");
      }

      const { error } = await supabaseAdmin.from("products").update(productData).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }

    const { data: row, error } = await supabaseAdmin
      .from("products")
      .insert(productData)
      .select("id")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Insert failed");
    return { id: row.id };
  });

export const vendorDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertVendor(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Confirm product belongs to this vendor before deleting
    const { data: existing } = await supabaseAdmin
      .from("products")
      .select("vendor_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!existing || existing.vendor_id !== context.userId) {
      throw new Error("Unauthorized: product does not belong to you");
    }

    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listVendorProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertVendor(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*, categories(slug, name)")
      .eq("vendor_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getVendorDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertVendor(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Fetch vendor products list
    const { data: products } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("vendor_id", context.userId);
    const productIds = (products ?? []).map((p) => p.id);

    if (productIds.length === 0) {
      return {
        productCount: 0,
        orderCount: 0,
        revenueCents: 0,
        orderTrend: [],
        statusBreakdown: {},
      };
    }

    // 2. Fetch order items for these products
    const { data: items, error: iErr } = await supabaseAdmin
      .from("order_items")
      .select("*, orders(*)")
      .in("product_id", productIds);
    if (iErr) throw new Error(iErr.message);

    const orderItems = items ?? [];
    const revenue = orderItems.reduce((s, o) => s + (o.unit_price_cents * o.quantity), 0);
    const uniqueOrderIds = Array.from(new Set(orderItems.map((o) => o.order_id).filter(Boolean)));

    // Group items by date for sales trend chart (last 30 days)
    const last30 = new Date();
    last30.setDate(last30.getDate() - 30);
    const dailyOrders: Record<string, { count: number; revenue: number }> = {};
    
    orderItems.forEach((item) => {
      const order = item.orders;
      if (!order) return;
      const date = new Date(order.created_at).toISOString().slice(0, 10);
      if (new Date(order.created_at) >= last30) {
        if (!dailyOrders[date]) dailyOrders[date] = { count: 0, revenue: 0 };
        dailyOrders[date].count += 1;
        dailyOrders[date].revenue += item.unit_price_cents * item.quantity;
      }
    });

    const orderTrend = Object.entries(dailyOrders)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, orders: data.count, revenue: data.revenue }));

    // Status breakdown
    const statusBreakdown: Record<string, number> = {};
    orderItems.forEach((item) => {
      statusBreakdown[item.fulfillment_status] = (statusBreakdown[item.fulfillment_status] || 0) + 1;
    });

    return {
      productCount: productIds.length,
      orderCount: uniqueOrderIds.length,
      revenueCents: revenue,
      orderTrend,
      statusBreakdown,
    };
  });

const VendorProfileInput = z.object({
  business_name: z.string().min(2).max(100),
  owner_name: z.string().min(2).max(100),
  phone_number: z.string().min(10).max(20),
  workshop_address: z.string().min(5).max(300),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  upi_payout_id: z.string().min(5).max(100),
  bio: z.string().max(1000).nullable().optional(),
});

export const updateVendorProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.infer<typeof VendorProfileInput>) => VendorProfileInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertVendor(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("vendor_profiles")
      .update({
        business_name: data.business_name,
        owner_name: data.owner_name,
        phone_number: data.phone_number,
        workshop_address: data.workshop_address,
        city: data.city,
        state: data.state,
        upi_payout_id: data.upi_payout_id,
        bio: data.bio || null,
      })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getPublicVendorStorefront = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Fetch vendor profile
    const { data: profile, error: pErr } = await supabaseAdmin
      .from("vendor_profiles")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!profile) return null;

    // 2. Fetch products sold by this vendor
    const { data: products, error: prErr } = await supabaseAdmin
      .from("products")
      .select("*, categories(slug, name), vendor_profiles(id, business_name)")
      .eq("vendor_id", data.id)
      .order("created_at", { ascending: false });
    if (prErr) throw new Error(prErr.message);

    return {
      profile,
      products: products ?? [],
    };
  });
