"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface ExternalProduct {
  external_id: string
  name: string
  description: string
  price: number // supplier/base cost
  image_url: string
  category: string
  supplier_name: string
  stock_quantity?: number
}

interface ImportResult {
  success: number
  failed: number
  errors: string[]
}

type SupplierKey = "alibaba" | "jumia" | "aliexpress" | "other"

type PricingRules = {
  strategy: "percent" | "fixed" | "hybrid"
  percent?: number // e.g. 25 => +25%
  fixed?: number // e.g. 1000 FCFA
  minMargin?: number // ensure minimum margin amount
  roundTo?: number // round to nearest (e.g. 50 => multiples of 50)
  psychological?: boolean // 0.99 style
}

function computePrice(cost: number, rules: PricingRules): number {
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
    // e.g., 10000 -> 9999
    price = Math.max(0, Math.floor(price) - 1)
  }
  return Math.max(0, Math.floor(price))
}

export function useExternalSuppliers() {
  const [importing, setImporting] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const supabase = createClient()

  // Simulate Alibaba API integration
  const fetchAlibabaProducts = async (query: string, limit = 50): Promise<ExternalProduct[]> => {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    return Array.from({ length: Math.min(limit, 20) }, (_, i) => ({
      external_id: `alibaba_${Date.now()}_${i}`,
      name: `${query} Product ${i + 1}`,
      description: `High quality ${query.toLowerCase()} product from verified Alibaba supplier. Wholesale pricing available.`,
      price: Math.floor(Math.random() * 50000) + 5000,
      image_url: `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(query + " product")}`,
      category: query,
      supplier_name: `Alibaba Supplier ${i + 1}`,
      stock_quantity: Math.floor(Math.random() * 1000) + 10,
    }))
  }

  // Simulate Jumia API integration
  const fetchJumiaProducts = async (query: string, limit = 50): Promise<ExternalProduct[]> => {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    return Array.from({ length: Math.min(limit, 15) }, (_, i) => ({
      external_id: `jumia_${Date.now()}_${i}`,
      name: `${query} Item ${i + 1}`,
      description: `Premium ${query.toLowerCase()} available on Jumia marketplace. Fast delivery across Africa.`,
      price: Math.floor(Math.random() * 30000) + 3000,
      image_url: `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(query + " jumia")}`,
      category: query,
      supplier_name: `Jumia Seller ${i + 1}`,
      stock_quantity: Math.floor(Math.random() * 500) + 5,
    }))
  }

  // Basic provider detection from URL
  const detectProviderFromUrl = (url: string): SupplierKey => {
    try {
      const u = new URL(url)
      const host = u.hostname.toLowerCase()
      if (host.includes("aliexpress")) return "aliexpress"
      if (host.includes("alibaba")) return "alibaba"
      if (host.includes("jumia")) return "jumia"
      return "other"
    } catch {
      return "other"
    }
  }

  // Mock fetch by URL (to be replaced with real API/scrape)
  const fetchProductByUrl = async (url: string): Promise<ExternalProduct> => {
    const provider = detectProviderFromUrl(url)
    await new Promise((r) => setTimeout(r, 800))
    return {
      external_id: `${provider}_${Date.now()}`,
      name: `Produit importé (${provider})`,
      description:
        "Produit importé automatiquement depuis une URL fournisseur. La description détaillée sera synchronisée.",
      price: Math.floor(Math.random() * 25000) + 3000,
      image_url: `/placeholder.svg?height=420&width=420&query=${encodeURIComponent(provider + " product")}`,
      category: "Auto",
      supplier_name: provider === "other" ? "Fournisseur externe" : provider[0].toUpperCase() + provider.slice(1),
      stock_quantity: Math.floor(Math.random() * 200) + 5,
    }
  }

  // Import products from external supplier with pricing rules
  const importProducts = async (
    supplier: "alibaba" | "jumia",
    query: string,
    selectedProducts: ExternalProduct[],
    pricingRules?: PricingRules,
  ): Promise<ImportResult> => {
    setImporting(true)
    const result: ImportResult = { success: 0, failed: 0, errors: [] }

    try {
      // Ensure supplier exists
      const { data: supplierData } = await supabase
        .from("suppliers")
        .select("id")
        .eq("name", supplier === "alibaba" ? "Alibaba" : "Jumia")
        .maybeSingle()

      let supplierId = supplierData?.id
      if (!supplierId) {
        const { data: newSupplier, error: createError } = await supabase
          .from("suppliers")
          .insert({
            name: supplier === "alibaba" ? "Alibaba" : "Jumia",
            contact_email: supplier === "alibaba" ? "contact@alibaba.com" : "contact@jumia.com",
            website: supplier === "alibaba" ? "https://alibaba.com" : "https://jumia.com",
            description: `External supplier integration with ${supplier}`,
            status: "active",
          })
          .select("id")
          .single()
        if (createError) throw createError
        supplierId = newSupplier.id
      }

      for (const product of selectedProducts) {
        try {
          const { data: existingProduct } = await supabase
            .from("products")
            .select("id")
            .eq("external_id", product.external_id)
            .maybeSingle()

          if (existingProduct) {
            result.errors.push(`Product ${product.name} already exists`)
            result.failed++
            continue
          }

          // Get or create category
          let categoryId: string | null = null
          const { data: categoryData } = await supabase
            .from("categories")
            .select("id")
            .eq("name", product.category)
            .maybeSingle()

          if (categoryData) {
            categoryId = categoryData.id
          } else {
            const { data: newCategory } = await supabase
              .from("categories")
              .insert({
                name: product.category,
                slug: product.category.toLowerCase().replace(/\s+/g, "-"),
                description: `Category for ${product.category} products`,
              })
              .select("id")
              .maybeSingle()
            if (newCategory) categoryId = newCategory.id
          }

          const finalPrice = pricingRules ? computePrice(product.price, pricingRules) : product.price

          const { error: productError } = await supabase.from("products").insert({
            name: product.name,
            description: product.description,
            price: finalPrice,
            compare_price: undefined, // could hold MSRP
            image_url: product.image_url,
            category_id: categoryId,
            supplier_id: supplierId,
            external_id: product.external_id,
            stock_quantity: product.stock_quantity || 0,
            is_external: true,
            status: "active",
          })

          if (productError) throw productError
          result.success++
        } catch (error) {
          result.errors.push(
            `Failed to import ${product.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
          )
          result.failed++
        }
      }

      toast.success(`Import completed: ${result.success} products imported, ${result.failed} failed`)
    } catch (error) {
      toast.error("Import failed: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setImporting(false)
    }

    return result
  }

  // Import single product by URL with pricing rules
  const importByUrl = async (url: string, rules?: PricingRules): Promise<ImportResult> => {
    setImporting(true)
    const result: ImportResult = { success: 0, failed: 0, errors: [] }
    try {
      const res = await fetch("/api/admin/external-imports/import-by-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, pricingRules: rules }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || "Import API failed")
      }
      result.success = 1
      toast.success("Produit importé depuis l'URL")
    } catch (e) {
      result.failed = 1
      result.errors.push(e instanceof Error ? e.message : "Unknown error")
      toast.error("Échec de l'import par URL")
    } finally {
      setImporting(false)
    }
    return result
  }

  // Sync prices and stock from external suppliers
  const syncExternalProducts = async (): Promise<void> => {
    setSyncing(true)
    try {
      const { data: externalProducts, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_external", true)
        .not("external_id", "is", null)
      if (error) throw error

      let updated = 0
      for (const product of externalProducts || []) {
        try {
          const updatedPrice = product.price + (Math.random() - 0.5) * 1000
          const updatedStock = Math.max(0, product.stock_quantity + Math.floor((Math.random() - 0.5) * 20))
          await supabase
            .from("products")
            .update({
              price: Math.max(1000, updatedPrice),
              stock_quantity: updatedStock,
              updated_at: new Date().toISOString(),
            })
            .eq("id", product.id)
          updated++
        } catch (error) {
          console.error(`Failed to sync product ${product.name}:`, error)
        }
      }
      toast.success(`Synchronized ${updated} external products`)
    } catch (error) {
      toast.error("Sync failed: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setSyncing(false)
    }
  }

  return {
    importing,
    syncing,
    fetchAlibabaProducts,
    fetchJumiaProducts,
    importProducts,
    importByUrl,
    detectProviderFromUrl,
    fetchProductByUrl,
    syncExternalProducts,
  }
}
