import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Vérifiez votre email</CardTitle>
            <CardDescription className="text-gray-600">
              Un lien de confirmation a été envoyé à votre adresse email
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Veuillez vérifier votre boîte de réception et cliquer sur le lien de confirmation pour activer votre
              compte.
            </p>
            <p className="text-xs text-gray-500">Si vous ne voyez pas l'email, vérifiez votre dossier spam.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
