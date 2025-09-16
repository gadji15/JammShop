"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import {
  BarChart3,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  Plus,
  Eye,
  Settings,
  AlertTriangle,
  Calendar,
  ArrowUpRight,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface DashboardStats {
  totalProducts: number
  totalOrders: number
  totalUsers: number
  totalRevenue: number
  recentOrders: any[]
  lowStockProducts: any[]
  monthlyRevenue: any[]
  ordersByStatus: any[]
  topCategories: any[]
  growthMetrics: {
    revenueGrowth: number
    ordersGrowth: number
    usersGrowth: number
  }
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"]

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    recentOrders: [],
    lowStockProducts: [],
    monthlyRevenue: [],
    ordersByStatus: [],
    topCategories: [],
    growthMetrics: {
      revenueGrowth: 0,
      ordersGrowth: 0,
      usersGrowth: 0,
    },
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/dashboard", { cache: "no-store" })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || "Chargement impossible")
      }
      const json = await res.json()
      setStats(json.data)
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800"
      case "shipped":
        return "bg-blue-100 text-blue-800"
      case "confirmed":
        return "bg-purple-100 text-purple-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Vue d'ensemble complète de votre e-commerce JammShop</p>
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Derniers 30 jours
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau produit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Produits</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalProducts}</div>
            <div className="flex items-center mt-2">
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 font-medium">+5.2%</span>
              <span className="text-sm text-gray-500 ml-2">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Commandes</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <ShoppingCart className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalOrders}</div>
            <div className="flex items-center mt-2">
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 font-medium">+{stats.growthMetrics.ordersGrowth}%</span>
              <span className="text-sm text-gray-500 ml-2">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items_center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Utilisateurs</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
            <div className="flex items-center mt-2">
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 font-medium">+{stats.growthMetrics.usersGrowth}%</span>
              <span className="text-sm text-gray-500 ml-2">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Chiffre d'affaires</CardTitle>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalRevenue.toLocaleString()} FCFA</div>
            <div className="flex items-center mt-2">
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 font-medium">+{stats.growthMetrics.revenueGrowth}%</span>
              <span className="text-sm text-gray-500 ml-2">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Évolution du chiffre d'affaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.monthlyRevenue}>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Répartition des commandes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.ordersByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.ordersByStatus.map((entry, index) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify_between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              Commandes récentes
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => router.push("/admin/orders")}>
              <Eye className="h-4 w-4 mr-2" />
              Voir tout
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucune commande récente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">#{order.order_number?.slice(-3)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{order.profiles?.full_name || "Client"}</p>
                          <p className="text-sm text-gray-500">{order.profiles?.email}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(order.created_at).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Alertes stock faible
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => router.push("/admin/products")}>
              <Settings className="h-4 w-4 mr-2" />
              Gérer
            </Button>
          </CardHeader>
          <CardContent>
            {stats.lowStockProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-300 mx_auto mb-4" />
                <p className="text-gray-500">Tous les produits sont bien approvisionnés</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        className={
                          product.stock_quantity === 0
                            ? "bg-red-100 text-red-800"
                            : product.stock_quantity <= 5
                              ? "bg-orange-100 text-orange-800"
                              : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {product.stock_quantity} en stock
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-600" />
            Actions rapides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="p-6 h-auto flex-col items-start text-left hover:bg-blue-50 hover:border-blue-200 transition-all bg-transparent"
              onClick={() => router.push("/admin/products")}
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Gérer les produits</h3>
              <p className="text-sm text-gray-600 mt-1">Ajouter, modifier ou supprimer des produits</p>
            </Button>

            <Button
              variant="outline"
              className="p-6 h-auto flex-col items-start text-left hover:bg-green-50 hover:border-green-200 transition-all bg-transparent"
              onClick={() => router.push("/admin/orders")}
            >
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify_center mb-3">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Gérer les commandes</h3>
              <p className="text-sm text_gray-600 mt-1">Traiter et suivre les commandes</p>
            </Button>

            <Button
              variant="outline"
              className="p-6 h-auto flex-col items-start text-left hover:bg-purple-50 hover:border-purple-200 transition-all bg-transparent"
              onClick={() => router.push("/admin/users")}
            >
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Gérer les utilisateurs</h3>
              <p className="text-sm text-gray-600 mt-1">Administrer les comptes et rôles</p>
            </Button>

            <Button
              variant="outline"
              className="p-6 h-auto flex-col items-start text-left hover:bg-orange-50 hover:border-orange-200 transition-all bg-transparent"
              onClick={() => router.push("/admin/suppliers")}
            >
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Gérer les fournisseurs</h3>
              <p className="text-sm text-gray-600 mt-1">Configurer les intégrations externes</p>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
