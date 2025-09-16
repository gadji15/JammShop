"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Search, Download, Filter, MoreHorizontal } from "lucide-react"
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

interface Order {
  id: string
  order_number: string
  status: string
  payment_status: string
  total_amount: number
  created_at: string
  profiles: {
    full_name: string
    email: string
  } | null
}

type OrderDir = "asc" | "desc"

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // server-driven
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [q, setQ] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")
  const [status, setStatus] = useState("all")
  const [payment, setPayment] = useState("all")
  const [start, setStart] = useState<string>("")
  const [end, setEnd] = useState<string>("")
  const [sort, setSort] = useState("created_at")
  const [order, setOrder] = useState<OrderDir>("desc")
  const [total, setTotal] = useState(0)

  const [filtersOpen, setFiltersOpen] = useState(false)

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(t)
  }, [q])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const p = new URLSearchParams()
      p.set("page", String(page))
      p.set("pageSize", String(pageSize))
      if (debouncedQ) p.set("q", debouncedQ)
      if (status && status !== "all") p.set("status", status)
      if (payment && payment !== "all") p.set("payment", payment)
      if (start) p.set("start", start)
      if (end) p.set("end", end)
      if (sort) p.set("sort", sort)
      if (order) p.set("order", order)
      const res = await fetch(`/api/admin/orders?${p.toString()}`, { cache: "no-store" })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || "Chargement impossible")
      }
      const json = await res.json()
      setOrders(json.data || [])
      setTotal(json.total || 0)
    } catch (e: any) {
      setError(e?.message || "Erreur")
      setOrders([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, debouncedQ, status, payment, start, end, sort, order])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const resetFilters = () => {
    setQ("")
    setStatus("all")
    setPayment("all")
    setStart("")
    setEnd("")
    setSort("created_at")
    setOrder("desc")
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "processing":
        return "bg-purple-100 text-purple-800"
      case "shipped":
        return "bg-indigo-100 text-indigo-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "refunded":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const exportCsvPage = () => {
    try {
      if (!orders || orders.length === 0) {
        toast.info("Aucune donnée à exporter (page vide)")
        return
      }
      const header = [
        "id",
        "order_number",
        "customer_name",
        "customer_email",
        "status",
        "payment_status",
        "total_amount",
        "created_at",
      ]
      const csvRows = [
        header.join(","),
        ...orders.map((o) =>
          [
            o.id,
            JSON.stringify(o.order_number || ""),
            JSON.stringify(o.profiles?.full_name || ""),
            JSON.stringify(o.profiles?.email || ""),
            o.status || "",
            o.payment_status || "",
            (o.total_amount ?? "").toString(),
            o.created_at || "",
          ].join(","),
        ),
      ]
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `orders_page_${page}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error("Export CSV impossible")
    }
  }

  const hasActiveFilters = status !== "all" || payment !== "all" || !!start || !!end || !!debouncedQ

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Commandes</h1>
        <p className="text-gray-600">Gérez toutes les commandes de votre boutique</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[220px] md:max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher (numéro, client, email)"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value)
                    setPage(1)
                  }}
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
                      <span className="text-sm font-medium">Statut</span>
                      <Select
                        value={status}
                        onValueChange={(v) => {
                          setStatus(v)
                          setPage(1)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="confirmed">Confirmée</SelectItem>
                          <SelectItem value="processing">En traitement</SelectItem>
                          <SelectItem value="shipped">Expédiée</SelectItem>
                          <SelectItem value="delivered">Livrée</SelectItem>
                          <SelectItem value="cancelled">Annulée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <span className="text-sm font-medium">Paiement</span>
                      <Select
                        value={payment}
                        onValueChange={(v) => {
                          setPayment(v)
                          setPage(1)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Paiement" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="paid">Payé</SelectItem>
                          <SelectItem value="failed">Échoué</SelectItem>
                          <SelectItem value="refunded">Remboursé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <span className="text-sm font-medium">Période</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                          type="date"
                          value={start || ""}
                          onChange={(e) => {
                            setStart(e.target.value || "")
                            setPage(1)
                          }}
                        />
                        <Input
                          type="date"
                          value={end || ""}
                          onChange={(e) => {
                            setEnd(e.target.value || "")
                            setPage(1)
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        className="flex-1"
                        onClick={() => {
                          setFiltersOpen(false)
                          setPage(1)
                          fetchOrders()
                        }}
                      >
                        Appliquer
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          resetFilters()
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
                  <DropdownMenuItem onClick={exportCsvPage}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV (page)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      resetFilters()
                    }}
                  >
                    Réinitialiser
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                {debouncedQ && <span className="px-2 py-1 bg-gray-100 rounded">Recherche: “{debouncedQ}”</span>}
                {status !== "all" && <span className="px-2 py-1 bg-gray-100 rounded">Statut: {status}</span>}
                {payment !== "all" && <span className="px-2 py-1 bg-gray-100 rounded">Paiement: {payment}</span>}
                {(start || end) && (
                  <span className="px-2 py-1 bg-gray-100 rounded">
                    Période: {start || "…"} → {end || "…"}
                  </span>
                )}
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
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("order_number")}
                    title="Trier par numéro"
                  >
                    Numéro {sort === "order_number" ? (order === "asc" ? "▲" : "▼") : ""}
                  </TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead
                    className="cursor-pointer hidden md:table-cell"
                    onClick={() => toggleSort("created_at")}
                    title="Trier par date"
                  >
                    Date {sort === "created_at" ? (order === "asc" ? "▲" : "▼") : ""}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hidden lg:table-cell"
                    onClick={() => toggleSort("total_amount")}
                    title="Trier par montant"
                  >
                    Montant {sort === "total_amount" ? (order === "asc" ? "▲" : "▼") : ""}
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">Statut</TableHead>
                  <TableHead className="hidden md:table-cell">Paiement</TableHead>
                  <TableHead className="w-12 text-right">Actions</TableHead>
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
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="text-center py-8 text-gray-500">Aucune commande trouvée</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">{order.order_number}</code>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.profiles?.full_name || "Client supprimé"}</p>
                          <p className="text-sm text-gray-500">{order.profiles?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(order.created_at).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="font-semibold">{order.total_amount.toFixed(2)} €</span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Select
                          value={order.status}
                          onValueChange={async (value) => {
                            try {
                              const res = await fetch(`/api/admin/orders/${order.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ status: value }),
                              })
                              if (!res.ok) {
                                const j = await res.json().catch(() => ({}))
                                throw new Error(j?.error || "Mise à jour impossible")
                              }
                              toast.success("Statut mis à jour")
                              fetchOrders()
                            } catch (e) {
                              toast.error("Erreur lors de la mise à jour du statut")
                            }
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="confirmed">Confirmée</SelectItem>
                            <SelectItem value="processing">En traitement</SelectItem>
                            <SelectItem value="shipped">Expédiée</SelectItem>
                            <SelectItem value="delivered">Livrée</SelectItem>
                            <SelectItem value="cancelled">Annulée</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge className={getPaymentStatusColor(order.payment_status)}>{order.payment_status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" asChild aria-label="Voir">
                          <Link href={`/admin/orders/${order.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
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
