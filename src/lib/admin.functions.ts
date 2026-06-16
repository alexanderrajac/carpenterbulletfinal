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
});

export const upsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.infer<typeof ProductInput>) => ProductInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id) {
      const { error } = await supabaseAdmin.from("products").update(data).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await supabaseAdmin
      .from("products")
      .insert(data)
      .select("id")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Insert failed");
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
      .from("products")
      .update({ stock: data.stock })
      .in("id", data.ids);
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
