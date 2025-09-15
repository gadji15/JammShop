import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 60

export async function GET(req: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)

  const minDiscount = Math.max(0, Number(searchParams.get("minDiscount") || "0"))
  const page = Math.max(1, Number(searchParams.get("page") || "1"))
  const pageSize = Math.min(60, Math.max(1, Number(searchParams.get("pageSize") || "24")))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Step 1: fetch product ids from the MV ordered by highest discount
  let mv = supabase
    .from("product_deals_agg")
    .select("product_id,effective_discount_pct", { count: "exact" })
    .gte("effective_discount_pct", minDiscount)
    .order("effective_discount_pct", { ascending: false })

  const { data: mvData, count: mvCount, error: mvError } = await mv.range(from, to)

  if (mvError) {
    return NextResponse.json({ error: mvError.message }, { status: 500 })
  }

  const ids = (mvData || []).map((r) => r.product_id)
  if (ids.length === 0) {
    return NextResponse.json({
      items: [],
      page,
      pageSize,
      total: mvCount || 0,
      totalPages: mvCount ? Math.ceil(mvCount / pageSize) : 1,
    })
  }

  // Step 2: fetch products data for those ids
  const { data: products, error: pErr } = await supabase
    .from("products")
    .select(
      `
      *,
      categories (*)
    `,
    )
    .in("id", ids)

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500 })
  }

  // Preserve order from MV
  const orderMap = new Map(ids.map((id, idx) => [id, idx]))
  const sorted = (products || []).slice().sort((a: any, b: any) => {
    const ia = orderMap.get(a.id) ?? 0
    const ib = orderMap.get(b.id) ?? 0
    return ia - ib
  })

  return NextResponse.json({
    items: sorted,
    page,
    pageSize,
    total: mvCount || 0,
    totalPages: mvCount ? Math.ceil(mvCount / pageSize) : 1,
  })
}