import { updateSession } from "@/lib/supabase/middleware"
import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

// Central configuration for restricted admin sections
const SUPER_ADMIN_ONLY_PREFIXES = [
  "/admin/settings",
  "/admin/users",
  "/admin/analytics",
  "/admin/external-imports",
]

export async function middleware(request: NextRequest) {
  // Always refresh session cookies first
  let response = await updateSession(request)

  // A/B cookie for Hero: set/override from URL (?ab=hero1|hero2) or once if missing
  const abParam = request.nextUrl.searchParams.get("ab")
  const abCookie = request.cookies.get("ab_variant")?.value
  let picked = abCookie

  if (abParam === "hero1" || abParam === "hero2") {
    picked = abParam
  } else if (!abCookie || (abCookie !== "hero1" && abCookie !== "hero2")) {
    picked = Math.random() &lt; 0.5 ? "hero1" : "hero2"
  }

  if (picked && picked !== abCookie) {
    response = response ?? NextResponse.next({ request })
    response.cookies.set("ab_variant", picked, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 180, // 180 days
    })
  }

  const { pathname } = request.nextUrl

  // Guard only for /admin paths
  if (pathname.startsWith("/admin")) {
    // Create a server client bound to this request/response lifecycle
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            // Ensure we propagate cookies back to client
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          },
        },
      },
    )

    // Get user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Not authenticated -> redirect to login
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      url.searchParams.set("redirect", pathname)
      const redirect = NextResponse.redirect(url)
      // copy cookies from response to redirect
      for (const { name, value } of response.cookies.getAll()) {
        redirect.cookies.set(name, value)
      }
      return redirect
    }

    // Fetch profile to check role
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"
    const isSuperAdmin = profile?.role === "super_admin"

    // Admin access required for all /admin
    if (!isAdmin) {
      const redirect = NextResponse.redirect(new URL("/", request.url))
      for (const { name, value } of response.cookies.getAll()) {
        redirect.cookies.set(name, value)
      }
      return redirect
    }

    // Restrict certain sections to super_admin only
    const isSuperAdminSection = SUPER_ADMIN_ONLY_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(p + "/"),
    )

    if (isSuperAdminSection && !isSuperAdmin) {
      const redirect = NextResponse.redirect(new URL("/admin", request.url))
      for (const { name, value } of response.cookies.getAll()) {
        redirect.cookies.set(name, value)
      }
      return redirect
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
