"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

type Brand = {
  id: string
  name: string
  slug?: string | null
  logo_url?: string | null
  description?: string | null
  created_at?: string
  website?: string | null
}

type ApiResp<T> = {
  data: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  error?: string
}

const DEFAULT_PAGE_SIZE = 24

export default function BrandsClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [items, setItems] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [sort, setSort] = useState<"name" | "newest" | "oldest">("name")

  // Init from URL
  useEffect(() => {
    const sp = new URLSearchParams(searchParams?.toString() || "")
    setQ(sp.get("q") || "")
    setPage(Math.max(1, Number(sp.get("page") || "1")))
    setPageSize(Math.min(60, Math.max(1, Number(sp.get("pageSize") || DEFAULT_PAGE_SIZE))))
    const s = (sp.get("sort") || "name") as typeof sort
    setSort(["name", "newest", "oldest"].includes(s) ? s : "name")
  }, [searchParams])

  const buildUrl = (overrides: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams(searchParams?.toString() || "")
    const entries: Record<string, string | number | undefined> = {
      q,
      page,
      pageSize,
      sort,
      ...overrides,
    }
    Object.entries(entries).forEach(([k, v]) => {
      if (v === undefined || v === "" || v === null) sp.delete(k)
      else sp.set(k, String(v))
    })
    return `${pathname}?${sp.toString()}`
  }

  const fetchBrands = async () => {
    setLoading(true)
    setError(null)
    try {
      const sp = new URLSearchParams()
      if (q) sp.set("q", q)
      sp.set("page", String(page))
      sp.set("pageSize", String(pageSize))
      sp.set("sort", sort)
      const res = await fetch(`/api/brands?${sp.toString()}`, { cache: "no-store" })
      const json: ApiResp<Brand> = await res.json()
      if (!res.ok) throw new Error((json as any).error || "Erreur serveur")
      setItems(json.data || [])
    } catch (e: any) {
      setError(e.message || "Erreur")
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBrands()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, page, pageSize, sort])

  useEffect(() => {
    router.replace(
      buildUrl({ q: q || undefined, page, pageSize, sort }),
      { scroll: false }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, page, pageSize, sort])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchBrands()
  }

  const total = Number(searchParams?.get("total") || 0)
  const totalPages = Number(searchParams?.get("totalPages") || 0)

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Toolbar */}
      <form onSubmit={handleSearch} className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une marque…"
          className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
        />
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value as any); setPage(1) }}
          className="h-10 w-full rounded-md border border-gray-300 px-2 text-sm"
        >
          <option value="name">Nom (A→Z)</option>
          <option value="newest">Plus récentes</option>
          <option value="oldest">Plus anciennes</option>
        </select>
        <div className="flex items-center justify-end">
          <Button type="submit" size="sm" className="w-full sm:w-auto">Rechercher</Button>
        </div>
      </form>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-600">Aucune marque trouvée.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((b) => (
            <Link key={b.id} href={b.slug ? `/brands/${b.slug}` : `/suppliers/${b.id}`} className="group">
              <div className="rounded-lg border bg-white p-4 flex items-center justify-center h-24">
                {b.logo_url ? (
                  <Image
                    src={b.logo_url}
                    alt={b.name}
                    width={160}
                    height={64}
                    className="object-contain max-h-12 grayscale group-hover:grayscale-0 transition"
                  />
                ) : (
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition">
                    {b.name}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Précédent
        </Button>
        <div className="text-sm text-gray-600">Page {page}</div>
        <Button variant="outline" size="sm" disabled={loading || items.length < pageSize} onClick={() => setPage((p) => p + 1)}>
          Suivant
        </Button>
      </div>
    </div>
  )
}