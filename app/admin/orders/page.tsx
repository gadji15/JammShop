"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Search, Download } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

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
  const [status, setStatus] = useState("all")
  const [sort, setSort] = useState("created_at")
  const [order, setOrder] = useState<OrderDir>("desc")
  const [total, setTotal] = useState(0)

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const p = new URLSearchParams()
      p.set("page", String(page))
      p.set("pageSize", String(pageSize))
      if (q) p.set("q", q)
      if (status && status !== "all") p.set("status", status)
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
  }, [page, pageSize, q, status, sort, order])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

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
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Commandes</h1>
        <p className="text-gray-600">Gérez toutes les commandes de votre boutique</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des commandes {total ? `(${total})` : ""}</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px] md:max-w-sm">
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
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmée</SelectItem>
                <SelectItem value="processing">En traitement</SelectItem>
                <SelectItem value="shipped">Expédiée</SelectItem>
                <SelectItem value="delivered">Livrée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setQ("")
                  setStatus("all")
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
                    onClick={() => toggleSort("order_number")}
                    title="Trier par numéro"
                  >
                    Numéro {sort === "order_number" ? (order === "asc" ? "▲" : "▼") : ""}
                  </TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("created_at")}
                    title="Trier par date"
                  >
                    Date {sort === "created_at" ? (order === "asc" ? "▲" : "▼") : ""}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("total_amount")}
                    title="Trier par montant"
                  >
                    Montant {sort === "total_amount" ? (order === "asc" ? "▲" : "▼") : ""}
                  </TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Paiement</TableHead>
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
                      <TableCell>{new Date(order.created_at).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell>
                        <span className="font-semibold">{order.total_amount.toFixed(2)} €</span>
                      </TableCell>
                      <TableCell>
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
                      <TableCell>
                        <Badge className={getPaymentStatusColor(order.payment_status)}>{order.payment_status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" asChild>
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
