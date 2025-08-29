import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Conditions générales de vente</h1>
            <p className="text-lg text-gray-600">Dernière mise à jour : 1er janvier 2024</p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>1. Objet</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p>
                  Les présentes conditions générales de vente (CGV) régissent les relations contractuelles entre
                  E-Commerce, société par actions simplifiée au capital de 10 000 euros, immatriculée au RCS de Paris
                  sous le numéro 123 456 789, dont le siège social est situé 123 Rue du Commerce, 75001 Paris, et toute
                  personne souhaitant effectuer un achat via le site internet www.e-commerce.fr.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Produits</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p>
                  Les produits proposés sont ceux qui figurent dans le catalogue publié sur le site internet
                  www.e-commerce.fr. Ces produits sont proposés dans la limite des stocks disponibles. Chaque produit
                  est accompagné d'un descriptif établi par le fabricant.
                </p>
                <p>
                  Les photographies des produits ne sont pas contractuelles et n'engagent pas le vendeur. En cas
                  d'indisponibilité du produit commandé, nous nous engageons à vous en informer au plus vite.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Prix</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p>
                  Les prix figurant dans le catalogue sont des prix TTC en euros, tenant compte de la TVA applicable au
                  jour de la commande. Tout changement du taux de la TVA sera automatiquement répercuté sur le prix des
                  produits.
                </p>
                <p>
                  Les prix indiqués ne comprennent pas les frais de livraison, facturés en supplément et indiqués avant
                  la validation de la commande. E-Commerce se réserve le droit de modifier ses prix à tout moment.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Commande</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p>
                  Les commandes sont passées sur le site internet www.e-commerce.fr. Pour passer commande, le client
                  doit suivre le processus de commande en ligne et s'identifier au moyen de ses nom d'utilisateur et mot
                  de passe.
                </p>
                <p>
                  La validation de la commande vaut acceptation des prix et descriptions des produits disponibles à la
                  vente. Toute commande vaut acceptation des présentes conditions générales de vente.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Paiement</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p>
                  Le paiement s'effectue soit par carte bancaire, soit par virement bancaire, soit par tout autre moyen
                  proposé sur le site. Le paiement par carte bancaire est sécurisé par le système de cryptage SSL.
                </p>
                <p>
                  Les données de paiement sont échangées en mode crypté grâce au protocole défini par le prestataire de
                  paiement agréé intervenant pour les transactions bancaires réalisées sur le site www.e-commerce.fr.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Livraison</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p>
                  Les produits sont livrés à l'adresse indiquée par le client lors de sa commande. Les délais de
                  livraison sont indiqués sur le site et ne sont donnés qu'à titre indicatif. En cas de retard de
                  livraison, le vendeur s'engage à prévenir le client.
                </p>
                <p>
                  La livraison est gratuite pour toute commande supérieure à 50 euros. En deçà, les frais de port sont
                  de 5,99 euros.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Droit de rétractation</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p>
                  Conformément aux dispositions légales en vigueur, le client dispose d'un délai de 14 jours à compter
                  de la réception de sa commande pour exercer son droit de rétractation sans avoir à justifier de motifs
                  ni à payer de pénalités.
                </p>
                <p>
                  Les retours sont gratuits. Les produits doivent être retournés dans leur état d'origine et dans leur
                  emballage d'origine avec tous les accessoires éventuels.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Garanties</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p>
                  Tous les produits fournis par E-Commerce bénéficient de la garantie légale de conformité et de la
                  garantie légale contre les vices cachés. Ces garanties s'appliquent dans les conditions prévues par le
                  Code de la consommation.
                </p>
              </CardContent>
            </Card>

            <Separator className="my-8" />

            <div className="text-center text-gray-600">
              <p>
                Pour toute question concernant ces conditions générales, veuillez nous contacter à{" "}
                <a href="mailto:legal@e-commerce.fr" className="text-blue-600 hover:underline">
                  legal@e-commerce.fr
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
