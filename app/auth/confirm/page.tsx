"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function ConfirmPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const confirmEmail = async () => {
      const supabase = createClient()
      const token_hash = searchParams.get("token_hash")
      const type = searchParams.get("type")

      if (!token_hash || !type) {
        setStatus("error")
        setMessage("Lien de confirmation invalide ou expiré")
        return
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        })

        if (error) throw error

        setStatus("success")
        setMessage("Votre email a été confirmé avec succès !")

        // Rediriger vers le dashboard après 3 secondes
        setTimeout(() => {
          router.push("/dashboard")
        }, 3000)
      } catch (error: unknown) {
        setStatus("error")
        setMessage(error instanceof Error ? error.message : "Une erreur s'est produite lors de la confirmation")
      }
    }

    confirmEmail()
  }, [router, searchParams])

  const getIcon = () => {
    switch (status) {
      case "loading":
        return <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      case "success":
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case "error":
        return <XCircle className="w-6 h-6 text-red-600" />
    }
  }

  const getTitle = () => {
    switch (status) {
      case "loading":
        return "Confirmation en cours..."
      case "success":
        return "Email confirmé !"
      case "error":
        return "Erreur de confirmation"
    }
  }

  const getDescription = () => {
    switch (status) {
      case "loading":
        return "Veuillez patienter pendant que nous confirmons votre email"
      case "success":
        return "Votre compte a été activé avec succès"
      case "error":
        return "Impossible de confirmer votre email"
    }
  }

  const getBgColor = () => {
    switch (status) {
      case "loading":
        return "bg-blue-100"
      case "success":
        return "bg-green-100"
      case "error":
        return "bg-red-100"
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className={`mx-auto w-12 h-12 ${getBgColor()} rounded-full flex items-center justify-center mb-4`}>
              {getIcon()}
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">{getTitle()}</CardTitle>
            <CardDescription className="text-gray-600">{getDescription()}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600">{message}</p>

            {status === "success" && (
              <p className="text-xs text-gray-500">
                Vous allez être redirigé vers votre tableau de bord dans quelques secondes.
              </p>
            )}

            {status === "error" && (
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href="/auth/register">Créer un nouveau compte</Link>
                </Button>
                <Button variant="outline" asChild className="w-full bg-transparent">
                  <Link href="/auth/login">Se connecter</Link>
                </Button>
              </div>
            )}

            {status === "success" && (
              <Button asChild className="w-full">
                <Link href="/dashboard">Accéder au tableau de bord</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
