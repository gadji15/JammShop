"use client"

import { createClient } from "@/lib/supabase/client"
import type { ProductWithCategory } from "@/lib/types/database"
import { useCallback, useEffect, useMemo, useState } from "react"

export interface CartRow {
  id: string
  user_id: string
  product_id: string
  quantity: number
  created_at: string
  updated_at: string
  products: ProductWithCategory
}

type LocalItem = { product_id: string; quantity: number }

const LOCAL_KEY = "jamm_cart"

export function useCart() {
  const [items, setItems] = useState<CartRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  // Helpers for localStorage fallback (guests)
  const readLocal = (): LocalItem[] => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY)
      const arr = raw ? JSON.parse(raw) : []
      return Array.isArray(arr) ? arr : []
    } catch {
      return []
    }
  }
  const writeLocal = (arr: LocalItem[]) => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(arr))
    } catch {}
  }

  const fetchCartItems = useCallback(async () => {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        // Guest: hydrate from localStorage (without product join)
        const local = readLocal()
        if (local.length === 0) {
          setItems([])
          return
        }
        // Fetch product details in one go
        const ids = local.map((l) => l.product_id)
        const { data: products, error: pErr } = await supabase
          .from("products")
          .select("*, categories (*)")
          .in("id", ids)
        if (pErr) throw pErr
        const joined: CartRow[] = local
          .map((l) => {
            const prod = (products || []).find((p: any) => p.id === l.product_id)
            if (!prod) return null
            return {
              id: `local-${l.product_id}`,
              user_id: "guest",
              product_id: l.product_id,
              quantity: l.quantity,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              products: prod as ProductWithCategory,
            }
          })
          .filter(Boolean) as CartRow[]
        setItems(joined)
        return
      }

      // Authenticated: read from DB
      const { data, error } = await supabase
        .from("shopping_cart")
        .select(
          `
          *,
          products (
            *,
            categories (*)
          )
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Merge local guest cart into DB once (then clear local)
      const local = readLocal()
      if (local.length > 0) {
        for (const li of local) {
          const existing = (data || []).find((it: any) => it.product_id === li.product_id)
          if (existing) {
            await supabase
              .from("shopping_cart")
              .update({ quantity: existing.quantity + li.quantity })
              .eq("id", existing.id)
          } else {
            await supabase.from("shopping_cart").insert({
              user_id: user.id,
              product_id: li.product_id,
              quantity: li.quantity,
            })
          }
        }
        writeLocal([])
        // re-read after merge
        const { data: after, error: err2 } = await supabase
          .from("shopping_cart")
          .select(
            `
            *,
            products (
              *,
              categories (*)
            )
          `,
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
        if (err2) throw err2
        setItems((after as any) || [])
      } else {
        setItems((data as any) || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchCartItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addToCart = async (productId: string, quantity = 1) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // Guest: update local
      const local = readLocal()
      const idx = local.findIndex((l) => l.product_id === productId)
      if (idx >= 0) local[idx].quantity += quantity
      else local.push({ product_id: productId, quantity })
      writeLocal(local)
      await fetchCartItems()
      return
    }

    // Authenticated: UPSERT-like behavior
    const existing = items.find((it) => it.product_id === productId)
    if (existing) {
      const { error } = await supabase
        .from("shopping_cart")
        .update({ quantity: existing.quantity + quantity })
        .eq("id", existing.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from("shopping_cart").insert({
        user_id: user.id,
        product_id: productId,
        quantity,
      })
      if (error) throw error
    }
    await fetchCartItems()
  }

  const updateQuantity = async (productId: string, quantity: number) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const local = readLocal()
      const idx = local.findIndex((l) => l.product_id === productId)
      if (idx >= 0) {
        if (quantity <= 0) local.splice(idx, 1)
        else local[idx].quantity = quantity
        writeLocal(local)
        await fetchCartItems()
      }
      return
    }

    const existing = items.find((it) => it.product_id === productId)
    if (!existing) return
    if (quantity <= 0) {
      await removeFromCart(productId)
      return
    }
    const { error } = await supabase.from("shopping_cart").update({ quantity }).eq("id", existing.id)
    if (error) throw error
    await fetchCartItems()
  }

  const removeFromCart = async (productId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const local = readLocal().filter((l) => l.product_id !== productId)
      writeLocal(local)
      await fetchCartItems()
      return
    }

    const existing = items.find((it) => it.product_id === productId)
    if (!existing) return
    const { error } = await supabase.from("shopping_cart").delete().eq("id", existing.id)
    if (error) throw error
    await fetchCartItems()
  }

  const clearCart = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      writeLocal([])
      await fetchCartItems()
      return
    }

    const { error } = await supabase.from("shopping_cart").delete().eq("user_id", user.id)
    if (error) throw error
    await fetchCartItems()
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.products?.price || 0) * item.quantity, 0)
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
