"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  Building2,
  FolderTree,
  Home,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Users,
  Download,
  Percent,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: Home },
  { name: "Produits", href: "/admin/products", icon: Package },
  { name: "Catégories", href: "/admin/categories", icon: FolderTree },
  { name: "Commandes", href: "/admin/orders", icon: ShoppingCart },
  { name: "Utilisateurs", href: "/admin/users", icon: Users },
  { name: "Fournisseurs", href: "/admin/suppliers", icon: Building2 },
  { name: "Promotions", href: "/admin/deals", icon: Percent },
  { name: "Imports Externes", href: "/admin/external-imports", icon: Download },
  { name: "Statistiques", href: "/admin/analytics", icon: BarChart3 },
  { name: "Paramètres", href: "/admin/settings", icon: Settings },
]

type SidebarProps = {
  disableAutoCollapse?: boolean
  className?: string
}

export function AdminSidebar({ disableAutoCollapse = false, className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    if (disableAutoCollapse) return
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true)
      } else {
        setIsCollapsed(false)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [disableAutoCollapse])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-gray-900 text-white transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64",
        className,
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-center px-3">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">J</span>
          </div>
          {!isCollapsed && (
            <span className="font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              JammShop
            </span>
          )}
        </div>
      </div>

      <Separator className="bg-gray-700" />

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative",
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white hover:scale-105",
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon
                    className={cn("flex-shrink-0 transition-all duration-200", isCollapsed ? "h-6 w-6" : "h-5 w-5")}
                  />
                  {!isCollapsed && <span className="ml-3 truncate">{item.name}</span>}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.name}
                    </div>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <Separator className="bg-gray-700" />

      {/* User Actions */}
      <div className="p-2">
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={cn(
            "w-full text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 group relative",
            isCollapsed ? "justify-center px-2" : "justify-start",
          )}
          title={isCollapsed ? "Se déconnecter" : undefined}
        >
          <LogOut className={cn("flex-shrink-0", isCollapsed ? "h-5 w-5" : "h-4 w-4")} />
          {!isCollapsed && <span className="ml-3">Se déconnecter</span>}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              Se déconnecter
            </div>
          )}
        </Button>
      </div>
    </div>
  )
}
