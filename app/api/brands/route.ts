import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 60

export async function GET(req: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)

  const q = (searchParams.get("q") || "").trim()
  const page = Math.max(1, Number(searchParams.get("page") || "1"))
  const pageSize = Math.min(60, Math.max(1, Number(searchParams.get("pageSize") || "24")))
  const sort = (searchParams.get("sort") || "name") as "name" | "newest" | "oldest"

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // brands_agg view provides supplier_id, product_count and timestamps aggregated from products
  let qb = supabase.from("brands_agg").select("*", { count: "exact" })

  // As we don't have a suppliers table in schema listing, we can't search by brand name.
  // We allow searching by supplier_id (UUID) prefix for now.
  if (q) {
    qb = qb.ilike("supplier_id::text", `%${q}%` as any)
  }

  switch (sort) {
    case "newest":
      qb = qb.order("last_created_at", { ascending: false })
      break
    case "oldest":
      qb = qb.order("first_created_at", { ascending: true })
      break
    case "name":
    default:
      // Fallback: order by supplier_id to simulate name ordering
      qb = qb.order("supplier_id", { ascending: true })
      break
  }

  const { data, count, error } = await qb.range(from, to)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Map to a uniform API shape
  const rows = (data || []).map((r: any) => ({
    id: r.supplier_id,
    name: r.supplier_id, // Without a suppliers table, we expose the UUID as label. Can be enhanced later.
    product_count: r.product_count,
    first_created_at: r.first_created_at,
    last_created_at: r.last_created_at,
  }))

  return NextResponse.json({
    data: rows,
    page,
    pageSize,
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  })
}