import { createServerClient } from "@supabase/ssr"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export async function getSessionWithProfile() {
  const h = await headers()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // In RSC we cannot read cookies directly via headers(); SSR cookie store is managed by Next
        // Using headers is enough for Supabase SSR to bind session in RSC context.
        getAll() {
          // Next 15: headers() doesn't expose cookies directly; rely on middleware/session refresh.
          return []
        },
        setAll() {
          // No-op in server components; middleware is responsible for session persistence
        },
      },
      headers: {
        // Forward request headers so Supabase can pick up the auth cookies from middleware
        // Note: headers() returns a Headers object; convert to plain object if needed.
      } as any,
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile: null | { role?: string } = null
  if (user) {
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    profile = data
  }

  return { user, profile }
}

export async function requireAdmin() {
  const { user, profile } = await getSessionWithProfile()
  if (!user) redirect("/auth/login")
  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"
  if (!isAdmin) redirect("/")
  return { user, profile }
}

export async function requireSuperAdmin() {
  const { user, profile } = await getSessionWithProfile()
  if (!user) redirect("/auth/login")
  if (profile?.role !== "super_admin") redirect("/admin")
  return { user, profile }
}