import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Award, Globe, Shield, Users } from "lucide-react"
import Image from "next/image"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">À propos de nous</h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              Votre partenaire de confiance pour le commerce en ligne depuis 2020
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Notre mission</h2>
              <p className="text-lg text-gray-600">
                Connecter les meilleurs fournisseurs du monde avec nos clients pour offrir des produits de qualité à des
                prix compétitifs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Une marketplace innovante</h3>
                <p className="text-gray-600 mb-6">
                  Nous avons créé une plateforme qui permet aux consommateurs d'accéder facilement à une large gamme de
                  produits provenant de fournisseurs vérifiés du monde entier, notamment d'Alibaba, Jumia et d'autres
                  marketplaces reconnues.
                </p>
                <p className="text-gray-600">
                  Notre objectif est de démocratiser l'accès aux produits internationaux tout en garantissant la
                  qualité, la sécurité et un service client exceptionnel.
                </p>
              </div>
              <div className="relative h-80 rounded-lg overflow-hidden">
                <Image src="/modern-office-team.png" alt="Notre équipe" fill className="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Nos valeurs</h2>
              <p className="text-lg text-gray-600">Les principes qui guident notre travail au quotidien</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="text-center border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Confiance</h3>
                  <p className="text-gray-600">
                    Nous vérifions tous nos fournisseurs et garantissons la qualité de chaque produit.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Globe className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Global</h3>
                  <p className="text-gray-600">
                    Accès aux meilleurs produits du monde entier grâce à notre réseau international.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Service</h3>
                  <p className="text-gray-600">
                    Une équipe dédiée pour vous accompagner à chaque étape de votre achat.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Excellence</h3>
                  <p className="text-gray-600">
                    Nous nous efforçons constamment d'améliorer notre service et votre expérience.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">E-Commerce en chiffres</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">50K+</div>
                <p className="text-gray-600">Clients satisfaits</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">10K+</div>
                <p className="text-gray-600">Produits disponibles</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">100+</div>
                <p className="text-gray-600">Fournisseurs partenaires</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600 mb-2">99%</div>
                <p className="text-gray-600">Taux de satisfaction</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Notre équipe</h2>
              <p className="text-lg text-gray-600">Des experts passionnés au service de votre satisfaction</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
                    <Image
                      src="/professional-headshot.png"
                      alt="Marie Dubois"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-semibold mb-1">Marie Dubois</h3>
                  <Badge variant="secondary" className="mb-3">
                    CEO & Fondatrice
                  </Badge>
                  <p className="text-gray-600 text-sm">
                    15 ans d'expérience dans le e-commerce international. Passionnée par l'innovation et la satisfaction
                    client.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
                    <Image
                      src="/professional-headshot.png"
                      alt="Pierre Martin"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-semibold mb-1">Pierre Martin</h3>
                  <Badge variant="secondary" className="mb-3">
                    CTO
                  </Badge>
                  <p className="text-gray-600 text-sm">
                    Expert en technologies web et intelligence artificielle. Responsable de l'innovation technique de
                    notre plateforme.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
                    <Image
                      src="/professional-headshot.png"
                      alt="Sophie Chen"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-semibold mb-1">Sophie Chen</h3>
                  <Badge variant="secondary" className="mb-3">
                    Directrice Commerciale
                  </Badge>
                  <p className="text-gray-600 text-sm">
                    Spécialiste des relations fournisseurs internationaux. Garante de la qualité de notre catalogue
                    produits.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
