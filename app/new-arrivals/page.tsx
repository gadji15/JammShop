"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ProductGrid } from "@/components/product/product-grid"
import { ProductGridSkeleton } from "@/components/product/product-loading"
import { Button } from "@/components/ui/button"
import { Filter, Sparkles } from "lucide-react"

type ApiResp<T> = {
  data: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  error?: string
}

type AnyProduct = {
  id: string
  name: string
  slug: string
  price: number
  compare_price?: number | null
  images?: string[] | null
  categories?: any
  created_at?: string
  stock_quantity?: number | null
  is_active?: boolean
  is_featured?: boolean
}

const DEFAULT_PAGE_SIZE = 24
const DEFAULT_NEW_DAYS = Number(process.env.NEXT_PUBLIC_NEW_PRODUCT_DAYS || "7") || 7

export default function NewArrivalsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [items, setItems] = useState<AnyProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [compact, setCompact] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [sortBy, setSortBy] = useState<"newest" | "price-asc" | "price-desc" | "name">("newest")
  const [inStock, setInStock] = useState(false)
  const [newDays, setNewDays] = useState(DEFAULT_NEW_DAYS)

  // Helpers
  const buildUrl = useCallback(
    (opts: Partial<{ page: number; pageSize: number; sort: string; view: string; inStock: boolean; newDays: number }>) => {
      const sp = new URLSearchParams(searchParams?.toString() || "")
      const p = opts.page ?? page
      const ps = opts.pageSize ?? pageSize
      const s = opts.sort ?? sortBy
      const v = opts.view ?? (compact ? "compact" : "comfortable")
      const stock = typeof opts.inStock === "boolean" ? opts.inStock : inStock
      const nd = typeof opts.newDays === "number" ? opts.newDays : newDays

      if (p > 1) sp.set("page", String(p))
      else sp.delete("page")
      if (ps !== DEFAULT_PAGE_SIZE) sp.set("pageSize", String(ps))
      else sp.delete("pageSize")
      if (s && s !== "newest") sp.set("sort", s)
      else sp.delete("sort")
      if (v !== "compact") sp.set("view", v)
      else sp.delete("view")
      if (stock) sp.set("inStock", "1")
      else sp.delete("inStock")
      if (nd !== DEFAULT_NEW_DAYS) sp.set("newDays", String(nd))
      else sp.delete("newDays")

      return `${pathname}?${sp.toString()}`
    },
    [searchParams, page, pageSize, sortBy, compact, inStock, newDays, pathname],
  )

  // Read initial from URL (and localStorage for view)
  useEffect(() => {
    const sp = new URLSearchParams(searchParams?.toString() || "")
    const p = Math.max(1, Number(sp.get("page") || "1"))
    const ps = Math.min(60, Math.max(1, Number(sp.get("pageSize") || DEFAULT_PAGE_SIZE)))
    const s = (sp.get("sort") || "newest") as typeof sortBy
    const v = (sp.get("view") || "").toLowerCase()
    const stock = ["1", "true", "yes"].includes((sp.get("inStock") || "").toLowerCase())
    const nd = Math.max(1, Number(sp.get("newDays") || DEFAULT_NEW_DAYS))

    setPage(p)
    setPageSize(ps)
    setSortBy(["newest", "price-asc", "price-desc", "name"].includes(s) ? s : "newest")
    setInStock(stock)
    setNewDays(Number.isFinite(nd) ? nd : DEFAULT_NEW_DAYS)

    if (v === "comfortable") setCompact(false)
    else {
      try {
        const stored = localStorage.getItem("newArrivalsView")
        if (stored === "comfortable") setCompact(false)
        else setCompact(true)
      } catch {
        setCompact(true)
      }
    }
  }, [searchParams])

  // Fetch
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const sp = new URLSearchParams()
      sp.set("page", String(page))
      sp.set("pageSize", String(pageSize))
      sp.set("sort", sortBy)
      sp.set("onlyNew", "1")
      sp.set("newDays", String(newDays))
      if (inStock) sp.set("inStock", "1")

      const res = await fetch(`/api/products?${sp.toString()}`, { cache: "no-store" })
      const json: ApiResp<AnyProduct> = await res.json()
      if ((json as any).error) throw new Error((json as any).error)
      setItems(json.data || [])
    } catch (e: any) {
      setError(e.message || "Erreur de chargement")
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sortBy, inStock, newDays])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Derived
  const total = Number(searchParams?.get("total")) || undefined // not provided; we could compute from length
  const totalPages = Number(searchParams?.get("totalPages")) || undefined

  // Sync URL
  useEffect(() => {
    router.replace(
      buildUrl({
        page,
        pageSize,
        sort: sortBy,
        view: compact ? "compact" : "comfortable",
        inStock,
        newDays,
      }),
      { scroll: false },
    )
    try {
      localStorage.setItem("newArrivalsView", compact ? "compact" : "comfortable")
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, sortBy, compact, inStock, newDays])

  // Pagination handlers (client-side, we rely on API paging)
  const nextPage = () => setPage((p) => p + 1)
  const prevPage = () => setPage((p) => Math.max(1, p - 1))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl" />
        </div>
        <div className="container mx-auto px-4 py-14 md:py-20 relative z-10 text-center">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/10 ring-1 ring-white/20 text-xs md:text-sm">
            JammShop — Nouveautés
          </span>
          <h1 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight text-balance">
            Nouveautés
          </h1>
          <p className="mt-3 md:mt-4 text-base md:text-lg text-white/90 max-w-2xl mx-auto">
            Fraîchement arrivés dans notre catalogue. Découvrez les derniers produits ajoutés.
          </p>
        </div>
      </section>

      {/* Toolbar */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          {/* Sort */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Trier</label>
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value as any); setPage(1) }}
              className="h-9 rounded-md border border-gray-300 px-2 text-sm w-full"
            >
              <option value="newest">Nouveautés</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
              <option value="name">Nom (A→Z)</option>
            </select>
          </div>

          {/* New window days */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Depuis</label>
            <select
              value={newDays}
              onChange={(e) => { setNewDays(Math.max(1, Number(e.target.value) || DEFAULT_NEW_DAYS)); setPage(1) }}
              className="h-9 rounded-md border border-gray-300 px-2 text-sm w-full"
            >
              {[3, 7, 14, 30, 60, 90].map((d) => (
                <option key={d} value={d}>
                  {d} jour{d > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* In stock */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">En stock</label>
            <input
              type="checkbox"
              checked={inStock}
              onChange={(e) => { setInStock(e.target.checked); setPage(1) }}
            />
          </div>

          {/* View + Page size */}
          <div className="flex items-center justify-end gap-2">
            <label className="text-sm text-gray-700">Par page</label>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
              className="h-9 rounded-md border border-gray-300 px-2 text-sm w-[90px]"
            >
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={36}>36</option>
              <option value={48}>48</option>
            </select>
            <Button
              variant={compact ? "secondary" : "outline"}
              size="sm"
              onClick={() => setCompact((v) => !v)}
              title={compact ? "Passer en affichage confortable" : "Passer en affichage compact"}
            >
              {compact ? "Affichage compact" : "Affichage confortable"}
            </Button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="container mx-auto px-4 pb-10">
        {loading ? (
          <ProductGridSkeleton />
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="text-center py-24 text-gray-600">Aucune nouveauté trouvée pour la période sélectionnée.</div>
        ) : (
          <ProductGrid products={items} compact={compact} />
        )}

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={prevPage}>
            Précédent
          </Button>
          <span className="text-sm text-gray-600">Page {page}</span>
          <Button size="sm" disabled={loading || items.length < pageSize} onClick={nextPage}>
            Suivant
          </Button>
        </div>
      </div>
    </div>
  )
}