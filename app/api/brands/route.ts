import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 60

export async function GET(req: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)

  const q = (searchParams.get("q") || "").trim()
  const type = (searchParams.get("type") || "").toLowerCase() // internal | alibaba | jumia | other
  const sort = (searchParams.get("sort") || "name") as "name" | "count"
  const page = Math.max(1, Number(searchParams.get("page") || "1"))
  const pageSize = Math.min(60, Math.max(1, Number(searchParams.get("pageSize") || "24")))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Base query with product counts via foreign table relationship
  let qb = supabase
    .from("suppliers")
    .select(
      `
      id, name, type, is_active, created_at,
      products:products(count)
    `,
      { count: "exact" },
    )
    .eq("is_active", true)

  if (q) {
    qb = qb.ilike("name", `%${q}%`)
  }
  if (type && ["internal", "alibaba", "jumia", "other"].includes(type)) {
    qb = qb.eq("type", type)
  }

  // Sorting (we will post-sort if sort=count because count is nested)
  // For name sorting we can do at SQL level.
  if (sort === "name") {
    qb = qb.order("name", { ascending: true })
  }

  const { data, count, error } = await qb.range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (data || []).map((r: any) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    created_at: r.created_at,
    product_count: Array.isArray(r.products) && r.products[0] && typeof r.products[0].count === "number" ? r.products[0].count : 0,
  }))

  // If sort by count is requested, sort in-memory (dataset already paginated).
  // If precise server-side sort by count is needed, we can add a SQL view. For now keep it simple.
  const items = sort === "count" ? rows.sort((a, b) => b.product_count - a.product_count) : rows

  return NextResponse.json({
    items,
    page,
    pageSize,
    total: count ?? items.length,
    totalPages: Math.ceil((count ?? items.length) / pageSize),
  })
}