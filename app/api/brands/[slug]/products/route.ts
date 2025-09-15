import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 60

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)

  const page = Math.max(1, Number(searchParams.get("page") || "1"))
  const pageSize = Math.min(60, Math.max(1, Number(searchParams.get("pageSize") || "24")))
  const sort = (searchParams.get("sort") || "newest") as "newest" | "price-asc" | "price-desc" | "name"
  const inStock = ["1", "true", "yes"].includes((searchParams.get("inStock") || "").toLowerCase())
  const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined

  // Resolve brand by slug or id
  const key = params.slug
  let { data: brand, error: bErr } = await supabase.from("brands_full").select("id, name, slug").eq("slug", key).maybeSingle()
  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 })
  if (!brand) {
    const { data: byId, error: e2 } = await supabase.from("brands_full").select("id, name, slug").eq("id", key).maybeSingle()
    if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })
    if (!byId) return NextResponse.json({ error: "Brand not found" }, { status: 404 })
    brand = byId
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let qb = supabase
    .from("products")
    .select(`
      *,
      categories (*)
    `, { count: "exact" })
    .eq("is_active", true)
    .eq("supplier_id", brand.id)

  if (inStock) qb = qb.gt("stock_quantity", 0)
  if (typeof minPrice === "number") qb = qb.gte("price", minPrice)
  if (typeof maxPrice === "number") qb = qb.lte("price", maxPrice)

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
    case "newest":
    default:
      qb = qb.order("created_at", { ascending: false })
      break
  }

  const { data, error, count } = await qb.range(from, to)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    brand,
    items: data || [],
    page,
    pageSize,
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  })
}