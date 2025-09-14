"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import { CheckCircle2, Percent, RefreshCcw, Search, Trash2 } from "lucide-react"

type ProductRow = {
  id: string
  name: string
  slug: string
  price: number
  compare_price: number | null
  stock_quantity: number
  low_stock_threshold: number
  images: string[]
  created_at: string
  categories?: { id: string; name: string; slug: string } | null
  is_active: boolean
}

type WithDiscount = ProductRow & { discount: number }

export default function AdminDealsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<WithDiscount[]>([])
  const [query, setQuery] = useState("")
  const [minDiscount, setMinDiscount] = useState(5)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [bulkPct, setBulkPct] = useState(15)

  const selectedIds = useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected])

  useEffect(() => {
    fetchRows()
  }, [])

  const fetchRows = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("products")
        .select(
          `
            *,
            categories (*)
          `,
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) throw error

      const mapped: WithDiscount[] =
        (data || []).map((p: any) => {
          const price = Number(p.price || 0)
          const compare = p.compare_price != null ? Number(p.compare_price) : null
          const discount =
            compare != null && compare > 0 && price < compare ? Math.round(((compare - price) / compare) * 100) : 0
          return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            price,
            compare_price: compare,
            stock_quantity: Number(p.stock_quantity || 0),
            low_stock_threshold: Number(p.low_stock_threshold || 0),
            images: Array.isArray(p.images) ? p.images : [],
            created_at: p.created_at,
            categories: p.categories ? { id: p.categories.id, name: p.categories.name, slug: p.categories.slug } : null,
            is_active: !!p.is_active,
            discount,
          }
        }) || []

      setRows(mapped)
    } catch (e) {
      console.error(e)
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter(
      (r) =>
        r.discount >= minDiscount &&
        (!q ||
          r.name.toLowerCase().includes(q) ||
          r.slug.toLowerCase().includes(q) ||
          r.categories?.name.toLowerCase().includes(q)),
    )
  }, [rows, query, minDiscount])

  const applyBulkDiscount = async () => {
    const pct = Math.max(1, Math.min(95, Math.round(bulkPct)))
    if (selectedIds.length === 0) return
    setLoading(true)
    try {
      // For each selected: if compare_price is null or <= price, set compare_price=price; then set price=price*(1-pct)
      const updates = selectedIds.map(async (id) => {
        const row = rows.find((r) => r.id === id)
        if (!row) return
        const currentPrice = Number(row.price)
        const currentCompare = row.compare_price != null ? Number(row.compare_price) : null
        const newCompare = currentCompare != null && currentCompare > currentPrice ? currentCompare : currentPrice
        const newPrice = Math.max(0.01, Number((newCompare * (1 - pct / 100)).toFixed(2)))
        const { error } = await supabase.from("products").update({ compare_price: newCompare, price: newPrice }).eq("id", id)
        if (error) throw error
      })
      await Promise.all(updates)
      await fetchRows()
      setSelected({})
    } catch (e) {
      console.error("Bulk discount error:", e)
    } finally {
      setLoading(false)
    }
  }

  const clearDiscounts = async () => {
    if (selectedIds.length === 0) return
    setLoading(true)
    try {
      const updates = selectedIds.map(async (id) => {
        const row = rows.find((r) => r.id === id)
        if (!row) return
        // Restore price to compare_price if present, then clear compare_price
        const newPrice = row.compare_price && row.compare_price > 0 ? Number(row.compare_price.toFixed(2)) : row.price
        const { error } = await supabase.from("products").update({ price: newPrice, compare_price: null }).eq("id", id)
        if (error) throw error
      })
      await Promise.all(updates)
      await fetchRows()
      setSelected({})
    } catch (e) {
      console.error("Clear discount error:", e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Promotions</h1>
          <p className="text-gray-600">Gérez les remises en appliquant des pourcentages ou en réinitialisant les promos.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchRows}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Link href="/deals" target="_blank">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Voir la page Offres
            </Button>
          </Link>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrer et actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Recherche produit/catégorie…"
                className="pl-8"
              />
            </div>

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
                onChange={(e) => setMinDiscount(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium tabular-nums w-10 text-right">{minDiscount}%</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Remise (batch)</label>
              <Input
                type="number"
                min={1}
                max={95}
                step={1}
                value={bulkPct}
                onChange={(e) => setBulkPct(Number(e.target.value))}
                className="w-24"
              />
              <Button onClick={applyBulkDiscount} disabled={loading || selectedIds.length === 0}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Appliquer aux sélectionnés
              </Button>
              <Button variant="outline" onClick={clearDiscounts} disabled={loading || selectedIds.length === 0}>
                <Trash2 className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Produits en promo ({filtered.filter((r) => r.discount > 0).length}) / Tous ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      aria-label="Tout sélectionner"
                      checked={
                        filtered.length > 0 && filtered.every((r) => selected[r.id])
                      }
                      onChange={(e) => {
                        const checked = e.target.checked
                        const next: Record<string, boolean> = {}
                        filtered.forEach((r) => (next[r.id] = checked))
                        setSelected(next)
                      }}
                    />
                  </TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Comparé</TableHead>
                  <TableHead>Réduc.</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Actif</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <div className="h-40 bg-gray-100 animate-pulse rounded" />
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-500">
                      Aucun produit trouvé avec ces critères.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={!!selected[r.id]}
                          onChange={(e) =>
                            setSelected((prev) => ({ ...prev, [r.id]: e.target.checked }))
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 rounded overflow-hidden bg-gray-100">
                            <Image
                              src={r.images?.[0] || "/placeholder.svg?height=48&width=48&query=product"}
                              alt={r.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-medium">{r.name}</div>
                            <div className="text-xs text-gray-500">/{r.slug}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{r.categories?.name || "—"}</TableCell>
                      <TableCell>{r.price.toFixed(2)} €</TableCell>
                      <TableCell>{r.compare_price ? `${r.compare_price.toFixed(2)} €` : "—"}</TableCell>
                      <TableCell>
                        {r.discount > 0 ? (
                          <Badge className="bg-red-600 text-white">-{r.discount}%</Badge>
                        ) : (
                          <span className="text-gray-500">0%</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            r.stock_quantity === 0
                              ? "destructive"
                              : r.stock_quantity <= r.low_stock_threshold
                              ? "secondary"
                              : "default"
                          }
                        >
                          {r.stock_quantity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.is_active ? "default" : "secondary"}>
                          {r.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={`/products/${r.slug}`} target="_blank">
                            <Button variant="outline" size="sm">Voir</Button>
                          </Link>
                          <Link href={`/admin/products/${r.id}/edit`}>
                            <Button variant="outline" size="sm">Éditer</Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}