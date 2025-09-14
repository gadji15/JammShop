import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 60

export async function GET(req: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)

  const q = (searchParams.get("q") || "").trim()
  const categoriesCsv = (searchParams.get("categories") || "").trim()
  const minPrice = Number(searchParams.get("minPrice") || "0")
  const maxPrice = Number(searchParams.get("maxPrice") || "0")
  const inStock = ["1", "true", "yes"].includes((searchParams.get("inStock") || "").toLowerCase())
  const featured = ["1", "true", "yes"].includes((searchParams.get("featured") || "").toLowerCase())
  const sort = searchParams.get("sort") || "newest"
  const page = Math.max(1, Number(searchParams.get("page") || "1"))
  const pageSize = Math.min(60, Math.max(1, Number(searchParams.get("pageSize") || "20")))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let qb = supabase
    .from("products")
    .select(
      `
      *,
      categories (*)
    `,
      { count: "exact" },
    )
    .eq("is_active", true)

  if (q) {
    qb = qb.or(`name.ilike.%${q}%,short_description.ilike.%${q}%`)
  }

  if (categoriesCsv) {
    const arr = categoriesCsv.split(",").map((s) => s.trim()).filter(Boolean)
    if (arr.length > 0) {
      qb = qb.in("category_id", arr)
    }
  }

  if (minPrice > 0) qb = qb.gte("price", minPrice)
  if (maxPrice > 0) qb = qb.lte("price", maxPrice)
  if (inStock) qb = qb.gt("stock_quantity", 0)
  if (featured) qb = qb.eq("is_featured", true)

  // Sorting
  switch (sort) {
    case "price-asc":
      qb = qb.order("price", { ascending: true })
      break
    case "price-desc":
      qb = qb.order("price", { ascending: false })
      break
    case "name":
      qb = qb.order("name", { ascending: true })
      break
    case "oldest":
      qb = qb.order("created_at", { ascending: true })
      break
    case "newest":
    default:
      qb = qb.order("created_at", { ascending: false })
      break
  }

  const { data, count, error } = await qb.range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data: data || [],
    page,
    pageSize,
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  })
}