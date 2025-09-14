"use client"

import { ProductGrid } from "@/components/product/product-grid"
import { ProductGridSkeleton } from "@/components/product/product-loading"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useCategories } from "@/lib/hooks/use-categories"
import { useShowcaseProducts } from "@/lib/hooks/use-showcase-products"
import { Carousel, CarouselItem } from "@/components/ui/carousel"
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
      <section className="relative bg-black text-white">
        <Hero />
      </section>

      {/* Categories Section */}
      <section className="py-14 md:py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-10 md:mb-16">
            <Badge className="bg-blue-100 text-blue-800 mb-3 md:mb-4">Catégories populaires</Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 md:mb-6 text-balance">
              Explorez nos <span className="text-blue-600">catégories</span>
            </h2>
            <p className="text-base md:text-xl text-gray-600 max-w-3xl mx-auto text-pretty">
              Trouvez exactement ce que vous cherchez dans nos différentes catégories de produits soigneusement
              sélectionnées
            </p>
          </div>

          {/* Bouton Voir plus (top-right) */}
          <div className="hidden md:block absolute right-4 top-4">
            <Button asChild variant="outline" size="sm" className="bg-transparent">
              <Link href="/products">
                Voir plus
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {categoriesLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Mobile: Embla carousel pour réduire la hauteur */}
              <div className="md:hidden -mx-4 px-4 mb-6">
                <Carousel options={{ align: "start", dragFree: true }}>
                  {categories.slice(0, 10).map((category, index) => (
                    <CarouselItem key={category.id} className="min-w-[180px]">
                      <Link
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
                            <div className="absolute inset-0 flex items-end p-3">
                              <div className="text-white">
                                <h3 className="font-bold text-base mb-0.5 group-hover:text-yellow-300 transition-colors">
                                  {category.name}
                                </h3>
                                <p className="text-xs text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  Découvrir →
                                </p>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    </CarouselItem>
                  ))}
                </Carousel>
              </div>

              {/* Desktop/Tablet: grille classique */}
              <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
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
                  size="sm md:lg"
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
      <section className="relative py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]">
          <div className="absolute -top-24 left-1/2 h-56 w-[80%] -translate-x-1/2 rounded-full bg-blue-200/30 blur-3xl"></div>
        </div>

        <div className="relative container mx-auto px-4">
          {/* Bouton Voir plus (top-right) */}
          <div className="hidden md:block absolute right-4 -top-2">
            <Button asChild variant="outline" size="sm" className="bg-transparent">
              <Link href="/products">
                Voir plus
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="flex flex-col gap-4 items-center text-center mb-10 md:mb-12">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
                Produits vedettes
              </Badge>
              <span className="text-sm text-gray-500">Mis à jour aujourd'hui</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 text-balance">
              Notre sélection <span className="text-blue-600">incontournable</span>
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl">
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
              compact
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
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          {/* Mobile: horizontal scroll to limit height */}
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 md:hidden">
            <Card className="min-w-[220px] snap-start text-center border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Truck className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-1.5">Livraison rapide</h3>
                <p className="text-gray-600 text-sm">Livraison gratuite dès 50€ d'achat partout en France</p>
              </CardContent>
            </Card>

            <Card className="min-w-[220px] snap-start text-center border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-1.5">Paiement sécurisé</h3>
                <p className="text-gray-600 text-sm">Vos transactions sont protégées par un cryptage SSL</p>
              </CardContent>
            </Card>

            <Card className="min-w-[220px] snap-start text-center border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="h-7 w-7 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-1.5">Retour gratuit</h3>
                <p className="text-gray-600 text-sm">30 jours pour changer d'avis, retour gratuit</p>
              </CardContent>
            </Card>
          </div>

          {/* Tablets/Desktop: grid */}
          <div className="hidden md:grid grid-cols-3 gap-6 lg:gap-8">
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
