"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { createClient } from "@/lib/supabase/client"
import {
  BarChart3,
  Building2,
  Download,
  FolderTree,
  Home,
  LogOut,
  Package,
  Percent,
  Settings,
  ShoppingCart,
  Users,
  ChevronDown,
} from "lucide-react"

type NavItem = { name: string; href: string; icon: any }
type NavGroup = { key: string; label: string; items: NavItem[] }

const GROUPS: NavGroup[] = [
  {
    key: "dashboard",
    label: "Tableau de bord",
    items: [{ name: "Dashboard", href: "/admin", icon: Home }],
  },
  {
    key: "catalog",
    label: "Catalogue",
    items: [
      { name: "Produits", href: "/admin/products", icon: Package },
      { name: "Catégories", href: "/admin/categories", icon: FolderTree },
      { name: "Promotions", href: "/admin/deals", icon: Percent },
      { name: "Fournisseurs", href: "/admin/suppliers", icon: Building2 },
      { name: "Imports Externes", href: "/admin/external-imports", icon: Download },
    ],
  },
  {
    key: "ops",
    label: "Opérations",
    items: [
      { name: "Commandes", href: "/admin/orders", icon: ShoppingCart },
      { name: "Utilisateurs", href: "/admin/users", icon: Users },
      { name: "Statistiques", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    key: "settings",
    label: "Paramètres",
    items: [{ name: "Paramètres", href: "/admin/settings", icon: Settings }],
  },
]

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem("admin_sidebar_collapsed")
      if (raw) setCollapsed(JSON.parse(raw))
    } catch {}
  }, [])

  const persist = useCallback((next: Record<string, boolean>) => {
    setCollapsed(next)
    try {
      localStorage.setItem("admin_sidebar_collapsed", JSON.stringify(next))
    } catch {}
  }, [])

  const toggle = (key: string) => {
    const next = { ...collapsed, [key]: !collapsed[key] }
    persist(next)
  }

  const isActive = useCallback(
    (href: string) => {
      if (!pathname) return false
      return pathname === href || pathname.startsWith(href + "/")
    },
    [pathname],
  )

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="flex h-full flex-col bg-gray-900 text-white w-72 lg:w-64 overflow-hidden">
      {/* Header/Branding */}
      <div className="flex h-16 items-center px-4 shrink-0">
        <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-sm">J</span>
        </div>
        <span className="ml-2 font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          JammShop
        </span>
      </div>
      <Separator className="bg-gray-700" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        <div className="space-y-2">
          {GROUPS.map((g) => {
            const isCollapsed = !!collapsed[g.key]
            return (
              <div key={g.key} className="space-y-1">
                <button
                  type="button"
                  className="w-full flex items-center justify-between text-left text-xs uppercase tracking-wide text-gray-400 px-2 py-2 hover:text-white"
                  onClick={() => toggle(g.key)}
                  aria-expanded={!isCollapsed}
                >
                  <span>{g.label}</span>
                  <ChevronDown
                    className={cn("h-4 w-4 transition-transform", isCollapsed ? "-rotate-90" : "rotate-0")}
                  />
                </button>
                {!isCollapsed && (
                  <ul className="space-y-1">
                    {g.items.map((item) => {
                      const active = isActive(item.href)
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={onNavigate}
                            className={cn(
                              "flex items-center rounded-lg px-3 py-2 text-sm transition-colors duration-200",
                              active
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                                : "text-gray-300 hover:bg-gray-800 hover:text-white",
                            )}
                          >
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                            <span className="ml-3 truncate">{item.name}</span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </nav>

      <Separator className="bg-gray-700" />

      {/* Footer actions */}
      <div className="p-2 shrink-0">
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          <span className="ml-3">Se déconnecter</span>
        </Button>
      </div>
    </div>
  )
}

export function AdminSidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  return (
    <>
      {/* Desktop static sidebar */}
      <div className="hidden lg:block h-full">
        <SidebarInner />
      </div>

      {/* Mobile drawer sidebar */}
      <div className="lg:hidden">
        <Sheet open={!!isOpen} onOpenChange={(open) => (!open ? onClose?.() : null)}>
          <SheetContent side="left" className="p-0 w-72 sm:w-80 data-[state=open]:animate-in">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation d'administration</SheetTitle>
              <SheetDescription>Menu de navigation pour les sections d'administration</SheetDescription>
            </SheetHeader>
            <SidebarInner onNavigate={onClose} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}