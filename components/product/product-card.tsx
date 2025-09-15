"use client"

import type { ProductWithCategory } from "@/lib/types/database"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Heart, ShoppingCart, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"

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

  const discountBgClass = useMemo(() => {
    if (discountPercentage >= 40) return "bg-red-600 text-white"
    if (discountPercentage >= 20) return "bg-orange-500 text-white"
    if (discountPercentage >= 10) return "bg-amber-400 text-black"
    if (discountPercentage > 0) return "bg-yellow-300 text-black"
    return "bg-red-600 text-white"
  }, [discountPercentage])

  const newWindowDays = useMemo(() => {
    const envVal = Number(process.env.NEXT_PUBLIC_NEW_PRODUCT_DAYS || "")
    return Number.isFinite(envVal) && envVal > 0 ? envVal : 7
  }, [])

  const isNew = useMemo(() => {
    const created = (product as any).created_at
    if (!created) return false
    const createdMs = Date.parse(created)
    if (Number.isNaN(createdMs)) return false
    const windowMs = newWindowDays * 24 * 60 * 60 * 1000
    return Date.now() - createdMs <= windowMs
  }, [product, newWindowDays])

  // Ultra-compact white band in compact mode; standard sizes otherwise
  const badgeTextSize = compact ? "text-[9px] md:text-[10px]" : "text-[10px] md:text-xs"
  const wishBtnSize = compact ? "h-6 w-6 md:h-7 md:w-7" : "h-7 w-7 md:h-8 md:w-8"
  const wishIconSize = compact ? "h-3 w-3 md:h-3.5 md:w-3.5" : "h-3.5 w-3.5 md:h-4 md:w-4"

  // White band padding significantly reduced in compact mode across breakpoints
  const contentPadding = compact ? "p-1 sm:p-1.5 md:p-2" : "p-2 sm:p-3 md:p-4"
  const spaceY = compact ? "space-y-0.5 md:space-y-1" : "space-y-1 sm:space-y-1.5 md:space-y-2"

  // Hide category entirely in compact to save height
  const categoryText = compact ? "hidden" : "text-[11px] md:text-xs"

  // Title single-line even on desktop in compact; smaller font
  const titleText = compact ? "text-[11px] sm:text-xs md:text-sm" : "text-[12px] sm:text-sm md:text-base"
  const titleClamp = compact ? "line-clamp-1" : "line-clamp-1 md:line-clamp-2"

  // Description controlled elsewhere; keep references here for non-compact
  const descText = compact ? "hidden" : "hidden md:block md:text-sm"
  const starSize = compact ? "h-0 w-0 md:h-0 md:w-0" : "h-3 w-3 md:h-3.5 md:w-3.5"
  const ratingText = compact ? "hidden" : "text-[10px] md:text-xs"

  const footerPadding = compact ? "p-1 sm:p-1.5 md:p-2" : "p-2 sm:p-3 md:p-4"
  const priceText = compact ? "text-[12px] sm:text-[13px] md:text-sm" : "text-sm sm:text-base md:text-lg"
  const comparePriceText = compact ? "text-[10px] sm:text-[11px] md:text-xs" : "text-[11px] sm:text-xs md:text-sm"
  const stockText = compact ? "hidden" : "text-[10px] md:text-xs"

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

        {/* Corner ribbon for strong promo highlight */}
        {discountPercentage > 0 && (
          <div
            className={`pointer-events-none absolute -left-10 top-3 -rotate-45 z-10 ${discountBgClass} font-bold shadow-lg ${
              compact ? "px-8 py-0.5 text-[10px]" : "px-10 py-1 text-xs md:text-sm"
            }`}
            aria-hidden="true"
          >
            -{discountPercentage}% PROMO
          </div>
        )}

        {/* New ribbon on the top-right (below wishlist) */}
        {isNew && (
          <div
            className={`pointer-events-none absolute -right-10 top-4 rotate-45 z-10 bg-emerald-600 text-white font-semibold shadow ${
              compact ? "px-6 py-0.5 text-[10px]" : "px-8 py-1 text-xs md:text-sm"
            }`}
            aria-hidden="true"
          >
            Nouveau
          </div>
        )}

        {/* Badges (kept clear of ribbon; no duplicate promo badge) */}
        <div className={`absolute ${discountPercentage > 0 ? "top-12 md:top-14" : "top-2"} left-2 z-20 flex flex-col gap-1`}>
          {product.is_featured && (
            <Badge variant="secondary" className={`bg-blue-600 text-white ${badgeTextSize} px-1.5 py-0.5`}>
              Vedette
            </Badge>
          )}
          {/* Remove old promo badge to avoid duplication with corner ribbon */}
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

          {/* Description removed in compact mode (including desktop) to reduce card height */}
          {!compact && (product as any).short_description && (
            <p className={`${descText} text-gray-600 line-clamp-2`}>{(product as any).short_description}</p>
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
