import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: ReturnType<typeof Object>, userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin only");
}

const ProductInput = z.object({
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
  featured: z.boolean(),
  is_approved: z.boolean().optional(),
  seo_keywords: z.string().nullable().optional(),
  customizations: z.any().nullable().optional(),
});

export const upsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.infer<typeof ProductInput>) => ProductInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    const catalogData = {
      slug: data.slug,
      name: data.name,
      description: data.description,
      category_id: data.category_id || null,
      image_url: data.image_url || null,
      featured: data.featured,
      is_approved: data.is_approved !== undefined ? data.is_approved : true,
      seo_keywords: data.seo_keywords || null,
      customizations: data.customizations || null,
    };

    if (data.id) {
      const { error } = await supabaseAdmin.from("products").update(catalogData).eq("id", data.id);
      if (error) throw new Error(error.message);

      // Upsert platform offer
      const { error: offerErr } = await supabaseAdmin
        .from("vendor_offers")
        .upsert({
          product_id: data.id,
          vendor_id: null,
          price_cents: data.price_cents,
          stock: data.stock,
          is_active: true
        }, { onConflict: "product_id,vendor_id" });
      if (offerErr) throw new Error(offerErr.message);

      return { id: data.id };
    }

    const { data: row, error } = await supabaseAdmin
      .from("products")
      .insert({ ...catalogData, vendor_id: null })
      .select("id")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Insert failed");

    // Insert platform offer
    const { error: offerErr } = await supabaseAdmin
      .from("vendor_offers")
      .insert({
        product_id: row.id,
        vendor_id: null,
        price_cents: data.price_cents,
        stock: data.stock,
        is_active: true
      });
    if (offerErr) throw new Error(offerErr.message);

    return { id: row.id };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ids: string[]; force?: boolean }) =>
    z
      .object({
        ids: z.array(z.string().uuid()),
        force: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.force) {
      const { data: items } = await supabaseAdmin
        .from("order_items")
        .select("order_id")
        .in("product_id", data.ids);
      const orderIds = Array.from(
        new Set(items?.map((i) => i.order_id).filter(Boolean) as string[]),
      );
      if (orderIds.length > 0) {
        await supabaseAdmin.from("order_items").delete().in("order_id", orderIds);
        await supabaseAdmin.from("orders").delete().in("id", orderIds);
      }
      await supabaseAdmin.from("order_items").delete().in("product_id", data.ids);
    }
    const { error } = await supabaseAdmin.from("products").delete().in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const purgeAllProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { force?: boolean }) =>
    z
      .object({
        force: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.force) {
      await supabaseAdmin
        .from("order_items")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      await supabaseAdmin.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    }
    const { error } = await supabaseAdmin
      .from("products")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const bulkUpdateCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ids: string[]; category_id: string | null }) =>
    z
      .object({
        ids: z.array(z.string().uuid()),
        category_id: z.string().uuid().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("products")
      .update({ category_id: data.category_id })
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const bulkUpdateFeatured = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ids: string[]; featured: boolean }) =>
    z
      .object({
        ids: z.array(z.string().uuid()),
        featured: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("products")
      .update({ featured: data.featured })
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const bulkUpdateStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ids: string[]; stock: number }) =>
    z
      .object({
        ids: z.array(z.string().uuid()),
        stock: z.number().int().min(0).max(100000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("vendor_offers")
      .update({ stock: data.stock })
      .in("product_id", data.ids)
      .is("vendor_id", null);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAllOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: string }) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "paid", "shipped", "delivered", "cancelled"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [productsRes, ordersRes] = await Promise.all([
      supabaseAdmin.from("products").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("orders").select("total_cents"),
    ]);
    const orders = ordersRes.data ?? [];
    const revenue = orders.reduce((s, o) => s + (o.total_cents ?? 0), 0);
    return {
      productCount: productsRes.count ?? 0,
      orderCount: orders.length,
      revenueCents: revenue,
    };
  });

export const makeMeAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Only allow if no admin exists yet (bootstrap)
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) throw new Error("Admin already exists. Promote via database.");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ==========================================
// CATEGORY CRUD
// ==========================================

const CategoryInput = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "lowercase, numbers, dashes"),
  name: z.string().min(1).max(160),
  description: z.string().max(2000).default(""),
  image_url: z.string().max(500).nullable().optional(),
});

