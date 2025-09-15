"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { Metadata } from "next"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ProductGrid } from "@/components/product/product-grid"
import { ProductGridSkeleton } from "@/components/product/product-loading"
import { Button } from "@/components/ui/button"
import { Filter, Percent, Sparkles } from "lucide-react"

type ApiResp<T> = {
  data: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  error?: string
}

// For loose typing against your existing DB type
type AnyProduct = {
  id: string
  name: string
  slug: string
  price: number | null
  compare_price?: number | null
  images?: string[] | null
  categories?: any
  created_at?: string
  stock_quantity?: number | null
  is_active?: boolean
  is_featured?: boolean
}

const DEFAULT_PAGE_SIZE = 24
const MAX_FETCH_PAGE_SIZE = 60 // we fetch a single big page then filter client-side
const DEFAULT_NEW_DAYS = Number(process.env.NEXT_PUBLIC_NEW_PRODUCT_DAYS || "7") || 7

export const metadata: Metadata = {
  title: "Offres et Promotions | JammShop",
  description:
    "Découvrez nos meilleures offres: réductions, nouveautés en promo, et produits en stock au meilleur prix.",
  alternates: { canonical: "/deals" },
  openGraph: {
    title: "Offres et Promotions | JammShop",
    description: "Réductions vérifiées et mises à jour régulièrement sur JammShop.",
    url: "/deals",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Offres et Promotions | JammShop",
    description: "Réductions vérifiées et mises à jour régulièrement sur JammShop.",
  },
}

