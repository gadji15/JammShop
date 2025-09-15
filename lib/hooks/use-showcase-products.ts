"use client"

import { createClient } from "@/lib/supabase/client"
import type { ProductWithCategory } from "@/lib/types/database"
import { useCallback, useEffect, useState } from "react"

export type ShowcaseFilter = "featured" | "new" | "best"

export function useShowcaseProducts(initial: ShowcaseFilter = "featured") {
  const [filter, setFilter] = useState<ShowcaseFilter>(initial)
  const [products, setProducts] = useState<ProductWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(
    async (f: ShowcaseFilter = filter) => {
      try {
        setLoading(true)
        const supabase = createClient()

        if (f === "best") {
          // Use materialized view product_sales_agg if available
          const { data: sales, error: salesErr } = await supabase
            .from("product_sales_agg")
            .select("product_id, sales_count")
            .order("sales_count", { ascending: false })
            .limit(12)

          if (salesErr) throw salesErr

          const ids = (sales || []).map((s: any) => s.product_id)
          if (ids.length === 0) {
            setProducts([])
            return
          }

          // Fetch corresponding products with categories
          const { data: prods, error: prodErr } = await supabase
            .from("products")
            .select(
              `
              *,
              categories (*)
            `,
            )
            .eq("is_active", true)
            .in("id", ids)

          if (prodErr) throw prodErr

          // Order products by the sales order
          const orderMap = new Map(ids.map((id: string, idx: number) => [id, idx]))
          const ordered = ((prods || []) as ProductWithCategory[]).sort(
            (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
          )

          setProducts(ordered.slice(0, 8))
          return
        }

        // Base select with category join
        let query = supabase
          .from("products")
          .select(
            `
            *,
            categories (*)
          `,
          )
          .eq("is_active", true)

        if (f === "featured") {
          query = query.eq("is_featured", true).order("created_at", { ascending: false })
        } else if (f === "new") {
          query = query.order("created_at", { ascending: false })
        }

        const { data, error } = await query.limit(8)
        if (error) throw error
        setProducts((data as ProductWithCategory[]) || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        setProducts([])
      } finally {
        setLoading(false)
      }
    },
    [filter],
  )

  useEffect(() => {
    fetchProducts(filter)
  }, [filter, fetchProducts])

  const setShowcaseFilter = (f: ShowcaseFilter) => setFilter(f)

  return {
    products,
    loading,
    error,
    filter,
    setFilter: setShowcaseFilter,
    refetch: () => fetchProducts(filter),
  }
}