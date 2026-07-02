import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Helper to get untyped admin client for new tables not yet in generated types
async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as any;
}

// ─── Public: List all active services ───
export const listServices = createServerFn({ method: "GET" }).handler(async () => {
  const supabaseAdmin = await getAdmin() as any;
  const { data, error } = await supabaseAdmin
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

// ─── Public: List services grouped by category ───
export const listServicesByCategory = createServerFn({ method: "GET" }).handler(async () => {
  const supabaseAdmin = await getAdmin();
  const { data, error } = await supabaseAdmin
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error(error.message);

  const grouped: Record<string, typeof data> = {};
  (data ?? []).forEach((s: any) => {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  });
  return grouped;
});

// ─── Public: Get a single service ───
export const getService = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const supabaseAdmin = await getAdmin();
    const { data: service, error } = await supabaseAdmin
      .from("services")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return service;
  });

// ─── Public: Find carpenters near a district offering a service ───
export const searchNearbyCarpenters = createServerFn({ method: "GET" })
  .inputValidator((input: { serviceId: string; district: string }) =>
    z.object({ serviceId: z.string().uuid(), district: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const supabaseAdmin = await getAdmin();

    // Find carpenters who offer this service
    const { data: carpServices, error: csErr } = await supabaseAdmin
      .from("carpenter_services")
      .select("vendor_id, custom_price_cents, vendor_profiles(id, business_name, owner_name, city, state, bio, avatar_url, is_approved)")
      .eq("service_id", data.serviceId)
      .eq("is_active", true);
    if (csErr) throw new Error(csErr.message);

    // Filter by district coverage
    const { data: areas, error: aErr } = await supabaseAdmin
      .from("service_areas")
      .select("vendor_id, district")
      .ilike("district", `%${data.district}%`);
    if (aErr) throw new Error(aErr.message);

    const areaVendorIds = new Set((areas ?? []).map((a: any) => a.vendor_id));

    // Get reviews for rating
    const vendorIds = (carpServices ?? []).map((cs: any) => cs.vendor_id);
    const { data: reviews } = await supabaseAdmin
      .from("service_reviews")
      .select("vendor_id, rating")
      .in("vendor_id", vendorIds.length > 0 ? vendorIds : ["00000000-0000-0000-0000-000000000000"]);

    const ratingMap: Record<string, { total: number; count: number }> = {};
    (reviews ?? []).forEach((r: any) => {
      if (!ratingMap[r.vendor_id]) ratingMap[r.vendor_id] = { total: 0, count: 0 };
      ratingMap[r.vendor_id].total += r.rating;
      ratingMap[r.vendor_id].count += 1;
    });

    return (carpServices ?? [])
      .filter((cs: any) => {
        const profile = cs.vendor_profiles;
        if (!profile || !profile.is_approved) return false;
        // If vendor has area entries, check district match. If no areas, include them (covers everywhere).
        if (areaVendorIds.size > 0 && !areaVendorIds.has(cs.vendor_id)) {
          // Check if vendor has any area entries at all
          const vendorHasAreas = (areas ?? []).some((a: any) => a.vendor_id === cs.vendor_id);
          if (!vendorHasAreas) return true; // No area restrictions
          return false;
        }
        return true;
      })
      .map((cs: any) => {
        const r = ratingMap[cs.vendor_id];
        return {
          vendor_id: cs.vendor_id,
          custom_price_cents: cs.custom_price_cents,
          profile: cs.vendor_profiles,
          avg_rating: r ? (r.total / r.count).toFixed(1) : null,
          review_count: r?.count ?? 0,
        };
      });
  });

const BookingInput = z.object({
  service_id: z.string().uuid(),
  vendor_id: z.string().uuid(),
  scheduled_date: z.string().min(1),
  scheduled_slot: z.enum(["morning", "afternoon", "evening"]),
  customer_name: z.string().min(1).max(120),
  customer_phone: z.string().min(10).max(20),
  address: z.object({
    line1: z.string().min(1).max(240),
    line2: z.string().max(240).optional(),
    city: z.string().min(1).max(100),
    district: z.string().min(1).max(100),
    pincode: z.string().min(6).max(10),
  }),
  notes: z.string().max(500).optional(),
});

// ─── Auth: Create a service booking ───
export const createServiceBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.infer<typeof BookingInput>) => BookingInput.parse(input))
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await getAdmin();

    // Get service price
    const { data: service } = await supabaseAdmin
      .from("services")
      .select("starts_at_cents, name")
      .eq("id", data.service_id)
      .single();
    if (!service) throw new Error("Service not found");

    // Check if carpenter has custom price
    const { data: carpService } = await supabaseAdmin
      .from("carpenter_services")
      .select("custom_price_cents")
      .eq("vendor_id", data.vendor_id)
      .eq("service_id", data.service_id)
      .maybeSingle();

    const totalCents = carpService?.custom_price_cents ?? service.starts_at_cents;

    // Generate booking number
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    const bookingNumber = `CB-${dateStr}-${rand}`;

    const { data: booking, error } = await supabaseAdmin
      .from("service_bookings")
      .insert({
        booking_number: bookingNumber,
        customer_id: context.userId,
        vendor_id: data.vendor_id,
        service_id: data.service_id,
        status: "pending",
        scheduled_date: data.scheduled_date,
        scheduled_slot: data.scheduled_slot,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        address: data.address,
        total_cents: totalCents,
        notes: data.notes || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { booking, serviceName: service.name };
  });

