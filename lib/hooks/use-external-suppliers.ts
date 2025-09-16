"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { getAdapterByKey } from "@/lib/providers"
import type { SupplierKey } from "@/lib/providers/types"

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

type PricingRules = {
  strategy: "percent" | "fixed" | "hybrid"
  percent?: number // e.g. 25 => +25%
  fixed?: number // e.g. 1000 FCFA
  minMargin?: number // ensure minimum margin amount
  roundTo?: number // round to nearest (e.g. 50 => multiples of 50)
  psychological?: boolean // 0.99 style
}

export function useExternalSuppliers() {
  const [importing, setImporting] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const supabase = createClient()

  // Provider-backed searches (adapters, placeholder for now)
  const fetchAlibabaProducts = async (query: string, limit = 50): Promise<ExternalProduct[]> => {
    const adapter = getAdapterByKey("alibaba")
    return adapter.search(query, limit)
  }

  const fetchJumiaProducts = async (query: string, limit = 50): Promise<ExternalProduct[]> => {
    const adapter = getAdapterByKey("jumia")
    return adapter.search(query, limit)
  }

  // Import single product by URL with pricing rules (server API)
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

  // Batch import via server API (jobs + items)
  const importBatch = async (
    supplierLabel: string,
    products: ExternalProduct[],
    pricingRules?: PricingRules,
  ): Promise<ImportResult> => {
    setImporting(true)
    const result: ImportResult = { success: 0, failed: 0, errors: [] }
    try {
      const res = await fetch("/api/admin/external-imports/import-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierLabel, products, pricingRules }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(j?.error || "Batch import failed")
      }
      result.success = j?.success || 0
      result.failed = j?.failed || 0
      toast.success(`Import terminé: ${result.success} ok, ${result.failed} échecs`)
    } catch (e) {
      result.failed = (products?.length || 0)
      result.errors.push(e instanceof Error ? e.message : "Unknown error")
      toast.error("Échec de l'import par lot")
    } finally {
      setImporting(false)
    }
    return result
  }

  // Sync prices and stock from external suppliers (placeholder)
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

  // Helper: provider detection by URL for UI (optional)
  const detectProviderFromUrl = (url: string): SupplierKey | "other" => {
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

  return {
    importing,
    syncing,
    fetchAlibabaProducts,
    fetchJumiaProducts,
    importByUrl,
    importBatch,
    detectProviderFromUrl,
    syncExternalProducts,
  }
}
