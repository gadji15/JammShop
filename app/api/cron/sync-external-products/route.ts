import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  const supabase = await createClient()

  // Update all external products with mock adjustments (placeholder until real provider sync is wired)
  const { data: externalProducts, error } = await supabase
    .from("products")
    .select("id, price, stock_quantity, name")
    .eq("is_external", true)
    .not("external_id", "is", null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let updated = 0
  for (const p of externalProducts || []) {
    try {
      const updatedPrice = Math.max(500, (p.price as number) + Math.floor((Math.random() - 0.5) * 2000))
      const updatedStock = Math.max(0, (p.stock_quantity as number) + Math.floor((Math.random() - 0.5) * 30))

      const { error: uErr } = await supabase
        .from("products")
        .update({
          price: updatedPrice,
          stock_quantity: updatedStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", p.id)

      if (!uErr) updated++
    } catch {
      // continue
    }
  }

  return NextResponse.json({ ok: true, updated })
}