export const upsertCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.infer<typeof CategoryInput>) => CategoryInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id) {
      const { error } = await supabaseAdmin.from("categories").update(data).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await supabaseAdmin
      .from("categories")
      .insert(data)
      .select("id")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Insert failed");
    return { id: row.id };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getAdminDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [productsRes, ordersRes, categoriesRes] = await Promise.all([
      supabaseAdmin.from("products").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("orders")
        .select("total_cents, created_at, status")
        .order("created_at", { ascending: true }),
      supabaseAdmin.from("categories").select("id", { count: "exact", head: true }),
    ]);
    const orders = ordersRes.data ?? [];
    const revenue = orders.reduce((s, o) => s + (o.total_cents ?? 0), 0);

    // Group orders by date for trend chart (last 30 days)
    const last30 = new Date();
    last30.setDate(last30.getDate() - 30);
    const dailyOrders: Record<string, { count: number; revenue: number }> = {};
    orders.forEach((o) => {
      const date = new Date(o.created_at).toISOString().slice(0, 10);
      if (new Date(o.created_at) >= last30) {
        if (!dailyOrders[date]) dailyOrders[date] = { count: 0, revenue: 0 };
        dailyOrders[date].count += 1;
        dailyOrders[date].revenue += o.total_cents ?? 0;
      }
    });

    const orderTrend = Object.entries(dailyOrders)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, orders: data.count, revenue: data.revenue }));

    // Status breakdown
    const statusBreakdown: Record<string, number> = {};
    orders.forEach((o) => {
      statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1;
    });

    return {
      productCount: productsRes.count ?? 0,
      orderCount: orders.length,
      revenueCents: revenue,
      categoryCount: categoriesRes.count ?? 0,
      orderTrend,
      statusBreakdown,
    };
  });

