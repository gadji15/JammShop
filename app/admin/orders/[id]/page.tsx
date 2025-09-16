"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, RefreshCcw } from "lucide-react"

type OrderItem = {
  id: string
  product_id: string
  quantity: number
  unit_price: number
  products?: {
    id: string
    name: string
    slug: string
    images?: string[]
    price?: number
  } | null
}

type OrderDetail = {
  id: string
  order_number: string
  status: string
  payment_status: string
  total_amount: number
  created_at: string
  user_id: string | null
  shipping_address?: any | null
  billing_address?: any | null
  profiles?: {
    full_name?: string | null
    email?: string | null
  } | null
  order_items?: OrderItem[]
}

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [order, setOrder] = useState<OrderDetail | null>(null)

  const fetchOrder = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/admin/orders/${params.id}`, { cache: "no-store" })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || "Chargement impossible")
      }
      const json = await res.json()
      setOrder(json.data as OrderDetail)
    } catch (e: any) {
      setError(e?.message || "Erreur")
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrder()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id])

  const items = useMemo(() => order?.order_items || [], [order])

  const setStatus = async (status: string) => {
    if (!order) return
    setSaving(true)
    try {
      await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      await fetchOrder()
    } catch (e) {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const setPaymentStatus = async (payment_status: string) => {
    if (!order) return
    setSaving(true)
    try {
      await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status }),
      })
      await fetchOrder()
    } catch (e) {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
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

  const getPaymentBadge = (ps: string) => {
    switch (ps) {
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
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/orders")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Détail commande {order?.order_number ? `#${order.order_number}` : ""}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchOrder}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-24 bg-gray-100 rounded animate-pulse" />
          <div className="h-80 bg-gray-100 rounded animate-pulse" />
        </div>
      ) : error ? (
        <div className="text-sm text-red-600">Erreur: {error}</div>
      ) : !order ? (
        <div className="text-gray-600">Commande introuvable.</div>
      ) : (
        <>
          {/* Summary card */}
          <Card>
            <CardHeader>
              <CardTitle>Résumé</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-500">Date</div>
                <div className="font-medium">
                  {new Date(order.created_at).toLocaleString("fr-FR")}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Client</div>
                <div className="font-medium">
                  {order.profiles?.full_name || "Client"}{" "}
                  <span className="text-gray-500">({order.profiles?.email || "—"})</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Montant</div>
                <div className="font-semibold">{order.total_amount?.toFixed(2)} €</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-gray-500 w-28">Statut</div>
                <Select value={order.status} onValueChange={setStatus} disabled={saving}>
                  <SelectTrigger className="w-40">
                    <Badge className={getStatusBadge(order.status)}>{order.status}</Badge>
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
              </div>
              <div className="flex items-center gap-3">
                <div className="text-xs text-gray-500 w-28">Paiement</div>
                <Select value={order.payment_status} onValueChange={setPaymentStatus} disabled={saving}>
                  <SelectTrigger className="w-40">
                    <Badge className={getPaymentBadge(order.payment_status)}>{order.payment_status}</Badge>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Payé</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="failed">Échec</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Articles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>PU</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <div className="text-gray-500">Aucun article</div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((it) => {
                        const img = it.products?.images?.[0] || "/placeholder.svg?height=48&width=48&query=product"
                        const name = it.products?.name || it.product_id
                        const link = it.products?.slug ? `/products/${it.products.slug}` : undefined
                        const unit = Number(it.unit_price ?? it.products?.price ?? 0)
                        const subtotal = unit * (it.quantity || 0)
                        return (
                          <TableRow key={it.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="relative h-12 w-12 rounded overflow-hidden bg-gray-100">
                                  <Image src={img} alt={name} fill className="object-cover" />
                                </div>
                                <div className="min-w-0">
                                  {link ? (
                                    <Link href={link} target="_blank" className="font-medium hover:text-blue-600">
                                      {name}
                                    </Link>
                                  ) : (
                                    <div className="font-medium">{name}</div>
                                  )}
                                  <div className="text-xs text-gray-500">ID: {it.product_id}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{unit.toFixed(2)} €</TableCell>
                            <TableCell>{it.quantity}</TableCell>
                            <TableCell className="font-semibold">{subtotal.toFixed(2)} €</TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Addresses (if available) */}
          {(order.shipping_address || order.billing_address) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {order.shipping_address && (
                <Card>
                  <CardHeader>
                    <CardTitle>Adresse de livraison</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-700 space-y-1">
                    <pre className="whitespace-pre-wrap break-words">{JSON.stringify(order.shipping_address, null, 2)}</pre>
                  </CardContent>
                </Card>
              )}
              {order.billing_address && (
                <Card>
                  <CardHeader>
                    <CardTitle>Adresse de facturation</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-700 space-y-1">
                    <pre className="whitespace-pre-wrap break-words">{JSON.stringify(order.billing_address, null, 2)}</pre>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}