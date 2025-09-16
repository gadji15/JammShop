import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { detectProviderFromUrl } from "@/lib/providers"
import type { SupplierKey } from "@/lib/providers/types"

export const dynamic = "force-dynamic"
export const revalidate = 0

const BUCKET = "product-images"

type PricingRules = {
  strategy: "percent" | "fixed" | "hybrid"
  percent?: number
  fixed?: number
  minMargin?: number
  roundTo?: number
  psychological?: boolean
}

function computePrice(cost: number, rules?: PricingRules): number {
  if (!rules) return Math.max(0, Math.floor(cost))
  let margin = 0
  const pct = Math.max(0, rules.percent ?? 0) / 100
  const fix = Math.max(0, rules.fixed ?? 0)
  switch (rules.strategy) {
    case "percent":
      margin = cost * pct
      break
    case "fixed":
      margin = fix
      break
    case "hybrid":
      margin = Math.max(cost * pct, fix)
      break
  }
  if (rules.minMargin) margin = Math.max(margin, rules.minMargin)
  let price = cost + margin
  if (rules.roundTo && rules.roundTo > 0) {
    price = Math.round(price / rules.roundTo) * rules.roundTo
  }
  if (rules.psychological) {
    price = Math.max(0, Math.floor(price) - 1)
  }
  return Math.max(0, Math.floor(price))
}

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, profile: null }
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
  return { supabase, user, profile }
}

async function uploadExternalImage(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : any,
  imageUrl: string,
  providerKey: string,
): Promise<string | null> {
  try {
    if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) return null
    const res = await fetch(imageUrl)
    if (!res.ok) return null
    const contentType = res.headers.get("content-type") || "image/jpeg"
    const ab = await res.arrayBuffer()
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg"
    const filename = `${providerKey}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const bucket = supabase.storage.from(BUCKET)

    const { error: upErr } = await bucket.upload(filename, ab, {
      contentType,
      upsert: false,
    })
    if (upErr) return null

    // Try to return a public URL if bucket is public
    const { data: pub } = await bucket.getPublicUrl(filename)
    if (pub?.publicUrl) return pub.publicUrl

    // Fallback to a long-lived signed URL if bucket is not public
    const { data: signed, error: signErr } = await bucket.createSignedUrl(filename, 60 * 60 * 24 * 365 * 5) // 5 years
    if (!signErr && signed?.signedUrl) return signed.signedUrl

    return null
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const { supabase, user, profile } = await requireAdmin()
  if (!user || !profile || !["admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { url, pricingRules } = body as { url: string; pricingRules?: PricingRules }
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing url" }, { status: 400 })
    }

    const resolved = detectProviderFromUrl(url)
    if (!resolved) {
      return NextResponse.json({ error: "Unsupported provider in URL" }, { status: 400 })
    }
    const { key, adapter } = resolved
    const product = await adapter.fetchByUrl(url)
    const finalPrice = computePrice(product.price, pricingRules)

    // Ensure supplier exists based on adapter.label
    const { data: supplierData } = await supabase
      .from("suppliers")
      .select("id")
      .eq("name", adapter.label)
      .maybeSingle()
    let supplierId = supplierData?.id
    if (!supplierId) {
      const { data: newSupplier } = await supabase
        .from("suppliers")
        .insert({
          name: adapter.label,
          website: adapter.website,
          description: `Auto-created supplier for URL imports (${adapter.label})`,
          status: "active",
        })
        .select("id")
        .maybeSingle()
      supplierId = newSupplier?.id
    }

    // Get or create category
    let categoryId: string | null = null
    const { data: categoryData } = await supabase.from("categories").select("id").eq("name", product.category).maybeSingle()
    if (categoryData) {
      categoryId = categoryData.id
    } else {
      const { data: newCategory } = await supabase
        .from("categories")
        .insert({
          name: product.category,
          slug: product.category.toLowerCase().replace(/\s+/g, "-"),
        })
        .select("id")
        .maybeSingle()
      categoryId = newCategory?.id ?? null
    }

    // Upload image to storage (best effort)
    const uploadedUrl = await uploadExternalImage(supabase, product.image_url, String(key))
    const finalImage = uploadedUrl || product.image_url

    // Insert product
    const { error } = await supabase.from("products").insert({
      name: product.name,
      description: product.description,
      price: finalPrice,
      image_url: finalImage,
      category_id: categoryId,
      supplier_id: supplierId ?? undefined,
      external_id: product.external_id,
      stock_quantity: product.stock_quantity || 0,
      is_external: true,
      status: "active",
    })
    if (error) throw error

    return NextResponse.json({ ok: true, product: { ...product, price: finalPrice, image_url: finalImage, provider: key as SupplierKey } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Import failed" }, { status: 500 })
  }
}