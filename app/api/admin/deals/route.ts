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

// GET /api/admin/deals?q=&minDiscount=&page=&pageSize=&sort=created_at|price|name|discount&order=asc|desc
export async function GET(req: Request) {
  const { supabase, user, profile } = await requireAdmin()
  if (!user || !profile || !["admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(req.url)
  const q = (url.searchParams.get("q") || "").trim()
  const minDiscount = Math.max(0, parseInt(url.searchParams.get("minDiscount") || "0", 10))
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") || "100", 10)))
  const sort = (url.searchParams.get("sort") || "created_at").toLowerCase()
  const orderAsc = (url.searchParams.get("order") || "desc").toLowerCase() === "asc"

  // Prefer view products_on_sale if present, otherwise fallback to products with basic filters
  // Note: PostgREST cannot compare two columns directly (compare_price > price),
  // so the base-table fallback will be less accurate.
  let data: any[] = []
  let count = 0
  let errorMsg: string | null = null

  // Try the view first
  try {
    let vq = supabase
      .from("products_on_sale" as any)
      .select(`*, categories(*)`, { count: "exact" })
      .eq("is_active", true)

    if (q) {
      vq = vq.or(`name.ilike.%${q}%,slug.ilike.%${q}%,categories.name.ilike.%${q}%`)
    }

    // Sorting (on base fields available in the view)
    if (["created_at", "price", "name"].includes(sort)) {
      vq = vq.order(sort as any, { ascending: orderAsc })
    } else {
      vq = vq.order("created_at", { ascending: false })
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    const { data: rows, error, count: cnt } = await vq.range(from, to)
    if (error) throw error
    data = rows || []
    count = cnt || 0
  } catch (e: any) {
    errorMsg = e?.message || "view products_on_sale not available, trying fallback"
  }

  // Fallback: fetch active products and compute discount client-side (inaccurate if many rows)
  if (!data || data.length === 0) {
    try {
      let pq = supabase.from("products").select(`*, categories(*)`, { count: "exact" }).eq("is_active", true)
      if (q) {
        pq = pq.or(`name.ilike.%${q}%,slug.ilike.%${q}%,categories.name.ilike.%${q}%`)
      }
      if (["created_at", "price", "name"].includes(sort)) {
        pq = pq.order(sort as any, { ascending: orderAsc })
      } else {
        pq = pq.order("created_at", { ascending: false })
      }
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      const { data: rows, error, count: cnt } = await pq.range(from, to)
      if (error) throw error
      data = rows || []
      count = cnt || 0
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || errorMsg || "Failed to load deals" }, { status: 500 })
    }
  }

  // Compute discount and filter by minDiscount in memory for the current page
  const enriched = (data || []).map((p: any) => {
    const price = Number(p.price || 0)
    const compare = p.compare_price != null ? Number(p.compare_price) : null
    const discount =
      compare != null && compare > 0 && price < compare ? Math.round(((compare - price) / compare) * 100) : 0
    return { ...p, discount }
  })

  let filtered = enriched
  if (minDiscount > 0) {
    filtered = enriched.filter((r) => r.discount >= minDiscount)
  }

  // Optional: sort by discount for the current page only
  if (sort === "discount") {
    filtered.sort((a, b) => (orderAsc ? a.discount - b.discount : b.discount - a.discount))
  }

  return NextResponse.json({
    data: filtered,
    page,
    pageSize,
    total: count,
    totalPages: count ? Math.ceil(count / pageSize) : 1,
    note: errorMsg || undefined,
  })
}