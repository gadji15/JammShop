"use client"

import { ProductGrid } from "@/components/product/product-grid"
import { ProductGridSkeleton } from "@/components/product/product-loading"
import { ProductSearch } from "@/components/product/product-search"
import { Badge } from "@/components/ui/badge"
import { useCategory } from "@/lib/hooks/use-categories"
import { useProductsByCategory } from "@/lib/hooks/use-products"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import React, { useState } from "react"

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = React.use(params)
  const { category, loading: categoryLoading, error: categoryError } = useCategory(resolvedParams.slug)
  const { products, loading: productsLoading, error: productsError } = useProductsByCategory(resolvedParams.slug)
  const [searchQuery, setSearchQuery] = useState("")

  if (categoryLoading || productsLoading) {
    return <CategoryPageSkeleton />
  }

  if (categoryError || productsError || !category) {
    notFound()
  }

  // Filter products by search query
  const filteredProducts = searchQuery
    ? products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : products

  const handleAddToCart = async (productId: string) => {
    // TODO: Implement add to cart functionality
    console.log("Add to cart:", productId)
  }

  const handleToggleWishlist = async (productId: string) => {
    // TODO: Implement wishlist functionality
    console.log("Toggle wishlist:", productId)
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
          <span className="mx-2">/</span>
          <span className="text-gray-900">{category.name}</span>
        </nav>

        {/* Category Header */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {category.image_url && (
              <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                <Image
                  src={category.image_url || "/placeholder.svg"}
                  alt={category.name}
                  width={192}
                  height={192}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-4xl font-bold text-gray-900">{category.name}</h1>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {products.length} produit{products.length > 1 ? "s" : ""}
                </Badge>
              </div>

              {category.description && (
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">{category.description}</p>
              )}

              <ProductSearch
                onSearch={setSearchQuery}
                placeholder={`Rechercher dans ${category.name}...`}
                className="max-w-md"
              />
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">
              {searchQuery ? `Résultats pour "${searchQuery}"` : "Tous les produits"}
            </h2>
            <p className="text-gray-600">
              {filteredProducts.length} produit{filteredProducts.length > 1 ? "s" : ""} trouvé
              {filteredProducts.length > 1 ? "s" : ""}
            </p>
          </div>

          <ProductGrid
            products={filteredProducts}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
          />
        </div>
      </div>
    </div>
  )
}

function CategoryPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="h-4 w-96 bg-gray-200 rounded mb-8" />

        <div className="mb-12">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-48 h-48 bg-gray-200 rounded-lg" />
            <div className="flex-1 space-y-4">
              <div className="h-10 w-64 bg-gray-200 rounded" />
              <div className="h-6 w-full bg-gray-200 rounded" />
              <div className="h-6 w-3/4 bg-gray-200 rounded" />
              <div className="h-10 w-80 bg-gray-200 rounded" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 bg-gray-200 rounded" />
            <div className="h-6 w-32 bg-gray-200 rounded" />
          </div>
          <ProductGridSkeleton />
        </div>
      </div>
    </div>
  )
}
