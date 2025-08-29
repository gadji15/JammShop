"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Lock, Mail, User, ShoppingCart, Shield, Star } from "lucide-react"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  reason?: string
  title?: string
  description?: string
}

export function AuthModal({ isOpen, onClose, reason, title, description }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [registerData, setRegisterData] = useState({ email: "", password: "", full_name: "" })
  const supabase = createClient()

  const getReasonContent = () => {
    switch (reason) {
      case "checkout":
        return {
          icon: <ShoppingCart className="h-8 w-8 text-blue-600" />,
          title: "Connexion requise pour commander",
          description: "Pour finaliser votre commande et suivre vos achats, vous devez être connecté à votre compte.",
          benefits: ["Suivi de vos commandes", "Historique d'achats", "Adresses sauvegardées"],
        }
      case "admin":
        return {
          icon: <Shield className="h-8 w-8 text-red-600" />,
          title: "Accès administrateur requis",
          description: "Cette section est réservée aux administrateurs. Connectez-vous avec vos identifiants admin.",
          benefits: ["Gestion des produits", "Suivi des commandes", "Statistiques détaillées"],
        }
      case "wishlist":
        return {
          icon: <Star className="h-8 w-8 text-yellow-600" />,
          title: "Sauvegardez vos favoris",
          description: "Créez un compte pour sauvegarder vos produits préférés et les retrouver facilement.",
          benefits: ["Liste de souhaits", "Recommandations personnalisées", "Alertes de prix"],
        }
      default:
        return {
          icon: <User className="h-8 w-8 text-green-600" />,
          title: title || "Connexion recommandée",
          description: description || "Connectez-vous pour accéder à toutes les fonctionnalités de JammShop.",
          benefits: ["Expérience personnalisée", "Commandes rapides", "Support prioritaire"],
        }
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      })

      if (error) throw error

      toast.success("Connexion réussie !")
      onClose()
      window.location.reload() // Refresh to update auth state
    } catch (error: any) {
      toast.error(error.message || "Erreur de connexion")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
          data: {
            full_name: registerData.full_name,
          },
        },
      })

      if (error) throw error

      toast.success("Compte créé ! Vérifiez votre email pour confirmer votre inscription.")
      onClose()
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'inscription")
    } finally {
      setIsLoading(false)
    }
  }

  const content = getReasonContent()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-gray-50 rounded-full w-fit">{content.icon}</div>
          <DialogTitle className="text-xl font-bold">{content.title}</DialogTitle>
          <DialogDescription className="text-gray-600">{content.description}</DialogDescription>
        </DialogHeader>

        {/* Benefits */}
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-blue-900 mb-2">Avantages de votre compte :</h4>
          <ul className="space-y-1">
            {content.benefits.map((benefit, index) => (
              <li key={index} className="text-sm text-blue-800 flex items-center">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Connexion</TabsTrigger>
            <TabsTrigger value="register">Inscription</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="votre@email.com"
                    className="pl-10"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">Nom complet</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="register-name"
                    placeholder="Votre nom complet"
                    className="pl-10"
                    value={registerData.full_name}
                    onChange={(e) => setRegisterData({ ...registerData, full_name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="votre@email.com"
                    className="pl-10"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Minimum 6 caractères"
                    className="pl-10"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Inscription..." : "Créer un compte"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="text-center">
          <Button variant="ghost" onClick={onClose} className="text-gray-500 hover:text-gray-700">
            Continuer sans compte
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
