import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Politique de confidentialité</h1>
            <p className="text-lg text-gray-600">Dernière mise à jour : 1er janvier 2024</p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>1. Collecte des informations</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p>
                  Nous collectons des informations lorsque vous vous inscrivez sur notre site, passez une commande, vous
                  abonnez à notre newsletter ou remplissez un formulaire. Les informations collectées incluent votre
                  nom, votre adresse e-mail, votre numéro de téléphone et/ou votre adresse.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Utilisation des informations</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p>Toutes les informations que nous recueillons auprès de vous peuvent être utilisées pour :</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Personnaliser votre expérience et répondre à vos besoins individuels</li>
                  <li>Fournir un contenu publicitaire personnalisé</li>
                  <li>Améliorer notre site web</li>
                  <li>Améliorer le service client et vos besoins de prise en charge</li>
                  <li>Vous contacter par e-mail</li>
                  <li>Administrer un concours, une promotion ou une enquête</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Confidentialité du commerce en ligne</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p>
                  Nous sommes les seuls propriétaires des informations recueillies sur ce site. Vos informations
                  personnelles ne seront pas vendues, échangées, transférées, ou données à une autre société pour
                  n'importe quelle raison, sans votre consentement, en dehors de ce qui est nécessaire pour répondre à
                  une demande et/ou transaction.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Divulgation à des tiers</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p>
                  Nous ne vendons, n'échangeons et ne transférons pas vos informations personnelles identifiables à des
                  tiers. Cela ne comprend pas les tierce parties de confiance qui nous aident à exploiter notre site Web
                  ou à mener nos affaires, tant que ces parties conviennent de garder ces informations confidentielles.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Protection des informations</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p>
                  Nous mettons en œuvre une variété de mesures de sécurité pour préserver la sécurité de vos
                  informations personnelles. Nous utilisons un cryptage à la pointe de la technologie pour protéger les
                  informations sensibles transmises en ligne.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Cookies</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p>
                  Nous utilisons des cookies pour améliorer votre expérience, recueillir des informations générales et
                  des statistiques de visiteurs, et pour d'autres utilisations commerciales. Si vous refusez
                  l'utilisation de cookies, vous pourrez toujours utiliser notre site Web.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Consentement</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p>
                  En utilisant notre site, vous consentez à notre politique de confidentialité. Si nous décidons de
                  modifier notre politique de confidentialité, nous publierons ces changements sur cette page.
                </p>
              </CardContent>
            </Card>

            <Separator className="my-8" />

            <div className="text-center text-gray-600">
              <p>
                Pour toute question concernant cette politique de confidentialité, veuillez nous contacter à{" "}
                <a href="mailto:privacy@e-commerce.fr" className="text-blue-600 hover:underline">
                  privacy@e-commerce.fr
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
