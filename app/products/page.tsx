"use client"

import { ProductFilters, type ProductFilters as ProductFiltersType } from "@/components/product/product-filters"
import { ProductGrid } from "@/components/product/product-grid"
import { ProductGridSkeleton } from "@/components/product/product-loading"
import { ProductSearch } from "@/components/product/product-search"
import { Button } from "@/components/ui/button"
import { useCategories } from "@/lib/hooks/use-categories"
import type { ProductWithCategory } from "@/lib/types/database"
import { Filter } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

type ApiResp = {
  data: ProductWithCategory[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  error?: string
}

export default function ProductsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Local UI state mapped to URL
  const [filters, setFilters] = useState<ProductFiltersType>({
    categories: [],
    priceRange: [0, 1000],
    inStock: false,
    featured: false,
    sortBy: "newest",
    searchQuery: "",
  })
  const [showFilters, setShowFilters] = useState(false)

  // Server data
  const [items, setItems] = useState<ProductWithCategory[]>([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(24)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const { categories, loading: categoriesLoading } = useCategories()

  // Read initial filters from URL
  useEffect(() => {
    const sp = new URLSearchParams(searchParams?.toString() || "")
    const q = sp.get("query") || sp.get("q") || ""
    const cats = (sp.get("categories") || "").split(",").filter(Boolean)
    const minPrice = Number(sp.get("minPrice") || "0")
    const maxPrice = Number(sp.get("maxPrice") || "1000")
    const inStock = ["1", "true", "yes"].includes((sp.get("inStock") || "").toLowerCase())
    const featured = ["1", "true", "yes"].includes((sp.get("featured") || "").toLowerCase())
    const sort = (sp.get("sort") || "newest") as ProductFiltersType["sortBy"]
    const pg = Math.max(1, Number(sp.get("page") || "1"))

    setFilters({
      categories: cats,
      priceRange: [minPrice, maxPrice],
      inStock,
      featured,
      sortBy: sort,
      searchQuery: q,
    })
    setPage(pg)
  }, [searchParams])

  const buildUrl = useCallback(
    (next: Partial<ProductFiltersType> & { page?: number }) => {
      const sp = new URLSearchParams()

      const q = next.searchQuery ?? filters.searchQuery
      if (q) sp.set("q", q)

      const cats = next.categories ?? filters.categories
      if (cats && cats.length) sp.set("categories", cats.join(","))

      const [minP, maxP] = next.priceRange ?? filters.priceRange
      if (minP && minP > 0) sp.set("minPrice", String(minP))
      if (maxP && maxP > 0) sp.set("maxPrice", String(maxP))

      const inStock = next.inStock ?? filters.inStock
      if (inStock) sp.set("inStock", "1")

      const featured = next.featured ?? filters.featured
      if (featured) sp.set("featured", "1")

      const sort = next.sortBy ?? filters.sortBy
      if (sort) sp.set("sort", sort)

      const pg = next.page ?? page
      if (pg && pg > 1) sp.set("page", String(pg))

      return `${pathname}?${sp.toString()}`
    },
    [filters, page, pathname],
  )

  // Fetch server data based on URL params
  const fetchProducts = useCallback(async () => {
    const sp = new URLSearchParams(searchParams?.toString() || "")
    sp.set("pageSize", String(pageSize))
    setLoading(true)
    try {
      const res = await fetch(`/api/products?${sp.toString()}`, { cache: "no-store" })
      const json: ApiResp = await res.json()
      if ((json as any).error) {
        setItems([])
        setTotal(0)
        setTotalPages(1)
      } else {
        setItems(json.data || [])
        setTotal(json.total || 0)
        setTotalPages(json.totalPages || 1)
      }
    } catch {
      setItems([])
      setTotal(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [searchParams, pageSize])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Handlers
  const handleSearch = (query: string) => {
    const next = { ...filters, searchQuery: query }
    setFilters(next)
    setPage(1)
    router.push(buildUrl({ searchQuery: query, page: 1 }))
  }

  const handleFiltersChange = (newFilters: ProductFiltersType) => {
    setFilters(newFilters)
    setPage(1)
    router.push(
      buildUrl({
        categories: newFilters.categories,
        priceRange: newFilters.priceRange,
        inStock: newFilters.inStock,
        featured: newFilters.featured,
        sortBy: newFilters.sortBy,
        searchQuery: newFilters.searchQuery,
        page: 1,
      }),
    )
  }

  const handleAddToCart = async (productId: string) => {
    // TODO: Implement add to cart functionality
    console.log("Add to cart:", productId)
  }

  const handleToggleWishlist = async (productId: string) => {
    // TODO: Implement wishlist functionality
    console.log("Toggle wishlist:", productId)
  }

  const nextPage = () => {
    if (page < totalPages) {
      const newPage = page + 1
      setPage(newPage)
      router.push(buildUrl({ page: newPage }))
    }
  }

  const prevPage = () => {
    if (page > 1) {
      const newPage = page - 1
      setPage(newPage)
      router.push(buildUrl({ page: newPage }))
    }
  }

  const headerSubtitle = useMemo(() => {
    const parts: string[] = []
    if (filters.searchQuery) parts.push(`Recherche: “${filters.searchQuery}”`)
    if (filters.categories.length) parts.push(`${filters.categories.length} catégorie(s)`)
    if (filters.inStock) parts.push("En stock")
    if (filters.featured) parts.push("Vedettes")
    return parts.join(" • ")
  }, [filters])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Tous les produits</h1>
          <p className="text-gray-600 mt-1">{headerSubtitle || "Parcourez notre catalogue complet"}</p>
          <div className="mt-4">
            <ProductSearch onSearch={handleSearch} className="max-w-xl" />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-72 flex-shrink-0">
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
            <div className="mb-4 flex items-center justify-between">
              <p className="text-gray-600">
                {loading ? "Chargement..." : `${total.toLocaleString()} produit(s) • Page ${page}/${totalPages}`}
              </p>
              <div className="hidden md:flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={prevPage}>
                  Précédent
                </Button>
                <Button size="sm" disabled={page >= totalPages || loading} onClick={nextPage}>
                  Suivant
                </Button>
              </div>
            </div>

            {loading ? (
              <ProductGridSkeleton />
            ) : (
              <>
                <ProductGrid products={items} onAddToCart={handleAddToCart} onToggleWishlist={handleToggleWishlist} />
                {/* Mobile pagination */}
                <div className="mt-6 flex md:hidden items-center justify-between">
                  <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={prevPage}>
                    Précédent
                  </Button>
                  <span className="text-sm text-gray-600">
                    {page}/{totalPages}
                  </span>
                  <Button size="sm" disabled={page >= totalPages || loading} onClick={nextPage}>
                    Suivant
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
