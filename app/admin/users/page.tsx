"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { Users, Search, Shield, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  email: string
  full_name: string
  phone: string
  role: string
  created_at: string
  last_sign_in_at: string
  order_count?: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const supabase = createClient()

  useEffect(() => {
    secureAndFetch()
  }, [])

  const secureAndFetch = async () => {
    // Client-side hard guard (middleware handles server-side)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = "/auth/login?redirect=/admin/users"
      return
    }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    if (profile?.role !== "super_admin") {
      window.location.href = "/admin"
      return
    }
    await fetchUsers()
  }

  const fetchUsers = async () => {
    try {
      // Fetch profiles without implicit join
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id,email,full_name,role,created_at,last_sign_in_at")
        .order("created_at", { ascending: false })

      if (profilesError) throw profilesError

      // Fetch aggregated order counts by user_id
      // Supabase JS client doesn't expose `.group()` directly.
      // Use RPC or a view instead. Here, use an RPC that groups in SQL.
      let countsMap = new Map<string, number>()
      try {
        const { data: orderAgg, error: ordersError } = await supabase.rpc("get_order_counts_by_user")
        if (ordersError) throw ordersError
        ;(orderAgg || []).forEach((row: any) => {
          if (row.user_id) countsMap.set(row.user_id, Number(row.count) || 0)
        })
      } catch (e) {
        console.warn("[AdminUsersPage] RPC get_order_counts_by_user failed, falling back to client-side tally:", e)
        // Fallback: fetch minimal orders and tally in JS (may be heavier on large datasets)
        const { data: ordersFallback, error: ordersFallbackErr } = await supabase
          .from("orders")
          .select("user_id")
        if (!ordersFallbackErr) {
          (ordersFallback || []).forEach((row: any) => {
            if (!row.user_id) return
            countsMap.set(row.user_id, (countsMap.get(row.user_id) || 0) + 1)
          })
        }
      }

      const usersWithOrderCount = (profiles || []).map((u: any) => ({
        ...u,
        order_count: countsMap.get(u.id) ?? 0,
      }))

      setUsers(usersWithOrderCount)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Erreur lors du chargement des utilisateurs")
    } finally {
      setLoading(false)
    }
  }

  const toggleUserRole = async (userId: string, currentRole: string) => {
    // Respect des rôles du projet: 'customer', 'admin', 'super_admin'
    // Cette action ne doit pas gérer super_admin (réservé via un autre flux)
    const newRole = currentRole === "admin" ? "customer" : "admin"

    try {
      const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId)

      if (error) throw error

      toast.success(`Rôle mis à jour vers ${newRole}`)
      fetchUsers()
    } catch (error) {
      console.error("Error updating user role:", error)
      toast.error("Erreur lors de la mise à jour du rôle")
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify_between items-center">
          <h1 className="text-3xl font-bold">Gestion des Utilisateurs</h1>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify_between items-center">
        <h1 className="text-3xl font-bold">Gestion des Utilisateurs</h1>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrateurs</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((user) => user.role === "admin").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((user) => user.last_sign_in_at).length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Liste des Utilisateurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Commandes</TableHead>
                <TableHead>Inscription</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name || "Non renseigné"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone || "Non renseigné"}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role === "admin" ? (
                        <>
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Admin
                        </>
                      ) : (
                        <>
                          <Shield className="h-3 w-3 mr-1" />
                          Utilisateur
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.order_count} commandes</Badge>
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => toggleUserRole(user.id, user.role)}>
                      {user.role === "admin" ? "Rétrograder" : "Promouvoir"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
