"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { usePayments } from "@/lib/hooks/use-payments"
import { createClient } from "@/lib/supabase/client"
import { CreditCard, Smartphone, Wallet, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

const paymentMethods = {
  orange_money: {
    name: "Orange Money",
    icon: Smartphone,
    color: "bg-orange-500",
    description: "Payez avec votre compte Orange Money",
  },
  wave: {
    name: "Wave",
    icon: Wallet,
    color: "bg-blue-500",
    description: "Payez avec votre compte Wave",
  },
  free_money: {
    name: "Free Money",
    icon: CreditCard,
    color: "bg-red-500",
    description: "Payez avec votre compte Free Money",
  },
  cash_on_delivery: {
    name: "Paiement à la livraison",
    icon: CreditCard,
    color: "bg-green-500",
    description: "Payez en espèces lors de la réception",
  },
}

export default function PaymentPage() {
  const [order, setOrder] = useState<any>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [loading, setLoading] = useState(true)
  const [paymentResult, setPaymentResult] = useState<any>(null)

  const params = useParams()
  const router = useRouter()
  const { processing, processPayment } = usePayments()
  const supabase = createClient()

  useEffect(() => {
    fetchOrder()
  }, [params.orderId])

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *,
            products (
              name,
              image_url
            )
          ),
          profiles (
            full_name,
            email
          )
        `)
        .eq("id", params.orderId)
        .single()

      if (error) throw error
      setOrder(data)
    } catch (error) {
      console.error("Error fetching order:", error)
      toast.error("Commande introuvable")
      router.push("/orders")
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!order) return

    if (order.payment_method !== "cash_on_delivery" && !phoneNumber.trim()) {
      toast.error("Veuillez entrer votre numéro de téléphone")
      return
    }

    try {
      const result = await processPayment({
        orderId: order.id,
        amount: order.total_amount,
        method: order.payment_method,
        phoneNumber: phoneNumber,
        customerName: order.profiles?.full_name || "",
        customerEmail: order.profiles?.email || "",
      })

      setPaymentResult(result)

      if (result.success) {
        toast.success(result.message)
        setTimeout(() => {
          router.push(`/orders/${order.id}`)
        }, 3000)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Erreur lors du traitement du paiement")
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Commande introuvable</h3>
            <Button onClick={() => router.push("/orders")}>Retour aux commandes</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (paymentResult) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              {paymentResult.success ? (
                <>
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-green-600 mb-2">Paiement Réussi !</h2>
                  <p className="text-gray-600 mb-4">{paymentResult.message}</p>
                  {paymentResult.transactionId && (
                    <p className="text-sm text-gray-500 mb-6">ID de transaction: {paymentResult.transactionId}</p>
                  )}
                  <Button onClick={() => router.push(`/orders/${order.id}`)}>Voir ma commande</Button>
                </>
              ) : (
                <>
                  <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-red-600 mb-2">Paiement Échoué</h2>
                  <p className="text-gray-600 mb-6">{paymentResult.message}</p>
                  <div className="space-x-4">
                    <Button onClick={() => setPaymentResult(null)}>Réessayer</Button>
                    <Button variant="outline" onClick={() => router.push(`/orders/${order.id}`)}>
                      Voir ma commande
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const paymentMethod = paymentMethods[order.payment_method as keyof typeof paymentMethods]
  const PaymentIcon = paymentMethod?.icon || CreditCard

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Finaliser le Paiement</h1>

        <div className="space-y-6">
          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <div className={`p-2 rounded-lg ${paymentMethod?.color} mr-3`}>
                  <PaymentIcon className="h-5 w-5 text-white" />
                </div>
                {paymentMethod?.name}
              </CardTitle>
              <p className="text-gray-600">{paymentMethod?.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.payment_method !== "cash_on_delivery" && (
                <div>
                  <Label htmlFor="phone">Numéro de téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Ex: +221 77 123 45 67"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Entrez le numéro associé à votre compte {paymentMethod?.name}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Résumé de la commande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {order.order_items?.slice(0, 3).map((item: any) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <img
                      src={item.products?.image_url || "/placeholder.svg"}
                      alt={item.products?.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.products?.name}</div>
                      <div className="text-sm text-gray-500">Qté: {item.quantity}</div>
                    </div>
                    <div className="font-medium">{(item.price * item.quantity).toLocaleString()} FCFA</div>
                  </div>
                ))}
                {order.order_items && order.order_items.length > 3 && (
                  <div className="text-sm text-gray-500">+{order.order_items.length - 3} autres articles</div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span>{order.total_amount.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span>Livraison</span>
                  <span>Gratuite</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total à payer</span>
                  <span>{order.total_amount.toLocaleString()} FCFA</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Button */}
          <Card>
            <CardContent className="pt-6">
              <Button onClick={handlePayment} disabled={processing} className="w-full" size="lg">
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Traitement en cours...
                  </>
                ) : (
                  <>Payer {order.total_amount.toLocaleString()} FCFA</>
                )}
              </Button>

              {order.payment_method !== "cash_on_delivery" && (
                <p className="text-xs text-gray-500 text-center mt-3">
                  Vous recevrez une notification sur votre téléphone pour confirmer le paiement
                </p>
              )}
            </CardContent>
          </Card>

          {/* Security Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">Paiement sécurisé</p>
                  <p className="text-blue-700">
                    Vos informations de paiement sont protégées et chiffrées. Nous ne stockons jamais vos données
                    bancaires.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
