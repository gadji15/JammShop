import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, profile: null }
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
  return { supabase, user, profile }
}

// PATCH /api/admin/users/:id { role: "admin" | "super_admin" | "user" }
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { supabase, user, profile } = await requireAdmin()
  if (!user || !profile || !["admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const targetId = params.id
  if (!targetId) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const role = String(payload?.role || "").trim()
  if (!role || !["user", "admin", "super_admin"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  // Prevent non-super_admin from assigning super_admin
  if (role === "super_admin" && profile.role !== "super_admin") {
    return NextResponse.json({ error: "Insufficient privileges" }, { status: 403 })
  }

  const { data, error } = await supabase.from("profiles").update({ role }).eq("id", targetId).select("*").maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}