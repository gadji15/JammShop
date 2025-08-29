"use client"

import React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useProduct } from "@/lib/hooks/use-products"
import { Heart, Minus, Plus, Share2, ShoppingCart, Star, Truck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { useState } from "react"

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export default function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = React.use(params)
  const { product, loading, error } = useProduct(resolvedParams.slug)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)

  if (loading) {
    return <ProductPageSkeleton />
  }

  if (error || !product) {
    notFound()
  }

  const handleAddToCart = async () => {
    setIsAddingToCart(true)
    try {
      // TODO: Implement add to cart functionality
      console.log("Add to cart:", product.id, "quantity:", quantity)
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleToggleWishlist = async () => {
    try {
      // TODO: Implement wishlist functionality
      setIsWishlisted(!isWishlisted)
    } catch (error) {
      console.error("Error toggling wishlist:", error)
    }
  }

  const discountPercentage = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0

  const isOutOfStock = product.stock_quantity === 0
  const isLowStock = product.stock_quantity <= product.low_stock_threshold && product.stock_quantity > 0

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-gray-600">
          <Link href="/" className="hover:text-gray-900">
            Accueil
          </Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-gray-900">
            Produits
          </Link>
          {product.categories && (
            <>
              <span className="mx-2">/</span>
              <Link href={`/categories/${product.categories.slug}`} className="hover:text-gray-900">
                {product.categories.name}
              </Link>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
              <Image
                src={product.images[selectedImageIndex] || "/placeholder.svg?height=600&width=600&query=product"}
                alt={product.name}
                width={600}
                height={600}
                className="w-full h-full object-cover"
              />
            </div>

            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square overflow-hidden rounded-md border-2 ${
                      selectedImageIndex === index ? "border-blue-600" : "border-gray-200"
                    }`}
                  >
                    <Image
                      src={image || "/placeholder.svg?height=150&width=150&query=product"}
                      alt={`${product.name} ${index + 1}`}
                      width={150}
                      height={150}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              {product.categories && (
                <Link
                  href={`/categories/${product.categories.slug}`}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {product.categories.name}
                </Link>
              )}
              <h1 className="text-3xl font-bold text-gray-900 mt-2">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-gray-600">(4.5) • 127 avis</span>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-gray-900">{product.price.toFixed(2)} €</span>
                {product.compare_price && (
                  <span className="text-xl text-gray-500 line-through">{product.compare_price.toFixed(2)} €</span>
                )}
                {discountPercentage > 0 && (
                  <Badge variant="destructive" className="bg-red-600 text-white">
                    -{discountPercentage}%
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">Prix TTC, livraison non comprise</p>
            </div>

            {/* Stock Status */}
            <div className="space-y-2">
              {isOutOfStock ? (
                <Badge variant="destructive" className="bg-red-100 text-red-800">
                  Rupture de stock
                </Badge>
              ) : isLowStock ? (
                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                  Stock faible ({product.stock_quantity} restant)
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  En stock ({product.stock_quantity} disponible)
                </Badge>
              )}
            </div>

            {/* Short Description */}
            {product.short_description && <p className="text-gray-700 text-lg">{product.short_description}</p>}

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-2 min-w-[60px] text-center">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    disabled={quantity >= product.stock_quantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <span className="text-sm text-gray-600">Max: {product.stock_quantity}</span>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || isOutOfStock}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {isAddingToCart ? "Ajout..." : isOutOfStock ? "Rupture de stock" : "Ajouter au panier"}
                </Button>

                <Button variant="outline" size="lg" onClick={handleToggleWishlist}>
                  <Heart className={`h-5 w-5 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
                </Button>

                <Button variant="outline" size="lg">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Features */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-green-600" />
                    <span>Livraison gratuite dès 50€</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs">
                      ✓
                    </span>
                    <span>Garantie 2 ans</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center text-white text-xs">
                      ↺
                    </span>
                    <span>Retour gratuit 30 jours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs">
                      ⚡
                    </span>
                    <span>Expédition rapide</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Product Description */}
        {product.description && (
          <div className="mt-16">
            <Separator className="mb-8" />
            <div className="max-w-4xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Description</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Product Specifications */}
        <div className="mt-12">
          <Separator className="mb-8" />
          <div className="max-w-4xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Spécifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-900">SKU</span>
                  <span className="text-gray-600">{product.sku || "N/A"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-900">Poids</span>
                  <span className="text-gray-600">{product.weight ? `${product.weight} kg` : "N/A"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-900">Stock</span>
                  <span className="text-gray-600">{product.stock_quantity} unités</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-900">Fournisseur</span>
                  <span className="text-gray-600">{product.suppliers?.name || "Interne"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-900">Ajouté le</span>
                  <span className="text-gray-600">{new Date(product.created_at).toLocaleDateString("fr-FR")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductPageSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-4 w-96 mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="grid grid-cols-4 gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-md" />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-full mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-20 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
