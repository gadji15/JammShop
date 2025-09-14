import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const supabase = await createClient()
  const ip =
    (req.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() ||
    (req.headers.get("x-real-ip") || "") ||
    null
  const ua = req.headers.get("user-agent") || null

  try {
    const payload = await req.json().catch(() => ({}))
    const { name, props, user_id } = payload || {}
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Missing event name" }, { status: 400 })
    }

    const { error } = await supabase.from("analytics_events").insert({
      name,
      props: props || {},
      user_id: user_id || null,
      ip,
      ua,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Invalid payload" }, { status: 400 })
  }
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get("page") || "1"))
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") || "20")))
  const name = searchParams.get("name") || undefined
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let qb = supabase
    .from("analytics_events")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (name) {
    qb = qb.eq("name", name)
  }

  const { data, count, error } = await qb
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data,
    page,
    pageSize,
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  })
}