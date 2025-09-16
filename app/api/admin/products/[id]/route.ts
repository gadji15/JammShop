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

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const { supabase, user, profile } = await requireAdmin()
  if (!user || !profile || !["admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const id = params.id
  if (!id) return NextResponse.json({ error: "Missing product id" }, { status: 400 })

  const { error } = await supabase.from("products").delete().eq("id", id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { supabase, user, profile } = await requireAdmin()
  if (!user || !profile || !["admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const id = params.id
  if (!id) return NextResponse.json({ error: "Missing product id" }, { status: 400 })

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  // Whitelist fields
  const allowed = [
    "name",
    "short_description",
    "price",
    "compare_price",
    "stock_quantity",
    "is_active",
    "is_featured",
    "category_id",
  ]
  const update: Record<string, any> = {}
  for (const k of allowed) {
    if (k in payload) update[k] = payload[k]
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
  }

  // Optional normalization
  if ("price" in update) update.price = Number(update.price)
  if ("compare_price" in update && update.compare_price != null) update.compare_price = Number(update.compare_price)
  if ("stock_quantity" in update) update.stock_quantity = Math.max(0, Number(update.stock_quantity))

  const { data, error } = await supabase.from("products").update(update).eq("id", id).select("*").maybeSingle()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, data }, { status: 200 })
}