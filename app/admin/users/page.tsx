"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

type OrderDir = "asc" | "desc"

type Profile = {
  id: string
  email: string
  full_name: string | null
  role: "user" | "admin" | "super_admin"
  created_at: string
}

export default function AdminUsersPage() {
  const [rows, setRows] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // server-driven controls
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [q, setQ] = useState("")
  const [role, setRole] = useState("all")
  const [sort, setSort] = useState("created_at")
  const [order, setOrder] = useState<OrderDir>("desc")
  const [total, setTotal] = useState(0)

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const p = new URLSearchParams()
      p.set("page", String(page))
      p.set("pageSize", String(pageSize))
      if (q) p.set("q", q)
      if (role && role !== "all") p.set("role", role)
      if (sort) p.set("sort", sort)
      if (order) p.set("order", order)

      const res = await fetch(`/api/admin/users?${p.toString()}`, { cache: "no-store" })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || "Chargement impossible")
      }
      const json = await res.json()
      setRows(json.data || [])
      setTotal(json.total || 0)
    } catch (e: any) {
      setError(e?.message || "Erreur")
      setRows([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, q, role, sort, order])

  useEffect(() => {
    fetchRows()
  }, [fetchRows])

  const toggleSort = (key: string) => {
    if (sort === key) {
      setOrder(order === "asc" ? "desc" : "asc")
    } else {
      setSort(key)
      setOrder("asc")
    }
  }

  const changeRole = async (id: string, newRole: Profile["role"]) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || "Mise à jour impossible")
      }
      fetchRows()
    } catch (e) {
      alert("Erreur lors du changement de rôle")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Utilisateurs</h1>
        <p className="text-gray-600">Gérez les comptes et rôles</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs {total ? `(${total})` : ""}</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px] md:max-w-sm">
              <Input
                placeholder="Rechercher (nom, email)"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <Select
              value={role}
              onValueChange={(v) => {
                setRole(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super admin</SelectItem>
              </SelectContent>
            </Select>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setQ("")
                  setRole("all")
                  setSort("created_at")
                  setOrder("desc")
                  setPage(1)
                }}
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-3 text-sm text-red-600">Erreur: {error}</div>}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("full_name")}
                    title="Trier par nom"
                  >
                    Nom {sort === "full_name" ? (order === "asc" ? "▲" : "▼") : ""}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("email")}
                    title="Trier par email"
                  >
                    Email {sort === "email" ? (order === "asc" ? "▲" : "▼") : ""}
                  </TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("created_at")}
                    title="Trier par date"
                  >
                    Inscription {sort === "created_at" ? (order === "asc" ? "▲" : "▼") : ""}
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell colSpan={5}>
                        <div className="h-10 bg-gray-100 rounded" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="text-center py-8 text-gray-500">Aucun utilisateur trouvé</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Select value={u.role} onValueChange={(v) => changeRole(u.id, v as any)}>
                          <SelectTrigger className="w-40">{u.role}</SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">user</SelectItem>
                            <SelectItem value="admin">admin</SelectItem>
                            <SelectItem value="super_admin">super_admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{new Date(u.created_at).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell>
                        {/* Placeholders for future actions */}
                        <div className="text-xs text-gray-500">—</div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Page {page} / {totalPages} — {total} élément(s)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Suivant
              </Button>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className="border rounded px-2 py-1 text-sm"
              >
                {[10, 20, 30, 50, 100].map((s) => (
                  <option key={s} value={s}>
                    {s} / page
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}