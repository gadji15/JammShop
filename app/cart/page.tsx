"use client"

import { CartItemComponent } from "@/components/cart/cart-item"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/lib/hooks/use-cart"
import { ArrowLeft, ShoppingBag } from "lucide-react"
import Link from "next/link"

export default function CartPage() {
  const { items, loading, addToCart, updateQuantity, removeFromCart, clearCart, getTotalPrice, getTotalItems } =
    useCart()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du panier...</p>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Votre panier est vide</h1>
            <p className="text-gray-600 mb-8">Découvrez nos produits et ajoutez-les à votre panier pour commencer.</p>
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link href="/products">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Continuer les achats
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const totalPrice = getTotalPrice()
  const totalItems = getTotalItems()
  const shippingCost = totalPrice >= 50 ? 0 : 5.99
  const finalTotal = totalPrice + shippingCost

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continuer les achats
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            Panier ({totalItems} article{totalItems > 1 ? "s" : ""})
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <CartItemComponent
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
              />
            ))}

            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={clearCart} className="text-red-600 hover:text-red-700 bg-transparent">
                Vider le panier
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Résumé de la commande</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>
                      Sous-total ({totalItems} article{totalItems > 1 ? "s" : ""})
                    </span>
                    <span>{totalPrice.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Livraison</span>
                    <span>{shippingCost === 0 ? "Gratuite" : `${shippingCost.toFixed(2)} €`}</span>
                  </div>
                  {shippingCost > 0 && (
                    <p className="text-sm text-gray-600">
                      Livraison gratuite dès 50€ d'achat (il vous manque {(50 - totalPrice).toFixed(2)} €)
                    </p>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{finalTotal.toFixed(2)} €</span>
                </div>

                <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg" asChild>
                  <Link href="/checkout">Procéder au paiement</Link>
                </Button>

                <div className="text-center text-sm text-gray-600">
                  <p>Paiement sécurisé</p>
                  <p>Retour gratuit sous 30 jours</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
