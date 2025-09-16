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

type ExternalProduct = {
  external_id: string
  name: string
  description: string
  price: number
  image_url: string
  category: string
  supplier_name: string
  stock_quantity?: number
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

export async function POST(req: Request) {
  const { supabase, user, profile } = await requireAdmin()
  if (!user || !profile || !["admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      supplierLabel,
      products,
      pricingRules,
    }: { supplierLabel: string; products: ExternalProduct[]; pricingRules?: PricingRules } = body

    if (!Array.isArray(products) || !supplierLabel) {
      return NextResponse.json({ error: "Missing payload" }, { status: 400 })
    }

    // Create job
    const { data: job, error: jobErr } = await supabase
      .from("import_jobs")
      .insert({
        user_id: user.id,
        supplier: supplierLabel,
        status: "running",
        pricing_rules: pricingRules ? pricingRules : null,
      })
      .select("*")
      .single()
    if (jobErr) throw jobErr

    // ensure supplier exists
    const { data: supplierData } = await supabase.from("suppliers").select("id").eq("name", supplierLabel).maybeSingle()
    let supplierId = supplierData?.id
    if (!supplierId) {
      const { data: newSupplier } = await supabase
        .from("suppliers")
        .insert({
          name: supplierLabel,
          status: "active",
        })
        .select("id")
        .maybeSingle()
      supplierId = newSupplier?.id
    }

    let success = 0
    let failed = 0

    for (const p of products) {
      try {
        // Record item as pending
        const { data: item } = await supabase
          .from("import_job_items")
          .insert({
            job_id: job.id,
            external_id: p.external_id,
            name: p.name,
            status: "pending",
            raw: p,
          })
          .select("*")
          .maybeSingle()

        // Skip if product already exists
        const { data: existing } = await supabase
          .from("products")
          .select("id")
          .eq("external_id", p.external_id)
          .maybeSingle()
        if (existing) {
          failed++
          await supabase
            .from("import_job_items")
            .update({ status: "failed", error: "Already exists" })
            .eq("id", item?.id || 0)
          continue
        }

        // category
        let categoryId: string | null = null
        const { data: categoryData } = await supabase
          .from("categories")
          .select("id")
          .eq("name", p.category)
          .maybeSingle()
        if (categoryData) categoryId = categoryData.id
        else {
          const { data: newCat } = await supabase
            .from("categories")
            .insert({
              name: p.category,
              slug: p.category.toLowerCase().replace(/\s+/g, "-"),
            })
            .select("id")
            .maybeSingle()
          categoryId = newCat?.id ?? null
        }

        const finalPrice = computePrice(p.price, pricingRules)

        const { data: newProduct, error: insErr } = await supabase
          .from("products")
          .insert({
            name: p.name,
            description: p.description,
            price: finalPrice,
            image_url: p.image_url,
            category_id: categoryId,
            supplier_id: supplierId ?? undefined,
            external_id: p.external_id,
            stock_quantity: p.stock_quantity || 0,
            is_external: true,
            status: "active",
          })
          .select("id")
          .maybeSingle()
        if (insErr) throw insErr

        success++
        await supabase
          .from("import_job_items")
          .update({ status: "success", product_id: newProduct?.id })
          .eq("id", item?.id || 0)
      } catch (e: any) {
        failed++
        await supabase
          .from("import_job_items")
          .update({ status: "failed", error: e?.message || "Failed" })
          .eq("job_id", job.id)
          .eq("external_id", p.external_id)
      }
    }

    await supabase
      .from("import_jobs")
      .update({
        status: failed > 0 && success > 0 ? "partial" : failed > 0 ? "failed" : "success",
        success_count: success,
        failed_count: failed,
        finished_at: new Date().toISOString(),
      })
      .eq("id", job.id)

    return NextResponse.json({ ok: true, job_id: job.id, success, failed })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Batch import failed" }, { status: 500 })
  }
}