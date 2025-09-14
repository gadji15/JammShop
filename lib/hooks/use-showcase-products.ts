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
        } else if (f === "best") {
          // NOTE: In absence of sales metrics, approximate "best sellers"
          // You may replace this with a server-side view/materialized view
          // that aggregates order_items counts and join here.
          // For now we promote featured first, then by lowest compare_price nulls last and lowest stock as a weak proxy.
          query = query
            .order("is_featured", { ascending: false }) // show featured first
            .order("stock_quantity", { ascending: true, nullsFirst: false }) // assume fast movers have lower stock
            .order("created_at", { ascending: false })
        }

        const { data, error } = await query.limit(8)

        if (error) throw error
        setProducts((data as ProductWithCategory[]) || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
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