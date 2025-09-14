import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") || "").trim()
  const limit = Number(searchParams.get("limit") || "6")

  if (!q) {
    return NextResponse.json({ products: [], categories: [] })
  }

  const supabase = await createClient()

  // Search categories
  const { data: categories, error: catErr } = await supabase
    .from("categories")
    .select("*")
    .ilike("name", `%${q}%`)
    .eq("is_active", true)
    .limit(limit)

  // Search products: name, short_description
  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select(
      `
      *,
      categories (*)
    `,
    )
    .eq("is_active", true)
    .or(`name.ilike.%${q}%,short_description.ilike.%${q}%`)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (catErr || prodErr) {
    return NextResponse.json({ error: catErr?.message || prodErr?.message }, { status: 500 })
  }

  return NextResponse.json({
    categories: categories || [],
    products: products || [],
  })
}