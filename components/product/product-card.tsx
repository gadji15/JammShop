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
  compact?: boolean
}

export function ProductCard({ product, onAddToCart, onToggleWishlist, compact = false }: ProductCardProps) {
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

  // More aggressive responsive reductions for the bottom band (content + footer)
  const badgeTextSize = compact ? "text-[9px] md:text-[10px]" : "text-[10px] md:text-xs"
  const wishBtnSize = compact ? "h-6 w-6 md:h-7 md:w-7" : "h-7 w-7 md:h-8 md:w-8"
  const wishIconSize = compact ? "h-3 w-3 md:h-3.5 md:w-3.5" : "h-3.5 w-3.5 md:h-4 md:w-4"

  // Shrink the white band height on small screens
  const contentPadding = compact ? "p-1.5 sm:p-2 md:p-2.5" : "p-2 sm:p-2.5 md:p-3"
  const spaceY = compact ? "space-y-0.5 sm:space-y-1" : "space-y-1 sm:space-y-1.5 md:space-y-2"

  // Hide some metadata on small to reduce height
  const categoryText = compact ? "hidden sm:inline text-[10px] md:text-[11px]" : "hidden sm:inline text-[11px] md:text-xs"

  // Title scales down hard on small, and clamp to 1 line on small, 2 on md+
  const titleText = compact ? "text-[11px] sm:text-xs md:text-sm" : "text-[12px] sm:text-sm md:text-base"
  const titleClamp = "line-clamp-1 md:line-clamp-2"

  // Description hidden on small, single line on md, 2 lines on lg
  const descText = compact ? "hidden md:block md:text-[11px] lg:text-xs" : "hidden md:block md:text-xs lg:text-sm"
  const starSize = compact ? "h-2.5 w-2.5 md:h-3 md:w-3" : "h-3 w-3 md:h-3.5 md:w-3.5"
  const ratingText = compact ? "text-[9px] md:text-[10px]" : "text-[10px] md:text-xs"

  const footerPadding = compact ? "p-1.5 sm:p-2 md:p-2.5" : "p-2 sm:p-2.5 md:p-3"
  const priceText = compact ? "text-[13px] sm:text-sm md:text-base" : "text-sm sm:text-base md:text-lg"
  const comparePriceText = compact ? "text-[10px] sm:text-[11px] md:text-xs" : "text-[11px] sm:text-xs md:text-sm"
  const stockText = compact ? "hidden sm:inline text-[9px] md:text-[10px]" : "hidden sm:inline text-[10px] md:text-xs"

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-md">
      <div className={`relative ${compact ? "aspect-[4/5]" : "aspect-square"} overflow-hidden`}>
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
            <Badge variant="secondary" className={`bg-blue-600 text-white ${badgeTextSize} px-1.5 py-0.5`}>
              Vedette
            </Badge>
          )}
          {discountPercentage > 0 && (
            <Badge variant="destructive" className={`bg-red-600 text-white ${badgeTextSize} px-1.5 py-0.5`}>
              -{discountPercentage}%
            </Badge>
          )}
          {product.stock_quantity <= product.low_stock_threshold && (
            <Badge
              variant="outline"
              className={`bg-orange-100 text-orange-800 border-orange-300 ${badgeTextSize} px-1.5 py-0.5`}
            >
              Stock faible
            </Badge>
          )}
        </div>

        {/* Wishlist button */}
        <Button
          variant="ghost"
          size="icon"
          className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white ${wishBtnSize}`}
          onClick={handleToggleWishlist}
        >
          <Heart className={`${wishIconSize} ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
        </Button>

        {/* Quick add to cart */}
        <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            onClick={handleAddToCart}
            disabled={isLoading || product.stock_quantity === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <ShoppingCart className={`${wishIconSize} mr-2`} />
            {isLoading ? "Ajout..." : product.stock_quantity === 0 ? "Rupture" : "Ajouter"}
          </Button>
        </div>
      </div>

      <CardContent className={contentPadding}>
        <div className={spaceY}>
          {product.categories && (
            <Link
              href={`/categories/${product.categories.slug}`}
              className={`${categoryText} text-blue-600 hover:text-blue-800 font-medium`}
            >
              {product.categories.name}
            </Link>
          )}

          <Link href={`/products/${product.slug}`}>
            <h3 className={`font-semibold text-gray-900 ${titleText} ${titleClamp} hover:text-blue-600 transition-colors`}>
              {product.name}
            </h3>
          </Link>

          {/* Description: hide on small, 1 line md, 2 lines lg */}
          {product.short_description && (
            <p className={`${descText} text-gray-600 line-clamp-1 lg:line-clamp-2`}>{product.short_description}</p>
          )}

          {/* Rating placeholder (hide on small to save height) */}
          <div className="hidden md:flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`${starSize} fill-yellow-400 text-yellow-400`} />
            ))}
            <span className={`${ratingText} text-gray-500 ml-1`}>(4.5)</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className={`${footerPadding} pt-0`}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span className={`${priceText} font-bold text-gray-900`}>{product.price.toFixed(2)} €</span>
            {product.compare_price && (
              <span className={`${comparePriceText} text-gray-500 line-through`}>{product.compare_price.toFixed(2)} €</span>
            )}
          </div>

          <div className={`${stockText} text-gray-500`}>Stock: {product.stock_quantity}</div>
        </div>
      </CardFooter>
    </Card>
  )
}
