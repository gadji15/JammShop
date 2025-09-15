"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ProductWithCategory } from "@/lib/types/database"

export interface CartItem {
  product_id: string
  quantity: number
  products: ProductWithCategory
  id?: string // db id if authenticated
}

type CartState = {
  items: CartItem[]
  loading: boolean
  guest: boolean
  error: string | null
  // actions
  init: () => Promise<void>
  refetch: () => Promise<void>
  addToCart: (productId: string, quantity?: number) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  removeFromCart: (productId: string) => Promise<void>
  clearCart: () => Promise<void>
  getTotalItems: () => number
  getTotalPrice: () => number
}

const LOCAL_KEY = "jamm_cart"

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      loading: true,
      guest: true,
      error: null,

      init: async () => {
        await get().refetch()
      },

      refetch: async () => {
        try {
          set({ loading: true, error: null })
          const res = await fetch("/api/cart", { cache: "no-store" })
          if (res.ok) {
            const json = await res.json()
            if (json.guest) {
              // Guest: hydrate from localStorage then fetch product details client-side
              const raw = localStorage.getItem(LOCAL_KEY)
              const local = raw ? (JSON.parse(raw) as { product_id: string; quantity: number }[]) : []
              if (local.length === 0) {
                set({ items: [], guest: true, loading: false })
                return
              }
              const ids = local.map((l) => l.product_id)
              // Fetch products client-side
              const prodsRes = await fetch(`/api/products?ids=${encodeURIComponent(ids.join(","))}&pageSize=${ids.length}`, {
                cache: "no-store",
              }).catch(() => null)
              let products: any[] = []
              if (prodsRes && prodsRes.ok) {
                const pj = await prodsRes.json()
                products = pj.data || []
              }
              const joined: CartItem[] = local
                .map((l) => {
                  const prod = products.find((p: any) => p.id === l.product_id)
                  if (!prod) return null
                  return { product_id: l.product_id, quantity: l.quantity, products: prod }
                })
                .filter(Boolean) as CartItem[]
              set({ items: joined, guest: true, loading: false })
            } else {
              // Authenticated: items already joined from API
              const items: CartItem[] = (json.items || []).map((it: any) => ({
                id: it.id,
                product_id: it.product_id,
                quantity: it.quantity,
                products: it.products,
              }))
              set({ items, guest: false, loading: false })
            }
          } else {
            set({ items: [], guest: true, loading: false, error: "Failed to load cart" })
          }
        } catch (e) {
          set({ items: [], guest: true, loading: false, error: "Failed to load cart" })
        }
      },

      addToCart: async (productId, quantity = 1) => {
        const { guest } = get()
        if (guest) {
          // Update local storage
          const raw = localStorage.getItem(LOCAL_KEY)
          const local = raw ? (JSON.parse(raw) as { product_id: string; quantity: number }[]) : []
          const idx = local.findIndex((l) => l.product_id === productId)
          if (idx >= 0) local[idx].quantity += quantity
          else local.push({ product_id: productId, quantity })
          localStorage.setItem(LOCAL_KEY, JSON.stringify(local))
          await get().refetch()
          return
        }
        // Authenticated via API
        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity }),
        })
        await get().refetch()
      },

      updateQuantity: async (productId, quantity) => {
        const { guest } = get()
        if (guest) {
          const raw = localStorage.getItem(LOCAL_KEY)
          let local = raw ? (JSON.parse(raw) as { product_id: string; quantity: number }[]) : []
          const idx = local.findIndex((l) => l.product_id === productId)
          if (idx >= 0) {
            if (quantity <= 0) local = local.filter((l) => l.product_id !== productId)
            else local[idx].quantity = quantity
            localStorage.setItem(LOCAL_KEY, JSON.stringify(local))
          }
          await get().refetch()
          return
        }
        await fetch("/api/cart", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity }),
        })
        await get().refetch()
      },

      removeFromCart: async (productId) => {
        const { guest } = get()
        if (guest) {
          const raw = localStorage.getItem(LOCAL_KEY)
          let local = raw ? (JSON.parse(raw) as { product_id: string; quantity: number }[]) : []
          local = local.filter((l) => l.product_id !== productId)
          localStorage.setItem(LOCAL_KEY, JSON.stringify(local))
          await get().refetch()
          return
        }
        await fetch("/api/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        })
        await get().refetch()
      },

      clearCart: async () => {
        const { guest, items } = get()
        if (guest) {
          localStorage.setItem(LOCAL_KEY, JSON.stringify([]))
          await get().refetch()
          return
        }
        // Remove all via multiple deletes (or implement /api/cart/clear)
        await Promise.all(
          items.map((it) =>
            fetch("/api/cart", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ productId: it.product_id }),
            }),
          ),
        )
        await get().refetch()
      },

      getTotalItems: () => {
        return get().items.reduce((acc, it) => acc + it.quantity, 0)
      },

      getTotalPrice: () => {
        return get().items.reduce((acc, it) => acc + (it.products?.price || 0) * it.quantity, 0)
      },
    }),
    { name: "jamm_cart_store" },
  ),
)

// Backward-compatible hook
export function useCart() {
  return useCartStore()
}