export default function DealsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [items, setItems] = useState<AnyProduct[]>([])
  const [loading, setLoading] = useState(true)

  const [compact, setCompact] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [sortBy, setSortBy] = useState<"discount" | "newest" | "price-asc" | "price-desc">("discount")
  const [minDiscount, setMinDiscount] = useState(10) // Show items with >= 10% discount by default

  const [onlyNew, setOnlyNew] = useState(false)
  const [newDays, setNewDays] = useState(DEFAULT_NEW_DAYS)

  // Helpers
  const buildUrl = useCallback(
    (opts: Partial<{ page: number; pageSize: number; sort: string; minDiscount: number; view: string; onlyNew: boolean; newDays: number }>) => {
      const sp = new URLSearchParams(searchParams?.toString() || "")
      const p = opts.page ?? page
      const ps = opts.pageSize ?? pageSize
      const s = opts.sort ?? sortBy
      const d = opts.minDiscount ?? minDiscount
      const v = opts.view ?? (compact ? "compact" : "comfortable")
      const n = typeof opts.onlyNew === "boolean" ? opts.onlyNew : onlyNew
      const nd = typeof opts.newDays === "number" ? opts.newDays : newDays

      if (p > 1) sp.set("page", String(p))
      else sp.delete("page")
      if (ps !== DEFAULT_PAGE_SIZE) sp.set("pageSize", String(ps))
      else sp.delete("pageSize")
      if (s && s !== "discount") sp.set("sort", s)
      else sp.delete("sort")
      if (d && d !== 10) sp.set("minDiscount", String(d))
      else sp.delete("minDiscount")
      if (v !== "compact") sp.set("view", v)
      else sp.delete("view")
      if (n) sp.set("onlyNew", "1")
      else sp.delete("onlyNew")
      if (nd !== DEFAULT_NEW_DAYS) sp.set("newDays", String(nd))
      else sp.delete("newDays")

      return `${pathname}?${sp.toString()}`
    },
    [searchParams, page, pageSize, sortBy, minDiscount, compact, pathname, onlyNew, newDays],
  )

  // Read initial state from URL + localStorage
  useEffect(() => {
    const sp = new URLSearchParams(searchParams?.toString() || "")
    const p = Math.max(1, Number(sp.get("page") || "1"))
    const ps = Math.min(60, Math.max(1, Number(sp.get("pageSize") || DEFAULT_PAGE_SIZE)))
    const s = (sp.get("sort") || "discount") as typeof sortBy
    const d = Math.max(0, Math.min(95, Number(sp.get("minDiscount") || "10")))
    const view = (sp.get("view") || "").toLowerCase()
    const newFlag = ["1", "true", "yes"].includes((sp.get("onlyNew") || "").toLowerCase())
    const nd = Math.max(1, Number(sp.get("newDays") || DEFAULT_NEW_DAYS))

    setPage(p)
    setPageSize(ps)
    setSortBy(["discount", "newest", "price-asc", "price-desc"].includes(s) ? s : "discount")
    setMinDiscount(Number.isFinite(d) ? d : 10)
    setOnlyNew(newFlag)
    setNewDays(Number.isFinite(nd) ? nd : DEFAULT_NEW_DAYS)

    if (view === "comfortable") setCompact(false)
    else {
      try {
        const stored = localStorage.getItem("dealsView")
        if (stored === "comfortable") setCompact(false)
        else setCompact(true)
      } catch {
        setCompact(true)
      }
    }
  }, [searchParams])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch a big page of on-sale products, we'll refine locally for minDiscount/newness
      const url = `/api/products?page=1&pageSize=${MAX_FETCH_PAGE_SIZE}&sort=newest&onSale=1`
      const res = await fetch(url, { cache: "no-store" })
      const json: ApiResp<AnyProduct> = await res.json()
      if ((json as any).error) {
        setItems([])
      } else {
        const products = (json.data || []).filter(Boolean)
        setItems(products)
      }
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Compute discounted list
  const discounted = useMemo(() => {
    const now = Date.now()
    const windowMs = newDays * 24 * 60 * 60 * 1000

    const withDiscount = items
      .map((p) => {
        const price = typeof p.price === "number" ? p.price : null
        const compare = typeof (p as any).compare_price === "number" ? (p as any).compare_price : null
        const discount =
          price !== null && compare !== null && compare > 0 && price < compare
            ? Math.round(((compare - price) / compare) * 100)
            : 0
        const isNew =
          !!p.created_at &&
          Number.isFinite(Date.parse(p.created_at)) &&
          now - Date.parse(p.created_at) <= windowMs
        return { product: p, discount, isNew }
      })
      .filter((x) => x.discount >= minDiscount && (!onlyNew || x.isNew))

    // Sorting
    switch (sortBy) {
      case "newest":
        withDiscount.sort((a, b) => (a.product.created_at || "") < (b.product.created_at || "") ? 1 : -1)
        break
      case "price-asc":
        withDiscount.sort((a, b) => (a.product.price ?? 0) - (b.product.price ?? 0))
        break
      case "price-desc":
        withDiscount.sort((a, b) => (b.product.price ?? 0) - (a.product.price ?? 0))
        break
      case "discount":
      default:
        withDiscount.sort((a, b) => b.discount - a.discount)
        break
    }

    return withDiscount
  }, [items, minDiscount, sortBy, onlyNew, newDays])

  // Pagination (client-side over filtered list)
  const total = discounted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pageClamped = Math.min(page, totalPages)
  const paginated = useMemo(() => {
    const from = (pageClamped - 1) * pageSize
    const to = from + pageSize
    return discounted.slice(from, to).map((x) => x.product)
  }, [discounted, pageClamped, pageSize])

  const setAndPush = (opts: Partial<{ page: number; pageSize: number; sort: typeof sortBy; minDiscount: number; view: string; onlyNew: boolean; newDays: number }>) => {
    if (typeof opts.page === "number") setPage(opts.page)
    if (typeof opts.pageSize === "number") setPageSize(opts.pageSize)
    if (opts.sort) setSortBy(opts.sort)
    if (typeof opts.minDiscount === "number") setMinDiscount(opts.minDiscount)
    if (opts.view) setCompact(opts.view !== "comfortable")
    if (typeof opts.onlyNew === "boolean") setOnlyNew(opts.onlyNew)
    if (typeof opts.newDays === "number") setNewDays(opts.newDays)
    router.replace(buildUrl(opts), { scroll: false })
  }

  const nextPage = () => {
    if (pageClamped < totalPages) setAndPush({ page: pageClamped + 1 })
  }
  const prevPage = () => {
    if (pageClamped > 1) setAndPush({ page: pageClamped - 1 })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-yellow-500" />
            Offres et Promotions
          </h1>
          <p className="text-gray-600 mt-1">Découvrez nos meilleures affaires: réductions vérifiées et mises à jour régulièrement.</p>
        </div>

        {/* Toolbar */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          {/* Min discount */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 flex items-center gap-1">
              <Percent className="h-4 w-4" /> Réduc. min
            </label>
            <input
              type="range"
              min={0}
              max={80}
              step={5}
              value={minDiscount}
              onChange={(e) => setAndPush({ minDiscount: Number(e.target.value), page: 1 })}
              className="flex-1"
            />
            <span className="text-sm font-medium tabular-nums w-10 text-right">{minDiscount}%</span>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Trier</label>
            <select
              value={sortBy}
              onChange={(e) => setAndPush({ sort: e.target.value as any, page: 1 })}
              className="h-9 rounded-md border border-gray-300 px-2 text-sm w-full"
            >
              <option value="discount">Réduction</option>
              <option value="newest">Nouveautés</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
            </select>
          </div>

          {/* Page size */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Par page</label>
            <select
              value={pageSize}
              onChange={(e) => setAndPush({ pageSize: Number(e.target.value), page: 1 })}
              className="h-9 rounded-md border border-gray-300 px-2 text-sm w-full"
            >
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={36}>36</option>
              <option value={48}>48</option>
            </select>
          </div>

          {/* View + New filter */}
          <div className="flex items-center justify-end gap-3">
            <label className="text-sm text-gray-600 flex items-center gap-2">
              <input
                type="checkbox"
                checked={onlyNew}
                onChange={(e) => setAndPush({ onlyNew: e.target.checked, page: 1 })}
              />
              Nouveautés
            </label>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Jours</label>
              <input
                type="number"
                min={1}
                max={90}
                value={newDays}
                onChange={(e) => setAndPush({ newDays: Math.max(1, Math.min(90, Number(e.target.value) || DEFAULT_NEW_DAYS)), page: 1 })}
                className="h-9 w-20 rounded-md border border-gray-300 px-2 text-sm"
              />
            </div>
            <Button
              variant={compact ? "secondary" : "outline"}
              size="sm"
              onClick={() => setAndPush({ view: compact ? "comfortable" : "compact" })}
              title={compact ? "Passer en affichage confortable" : "Passer en affichage compact"}
            >
              {compact ? "Affichage compact" : "Affichage confortable"}
            </Button>
          </div>
        </div>

        {/* Count + chips */}
        <div className="mb-4 text-gray-600">
          {loading ? "Chargement..." : `${total.toLocaleString()} offre(s) • Page ${pageClamped}/${totalPages}`}
        </div>

        {/* Grid */}
        <div className="flex-1">
          {loading ? (
            <ProductGridSkeleton />
          ) : total === 0 ? (
            <div className="text-center py-24 text-gray-600">
              Aucune offre correspondant aux critères actuels.
              <div className="mt-3">
                <Button variant="outline" onClick={() => setAndPush({ minDiscount: 0, sort: "discount", page: 1, onlyNew: false, newDays: DEFAULT_NEW_DAYS })}>
                  Réinitialiser les filtres
                </Button>
              </div>
            </div>
          ) : (
            <ProductGrid products={paginated} compact={compact} />
          )}
        </div>

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <Button variant="outline" size="sm" disabled={pageClamped <= 1} onClick={prevPage}>
              Précédent
            </Button>
            <span className="text-sm text-gray-600">
              {pageClamped}/{totalPages}
            </span>
            <Button size="sm" disabled={pageClamped >= totalPages} onClick={nextPage}>
              Suivant
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}