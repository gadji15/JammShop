"use client"

import type { ProductWithCategory } from "@/lib/types/database"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Heart, ShoppingCart, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

interface ProductCardProps {
  product: ProductWithCategory
  onAddToCart?: (productId: string) => void
  onToggleWishlist?: (productId: string) => void
}

export function ProductCard({ product, onAddToCart, onToggleWishlist }: ProductCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)

  const handleAddToCart = async () => {
    if (!onAddToCart) return
    setIsLoading(true)
    try {
      await onAddToCart(product.id)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleWishlist = async () => {
    if (!onToggleWishlist) return
    try {
      await onToggleWishlist(product.id)
      setIsWishlisted(!isWishlisted)
    } catch (error) {
      console.error("Error toggling wishlist:", error)
    }
  }

  const discountPercentage = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden">
        <Link href={`/products/${product.slug}`}>
          <Image
            src={product.images[0] || "/placeholder.svg?height=300&width=300&query=product"}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_featured && (
            <Badge variant="secondary" className="bg-blue-600 text-white">
              Vedette
            </Badge>
          )}
          {discountPercentage > 0 && (
            <Badge variant="destructive" className="bg-red-600 text-white">
              -{discountPercentage}%
            </Badge>
          )}
          {product.stock_quantity <= product.low_stock_threshold && (
            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
              Stock faible
            </Badge>
          )}
        </div>

        {/* Wishlist button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white"
          onClick={handleToggleWishlist}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
        </Button>

        {/* Quick add to cart */}
        <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            onClick={handleAddToCart}
            disabled={isLoading || product.stock_quantity === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {isLoading ? "Ajout..." : product.stock_quantity === 0 ? "Rupture" : "Ajouter"}
          </Button>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="space-y-2">
          {product.categories && (
            <Link
              href={`/categories/${product.categories.slug}`}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              {product.categories.name}
            </Link>
          )}

          <Link href={`/products/${product.slug}`}>
            <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors">
              {product.name}
            </h3>
          </Link>

          {product.short_description && (
            <p className="text-sm text-gray-600 line-clamp-2">{product.short_description}</p>
          )}

          {/* Rating placeholder */}
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="text-xs text-gray-500 ml-1">(4.5)</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">{product.price.toFixed(2)} €</span>
            {product.compare_price && (
              <span className="text-sm text-gray-500 line-through">{product.compare_price.toFixed(2)} €</span>
            )}
          </div>

          <div className="text-xs text-gray-500">Stock: {product.stock_quantity}</div>
        </div>
      </CardFooter>
    </Card>
  )
}
