"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface ExternalProduct {
  external_id: string
  name: string
  description: string
  price: number
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

export function useExternalSuppliers() {
  const [importing, setImporting] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const supabase = createClient()

  // Simulate Alibaba API integration
  const fetchAlibabaProducts = async (query: string, limit = 50): Promise<ExternalProduct[]> => {
    // In a real implementation, this would call Alibaba's API
    // For demo purposes, we'll return mock data
    await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate API delay

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

  // Import products from external supplier
  const importProducts = async (
    supplier: "alibaba" | "jumia",
    query: string,
    selectedProducts: ExternalProduct[],
  ): Promise<ImportResult> => {
    setImporting(true)
    const result: ImportResult = { success: 0, failed: 0, errors: [] }

    try {
      // First, ensure supplier exists
      const { data: supplierData, error: supplierError } = await supabase
        .from("suppliers")
        .select("id")
        .eq("name", supplier === "alibaba" ? "Alibaba" : "Jumia")
        .single()

      let supplierId = supplierData?.id

      if (!supplierId) {
        // Create supplier if it doesn't exist
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

      // Import each selected product
      for (const product of selectedProducts) {
        try {
          // Check if product already exists
          const { data: existingProduct } = await supabase
            .from("products")
            .select("id")
            .eq("external_id", product.external_id)
            .single()

          if (existingProduct) {
            result.errors.push(`Product ${product.name} already exists`)
            result.failed++
            continue
          }

          // Get or create category
          let categoryId = null
          const { data: categoryData } = await supabase
            .from("categories")
            .select("id")
            .eq("name", product.category)
            .single()

          if (categoryData) {
            categoryId = categoryData.id
          } else {
            const { data: newCategory, error: categoryError } = await supabase
              .from("categories")
              .insert({
                name: product.category,
                slug: product.category.toLowerCase().replace(/\s+/g, "-"),
                description: `Category for ${product.category} products`,
              })
              .select("id")
              .single()

            if (!categoryError) {
              categoryId = newCategory.id
            }
          }

          // Insert product
          const { error: productError } = await supabase.from("products").insert({
            name: product.name,
            description: product.description,
            price: product.price,
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

  // Sync prices and stock from external suppliers
  const syncExternalProducts = async (): Promise<void> => {
    setSyncing(true)

    try {
      // Get all external products
      const { data: externalProducts, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_external", true)
        .not("external_id", "is", null)

      if (error) throw error

      let updated = 0

      for (const product of externalProducts || []) {
        try {
          // Simulate fetching updated data from external API
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
    syncExternalProducts,
  }
}
