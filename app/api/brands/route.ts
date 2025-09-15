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
  const sort = (searchParams.get("sort") || "name") as "name" | "newest" | "oldest" | "count"
  const letter = (searchParams.get("letter") || "").toLowerCase()
  const minCount = Number(searchParams.get("minCount") || "0")

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Query brands derived from attributes
  let qb = supabase.from("brands_attr").select("*", { count: "exact" })

  if (q) {
    qb = qb.ilike("name", `%${q}%`)
  }
  if (letter && /^[a-z0-9]$/.test(letter)) {
    if (/[a-z]/.test(letter)) {
      qb = qb.ilike("slug", `${letter}%`)
    } else {
      // digit bucket: brands starting with digit
      qb = qb.or("slug.ilike.0%,slug.ilike.1%,slug.ilike.2%,slug.ilike.3%,slug.ilike.4%,slug.ilike.5%,slug.ilike.6%,slug.ilike.7%,slug.ilike.8%,slug.ilike.9%")
    }
  }
  if (minCount > 0) {
    qb = qb.gte("product_count", minCount)
  }

  switch (sort) {
    case "newest":
      qb = qb.order("last_created_at", { ascending: false })
      break
    case "oldest":
      qb = qb.order("first_created_at", { ascending: true })
      break
    case "count":
      qb = qb.order("product_count", { ascending: false })
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
})
}