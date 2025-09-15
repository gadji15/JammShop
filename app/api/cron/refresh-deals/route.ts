import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export const runtime = "edge"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const provided = url.searchParams.get("secret") || ""
  const expected = process.env.CRON_SECRET || ""

  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServerClient()

  // Call the refresh function; it returns void
  const { error } = await supabase.rpc("refresh_product_deals_agg")

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, refreshed: true })
}