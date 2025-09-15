"use client"

import { useState, useMemo } from "react"
import { useCart } from "@/lib/hooks/use-cart"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, Trash2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

export function CartDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { items, updateQuantity, removeFromCart, getTotalItems, getTotalPrice } = useCart()
  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()

  const onInc = async (pid: string, q: number) => {
    try {
      await updateQuantity(pid, q + 1)
    } catch (e) {
      toast.error("Impossible d'augmenter la quantité")
    }
  }

  const onDec = async (pid: string, q: number) => {
    try {
      await updateQuantity(pid, q - 1)
    } catch (e) {
      toast.error("Impossible de diminuer la quantité")
    }
  }

  const onRemove = async (pid: string) => {
    try {
      await removeFromCart(pid)
      toast.success("Article retiré du panier")
    } catch (e) {
      toast.error("Suppression impossible")
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Panier ({totalItems})</SheetTitle>
        </SheetHeader>

        <div className="mt-4 flex h-[calc(100dvh-160px)] flex-col">
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {items.length === 0 ? (
              <div className="text-center text-gray-500 py-10">Votre panier est vide</div>
            ) : (
              items.map((it) => (
                <div key={it.product_id} className="flex gap-3 items-center">
                  <div className="w-16 h-16 flex-shrink-0">
                    <Image
                      src={it.products.images?.[0] || "/placeholder.svg?height=64&width=64&query=product"}
                      alt={it.products.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${it.products.slug}`} onClick={() => onOpenChange(false)}>
                      <div className="text-sm font-medium text-gray-900 truncate hover:text-blue-600">
                        {it.products.name}
                      </div>
                    </Link>
                    <div className="text-xs text-gray-500">{it.products.categories?.name}</div>
                    <div className="mt-1 text-sm font-semibold">{(it.products.price * it.quantity).toFixed(2)} €</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onDec(it.product_id, it.quantity)}
                      disabled={it.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <div className="w-6 text-center text-sm">{it.quantity}</div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onInc(it.product_id, it.quantity)}
                      disabled={it.quantity >= (it.products.stock_quantity || 0)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onRemove(it.product_id)} className="text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <Separator className="my-3" />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Sous-total</span>
              <span>{Math.round(totalPrice).toLocaleString()} FCFA</span>
            </div>
            <div className="flex gap-2">
              <Button asChild className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => onOpenChange(false)}>
                <Link href="/cart">Voir le panier</Link>
              </Button>
              <Button asChild className="flex-1" onClick={() => onOpenChange(false)}>
                <Link href="/checkout">Payer</Link>
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}