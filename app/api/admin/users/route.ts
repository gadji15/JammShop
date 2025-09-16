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

// GET /api/admin/users?page=&pageSize=&q=&role=&sort=&order=
export async function GET(req: Request) {
  const { supabase, user, profile } = await requireAdmin()
  if (!user || !profile || !["admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(req.url)
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") || "20", 10)))
  const q = (url.searchParams.get("q") || "").trim()
  const role = url.searchParams.get("role") || ""
  const sort = url.searchParams.get("sort") || "created_at"
  const order = (url.searchParams.get("order") || "desc").toLowerCase() === "asc" ? "asc" : "desc"

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
  }
  if (role && role !== "all") {
    query = query.eq("role", role)
  }

  const sortable = new Set(["created_at", "full_name", "email", "role"])
  const sortKey = sortable.has(sort) ? sort : "created_at"
  query = query.order(sortKey, { ascending: order === "asc" })

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, error, count } = await query.range(from, to)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data: data || [],
    page,
    pageSize,
    total: count || 0,
    totalPages: count ? Math.ceil(count / pageSize) : 1,
  })
}