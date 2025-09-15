"use client"

import type { CartItem } from "@/lib/hooks/use-cart"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Minus, Plus, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface CartItemProps {
  item: CartItem
  onUpdateQuantity: (productId: string, quantity: number) => Promise<void>
  onRemove: (productId: string) => Promise<void>
}

export function CartItemComponent({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const handleQuantityChange = async (newQuantity: number) => {
    try {
      await onUpdateQuantity(item.product_id, newQuantity)
    } catch (error) {
      console.error("Error updating quantity:", error)
    }
  }

  const handleRemove = async () => {
    try {
      await onRemove(item.product_id)
    } catch (error) {
      console.error("Error removing item:", error)
    }
  }

  const totalPrice = item.products.price * item.quantity

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Product Image */}
          <div className="w-20 h-20 flex-shrink-0">
            <Image
              src={item.products.images[0] || "/placeholder.svg?height=80&width=80&query=product"}
              alt={item.products.name}
              width={80}
              height={80}
              className="w-full h-full object-cover rounded-md"
            />
          </div>

          {/* Product Info */}
          <div className="flex-1 space-y-2">
            <div>
              <Link
                href={`/products/${item.products.slug}`}
                className="font-medium text-gray-900 hover:text-blue-600 line-clamp-2"
              >
                {item.products.name}
              </Link>
              {item.products.categories && <p className="text-sm text-gray-500">{item.products.categories.name}</p>}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-transparent"
                  onClick={() => handleQuantityChange(item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-transparent"
                  onClick={() => handleQuantityChange(item.quantity + 1)}
                  disabled={item.quantity >= item.products.stock_quantity}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <div className="text-right">
                <p className="font-semibold text-gray-900">{totalPrice.toFixed(2)} €</p>
                <p className="text-sm text-gray-500">{item.products.price.toFixed(2)} € / unité</p>
              </div>
            </div>
          </div>

          {/* Remove Button */}
          <Button variant="ghost" size="icon" onClick={handleRemove} className="text-red-500 hover:text-red-700">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
