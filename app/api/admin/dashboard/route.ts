import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, profile: null }
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
  return { supabase, user, profile }
}

export async function GET() {
  const { supabase, user, profile } = await requireAdmin()
  if (!user || !profile || !["admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // counts
  const { count: totalProducts } = await supabase.from("products").select("*", { count: "exact", head: true })
  const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true })

  // orders basic data
  const { data: orders, count: totalOrders } = await supabase
    .from("orders")
    .select("id, total_amount, status, created_at", { count: "exact" })

  const totalRevenue =
    orders?.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) ?? 0

  // Monthly revenue last 6 months
  const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"]
  const buckets = new Array(12).fill(0)
  orders?.forEach((o) => {
    const d = new Date(o.created_at as any)
    const m = d.getMonth()
    buckets[m] += Number(o.total_amount) || 0
  })
  const currentMonth = new Date().getMonth()
  const last6 = [...Array(6)].map((_, i) => (currentMonth - (5 - i) + 12) % 12)
  const monthlyRevenue = last6.map((m) => ({ month: months[m], revenue: buckets[m] }))

  const ordersByStatus = [
    { name: "En attente", value: orders?.filter((o) => o.status === "pending").length || 0 },
    { name: "Confirmé", value: orders?.filter((o) => o.status === "confirmed").length || 0 },
    { name: "Expédié", value: orders?.filter((o) => o.status === "shipped").length || 0 },
    { name: "Livré", value: orders?.filter((o) => o.status === "delivered").length || 0 },
    { name: "Annulé", value: orders?.filter((o) => o.status === "cancelled").length || 0 },
  ]

  // recent orders with profile
  const { data: recentOrders } = await supabase
    .from("orders")
    .select(`*, profiles:profiles!orders_user_id_fkey (full_name, email)`)
    .order("created_at", { ascending: false })
    .limit(5)

  // low stock products
  const { data: lowStockProducts } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("stock_quantity", { ascending: true })
    .lte("stock_quantity", 10)
    .limit(5)

  const payload = {
    totalProducts: totalProducts || 0,
    totalOrders: totalOrders || 0,
    totalUsers: totalUsers || 0,
    totalRevenue,
    recentOrders: recentOrders || [],
    lowStockProducts: lowStockProducts || [],
    monthlyRevenue,
    ordersByStatus,
    topCategories: [],
    growthMetrics: {
      revenueGrowth: 0,
      ordersGrowth: 0,
      usersGrowth: 0,
    },
  }

  return NextResponse.json({ data: payload })
}