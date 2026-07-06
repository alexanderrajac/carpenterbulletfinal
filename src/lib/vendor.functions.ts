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
    
    let productId = data.id;
    const catalogData = {
      slug: data.slug,
      name: data.name,
      description: data.description,
      category_id: data.category_id || null,
      image_url: data.image_url || null,
      featured: data.featured,
      seo_keywords: data.seo_keywords || null,
      customizations: data.customizations || null,
    };

    if (productId) {
      // Check if they own the catalog product
      const { data: existing } = await supabaseAdmin
        .from("products")
        .select("vendor_id")
        .eq("id", productId)
        .maybeSingle();
      
      if (existing && existing.vendor_id === context.userId) {
        // They suggested/created the product, so they can edit catalog metadata
        const { error } = await supabaseAdmin
          .from("products")
          .update({ ...catalogData, is_approved: false }) // reset approval on edits
          .eq("id", productId);
        if (error) throw new Error(error.message);
      }

      // Upsert vendor offer details
      const { error: offerErr } = await supabaseAdmin
        .from("vendor_offers")
        .upsert({
          product_id: productId,
          vendor_id: context.userId,
          price_cents: data.price_cents,
          stock: data.stock,
          is_active: true
        }, { onConflict: "product_id,vendor_id" });
      if (offerErr) throw new Error(offerErr.message);

      return { id: productId };
    }

    // Creating new product - check if slug exists in global catalog
    const { data: existingBySlug } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();

    if (existingBySlug) {
      productId = existingBySlug.id;
    } else {
      // Create new catalog product suggestion
      const { data: newProd, error } = await supabaseAdmin
        .from("products")
        .insert({
          ...catalogData,
          vendor_id: context.userId,
          is_approved: false
        })
        .select("id")
        .single();
      if (error || !newProd) throw new Error(error?.message ?? "Insert catalog product failed");
      productId = newProd.id;
    }

    // Create the vendor offer
    const { error: offerErr } = await supabaseAdmin
      .from("vendor_offers")
      .insert({
        product_id: productId,
        vendor_id: context.userId,
        price_cents: data.price_cents,
        stock: data.stock,
        is_active: true
      });
    if (offerErr) throw new Error(offerErr.message);

    return { id: productId };
  });

export const vendorDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertVendor(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Delete offer
    const { error: offerErr } = await supabaseAdmin
      .from("vendor_offers")
      .delete()
      .eq("product_id", data.id)
      .eq("vendor_id", context.userId);
    if (offerErr) throw new Error(offerErr.message);

    // If they own the catalog product, check if anyone else has an offer. If not, delete catalog product.
    const { data: existing } = await supabaseAdmin
      .from("products")
      .select("vendor_id")
      .eq("id", data.id)
      .maybeSingle();
    
    if (existing && existing.vendor_id === context.userId) {
      const { count } = await supabaseAdmin
        .from("vendor_offers")
        .select("id", { count: "exact", head: true })
        .eq("product_id", data.id);
      
      if ((count ?? 0) === 0) {
        await supabaseAdmin.from("products").delete().eq("id", data.id);
      }
    }

    return { ok: true };
  });

export const listVendorProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertVendor(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("vendor_offers")
      .select("*, products(*, categories(slug, name))")
      .eq("vendor_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    
    return (data ?? []).map((o: any) => ({
      ...o.products,
      price_cents: o.price_cents,
      stock: o.stock,
      is_approved: o.products?.is_approved,
      offer_id: o.id,
    }));
  });

export const getVendorDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertVendor(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Fetch vendor offers count
    const { data: offers } = await supabaseAdmin
      .from("vendor_offers")
      .select("product_id")
      .eq("vendor_id", context.userId);
    const productCount = offers?.length ?? 0;

    // 2. Fetch order items for this vendor
    const { data: items, error: iErr } = await supabaseAdmin
      .from("order_items")
      .select("*, orders(*)")
      .eq("vendor_id", context.userId);
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
      productCount,
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
  avatar_url: z.string().max(500).nullable().optional(),
  portfolio_images: z.array(z.string()).optional(),
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
        avatar_url: data.avatar_url || null,
        portfolio_images: data.portfolio_images || null,
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

    // 2. Fetch products sold by this vendor via vendor_offers (only approved catalog items)
    const { data: offers, error: prErr } = await supabaseAdmin
      .from("vendor_offers")
      .select("price_cents, stock, products(*, categories(slug, name), vendor_profiles(id, business_name))")
      .eq("vendor_id", data.id)
      .eq("is_active", true)
      .eq("products.is_approved", true);
    if (prErr) throw new Error(prErr.message);

    const activeOffers = (offers ?? []).filter((o: any) => o.products !== null);
    const mappedProducts = activeOffers.map((o: any) => ({
      ...o.products,
      price_cents: o.price_cents,
      stock: o.stock,
    }));

    return {
      profile,
      products: mappedProducts,
    };
  });
