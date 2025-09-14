"use client"

import { ProductFilters, type ProductFilters as ProductFiltersType } from "@/components/product/product-filters"
import { ProductGrid } from "@/components/product/product-grid"
import { ProductGridSkeleton } from "@/components/product/product-loading"
import { ProductSearch } from "@/components/product/product-search"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
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

const DEFAULT_PAGE_SIZE = 24

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
  const [compactView, setCompactView] = useState(true)

  // Server data
  const [items, setItems] = useState<ProductWithCategory[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
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
    const ps = Math.min(60, Math.max(1, Number(sp.get("pageSize") || DEFAULT_PAGE_SIZE)))
    const viewParam = (sp.get("view") || "compact").toLowerCase()
    setCompactView(viewParam !== "comfortable")

    setFilters({
      categories: cats,
      priceRange: [minPrice, maxPrice],
      inStock,
      featured,
      sortBy: sort,
      searchQuery: q,
    })
    setPage(pg)
    setPageSize(ps)
  }, [searchParams])

  const buildUrl = useCallback(
    (next: Partial<ProductFiltersType> & { page?: number; pageSize?: number; view?: "compact" | "comfortable" }) => {
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

      const ps = next.pageSize ?? pageSize
      if (ps !== DEFAULT_PAGE_SIZE) sp.set("pageSize", String(ps))

      const view = next.view ?? (compactView ? "compact" : "comfortable")
      if (view !== "compact") sp.set("view", view)

      return `${pathname}?${sp.toString()}`
    },
    [filters, page, pageSize, pathname, compactView],
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

  const handleSortChange = (sort: ProductFiltersType["sortBy"]) => {
    const next = { ...filters, sortBy: sort }
    setFilters(next)
    setPage(1)
    router.push(buildUrl({ sortBy: sort, page: 1 }))
  }

  const handlePageSizeChange = (ps: number) => {
    setPageSize(ps)
    setPage(1)
    router.push(buildUrl({ pageSize: ps, page: 1 }))
  }

  const toggleView = () => {
    const nextCompact = !compactView
    setCompactView(nextCompact)
    router.push(buildUrl({ view: nextCompact ? "compact" : "comfortable" }))
  }

  const clearAll = () => {
    const cleared: ProductFiltersType = {
      categories: [],
      priceRange: [0, 1000],
      inStock: false,
      featured: false,
      sortBy: "newest",
      searchQuery: "",
    }
    setFilters(cleared)
    setPage(1)
    setPageSize(DEFAULT_PAGE_SIZE)
    router.push(buildUrl({ ...cleared, page: 1, pageSize: DEFAULT_PAGE_SIZE }))
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

  const categoryLabel = (id: string) => categories.find((c) => c.id === id)?.name || id

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Tous les produits</h1>
          <p className="text-gray-600 mt-1">{headerSubtitle || "Parcourez notre catalogue complet"}</p>
          <div className="mt-4">
            <ProductSearch onSearch={handleSearch} className="max-w-xl" />
          </div>
        </div>

        {/* Active filters chips */}
        <div className="mb-4 flex flex-wrap gap-2">
          {filters.searchQuery && (
            <Button
              variant="secondary"
              size="sm"
              className="bg-blue-50 text-blue-700 border border-blue-200"
              onClick={() => handleSearch("")}
            >
              Recherche: “{filters.searchQuery}” ✕
            </Button>
          )}
          {filters.categories.map((id) => (
            <Button
              key={id}
              variant="secondary"
              size="sm"
              className="bg-gray-100 text-gray-800"
              onClick={() => {
                const next = { ...filters, categories: filters.categories.filter((c) => c !== id) }
                handleFiltersChange(next)
              }}
            >
              {categoryLabel(id)} ✕
            </Button>
          ))}
          {filters.inStock && (
            <Button
              variant="secondary"
              size="sm"
              className="bg-gray-100 text-gray-800"
              onClick={() => handleFiltersChange({ ...filters, inStock: false })}
            >
              En stock ✕
            </Button>
          )}
          {filters.featured && (
            <Button
              variant="secondary"
              size="sm"
              className="bg-gray-100 text-gray-800"
              onClick={() => handleFiltersChange({ ...filters, featured: false })}
            >
              Vedettes ✕
            </Button>
          )}
          {(filters.searchQuery ||
            filters.categories.length ||
            filters.inStock ||
            filters.featured ||
            filters.priceRange[0] > 0 ||
            filters.priceRange[1] < 1000) && (
            <Button variant="outline" size="sm" onClick={clearAll}>
              Réinitialiser tout
            </Button>
          )}
        </div>

        {/* Toolbar: count, sort, page size, filters button */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-gray-600 order-3 md:order-1">
            {loading ? "Chargement..." : `${total.toLocaleString()} produit(s) • Page ${page}/${totalPages}`}
          </p>

          <div className="order-1 md:order-2 w-full md:w-auto grid grid-cols-2 gap-2 sm:gap-3 items-center">
            {/* Sort */}
            <div className="flex items-center gap-2 min-w-0">
              <label className="text-sm text-gray-600 shrink-0">Trier</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleSortChange(e.target.value as ProductFiltersType["sortBy"])}
                className="h-9 rounded-md border border-gray-300 px-2 text-sm w-full min-w-0"
              >
                <option value="newest">Nouveautés</option>
                <option value="oldest">Plus anciens</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
                <option value="name">Nom (A→Z)</option>
              </select>
            </div>

            {/* Page size */}
            <div className="flex items-center gap-2 justify-end md:justify-start">
              <label className="text-sm text-gray-600 shrink-0">Par page</label>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="h-9 rounded-md border border-gray-300 px-2 text-sm w-[84px] sm:w-[100px]"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={36}>36</option>
                <option value={48}>48</option>
              </select>
            </div>

            {/* Filters button spans full width on small screens */}
            <Button variant="outline" onClick={() => setShowFilters(true)} className="col-span-2 md:col-span-1">
              <Filter className="h-4 w-4 mr-2" />
              Filtres
            </Button>
          </div>

          {/* View toggle */}
          <div className="order-2 md:order-3 flex items-center justify-end">
            <Button
              variant={compactView ? "secondary" : "outline"}
              size="sm"
              onClick={toggleView}
              className={compactView ? "bg-gray-100 text-gray-900" : ""}
              title={compactView ? "Passer en affichage confortable" : "Passer en affichage compact"}
            >
              {compactView ? "Affichage compact" : "Affichage confortable"}
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          {loading ? (
            <ProductGridSkeleton />
          ) : (
            <>
              <ProductGrid
                products={items}
                onAddToCart={handleAddToCart}
                onToggleWishlist={handleToggleWishlist}
                compact={compactView}
              />
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

        {/* Filters Sheet (instead of static sidebar) */}
        <Sheet open={showFilters} onOpenChange={setShowFilters}>
          <SheetContent side="left" className="w-[88vw] sm:w-[420px] p-0">
            <SheetHeader className="px-6 py-4 border-b">
              <SheetTitle>Filtres</SheetTitle>
            </SheetHeader>
            <div className="p-6 overflow-y-auto h-[calc(100vh-64px)]">
              {!categoriesLoading && (
                <ProductFilters
                  categories={categories}
                  onFiltersChange={(f) => {
                    handleFiltersChange(f)
                  }}
                  isOpen={true}
                  onToggle={() => setShowFilters(false)}
                />
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
