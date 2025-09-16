"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { ProductWithDetails } from "@/lib/types/database"
import { Edit, Eye, Plus, Search, Trash2, Download } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

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

  // Bulk selection
  const [selected, setSelected] = useState<string[]>([])

  // Edit drawer
  const [editOpen, setEditOpen] = useState(false)
  const [editItem, setEditItem] = useState<any | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    short_description: "",
    price: "",
    compare_price: "",
    stock_quantity: "",
    is_active: false as boolean,
    is_featured: false as boolean,
  })

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
      setSelected([]) // reset selection when data changes
    } catch (e: any) {
      setError(e?.message || "Erreur")
      setProducts([])
      setTotal(0)
      setSelected([])
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

  const toggleSelected = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const selectAllPage = () => {
    const ids = products.map((p: any) => p.id)
    const allSelected = ids.every((id) => selected.includes(id))
    if (allSelected) {
      setSelected((prev) => prev.filter((id) => !ids.includes(id)))
    } else {
      // add missing
      setSelected((prev) => Array.from(new Set([...prev, ...ids])))
    }
  }

  const runBulk = async (action: string) => {
    if (selected.length === 0) {
      alert("Sélectionnez au moins un produit.")
      return
    }
    let body: any = { ids: selected, action }
    if (action === "applyDiscountPercent") {
      const input = window.prompt("Pourcentage de remise (%)", "10")
      const percent = Number(input)
      if (!Number.isFinite(percent) || percent <= 0 || percent >= 100) {
        alert("Pourcentage invalide.")
        return
      }
      body.percent = percent
    }
    if (action === "delete" && !confirm(`Supprimer ${selected.length} produit(s) ?`)) return
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || "Action impossible")
      }
      await fetchProducts()
      alert("Action exécutée.")
    } catch (e) {
      console.error(e)
      alert("Erreur lors de l'action.")
    }
  }

  const openEdit = (p: any) => {
    setEditItem(p)
    setEditForm({
      name: p.name || "",
      short_description: p.short_description || "",
      price: String(p.price ?? ""),
      compare_price: String(p.compare_price ?? ""),
      stock_quantity: String(p.stock_quantity ?? ""),
      is_active: !!p.is_active,
      is_featured: !!p.is_featured,
    })
    setEditOpen(true)
  }

  const saveEdit = async () => {
    if (!editItem) return
    setEditSaving(true)
    try {
      const payload: any = {
        name: editForm.name,
        short_description: editForm.short_description,
        price: editForm.price ? Number(editForm.price) : undefined,
        compare_price: editForm.compare_price ? Number(editForm.compare_price) : null,
        stock_quantity: editForm.stock_quantity ? Number(editForm.stock_quantity) : undefined,
        is_active: editForm.is_active,
        is_featured: editForm.is_featured,
      }
      const res = await fetch(`/api/admin/products/${editItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || "Sauvegarde impossible")
      }
      await fetchProducts()
      setEditOpen(false)
    } catch (e) {
      console.error(e)
      alert("Erreur lors de la sauvegarde")
    } finally {
      setEditSaving(false)
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

            {/* Quick filters */}
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

            {/* Bulk actions */}
            <div className="flex flex-wrap gap-2 md:ml-auto">
              <Button variant="outline" onClick={selectAllPage}>Sélection page</Button>
              <Button variant="outline" onClick={() => runBulk("setActive")} disabled={selected.length === 0}>
                Activer
              </Button>
              <Button variant="outline" onClick={() => runBulk("setInactive")} disabled={selected.length === 0}>
                Désactiver
              </Button>
              <Button variant="outline" onClick={() => runBulk("setFeatured")} disabled={selected.length === 0}>
                Vedette +
              </Button>
              <Button variant="outline" onClick={() => runBulk("unsetFeatured")} disabled={selected.length === 0}>
                Vedette -
              </Button>
              <Button variant="outline" onClick={() => runBulk("applyDiscountPercent")} disabled={selected.length === 0}>
                Remise %
              </Button>
              <Button variant="outline" onClick={() => runBulk("resetPromotions")} disabled={selected.length === 0}>
                Reset promos
              </Button>
              <Button variant="destructive" onClick={() => runBulk("delete")} disabled={selected.length === 0}>
                Supprimer
              </Button>
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
                  <TableHead className="w-8">
                    <input
                      type="checkbox"
                      aria-label="Tout sélectionner"
                      onChange={selectAllPage}
                      checked={products.length > 0 && products.every((p: any) => selected.includes(p.id))}
                    />
                  </TableHead>
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
                      <TableCell colSpan={8}>
                        <div className="h-10 bg-gray-100 rounded" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <div className="text-center py-8 text-gray-500">Aucun produit trouvé</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product: any) => (
                    <TableRow key={product.id}>
                      <TableCell className="w-8">
                        <input
                          type="checkbox"
                          aria-label="Sélectionner"
                          checked={selected.includes(product.id)}
                          onChange={() => toggleSelected(product.id)}
                        />
                      </TableCell>
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
                          <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                            <Edit className="h-4 w-4" />
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
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const rows = products
                    if (!rows || rows.length === 0) {
                      toast.info("Aucune donnée à exporter (page vide)")
                      return
                    }
                    const header = [
                      "id",
                      "name",
                      "sku",
                      "category",
                      "price",
                      "compare_price",
                      "stock_quantity",
                      "is_active",
                      "is_featured",
                      "created_at",
                    ]
                    const csvRows = [
                      header.join(","),
                      ...rows.map((r: any) =>
                        [
                          r.id,
                          JSON.stringify(r.name || ""),
                          JSON.stringify(r.sku || ""),
                          JSON.stringify(r.categories?.name || ""),
                          r.price ?? "",
                          r.compare_price ?? "",
                          r.stock_quantity ?? "",
                          r.is_active ? "1" : "0",
                          r.is_featured ? "1" : "0",
                          r.created_at || "",
                        ].join(","),
                      ),
                    ]
                    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8" })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `products_page_${page}.csv`
                    a.click()
                    URL.revokeObjectURL(url)
                  } catch {
                    toast.error("Export CSV impossible")
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV (page)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Drawer */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Éditer le produit</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-sm font-medium">Nom</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description courte</label>
              <Input
                value={editForm.short_description}
                onChange={(e) => setEditForm((f) => ({ ...f, short_description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Prix</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Prix comparé</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editForm.compare_price}
                  onChange={(e) => setEditForm((f) => ({ ...f, compare_price: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Stock</label>
              <Input
                type="number"
                value={editForm.stock_quantity}
                onChange={(e) => setEditForm((f) => ({ ...f, stock_quantity: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
                Actif
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editForm.is_featured}
                  onChange={(e) => setEditForm((f) => ({ ...f, is_featured: e.target.checked }))}
                />
                Vedette
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={saveEdit} disabled={editSaving} className="bg-blue-600 hover:bg-blue-700">
                {editSaving ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Annuler
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
