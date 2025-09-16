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

/**
 * POST /api/admin/products/bulk
 * body: {
 *   ids: string[],
 *   action: "setActive" | "setInactive" | "setFeatured" | "unsetFeatured" | "applyDiscountPercent" | "resetPromotions" | "delete",
 *   percent?: number
 * }
 */
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

  const ids: string[] = Array.isArray(payload?.ids) ? payload.ids : []
  const action: string = String(payload?.action || "")
  const percentRaw = payload?.percent

  if (ids.length === 0) {
    return NextResponse.json({ error: "No ids provided" }, { status: 400 })
  }

  switch (action) {
    case "setActive": {
      const { error } = await supabase.from("products").update({ is_active: true }).in("id", ids)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      break
    }
    case "setInactive": {
      const { error } = await supabase.from("products").update({ is_active: false }).in("id", ids)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      break
    }
    case "setFeatured": {
      const { error } = await supabase.from("products").update({ is_featured: true }).in("id", ids)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      break
    }
    case "unsetFeatured": {
      const { error } = await supabase.from("products").update({ is_featured: false }).in("id", ids)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      break
    }
    case "applyDiscountPercent": {
      const percent = Number(percentRaw)
      if (!Number.isFinite(percent) || percent <= 0 || percent >= 100) {
        return NextResponse.json({ error: "Invalid percent" }, { status: 400 })
      }
      // Fetch current prices
      const { data: rows, error: e1 } = await supabase.from("products").select("id, price, compare_price").in("id", ids)
      if (e1) return NextResponse.json({ error: e1.message }, { status: 500 })
      const updates = rows?.map((r) => {
        const currentPrice = Number(r.price) || 0
        const base = Number(r.compare_price) || currentPrice
        const newCompare = base > 0 ? base : currentPrice
        const newPrice = Math.max(0, Math.round(newCompare * (1 - percent / 100)))
        return { id: r.id, price: newPrice, compare_price: newCompare }
      }) || []
      // Apply one-by-one (Supabase doesn't support update from values list easily)
      for (const u of updates) {
        const { error: uerr } = await supabase.from("products").update({ price: u.price, compare_price: u.compare_price }).eq("id", u.id)
        if (uerr) return NextResponse.json({ error: uerr.message }, { status: 500 })
      }
      break
    }
    case "resetPromotions": {
      // Restore price from compare_price if present, and clear compare_price
      const { data: rows, error: e1 } = await supabase.from("products").select("id, price, compare_price").in("id", ids)
      if (e1) return NextResponse.json({ error: e1.message }, { status: 500 })
      for (const r of rows || []) {
        const compare = Number(r.compare_price)
        if (Number.isFinite(compare) && compare > 0) {
          const { error: uerr } = await supabase
            .from("products")
            .update({ price: compare, compare_price: null })
            .eq("id", r.id)
          if (uerr) return NextResponse.json({ error: uerr.message }, { status: 500 })
        } else {
          const { error: uerr } = await supabase.from("products").update({ compare_price: null }).eq("id", r.id)
          if (uerr) return NextResponse.json({ error: uerr.message }, { status: 500 })
        }
      }
      break
    }
    case "delete": {
      const { error } = await supabase.from("products").delete().in("id", ids)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      break
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}