// ─── Auth: List customer's bookings ───
export const listMyBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabaseAdmin = await getAdmin();
    const { data, error } = await supabaseAdmin
      .from("service_bookings")
      .select("*, services(name, category), vendor_profiles(business_name, owner_name, phone_number, city)")
      .eq("customer_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ─── Auth: List vendor's service bookings ───
export const listVendorServiceBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabaseAdmin = await getAdmin();
    const { data, error } = await supabaseAdmin
      .from("service_bookings")
      .select("*, services(name, category)")
      .eq("vendor_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ─── Auth: Update booking status (vendor/admin) ───
export const updateBookingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { bookingId: string; status: string }) =>
    z.object({ bookingId: z.string().uuid(), status: z.string() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await getAdmin();

    // Check if user is admin
    const { data: adminRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    const isAdmin = !!adminRole;

    let query = supabaseAdmin
      .from("service_bookings")
      .update({ status: data.status })
      .eq("id", data.bookingId);

    if (!isAdmin) {
      query = query.eq("vendor_id", context.userId);
    }

    const { error } = await query;
    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─── Auth: Submit a service review ───
export const submitServiceReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { bookingId: string; rating: number; reviewText?: string }) =>
    z.object({
      bookingId: z.string().uuid(),
      rating: z.number().int().min(1).max(5),
      reviewText: z.string().max(1000).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await getAdmin();

    // Verify the booking belongs to the customer and is completed
    const { data: booking } = await supabaseAdmin
      .from("service_bookings")
      .select("vendor_id, status")
      .eq("id", data.bookingId)
      .eq("customer_id", context.userId)
      .single();

    if (!booking) throw new Error("Booking not found");
    if (booking.status !== "completed") throw new Error("Can only review completed bookings");

    const { error } = await supabaseAdmin.from("service_reviews").insert({
      booking_id: data.bookingId,
      customer_id: context.userId,
      vendor_id: booking.vendor_id,
      rating: data.rating,
      review_text: data.reviewText || null,
    });

    if (error) throw new Error(error.message);
    return { success: true };
  });

// ─── Admin: Get service analytics ───
export const getServiceAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabaseAdmin = await getAdmin();

    // Verify admin
    const { data: adminRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) throw new Error("Admin only");

    const { data: bookings } = await supabaseAdmin
      .from("service_bookings")
      .select("id, total_cents, status, created_at, services(category)");

    const { count: totalCarpenters } = await supabaseAdmin
      .from("vendor_profiles")
      .select("id", { count: "exact", head: true });

    const { count: approvedCarpenters } = await supabaseAdmin
      .from("vendor_profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_approved", true);

    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("total_cents, status, created_at");

    const allBookings = bookings ?? [];
    const allOrders = orders ?? [];

    // Total service revenue
    const serviceRevenue = allBookings
      .filter((b: any) => b.status === "completed")
      .reduce((sum: number, b: any) => sum + b.total_cents, 0);

    // Total product revenue
    const productRevenue = allOrders
      .reduce((sum: number, o: any) => sum + o.total_cents, 0);

    // Monthly breakdown
    const monthlyData: Record<string, { services: number; products: number; bookingCount: number; orderCount: number }> = {};
    allBookings.forEach((b: any) => {
      const month = new Date(b.created_at).toISOString().slice(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { services: 0, products: 0, bookingCount: 0, orderCount: 0 };
      if (b.status === "completed") monthlyData[month].services += b.total_cents;
      monthlyData[month].bookingCount += 1;
    });
    allOrders.forEach((o: any) => {
      const month = new Date(o.created_at).toISOString().slice(0, 7);
      if (!monthlyData[month]) monthlyData[month] = { services: 0, products: 0, bookingCount: 0, orderCount: 0 };
      monthlyData[month].products += o.total_cents;
      monthlyData[month].orderCount += 1;
    });

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    allBookings.forEach((b: any) => {
      const cat = b.services?.category ?? "Unknown";
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    });

    return {
      totalCarpenters: totalCarpenters ?? 0,
      approvedCarpenters: approvedCarpenters ?? 0,
      totalBookings: allBookings.length,
      completedBookings: allBookings.filter((b: any) => b.status === "completed").length,
      totalOrders: allOrders.length,
      serviceRevenueCents: serviceRevenue,
      productRevenueCents: productRevenue,
      totalGmvCents: serviceRevenue + productRevenue,
      targetCents: 10000000, // ₹1 Crore in paise
      monthlyData: Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, d]) => ({ month, ...d })),
      categoryBreakdown,
    };
  });
