"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ProductWithDetails } from "@/lib/types/database"
import { Edit, Eye, Plus, Search, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"

type Order = "asc" | "desc"

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Server-driven controls
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [q, setQ] = useState("")
  const [active, setActive] = useState<string | null>(null) // "1" | "0" | null
  const [featured, setFeatured] = useState<string | null>(null) // "1" | null
  const [stock, setStock] = useState<string | null>(null) // "low" | "out" | null
  const [sort, setSort] = useState("created_at")
  const [order, setOrder] = useState<Order>("desc")
  const [total, setTotal] = useState(0)

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const p = new URLSearchParams()
      p.set("page", String(page))
      p.set("pageSize", String(pageSize))
      if (q) p.set("q", q)
      if (active) p.set("active", active)
      if (featured) p.set("featured", featured)
      if (stock) p.set("stock", stock)
      if (sort) p.set("sort", sort)
      if (order) p.set("order", order)

      const res = await fetch(`/api/admin/products?${p.toString()}`, { cache: "no-store" })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || "Chargement impossible")
      }
      const json = await res.json()
      setProducts(json.data || [])
      setTotal(json.total || 0)
    } catch (e: any) {
      setError(e?.message || "Erreur")
      setProducts([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, q, active, featured, stock, sort, order])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const onSearch = (v: string) => {
    setQ(v)
    setPage(1)
  }

  const toggleSort = (key: string) => {
    if (sort === key) {
      setOrder(order === "asc" ? "desc" : "asc")
    } else {
      setSort(key)
      setOrder("asc")
    }
  }

  const handleDelete = async (productId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || "Suppression impossible")
      }
      fetchProducts()
    } catch (error) {
      console.error("Error deleting product:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Produits</h1>
          <p className="text-gray-600">Gérez votre catalogue de produits</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau produit
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des produits {total ? `(${total})` : ""}</CardTitle>
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher (nom, SKU)..."
                value={q}
                onChange={(e) => onSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={active === "1" ? "default" : "outline"}
                onClick={() => {
                  setActive(active === "1" ? null : "1")
                  setPage(1)
                }}
              >
                Actifs
              </Button>
              <Button
                variant={featured === "1" ? "default" : "outline"}
                onClick={() => {
                  setFeatured(featured === "1" ? null : "1")
                  setPage(1)
                }}
              >
                Vedette
              </Button>
              <Button
                variant={stock === "low" ? "default" : "outline"}
                onClick={() => {
                  setStock(stock === "low" ? null : "low")
                  setPage(1)
                }}
              >
                Stock faible
              </Button>
              <Button
                variant={stock === "out" ? "default" : "outline"}
                onClick={() => {
                  setStock(stock === "out" ? null : "out")
                  setPage(1)
                }}
              >
                Rupture
              </Button>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                onClick={() => {
                  setQ("")
                  setActive(null)
                  setFeatured(null)
                  setStock(null)
                  setSort("created_at")
                  setOrder("desc")
                  setPage(1)
                }}
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-3 text-sm text-red-600">Erreur: {error}</div>}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("name")}
                    title="Trier par nom"
                  >
                    Produit {sort === "name" ? (order === "asc" ? "▲" : "▼") : ""}
                  </TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("price")}
                    title="Trier par prix"
                  >
                    Prix {sort === "price" ? (order === "asc" ? "▲" : "▼") : ""}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("stock_quantity")}
                    title="Trier par stock"
                  >
                    Stock {sort === "stock_quantity" ? (order === "asc" ? "▲" : "▼") : ""}
                  </TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell colSpan={7}>
                        <div className="h-10 bg-gray-100 rounded" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="text-center py-8 text-gray-500">Aucun produit trouvé</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product: any) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 relative rounded-md overflow-hidden bg-gray-100">
                            <Image
                              src={product.images?.[0] || "/placeholder.svg?height=48&width=48&query=product"}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-500 line-clamp-1">{product.short_description}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">{product.sku || "N/A"}</code>
                      </TableCell>
                      <TableCell>{product.categories?.name || "Non catégorisé"}</TableCell>
                      <TableCell>
                        <div>
                          <span className="font-semibold">{Number(product.price).toFixed(2)} €</span>
                          {product.compare_price && (
                            <div className="text-sm text-gray-500 line-through">
                              {Number(product.compare_price).toFixed(2)} €
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            product.stock_quantity === 0
                              ? "destructive"
                              : product.stock_quantity <= product.low_stock_threshold
                              ? "secondary"
                              : "default"
                          }
                        >
                          {product.stock_quantity} unités
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.is_active ? "default" : "secondary"}>
                          {product.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/products/${product.slug}`} target="_blank">
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/admin/products/${product.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Page {page} / {totalPages} — {total} élément(s)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Suivant
              </Button>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className="border rounded px-2 py-1 text-sm"
              >
                {[10, 20, 30, 50, 100].map((s) => (
                  <option key={s} value={s}>
                    {s} / page
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
