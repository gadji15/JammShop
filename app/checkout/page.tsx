"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/lib/hooks/use-cart"
import { useOrders } from "@/lib/hooks/use-orders"
import { createClient } from "@/lib/supabase/client"
import { CreditCard, MapPin, Package, Truck, Smartphone, Wallet } from "lucide-react"
import { toast } from "sonner"
import { useAuthModal } from "@/lib/hooks/use-auth-modal"
import { AuthModal } from "@/components/auth/auth-modal"

export default function CheckoutPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { isOpen, reason, title, description, openModal, closeModal } = useAuthModal()
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
    payment_method: "cash_on_delivery",
    notes: "",
  })

  const { items, total, clearCart } = useCart()
  const { createOrder } = useOrders(user?.id)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (!user) {
        openModal(
          "checkout",
          "Connexion requise pour commander",
          "Pour finaliser votre commande et suivre vos achats, vous devez être connecté à votre compte.",
        )
      }

      if (user) {
        supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) {
              setFormData((prev) => ({
                ...prev,
                full_name: profile.full_name || "",
                email: user.email || "",
                phone: profile.phone || "",
              }))
            }
          })
      }
    })
  }, [supabase, openModal])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      openModal("checkout")
      return
    }

    setLoading(true)

    try {
      const shippingAddress = `${formData.address}, ${formData.city} ${formData.postal_code}`

      const orderItems = items.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }))

      const order = await createOrder({
        total_amount: total,
        shipping_address: shippingAddress,
        payment_method: formData.payment_method,
        items: orderItems,
      })

      clearCart()

      if (formData.payment_method === "cash_on_delivery") {
        toast.success("Commande passée avec succès !")
        router.push("/orders")
      } else {
        router.push(`/payment/${order.id}`)
      }
    } catch (error) {
      console.error("Error creating order:", error)
      toast.error("Erreur lors de la création de la commande")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <AuthModal isOpen={isOpen} onClose={closeModal} reason={reason} title={title} description={description} />

      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Finaliser la commande</h1>

        {!user && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              💡 <strong>Astuce :</strong> Connectez-vous pour une expérience de commande plus rapide avec vos
              informations sauvegardées.
            </p>
          </div>
        )}

        {items.length === 0 ? (
          <div className="max-w-md mx-auto">
            <div className="text-center space-y-4 p-8 bg-gray-50 rounded-lg">
              <h2 className="text-xl font-semibold">Panier vide</h2>
              <p className="text-gray-600">Votre panier est vide. Ajoutez des produits avant de passer commande.</p>
              <Button asChild className="w-full">
                <a href="/products">Voir les produits</a>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Shipping Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Informations de livraison
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="full_name">Nom complet</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Adresse</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">Ville</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="postal_code">Code postal</Label>
                        <Input
                          id="postal_code"
                          value={formData.postal_code}
                          onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Payment Method */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Mode de paiement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <label className="flex items-center space-x-3 cursor-pointer p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="payment_method"
                          value="cash_on_delivery"
                          checked={formData.payment_method === "cash_on_delivery"}
                          onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                          className="text-blue-600"
                        />
                        <CreditCard className="h-5 w-5 text-green-600" />
                        <div className="flex-1">
                          <div className="font-medium">Paiement à la livraison</div>
                          <div className="text-sm text-gray-500">Payez en espèces lors de la réception</div>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3 cursor-pointer p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="payment_method"
                          value="orange_money"
                          checked={formData.payment_method === "orange_money"}
                          onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                          className="text-blue-600"
                        />
                        <Smartphone className="h-5 w-5 text-orange-600" />
                        <div className="flex-1">
                          <div className="font-medium">Orange Money</div>
                          <div className="text-sm text-gray-500">Paiement mobile sécurisé avec Orange Money</div>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3 cursor-pointer p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="payment_method"
                          value="wave"
                          checked={formData.payment_method === "wave"}
                          onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                          className="text-blue-600"
                        />
                        <Wallet className="h-5 w-5 text-blue-600" />
                        <div className="flex-1">
                          <div className="font-medium">Wave</div>
                          <div className="text-sm text-gray-500">Paiement rapide et sécurisé avec Wave</div>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3 cursor-pointer p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="payment_method"
                          value="free_money"
                          checked={formData.payment_method === "free_money"}
                          onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                          className="text-blue-600"
                        />
                        <CreditCard className="h-5 w-5 text-red-600" />
                        <div className="flex-1">
                          <div className="font-medium">Free Money</div>
                          <div className="text-sm text-gray-500">Paiement mobile avec Free Money</div>
                        </div>
                      </label>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Notes de commande (optionnel)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Instructions spéciales pour la livraison..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </CardContent>
                </Card>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Traitement..." : "Passer la commande"}
                </Button>
              </form>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Résumé de la commande
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <img
                        src={item.image_url || "/placeholder.svg"}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-sm text-gray-500">Qté: {item.quantity}</div>
                      </div>
                      <div className="font-medium">{(item.price * item.quantity).toLocaleString()} FCFA</div>
                    </div>
                  ))}

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Sous-total</span>
                      <span>{total.toLocaleString()} FCFA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Livraison</span>
                      <span>Gratuite</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{total.toLocaleString()} FCFA</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Truck className="h-4 w-4" />
                    <span>Livraison gratuite au Sénégal</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
