"use client"

import { createClient } from "@/lib/supabase/client"
import type { ProductWithCategory, ProductWithDetails } from "@/lib/types/database"
import { useEffect, useState } from "react"

export function useProducts() {
  const [products, setProducts] = useState<ProductWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories (*)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return { products, loading, error, refetch: fetchProducts }
}

export function useProduct(slug: string) {
  const [product, setProduct] = useState<ProductWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (slug) {
      fetchProduct(slug)
    }
  }, [slug])

  const fetchProduct = async (productSlug: string) => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories (*),
          suppliers (*)
        `)
        .eq("slug", productSlug)
        .eq("is_active", true)
        .single()

      if (error) throw error
      setProduct(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Product not found")
    } finally {
      setLoading(false)
    }
  }

  return { product, loading, error, refetch: () => fetchProduct(slug) }
}

export function useFeaturedProducts() {
  const [products, setProducts] = useState<ProductWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFeaturedProducts()
  }, [])

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories (*)
        `)
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(8)

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return { products, loading, error, refetch: fetchFeaturedProducts }
}

export function useProductsByCategory(categorySlug: string) {
  const [products, setProducts] = useState<ProductWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (categorySlug) {
      fetchProductsByCategory(categorySlug)
    }
  }, [categorySlug])

  const fetchProductsByCategory = async (slug: string) => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories!inner (*)
        `)
        .eq("is_active", true)
        .eq("categories.slug", slug)
        .eq("categories.is_active", true)
        .order("created_at", { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return { products, loading, error, refetch: () => fetchProductsByCategory(categorySlug) }
}

export function useSearchProducts(query: string) {
  const [products, setProducts] = useState<ProductWithCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (query.trim()) {
      searchProducts(query)
    } else {
      setProducts([])
    }
  }, [query])

  const searchProducts = async (searchQuery: string) => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories (*)
        `)
        .eq("is_active", true)
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,short_description.ilike.%${searchQuery}%`)
        .order("created_at", { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return { products, loading, error }
}
