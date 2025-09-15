import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 60

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const supabase = await createClient()
  const key = params.slug

  // Resolve brand from attributes view
  const { data, error } = await supabase.from("brands_attr").select("name, slug").eq("slug", key).maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 })
  }

  return NextResponse.json({ brand: data })
}