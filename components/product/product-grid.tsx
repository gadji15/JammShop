"use client"

import type { ProductWithCategory } from "@/lib/types/database"
import { ProductCard } from "./product-card"

interface ProductGridProps {
  products: ProductWithCategory[]
  onAddToCart?: (productId: string) => void
  onToggleWishlist?: (productId: string) => void
}

export function ProductGrid({ products, onAddToCart, onToggleWishlist }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-10 md:py-12">
        <div className="text-gray-500 text-base md:text-lg">Aucun produit trouvé</div>
        <p className="text-gray-400 mt-2 text-sm md:text-base">Essayez de modifier vos critères de recherche</p>
      </div>
    )
  }

  return (
    <>
      {/* Mobile: horizontal scroll to reduce vertical space */}
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 md:hidden">
        {products.map((product) => (
          <div key={product.id} className="min-w-[240px] snap-start">
            <ProductCard product={product} onAddToCart={onAddToCart} onToggleWishlist={onToggleWishlist} />
          </div>
        ))}
      </div>

      {/* Desktop and tablets: grid */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} onToggleWishlist={onToggleWishlist} />
        ))}
      </div>
    </>
  )
}
