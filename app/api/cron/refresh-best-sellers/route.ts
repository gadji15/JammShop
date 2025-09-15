import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// Protect with a secret header if exposed publicly via cron
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const provided = new URL(req.url).searchParams.get("secret")
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc("refresh_product_sales_agg")
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}