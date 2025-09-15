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

  // brands_full exposes name/slug/logo with counts (joined brands + brands_agg)
  let qb = supabase.from("brands_full").select("*", { count: "exact" })

  if (q) {
    qb = qb.ilike("name", `%${q}%`)
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
      qb = qb.order("name", { ascending: true })
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