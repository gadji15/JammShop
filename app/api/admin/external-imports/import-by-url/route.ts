import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

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

function detectProviderFromUrl(url: string) {
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()
    if (host.includes("aliexpress")) return { key: "aliexpress", label: "AliExpress", website: "https://aliexpress.com" }
    if (host.includes("alibaba")) return { key: "alibaba", label: "Alibaba", website: "https://alibaba.com" }
    if (host.includes("jumia")) return { key: "jumia", label: "Jumia", website: "https://jumia.com" }
    return { key: "other", label: "External Supplier", website: undefined }
  } catch {
    return { key: "other", label: "External Supplier", website: undefined }
  }
}

// NOTE: This is a placeholder that should be replaced with a real provider API or scraper
async function fetchProductByUrl(url: string) {
  const provider = detectProviderFromUrl(url)
  return {
    external_id: `${provider.key}_${Date.now()}`,
    name: `Produit importé (${provider.label})`,
    description:
      "Produit importé automatiquement depuis une URL fournisseur. La description détaillée sera synchronisée.",
    price: Math.floor(Math.random() * 25000) + 3000,
    image_url: `/placeholder.svg?height=420&width=420&query=${encodeURIComponent(provider.label + " product")}`,
    category: "Auto",
    supplier_name: provider.label,
    stock_quantity: Math.floor(Math.random() * 200) + 5,
  }
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

    const provider = detectProviderFromUrl(url)
    const product = await fetchProductByUrl(url)
    const finalPrice = computePrice(product.price, pricingRules)

    // Ensure supplier exists
    const { data: supplierData } = await supabase
      .from("suppliers")
      .select("id")
      .eq("name", provider.label)
      .maybeSingle()
    let supplierId = supplierData?.id
    if (!supplierId) {
      const { data: newSupplier } = await supabase
        .from("suppliers")
        .insert({
          name: provider.label,
          website: provider.website,
          description: `Auto-created supplier for URL imports (${provider.label})`,
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

    // Insert product
    const { error } = await supabase.from("products").insert({
      name: product.name,
      description: product.description,
      price: finalPrice,
      image_url: product.image_url,
      category_id: categoryId,
      supplier_id: supplierId ?? undefined,
      external_id: product.external_id,
      external_url: url,
      stock_quantity: product.stock_quantity || 0,
      is_external: true,
      status: "active",
    })
    if (error) throw error

    return NextResponse.json({ ok: true, product: { ...product, price: finalPrice } })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Import failed" }, { status: 500 })
  }
}