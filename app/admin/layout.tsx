"use client"

import type React from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { useAuthModal } from "@/lib/hooks/use-auth-modal"
import { AuthModal } from "@/components/auth/auth-modal"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isOpen, reason, title, description, openModal, closeModal } = useAuthModal()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          openModal(
            "admin",
            "Accès administrateur requis",
            "Cette section est réservée aux administrateurs. Connectez-vous avec vos identifiants admin.",
          )
          setLoading(false)
          return
        }

        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
          openModal(
            "admin",
            "Droits administrateur requis",
            "Vous devez avoir des droits administrateur pour accéder à cette section.",
          )
          setLoading(false)
          return
        }

        setUser(user)
        setProfile(profile)
      } catch (error) {
        console.error("Auth check failed:", error)
        openModal("admin")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [supabase, openModal])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 text-sm">Chargement de l'administration...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <AuthModal isOpen={isOpen} onClose={closeModal} reason={reason} title={title} description={description} />
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Administration JammShop</h1>
          <p className="text-gray-600">Accès réservé aux administrateurs</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className={`${sidebarOpen ? "block" : "hidden"} lg:block fixed lg:relative z-30 h-full`}>
        <AdminSidebar />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AdminHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto p-4 lg:p-6 xl:p-8 bg-gray-50">
          <div className="max-w-full mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
