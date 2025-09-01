"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useMemo, useState } from "react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Calendar, Download, BarChart3, PieChart as PieIcon, TrendingUp, Users, Package, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

type OrderRow = {
  id: string
  total_amount: number
  status: string
  created_at: string
}

type ProductRow = {
  id: string
  name: string
  price: number
  stock_quantity: number
  category_id: string | null
  created_at: string
}

type ProfileRow = {
  id: string
  created_at: string
}

type CategoryRow = {
  id: string
  name: string
}

type Aggregates = {
  revenueByMonth: { month: string; revenue: number }[]
  ordersByMonth: { month: string; orders: number }[]
  usersByMonth: { month: string; users: number }[]
  revenueByStatus: { name: string; value: number }[]
  stockByCategory: { name: string; value: number }[]
  kpis: {
    revenue30d: number
    orders30d: number
    newUsers30d: number
    avgOrderValue30d: number
  }
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#84CC16", "#F97316"]

function monthKey(date: Date) {
  return date.toLocaleDateString("fr-FR", { month: "short" })
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export default function AnalyticsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [products, setProducts] = useState<ProductRow[]>([])
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [categories, setCategories] = useState<CategoryRow[]>([])

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true)

        const since = new Date()
        since.setMonth(since.getMonth() - 6) // 6 derniers mois

        // Orders (limiter la plage pour éviter trop de data)
        const { data: ordersData } = await supabase
          .from("orders")
          .select("id,total_amount,status,created_at")
          .gte("created_at", since.toISOString())

        // Products (pour stats stock/catégories)
        const { data: productsData } = await supabase
          .from("products")
          .select("id,name,price,stock_quantity,category_id,created_at")

        // Profiles (nouveaux utilisateurs)
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id,created_at")
          .gte("created_at", since.toISOString())

        // Categories (noms)
        const { data: categoriesData } = await supabase.from("categories").select("id,name")

        setOrders(ordersData || [])
        setProducts(productsData || [])
        setProfiles(profilesData || [])
        setCategories(categoriesData || [])
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const aggregates: Aggregates = useMemo(() => {
    const now = new Date()
    const monthsBack = [...Array(6)]
      .map((_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
        return { key: monthKey(d), month: d.getMonth(), year: d.getFullYear() }
      })

    const byMonth = (items: { created_at: string }[]) => {
      const map = new Map<string, number>()
      monthsBack.forEach((m) => map.set(m.key, 0))
      items.forEach((it) => {
        const d = new Date(it.created_at)
        const key = monthKey(d)
        if (map.has(key)) map.set(key, (map.get(key) || 0) + 1)
      })
      return monthsBack.map((m) => ({ month: m.key, value: map.get(m.key) || 0 }))
    }

    const revenueMap = new Map<string, number>()
    monthsBack.forEach((m) => revenueMap.set(m.key, 0))
    orders.forEach((o) => {
      const d = new Date(o.created_at)
      const key = monthKey(d)
      if (revenueMap.has(key)) {
        revenueMap.set(key, (revenueMap.get(key) || 0) + (o.total_amount || 0))
      }
    })
    const revenueByMonth = monthsBack.map((m) => ({ month: m.key, revenue: revenueMap.get(m.key) || 0 }))
    const ordersByMonth = byMonth(orders).map((o) => ({ month: o.month, orders: o.value }))
    const usersByMonth = byMonth(profiles).map((u) => ({ month: u.month, users: u.value }))

    const revenueByStatusMap = new Map<string, number>()
    orders.forEach((o) => {
      const prev = revenueByStatusMap.get(o.status) || 0
      revenueByStatusMap.set(o.status, prev + (o.total_amount || 0))
    })
    const revenueByStatus = Array.from(revenueByStatusMap.entries()).map(([name, value]) => ({ name, value }))

    const catName = (id: string | null) => categories.find((c) => c.id === id)?.name || "Sans catégorie"
    const stockByCategoryMap = new Map<string, number>()
    products.forEach((p) => {
      const key = catName(p.category_id as any)
      stockByCategoryMap.set(key, (stockByCategoryMap.get(key) || 0) + (p.stock_quantity || 0))
    })
    const stockByCategory = Array.from(stockByCategoryMap.entries()).map(([name, value]) => ({ name, value }))

    const thirtyDaysAgo = startOfDay(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    const orders30d = orders.filter((o) => new Date(o.created_at) >= thirtyDaysAgo)
    const revenue30d = orders30d.reduce((sum, o) => sum + (o.total_amount || 0), 0)
    const newUsers30d = profiles.filter((p) => new Date(p.created_at) >= thirtyDaysAgo).length
    const avgOrderValue30d = orders30d.length ? Math.round((revenue30d / orders30d.length) * 100) / 100 : 0

    return {
      revenueByMonth,
      ordersByMonth,
      usersByMonth,
      revenueByStatus,
      stockByCategory,
      kpis: {
        revenue30d,
        orders30d: orders30d.length,
        newUsers30d,
        avgOrderValue30d,
      },
    }
  }, [orders, products, profiles, categories])

  const handleExportCSV = () => {
    const rows = [
      ["Mois", "Revenu (FCFA)", "Commandes", "Nouveaux utilisateurs"],
      ...aggregates.revenueByMonth.map((r, i) => [
        r.month,
        r.revenue,
        aggregates.ordersByMonth[i]?.orders || 0,
        aggregates.usersByMonth[i]?.users || 0,
      ]),
    ]
    const csv = rows.map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Données consolidées liées aux commandes, produits et utilisateurs</p>
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            6 derniers mois
          </Button>
          <Button size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Revenu (30j)</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{aggregates.kpis.revenue30d.toLocaleString()} FCFA</div>
            <Badge variant="secondary" className="mt-2 bg-blue-100 text-blue-800">
              CA moyen/jour: {Math.round((aggregates.kpis.revenue30d / 30) || 0).toLocaleString()} FCFA
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Commandes (30j)</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{aggregates.kpis.orders30d}</div>
            <p className="text-sm text-gray-600 mt-2">Valeur moyenne: {aggregates.kpis.avgOrderValue30d.toLocaleString()} FCFA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Nouveaux utilisateurs (30j)</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{aggregates.kpis.newUsers30d}</div>
            <p className="text-sm text-gray-600 mt-2">Conversion à suivre dans les tunnels</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Produits actifs</CardTitle>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Package className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{products.length}</div>
            <p className="text-sm text-gray-600 mt-2">Suivi du stock par catégorie ci-dessous</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue evolution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Evolution du chiffre d'affaires (6 mois)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={aggregates.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} FCFA`, "Chiffre d'affaires"]} />
                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Orders & Users volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              Volume de commandes (6 mois)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aggregates.ordersByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              Nouveaux utilisateurs (6 mois)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aggregates.usersByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="users" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution par statut et stock par catégorie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieIcon className="h-5 w-5 text-fuchsia-600" />
              Revenu par statut de commande
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={aggregates.revenueByStatus} cx="50%" cy="50%" outerRadius={90} fill="#8884d8" dataKey="value" label>
                    {aggregates.revenueByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} FCFA`, "Revenu"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieIcon className="h-5 w-5 text-amber-600" />
              Stock par catégorie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={aggregates.stockByCategory} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
                    {aggregates.stockByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />
      <p className="text-xs text-gray-500">
        Les données proviennent directement de Supabase (orders, products, profiles, categories) et sont agrégées côté client.
      </p>
    </div>
  )
}