export const listAllVendors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("vendor_profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const toggleVendorApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { vendorId: string; isApproved: boolean }) =>
    z.object({ vendorId: z.string().uuid(), isApproved: z.boolean() }).parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("vendor_profiles")
      .update({ is_approved: data.isApproved })
      .eq("id", data.vendorId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const AdminVendorUpdateInput = z.object({
  id: z.string().uuid(),
  business_name: z.string().min(2).max(100),
  owner_name: z.string().min(2).max(100),
  phone_number: z.string().min(10).max(20),
  workshop_address: z.string().min(5).max(300),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  upi_payout_id: z.string().min(5).max(100),
  bio: z.string().max(1000).nullable().optional(),
  avatar_url: z.string().max(500).nullable().optional(),
});

export const updateVendorProfileAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.infer<typeof AdminVendorUpdateInput>) => AdminVendorUpdateInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
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
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminVerifyProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { productId: string; isApproved: boolean }) =>
    z.object({ productId: z.string().uuid(), isApproved: z.boolean() }).parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("products")
      .update({ is_approved: data.isApproved })
      .eq("id", data.productId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ==========================================
// BULK VENDOR / STORE IMPORT & MAPPING CRUD
// ==========================================

export const adminBulkSaveVendors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      vendors: Array<{
        id?: string;
        business_name: string;
        owner_name: string;
        phone_number: string;
        workshop_address?: string;
        city: string;
        state: string;
        upi_payout_id?: string;
        bio?: string | null;
        avatar_url?: string | null;
        is_approved?: boolean;
        districts_covered?: string[];
        services_offered?: string[];
      }>;
    }) =>
      z
        .object({
          vendors: z.array(
            z.object({
              id: z.string().optional(),
              business_name: z.string().min(1),
              owner_name: z.string().min(1),
              phone_number: z.string().min(1),
              workshop_address: z.string().optional(),
              city: z.string().min(1),
              state: z.string().min(1),
              upi_payout_id: z.string().optional(),
              bio: z.string().nullable().optional(),
              avatar_url: z.string().nullable().optional(),
              is_approved: z.boolean().optional(),
              districts_covered: z.array(z.string()).optional(),
              services_offered: z.array(z.string()).optional(),
            }),
          ),
        })
        .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let count = 0;
    for (const v of data.vendors) {
      const vendorId = v.id || `v-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const profileData = {
        id: vendorId,
        business_name: v.business_name,
        owner_name: v.owner_name,
        phone_number: v.phone_number,
        workshop_address: v.workshop_address || `${v.city}, ${v.state}`,
        city: v.city,
        state: v.state,
        upi_payout_id: v.upi_payout_id || `${v.phone_number}@upi`,
        bio: v.bio || null,
        avatar_url: v.avatar_url || null,
        is_approved: v.is_approved ?? true,
        districts_covered: v.districts_covered || [v.city],
        services_offered: v.services_offered || [],
      };

      const { error } = await supabaseAdmin.from("vendor_profiles").upsert(profileData);
      if (!error) {
        count++;

        // Sync service_areas
        if (v.districts_covered && v.districts_covered.length > 0) {
          await supabaseAdmin.from("service_areas").delete().eq("vendor_id", vendorId);
          const areaRows = v.districts_covered.map((dist) => ({
            vendor_id: vendorId,
            district: dist,
            pincodes: [],
          }));
          await supabaseAdmin.from("service_areas").insert(areaRows);
        }

        // Sync carpenter_services
        if (v.services_offered && v.services_offered.length > 0) {
          await supabaseAdmin.from("carpenter_services").delete().eq("vendor_id", vendorId);
          const serviceRows = v.services_offered.map((svcId) => ({
            vendor_id: vendorId,
            service_id: svcId,
            custom_price_cents: null,
            is_active: true,
          }));
          await supabaseAdmin.from("carpenter_services").insert(serviceRows);
        }
      }
    }

    return { ok: true, count };
  });

export const adminBulkDeleteVendors = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ids: string[] }) => z.object({ ids: z.array(z.string()) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.ids.length > 0) {
      await supabaseAdmin.from("carpenter_services").delete().in("vendor_id", data.ids);
      await supabaseAdmin.from("service_areas").delete().in("vendor_id", data.ids);
      await supabaseAdmin.from("vendor_profiles").delete().in("id", data.ids);
    }
    return { ok: true, count: data.ids.length };
  });

export const adminBulkUpdateVendorStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { ids: string[]; isApproved: boolean }) =>
    z.object({ ids: z.array(z.string()), isApproved: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.ids.length > 0) {
      await supabaseAdmin.from("vendor_profiles").update({ is_approved: data.isApproved }).in("id", data.ids);
    }
    return { ok: true, count: data.ids.length };
  });

export const adminGetVendorFullDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { vendorId: string }) => z.object({ vendorId: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("vendor_profiles")
      .select("*")
      .eq("id", data.vendorId)
      .maybeSingle();

    const { data: carpServices } = await supabaseAdmin
      .from("carpenter_services")
      .select("service_id, custom_price_cents, is_active")
      .eq("vendor_id", data.vendorId);

    const { data: areas } = await supabaseAdmin
      .from("service_areas")
      .select("district")
      .eq("vendor_id", data.vendorId);

    return {
      profile,
      carpenter_services: carpServices || [],
      service_areas: (areas || []).map((a: any) => a.district),
    };
  });

export const adminUpdateVendorServicesAndAreas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      vendorId: string;
      districts_covered: string[];
      service_ids: string[];
    }) =>
      z
        .object({
          vendorId: z.string(),
          districts_covered: z.array(z.string()),
          service_ids: z.array(z.string()),
        })
        .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Update vendor_profiles
    await supabaseAdmin
      .from("vendor_profiles")
      .update({
        districts_covered: data.districts_covered,
        services_offered: data.service_ids,
      })
      .eq("id", data.vendorId);

    // Sync service_areas table
    await supabaseAdmin.from("service_areas").delete().eq("vendor_id", data.vendorId);
    if (data.districts_covered.length > 0) {
      const areaRows = data.districts_covered.map((dist) => ({
        vendor_id: data.vendorId,
        district: dist,
        pincodes: [],
      }));
      await supabaseAdmin.from("service_areas").insert(areaRows);
    }

    // Sync carpenter_services table
    await supabaseAdmin.from("carpenter_services").delete().eq("vendor_id", data.vendorId);
    if (data.service_ids.length > 0) {
      const serviceRows = data.service_ids.map((sId) => ({
        vendor_id: data.vendorId,
        service_id: sId,
        custom_price_cents: null,
        is_active: true,
      }));
      await supabaseAdmin.from("carpenter_services").insert(serviceRows);
    }

    return { ok: true };
  });



