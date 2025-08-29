"use client"

import { ProductFilters, type ProductFilters as ProductFiltersType } from "@/components/product/product-filters"
import { ProductGrid } from "@/components/product/product-grid"
import { ProductGridSkeleton } from "@/components/product/product-loading"
import { ProductSearch } from "@/components/product/product-search"
import { Button } from "@/components/ui/button"
import { useCategories } from "@/lib/hooks/use-categories"
import { useProducts, useSearchProducts } from "@/lib/hooks/use-products"
import type { ProductWithCategory } from "@/lib/types/database"
import { Filter } from "lucide-react"
import { useEffect, useState } from "react"

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<ProductFiltersType>({
    categories: [],
    priceRange: [0, 1000],
    inStock: false,
    featured: false,
    sortBy: "newest",
    searchQuery: "",
  })
  const [showFilters, setShowFilters] = useState(false)
  const [filteredProducts, setFilteredProducts] = useState<ProductWithCategory[]>([])

  const { products: allProducts, loading: productsLoading } = useProducts()
  const { products: searchResults, loading: searchLoading } = useSearchProducts(searchQuery)
  const { categories, loading: categoriesLoading } = useCategories()

  const loading = productsLoading || searchLoading || categoriesLoading
  const products = searchQuery ? searchResults : allProducts

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...products]

    // Apply category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter((product) => product.categories && filters.categories.includes(product.categories.id))
    }

    // Apply price range filter
    filtered = filtered.filter(
      (product) => product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1],
    )

    // Apply stock filter
    if (filters.inStock) {
      filtered = filtered.filter((product) => product.stock_quantity > 0)
    }

    // Apply featured filter
    if (filters.featured) {
      filtered = filtered.filter((product) => product.is_featured)
    }

    // Apply sorting
    switch (filters.sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price)
        break
      case "price-high":
        filtered.sort((a, b) => b.price - a.price)
        break
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "oldest":
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case "newest":
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }

    setFilteredProducts(filtered)
  }, [products, filters])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleFiltersChange = (newFilters: ProductFiltersType) => {
    setFilters(newFilters)
    if (newFilters.searchQuery !== searchQuery) {
      setSearchQuery(newFilters.searchQuery)
    }
  }

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Tous les produits</h1>
          <ProductSearch onSearch={handleSearch} className="max-w-md" />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="lg:hidden mb-4">
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="w-full justify-start">
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
            </div>

            <div className={`${showFilters ? "block" : "hidden"} lg:block`}>
              {!categoriesLoading && (
                <ProductFilters
                  categories={categories}
                  onFiltersChange={handleFiltersChange}
                  isOpen={true}
                  onToggle={() => setShowFilters(!showFilters)}
                />
              )}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600">
                {loading ? "Chargement..." : `${filteredProducts.length} produit(s) trouvé(s)`}
              </p>
            </div>

            {loading ? (
              <ProductGridSkeleton />
            ) : (
              <ProductGrid
                products={filteredProducts}
                onAddToCart={handleAddToCart}
                onToggleWishlist={handleToggleWishlist}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
