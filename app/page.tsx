"use client"

import { ProductGrid } from "@/components/product/product-grid"
import { ProductGridSkeleton } from "@/components/product/product-loading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useCategories } from "@/lib/hooks/use-categories"
import { useShowcaseProducts } from "@/lib/hooks/use-showcase-products"
import { ArrowRight, Package, Shield, Truck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function HomePage() {
  const { products: showcaseProducts, loading: showcaseLoading, filter, setFilter } = useShowcaseProducts("featured")
  const { categories, loading: categoriesLoading } = useCategories()

  const handleAddToCart = async (productId: string) => {
    // TODO: Implement add to cart functionality
    console.log("Add to cart:", productId)
  }

  const handleToggleWishlist = async (productId: string) => {
    // TODO: Implement wishlist functionality
    console.log("Toggle wishlist:", productId)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        </div>

        <div className="relative container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6">
              <Badge className="bg-white/20 text-white border-white/30 mb-4 animate-fade-in">
                🎉 Nouveau sur JammShop
              </Badge>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance animate-fade-in-up">
              Votre <span className="text-yellow-300">marketplace</span> de confiance
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 text-pretty animate-fade-in-up animation-delay-200">
              Découvrez des milliers de produits de qualité provenant de fournisseurs du monde entier, directement
              depuis le Sénégal
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-400">
              <Button
                asChild
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-lg"
              >
                <Link href="/products">
                  Découvrir nos produits
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-blue-600 bg-transparent hover:scale-105 transition-all duration-300"
              >
                <Link href="/auth/register">Devenir vendeur</Link>
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-blue-200 animate-fade-in-up animation-delay-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">+10,000 produits</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Livraison Sénégal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Paiement Mobile Money</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-blue-100 text-blue-800 mb-4">Catégories populaires</Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 text-balance">
              Explorez nos <span className="text-blue-600">catégories</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto text-pretty">
              Trouvez exactement ce que vous cherchez dans nos différentes catégories de produits soigneusement
              sélectionnées
            </p>
          </div>

          {categoriesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
                {categories.slice(0, 10).map((category, index) => (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    className="group block animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <Card className="overflow-hidden transition-all duration-500 hover:shadow-2xl group-hover:scale-105 border-0 shadow-lg">
                      <div className="aspect-square relative">
                        <Image
                          src={category.image_url || `/placeholder.svg`}
                          alt={category.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/70 transition-all duration-300" />
                        <div className="absolute inset-0 flex items-end p-4">
                          <div className="text-white">
                            <h3 className="font-bold text-lg mb-1 group-hover:text-yellow-300 transition-colors">
                              {category.name}
                            </h3>
                            <p className="text-sm text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              Découvrir →
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>

              <div className="text-center">
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="hover:scale-105 transition-all duration-300 shadow-lg bg-transparent"
                >
                  <Link href="/products">
                    Voir toutes les catégories
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Featured Products Section (just after categories with improved UI) */}
      <section className="relative py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]">
          <div className="absolute -top-24 left-1/2 h-56 w-[80%] -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl"></div>
        </div>

        <div className="relative container mx-auto px-4">
          <div className="flex flex-col gap-4 items-center text-center mb-12">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
                Produits vedettes
              </Badge>
              <span className="text-sm text-gray-500">Mis à jour aujourd'hui</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-balance">
              Notre sélection <span className="text-blue-600">incontournable</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl">
              Des best-sellers et nouveautés triés pour vous. Qualité, prix et disponibilité au rendez-vous.
            </p>

            <div className="mt-2 flex items-center gap-2">
              <Button
                variant={filter === "new" ? undefined : "outline"}
                size="sm"
                className={filter === "new" ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-transparent"}
                onClick={() => setFilter("new")}
              >
                Nouveautés
              </Button>
              <Button
                variant={filter === "best" ? undefined : "outline"}
                size="sm"
                className={filter === "best" ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-transparent"}
                onClick={() => setFilter("best")}
              >
                Meilleures ventes
              </Button>
              <Button
                variant={filter === "featured" ? undefined : "outline"}
                size="sm"
                className={filter === "featured" ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-transparent"}
                onClick={() => setFilter("featured")}
              >
                Tout voir
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {showcaseLoading ? (
            <ProductGridSkeleton count={8} />
          ) : (
            <ProductGrid
              products={showcaseProducts}
              onAddToCart={handleAddToCart}
              onToggleWishlist={handleToggleWishlist}
            />
          )}

          <div className="text-center mt-12">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Link href="/products">
                Voir tous les produits
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Livraison rapide</h3>
                <p className="text-gray-600">Livraison gratuite dès 50€ d'achat partout en France</p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Paiement sécurisé</h3>
                <p className="text-gray-600">Vos transactions sont protégées par un cryptage SSL</p>
              </CardContent>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Retour gratuit</h3>
                <p className="text-gray-600">30 jours pour changer d'avis, retour gratuit</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg width%3D%2260%22 height%3D%2260%22 viewBox%3D%220 0 60 60%22 xmlns%3D%22http://www.w3.org/2000/svg%22%3E%3Cg fill%3D%22none%22 fillRule%3D%22evenodd%22%3E%3Cg fill%3D%22%23ffffff%22 fillOpacity%3D%220.1%22%3E%3Ccircle cx%3D%2230%22 cy%3D%2230%22 r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">Restez connecté avec JammShop</h2>
            <p className="text-xl text-blue-100 mb-10 text-pretty">
              Inscrivez-vous à notre newsletter pour recevoir nos offres exclusives, les dernières nouveautés et des
              conseils d'achat personnalisés
            </p>
            <div className="max-w-md mx-auto flex gap-3">
              <input
                type="email"
                placeholder="Votre adresse email"
                className="flex-1 px-6 py-4 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-lg"
              />
              <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-xl shadow-lg hover:scale-105 transition-all duration-300">
                S'inscrire
              </Button>
            </div>
            <p className="text-sm text-blue-200 mt-4">Pas de spam, désabonnement en un clic</p>
          </div>
        </div>
      </section>
    </div>
  )
}
