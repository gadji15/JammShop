import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

// Utility: parse JSON body safely
async function readJson<T = any>(req: Request): Promise<T | null> {
  try {
    const data = await req.json()
    return data as T
  } catch {
    return null
  }
}

// GET /api/cart - returns authenticated user's cart
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Guests are handled client-side via localStorage; return empty
    return NextResponse.json({ items: [], totalItems: 0, totalPrice: 0, guest: true }, { status: 200 })
  }

  const { data, error } = await supabase
    .from("shopping_cart")
    .select(
      `
      *,
      products (
        *,
        categories (*)
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const items = data || []
  const totalItems = items.reduce((acc: number, it: any) => acc + (it.quantity || 0), 0)
  const totalPrice = items.reduce((acc: number, it: any) => acc + ((it.products?.price || 0) * (it.quantity || 0)), 0)

  return NextResponse.json({ items, totalItems, totalPrice, guest: false })
}

// POST /api/cart - add/increase item; body: { productId: string, quantity?: number }
export async function POST(req: Request) {
  const supabase = await createClient()
  const payload = await readJson<{ productId?: string; quantity?: number }>(req)
  if (!payload || !payload.productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 })
  }
  const qty = Math.max(1, Number(payload.quantity || 1))

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "guest carts handled on client" }, { status: 401 })
  }

  // Check product exists and active
  const { data: prod, error: perr } = await supabase
    .from("products")
    .select("*")
    .eq("id", payload.productId)
    .eq("is_active", true)
    .maybeSingle()
  if (perr) return NextResponse.json({ error: perr.message }, { status: 500 })
  if (!prod) return NextResponse.json({ error: "Produit introuvable ou inactif" }, { status: 404 })

  // Read existing
  const { data: existing, error: e1 } = await supabase
    .from("shopping_cart")
    .select("*")
    .eq("user_id", user.id)
    .eq("product_id", payload.productId)
    .maybeSingle()
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 })

  if (existing) {
    const { error: uerr } = await supabase
      .from("shopping_cart")
      .update({ quantity: existing.quantity + qty })
      .eq("id", existing.id)
    if (uerr) return NextResponse.json({ error: uerr.message }, { status: 500 })
  } else {
    const { error: ierr } = await supabase.from("shopping_cart").insert({
      user_id: user.id,
      product_id: payload.productId,
      quantity: qty,
    })
    if (ierr) return NextResponse.json({ error: ierr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// PATCH /api/cart - update quantity; body: { productId: string, quantity: number }
export async function PATCH(req: Request) {
  const supabase = await createClient()
  const payload = await readJson<{ productId?: string; quantity?: number }>(req)
  if (!payload || !payload.productId || typeof payload.quantity !== "number") {
    return NextResponse.json({ error: "productId and quantity required" }, { status: 400 })
  }
  const qty = Math.max(0, Math.floor(payload.quantity))

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "guest carts handled on client" }, { status: 401 })
  }

  const { data: existing, error } = await supabase
    .from("shopping_cart")
    .select("*")
    .eq("user_id", user.id)
    .eq("product_id", payload.productId)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!existing) return NextResponse.json({ error: "Item introuvable" }, { status: 404 })

  if (qty <= 0) {
    const { error: derr } = await supabase.from("shopping_cart").delete().eq("id", existing.id)
    if (derr) return NextResponse.json({ error: derr.message }, { status: 500 })
  } else {
    const { error: uerr } = await supabase.from("shopping_cart").update({ quantity: qty }).eq("id", existing.id)
    if (uerr) return NextResponse.json({ error: uerr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// DELETE /api/cart - remove item; body: { productId: string }
export async function DELETE(req: Request) {
  const supabase = await createClient()
  const payload = await readJson<{ productId?: string }>(req)
  if (!payload || !payload.productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "guest carts handled on client" }, { status: 401 })
  }

  const { error } = await supabase
    .from("shopping_cart")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", payload.productId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}