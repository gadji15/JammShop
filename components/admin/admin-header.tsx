"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { Bell, Menu, Search, User, Settings, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface AdminHeaderProps {
  onMenuClick?: () => void
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        setProfile(profile)
      }
    }

    getUser()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6 shadow-sm">
      <div className="flex items-center space-x-4 flex-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden hover:bg-gray-100 transition-colors duration-200"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Rechercher dans l'admin..."
            className="pl-10 pr-4 py-2 w-full border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 lg:space-x-4">
        <Button variant="ghost" size="icon" className="relative hover:bg-gray-100 transition-colors duration-200">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs flex items-center justify-center">
            <span className="sr-only">Nouvelles notifications</span>
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center space-x-2 hover:bg-gray-100 transition-colors duration-200 px-2 lg:px-3"
            >
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-sm font-medium text-gray-900">{profile?.full_name || "Admin"}</div>
                <div className="text-xs text-gray-500 truncate max-w-32">{user?.email}</div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 shadow-lg">
            <div className="px-3 py-2 border-b">
              <div className="text-sm font-medium text-gray-900">{profile?.full_name || "Administrateur"}</div>
              <div className="text-xs text-gray-500 truncate">{user?.email}</div>
            </div>
            <DropdownMenuItem asChild>
              <button
                onClick={() => router.push("/admin/profile")}
                className="w-full text-left flex items-center px-3 py-2 hover:bg-gray-50"
              >
                <User className="h-4 w-4 mr-2" />
                Mon profil
              </button>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <button
                onClick={() => router.push("/admin/settings")}
                className="w-full text-left flex items-center px-3 py-2 hover:bg-gray-50"
              >
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </button>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <button
                onClick={handleSignOut}
                className="w-full text-left flex items-center px-3 py-2 text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Se déconnecter
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
