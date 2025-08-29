"use client"

import { createClient } from "@/lib/supabase/client"
import type { ProductWithCategory } from "@/lib/types/database"
import { useEffect, useState } from "react"

export interface CartItem {
  id: string
  product_id: string
  quantity: number
  created_at: string
  updated_at: string
  products: ProductWithCategory
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCartItems()
  }, [])

  const fetchCartItems = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setItems([])
        return
      }

      const { data, error } = await supabase
        .from("shopping_cart")
        .select(`
          *,
          products (
            *,
            categories (*)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setItems(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (productId: string, quantity = 1) => {
    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Vous devez être connecté pour ajouter des produits au panier")
      }

      // Check if item already exists in cart
      const existingItem = items.find((item) => item.product_id === productId)

      if (existingItem) {
        // Update quantity
        const { error } = await supabase
          .from("shopping_cart")
          .update({ quantity: existingItem.quantity + quantity })
          .eq("id", existingItem.id)

        if (error) throw error
      } else {
        // Add new item
        const { error } = await supabase.from("shopping_cart").insert({
          user_id: user.id,
          product_id: productId,
          quantity,
        })

        if (error) throw error
      }

      await fetchCartItems()
    } catch (err) {
      throw err
    }
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      const supabase = createClient()

      if (quantity <= 0) {
        await removeFromCart(itemId)
        return
      }

      const { error } = await supabase.from("shopping_cart").update({ quantity }).eq("id", itemId)

      if (error) throw error
      await fetchCartItems()
    } catch (err) {
      throw err
    }
  }

  const removeFromCart = async (itemId: string) => {
    try {
      const supabase = createClient()

      const { error } = await supabase.from("shopping_cart").delete().eq("id", itemId)

      if (error) throw error
      await fetchCartItems()
    } catch (err) {
      throw err
    }
  }

  const clearCart = async () => {
    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase.from("shopping_cart").delete().eq("user_id", user.id)

      if (error) throw error
      await fetchCartItems()
    } catch (err) {
      throw err
    }
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.products.price * item.quantity, 0)
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  return {
    items,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getTotalItems,
    refetch: fetchCartItems,
  }
}
