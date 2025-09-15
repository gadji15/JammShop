import { cookies } from "next/headers"
import { Suspense } from "react"
import type { Metadata } from "next"
import NewArrivalsClient from "@/components/new-arrivals/new-arrivals-client"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Nouveautés | JammShop",
  description:
    "Découvrez les dernières nouveautés JammShop : produits fraîchement ajoutés, prêts à être expédiés. Parcourez les arrivées récentes et trouvez vos coups de cœur.",
  alternates: { canonical: "/new-arrivals" },
  openGraph: {
    title: "Nouveautés | JammShop",
    description:
      "Découvrez les dernières nouveautés JammShop : produits fraîchement ajoutés, prêts à être expédiés.",
    url: "/new-arrivals",
    type: "website",
    images: [
      {
        url: `/api/og?route=new-arrivals`,
        width: 1200,
        height: 630,
        alt: "Nouveautés JammShop",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nouveautés | JammShop",
    description:
      "Découvrez les dernières nouveautés JammShop : produits fraîchement ajoutés, prêts à être expédiés.",
    images: [`/api/og?route=new-arrivals`],
  },
}

export default async function NewArrivalsPage() {
  const cookieStore = await cookies()
  const preferred = cookieStore.get("newArrivalsView")?.value
  const initialView = preferred === "comfortable" ? "comfortable" : "compact"

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Hero/Header SSR for SEO */}
      <section className="relative overflow-x-clip bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl" />
        </div>
        <div className="container mx-auto px-4 py-14 md:py-20 relative z-10 text-center">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/10 ring-1 ring-white/20 text-xs md:text-sm">
            JammShop — Nouveautés
          </span>
          <h1 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight text-balance">Nouveautés</h1>
          <p className="mt-3 md:mt-4 text-base md:text-lg text-white/90 max-w-2xl mx-auto">
            Fraîchement arrivés dans notre catalogue. Découvrez les derniers produits ajoutés.
          </p>

          {/* CTA vers les promotions */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 max-w-full">
            <Button
              asChild
              variant="secondary"
              className="w-full sm:w-auto bg-white text-blue-700 hover:bg-gray-100 whitespace-normal break-words text-sm sm:text-base px-4 sm:px-5"
            >
              <Link href="/deals">Profiter des promotions</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full sm:w-auto border-white/70 bg-transparent text-white hover:bg-white/10 hover:text-white whitespace-normal break-words text-sm sm:text-base px-4 sm:px-5"
            >
              <Link href="/products?sort=newest">Parcourir tout le catalogue</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Client section (filters, list, pagination) */}
      <Suspense fallback={<div className="container mx-auto px-4 py-10">Chargement des nouveautés…</div>}>
        <NewArrivalsClient initialView={initialView as "compact" | "comfortable"} />
      </Suspense>
    </div>
  )
}