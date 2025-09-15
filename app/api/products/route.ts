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
  const onSale = ["1", "true", "yes"].includes((searchParams.get("onSale") || "").toLowerCase())
  const onlyNew = ["1", "true", "yes"].includes((searchParams.get("onlyNew") || "").toLowerCase())
  const newDays = Math.max(1, Number(searchParams.get("newDays") || "7"))
  const sort = searchParams.get("sort") || "newest"
  const page = Math.max(1, Number(searchParams.get("page") || "1"))
  const pageSize = Math.min(60, Math.max(1, Number(searchParams.get("pageSize") || "20")))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const base = onSale ? "products_on_sale" : "products"

  let qb = supabase
    .from(base)
    .select(
      `
      *,
      categories (*)
    `,
      { count: "exact" },
    )
    .eq(onSale ? undefined : "is_active", true as any)

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
  // Note: onSale filter will be applied after fetch (column-to-column comparison price < compare_price)

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

  // Execute base query
  const { data, count, error } = await qb.range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Post-filtering: onSale via column-to-column, and onlyNew by date window
  let filtered = data || []
  if (onSale) {
    filtered = filtered.filter((p: any) => typeof p.compare_price === "number" && typeof p.price === "number" && p.compare_price > p.price)
  }
  if (onlyNew) {
    const now = Date.now()
    const windowMs = newDays * 24 * 60 * 60 * 1000
    filtered = filtered.filter((p: any) => p.created_at && Number.isFinite(Date.parse(p.created_at)) && (now - Date.parse(p.created_at) <= windowMs))
  }

  return NextResponse.json({
    data: filtered,
    page,
    pageSize,
    total: (onSale || onlyNew) ? filtered.length : count ?? 0,
    totalPages: Math.ceil(((onSale || onlyNew) ? filtered.length : count ?? 0) / pageSize),
  })
}