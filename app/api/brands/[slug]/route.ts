import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 60

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const supabase = await createClient()
  const key = params.slug

  // Try slug first
  let { data, error } = await supabase.from("brands_full").select("*").eq("slug", key).limit(1).maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If not found, try by id (uuid)
  if (!data) {
    const { data: byId, error: err2 } = await supabase.from("brands_full").select("*").eq("id", key).limit(1).maybeSingle()
    if (err2) {
      return NextResponse.json({ error: err2.message }, { status: 500 })
    }
    if (!byId) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 })
    }
    data = byId
  }

  return NextResponse.json({ brand: data })
}