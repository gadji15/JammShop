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

export async function GET(req: Request) {
  const url = new URL(req.url)
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") || "20", 10)))
  const q = url.searchParams.get("q") || ""
  const sort = url.searchParams.get("sort") || "created_at"
  const order = (url.searchParams.get("order") || "desc").toLowerCase() === "asc" ? "asc" : "desc"
  const isActive = url.searchParams.get("active")
  const isFeatured = url.searchParams.get("featured")
  const stock = url.searchParams.get("stock") // low|out|any

  const { supabase, user, profile } = await requireAdmin()
  if (!user || !profile || !["admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let query = supabase
    .from("products")
    .select(
      `
      *,
      categories (*)
    `,
      { count: "exact" },
    )

  if (q) {
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`)
  }
  if (isActive === "1" || isActive === "true") {
    query = query.eq("is_active", true)
  }
  if (isActive === "0" || isActive === "false") {
    query = query.eq("is_active", false)
  }
  if (isFeatured === "1" || isFeatured === "true") {
    query = query.eq("is_featured", true)
  }
  if (stock === "low") {
    query = query.lte("stock_quantity", "low_stock_threshold")
  } else if (stock === "out") {
    query = query.eq("stock_quantity", 0)
  }

  // Sorting
  const sortable = new Set(["created_at", "name", "price", "stock_quantity"])
  const sortKey = sortable.has(sort) ? sort : "created_at"
  query = query.order(sortKey, { ascending: order === "asc" })

  // Pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, error, count } = await query.range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data: data || [],
    page,
    pageSize,
    total: count || 0,
    totalPages: count ? Math.ceil(count / pageSize) : 1,
  })
}