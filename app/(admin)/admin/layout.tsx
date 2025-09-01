import type React from "react"
import { redirect } from "next/navigation"
import { createClient as createServerSupabase } from "@/lib/supabase/server"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?reason=admin_required")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    redirect("/auth/login?reason=forbidden")
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className={`lg:block fixed lg:relative z-30 h-full`}>
        <AdminSidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AdminHeader onMenuClick={() => {}} />
        <main className="flex-1 overflow-auto p-4 lg:p-6 xl:p-8 bg-gray-50">
          <div className="max-w-full mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}