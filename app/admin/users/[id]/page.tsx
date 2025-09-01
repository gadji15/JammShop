"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Shield, ShieldCheck, Mail, Phone, Calendar, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: "customer" | "admin" | "super_admin"
  created_at: string
  last_sign_in_at: string | null
}

interface UserOrder {
  id: string
  order_number: string
  total_amount: number
  status: string
  created_at: string
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const router = useRouter()
  const supabase = createClient()

  const [meRole, setMeRole] = useState<"customer" | "admin" | "super_admin" | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [orders, setOrders] = useState<UserOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingRole, setUpdatingRole] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      // Check current session and role: only super_admin may access
      const { data: { user: sessionUser } } = await supabase.auth.getUser()
      if (!sessionUser) {
        window.location.href = "/auth/login?redirect=/admin/users"
        return
      }
      const { data: myProfile } = await supabase.from("profiles").select("role").eq("id", sessionUser.id).single()
      setMeRole((myProfile?.role as any) ?? null)
      if (myProfile?.role !== "super_admin") {
        toast.error("Accès réservé au super administrateur")
        router.push("/admin")
        return
      }

      // Load target profile
      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("id,email,full_name,phone,role,created_at,last_sign_in_at")
        .eq("id", id)
        .single()

      if (pErr || !profile) {
        toast.error("Utilisateur introuvable")
        router.push("/admin/users")
        return
      }

      setUser(profile as UserProfile)

      // Load user orders
      const { data: userOrders } = await supabase
        .from("orders")
        .select("id,order_number,total_amount,status,created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false })

      setOrders(userOrders || [])
      setLoading(false)
    }

    if (id) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const promoteToAdmin = async () => {
    if (!user) return
    setUpdatingRole(true)
    try {
      const { error } = await supabase.from("profiles").update({ role: "admin" }).eq("id", user.id)
      if (error) throw error
      setUser({ ...user, role: "admin" })
      toast.success("Utilisateur promu administrateur")
    } catch (e) {
      console.error(e)
      toast.error("Échec de la promotion")
    } finally {
      setUpdatingRole(false)
    }
  }

  const demoteToCustomer = async () => {
    if (!user) return
    setUpdatingRole(true)
    try {
      const { error } = await supabase.from("profiles").update({ role: "customer" }).eq("id", user.id)
      if (error) throw error
      setUser({ ...user, role: "customer" })
      toast.success("Administrateur rétrogradé en utilisateur")
    } catch (e) {
      console.error(e)
      toast.error("Échec de la rétrogradation")
    } finally {
      setUpdatingRole(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  if (!user) return null

  const isAdmin = user.role === "admin"
  const isSuperAdmin = user.role === "super_admin"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fiche utilisateur</h1>
          <p className="text-gray-600">Accès réservé au super administrateur</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/users")}>Retour</Button>
          {!isSuperAdmin && (
            isAdmin ? (
              <Button variant="destructive" onClick={demoteToCustomer} disabled={updatingRole}>
                Rétrograder en utilisateur
              </Button>
            ) : (
              <Button onClick={promoteToAdmin} disabled={updatingRole}>
                Promouvoir en administrateur
              </Button>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                {isSuperAdmin ? <ShieldCheck className="h-4 w-4 text-purple-600" /> : isAdmin ? <ShieldCheck className="h-4 w-4 text-green-600" /> : <Shield className="h-4 w-4 text-gray-500" />}
                <Badge variant={isSuperAdmin ? "default" : isAdmin ? "default" : "secondary"}>
                  {isSuperAdmin ? "Super Admin" : isAdmin ? "Admin" : "Utilisateur"}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-gray-600">Nom complet</div>
                  <div className="font-medium">{user.full_name || "—"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-600">Téléphone</div>
                  <div className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    {user.phone || "—"}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-600">Email</div>
                  <div className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    {user.email}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-600">Inscription</div>
                  <div className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    {new Date(user.created_at).toLocaleDateString("fr-FR")}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-600">Dernière connexion</div>
                  <div className="font-medium">
                    {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("fr-FR") : "—"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Commandes ({orders.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {orders.length === 0 ? (
                <div className="text-sm text-gray-500">Aucune commande</div>
              ) : (
                orders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between border rounded-lg p-4">
                    <div className="space-y-1">
                      <div className="font-medium flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-blue-600" />
                        #{o.order_number}
                      </div>
                      <div className="text-sm text-gray-600">{new Date(o.created_at).toLocaleDateString("fr-FR")}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{o.total_amount.toFixed(2)} €</div>
                      <Badge variant="outline">{o.status}</Badge>
                    </div>
                    <Button asChild variant="outline" className="ml-3">
                      <Link href={`/admin/orders/${o.id}`}>Voir</Link>
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!isSuperAdmin && (
                <>
                  {isAdmin ? (
                    <Button variant="destructive" className="w-full" onClick={demoteToCustomer} disabled={updatingRole}>
                      Rétrograder en utilisateur
                    </Button>
                  ) : (
                    <Button className="w-full" onClick={promoteToAdmin} disabled={updatingRole}>
                      Promouvoir en administrateur
                    </Button>
                  )}
                </>
              )}
              <Separator />
              <Button variant="outline" className="w-full" onClick={() => router.push("/admin/users")}>
                Retour à la liste
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}