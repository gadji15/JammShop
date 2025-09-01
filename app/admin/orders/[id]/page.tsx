"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import Link from "next/link"

interface OrderItem {
  id: string
  product_id: string
  quantity: number
  unit_price: number
  products?: {
    name: string
    slug: string
    images?: string[]
  } | null
}

interface OrderDetail {
  id: string
  order_number: string
  status: string
  payment_status: string
  total_amount: number
  created_at: string
  shipping_address?: any
  billing_address?: any
  profiles: {
    id: string
    full_name: string
    email: string
    phone?: string
  } | null
  order_items: OrderItem[]
}

const statusOptions = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const

const statusColor = (status: string) => {
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

const paymentColor = (status: string) => {
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

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const router = useRouter()
  const supabase = createClient()

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          profiles!orders_user_id_fkey (id, full_name, email, phone),
          order_items (
            id, product_id, quantity, unit_price,
            products:products!order_items_product_id_fkey (name, slug, images)
          )
        `)
        .eq("id", id)
        .single()

      if (error || !data) {
        toast.error("Commande introuvable")
        router.push("/admin/orders")
        return
      }

      // Normalize items join (depending on alias)
      const orderItems: OrderItem[] = (data.order_items || []).map((it: any) => ({
        id: it.id,
        product_id: it.product_id,
        quantity: it.quantity,
        unit_price: it.unit_price,
        products: it.products ?? null,
      }))

      setOrder({
        id: data.id,
        order_number: data.order_number,
        status: data.status,
        payment_status: data.payment_status,
        total_amount: data.total_amount,
        created_at: data.created_at,
        shipping_address: data.shipping_address,
        billing_address: data.billing_address,
        profiles: data.profiles,
        order_items: orderItems,
      })
      setLoading(false)
    }
    if (id) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const updateStatus = async (newStatus: string) => {
    if (!order) return
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", order.id)
    if (error) {
      toast.error("Échec de la mise à jour du statut")
      return
    }
    toast.success("Statut mis à jour")
    setOrder({ ...order, status: newStatus })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Commande {order.order_number}</h1>
          <p className="text-gray-600">Créée le {new Date(order.created_at).toLocaleDateString("fr-FR")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.print()}>Imprimer</Button>
          <Button variant="outline" onClick={() => router.push("/admin/orders")}>Retour</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Articles ({order.order_items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border rounded-lg p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded overflow-hidden bg-gray-100">
                        {/* Using img to avoid next/image config complexities here */}
                        <img
                          src={item.products?.images?.[0] || "/placeholder.svg?height=64&width=64"}
                          alt={item.products?.name || "Produit"}
                          className="w-16 h-16 object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium">{item.products?.name || "Produit supprimé"}</div>
                        {item.products?.slug && (
                          <Link className="text-sm text-blue-600 hover:underline" href={`/products/${item.products.slug}`} target="_blank">
                            Voir sur le site
                          </Link>
                        )}
                        <div className="text-sm text-gray-500">Qté: {item.quantity}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{(item.unit_price * item.quantity).toFixed(2)} €</div>
                      <div className="text-sm text-gray-500">{item.unit_price.toFixed(2)} € /u</div>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="flex items-center justify-end text-xl font-bold">
                Total: {order.total_amount.toFixed(2)} €
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statuts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Statut commande</div>
                <Select value={order.status} onValueChange={updateStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Changer le statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge className={statusColor(order.status)}>{order.status}</Badge>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Statut paiement</div>
                <Badge className={paymentColor(order.payment_status)}>{order.payment_status}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="font-medium">{order.profiles?.full_name || "Client supprimé"}</div>
              <div className="text-gray-600">{order.profiles?.email}</div>
              {order.profiles?.id && (
                <Link className="text-sm text-blue-600 hover:underline" href={`/admin/users/${order.profiles.id}`}>
                  Ouvrir la fiche utilisateur
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Adresses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700">Livraison</div>
                <div className="text-sm text-gray-600 whitespace-pre-line">
                  {order.shipping_address ? JSON.stringify(order.shipping_address, null, 2) : "—"}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700">Facturation</div>
                <div className="text-sm text-gray-600 whitespace-pre-line">
                  {order.billing_address ? JSON.stringify(order.billing_address, null, 2) : "—"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}