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
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">Aucun produit trouvé</div>
        <p className="text-gray-400 mt-2">Essayez de modifier vos critères de recherche</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} onToggleWishlist={onToggleWishlist} />
      ))}
    </div>
  )
}
