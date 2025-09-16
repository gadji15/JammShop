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

// GET /api/admin/categories?q=&page=&pageSize=
export async function GET(req: Request) {
  const { supabase, user, profile } = await requireAdmin()
  if (!user || !profile || !["admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(req.url)
  const q = url.searchParams.get("q") || ""
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") || "20", 10)))

  let query = supabase.from("categories").select("*, products(count)", { count: "exact" }).order("created_at", {
    ascending: false,
  })

  if (q) {
    query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, error, count } = await query.range(from, to)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const mapped =
    (data || []).map((c: any) => ({
      ...c,
      product_count: c.products?.[0]?.count || 0,
    })) || []

  return NextResponse.json({
    data: mapped,
    page,
    pageSize,
    total: count || 0,
    totalPages: count ? Math.ceil((count as number) / pageSize) : 1,
  })
}

// POST /api/admin/categories
export async function POST(req: Request) {
  const { supabase, user, profile } = await requireAdmin()
  if (!user || !profile || !["admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const name = String(payload?.name || "").trim()
  const description = String(payload?.description || "").trim()
  const image_url = payload?.image_url ? String(payload.image_url).trim() : null
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 })
  const slug =
    String(payload?.slug || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || name.toLowerCase().replace(/[^a-z0-9]+/g, "-")

  const { data, error } = await supabase
    .from("categories")
    .insert({ name, slug, description, image_url })
    .select("*")
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, data }, { status: 201 })
}