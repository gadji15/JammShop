import { cookies } from "next/headers"
import { Hero } from "@/components/layout/hero"
import ClientHome from "@/components/home/client-home"

export default async function HomePage() {
  // Server-side: pick the A/B variant from cookie set by middleware
  const cookieStore = await cookies()
  const variant = (cookieStore.get("ab_variant")?.value === "hero2" ? "hero2" : "hero1") as "hero1" | "hero2"

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section (SSR deterministic) */}
      <section className="relative bg-black text-white">
        <Hero forcedVariant={variant} />
      </section>
      {/* Client sections (categories, featured products, features, newsletter) */}
      <ClientHome />
    </div>
  )
}
