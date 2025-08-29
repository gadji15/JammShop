"use client"

import { createClient } from "@/lib/supabase/client"
import type { Category } from "@/lib/types/database"
import { useEffect, useState } from "react"

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return { categories, loading, error, refetch: fetchCategories }
}

export function useCategory(slug: string) {
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (slug) {
      fetchCategory(slug)
    }
  }, [slug])

  const fetchCategory = async (categorySlug: string) => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", categorySlug)
        .eq("is_active", true)
        .single()

      if (error) throw error
      setCategory(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Category not found")
    } finally {
      setLoading(false)
    }
  }

  return { category, loading, error, refetch: () => fetchCategory(slug) }
}
