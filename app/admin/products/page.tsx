"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import type { ProductWithDetails } from "@/lib/types/database"
import { Edit, Eye, Plus, Search, Trash2, Download, Filter, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Order = "asc" | "desc"

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Server-driven controls
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [q, setQ] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)
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
      if (debouncedQ) p.set("q", debouncedQ)
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
  }, [page, pageSize, debouncedQ, active, featured, stock, sort, order])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

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

  const exportCsvPage = () => {
    try {
      if (!products || products.length === 0) {
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
        ...products.map((r: any) =>
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

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[220px] md:max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher (nom, SKU)..."
                  value={q}
                  onChange={(e) => onSearch(e.target.value)}
                  className="pl-8"
                />
              </div>

              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filtres
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Filtres avancés</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Actifs</span>
                      <div>
                        <select
                          className="border rounded px-2 py-2 text-sm w-full"
                          value={active || "all"}
                          onChange={(e) => {
                            const v = e.target.value
                            setActive(v === "all" ? null : "1")
                            setPage(1)
                          }}
                        >
                          <option value="all">Tous</option>
                          <option value="1">Actifs</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-sm font-medium">Vedettes</span>
                      <div>
                        <select
                          className="border rounded px-2 py-2 text-sm w-full"
                          value={featured || "all"}
                          onChange={(e) => {
                            const v = e.target.value
                            setFeatured(v === "all" ? null : "1")
                            setPage(1)
                          }}
                        >
                          <option value="all">Toutes</option>
                          <option value="1">Vedette</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-sm font-medium">Stock</span>
                      <div>
                        <select
                          className="border rounded px-2 py-2 text-sm w-full"
                          value={stock || "all"}
                          onChange={(e) => {
                            const v = e.target.value
                            setStock(v === "all" ? null : v)
                            setPage(1)
                          }}
                        >
                          <option value="all">Tous</option>
                          <option value="low">Stock faible</option>
                          <option value="out">Rupture</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        className="flex-1"
                        onClick={() => {
                          setFiltersOpen(false)
                          setPage(1)
                          fetchProducts()
                        }}
                      >
                        Appliquer
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
                          setFiltersOpen(false)
                        }}
                      >
                        Réinitialiser
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <MoreHorizontal className="h-4 w-4" />
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={selectAllPage}>Sélection page</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled={selected.length === 0} onClick={() => runBulk("setActive")}>
                    Activer
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={selected.length === 0} onClick={() => runBulk("setInactive")}>
                    Désactiver
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={selected.length === 0} onClick={() => runBulk("setFeatured")}>
                    Vedette +
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={selected.length === 0} onClick={() => runBulk("unsetFeatured")}>
                    Vedette -
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={selected.length === 0} onClick={() => runBulk("applyDiscountPercent")}>
                    Remise %
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={selected.length === 0} onClick={() => runBulk("resetPromotions")}>
                    Reset promos
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={selected.length === 0} onClick={() => runBulk("delete")}>
                    Supprimer
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={exportCsvPage}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV (page)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
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
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Chips filtres actifs */}
            {(q || active === "1" || featured === "1" || stock) && (
              <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                {q && <span className="px-2 py-1 bg-gray-100 rounded">Recherche: “{q}”</span>}
                {active === "1" && <span className="px-2 py-1 bg-gray-100 rounded">Actifs</span>}
                {featured === "1" && <span className="px-2 py-1 bg-gray-100 rounded">Vedette</span>}
                {stock && <span className="px-2 py-1 bg-gray-100 rounded">Stock: {stock}</span>}
              </div>
            )}
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
                  <TableHead className="hidden sm:table-cell">SKU</TableHead>
                  <TableHead className="hidden md:table-cell">Catégorie</TableHead>
                  <TableHead
                    className="cursor-pointer hidden lg:table-cell"
                    onClick={() => toggleSort("price")}
                    title="Trier par prix"
                  >
                    Prix {sort === "price" ? (order === "asc" ? "▲" : "▼") : ""}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hidden md:table-cell"
                    onClick={() => toggleSort("stock_quantity")}
                    title="Trier par stock"
                  >
                    Stock {sort === "stock_quantity" ? (order === "asc" ? "▲" : "▼") : ""}
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">Statut</TableHead>
                  <TableHead className="w-16 text-right">Actions</TableHead>
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
          <div className="mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-sm text-gray-600 order-2 sm:order-1 text-center sm:text-left">
                Page {page} / {totalPages} — {total} élément(s)
              </div>

              <div className="order-1 sm:order-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Précédent"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="min-w-[72px] text-center text-sm">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Suivant"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline text-sm text-gray-600">Lignes</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setPage(1)
                    }}
                    className="border rounded px-2 py-1 text-sm bg-transparent"
                    aria-label="Lignes par page"
                  >
                    {[10, 20, 30, 50, 100].map((s) => (
                      <option key={s} value={s}>
                        {s} / page
                      </option>
                    ))}
                  </select>
                </div>
              </div>
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
