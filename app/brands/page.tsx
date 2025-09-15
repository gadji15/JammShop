import type { Metadata } from "next"
import { Suspense } from "react"
import BrandsClient from "@/components/brands/brands-client"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Marques | JammShop",
  description: "Découvrez toutes les marques présentes sur JammShop. Recherchez, filtrez, explorez les catalogues par marque.",
  alternates: { canonical: "/brands" },
  openGraph: {
    title: "Marques | JammShop",
    description: "Toutes les marques disponibles sur JammShop.",
    url: "/brands",
    type: "website",
    images: [{ url: "/api/og?title=Marques%20JammShop&subtitle=Explorez%20nos%20marques" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Marques | JammShop",
    description: "Toutes les marques disponibles sur JammShop.",
    images: ["/api/og?title=Marques%20JammShop&subtitle=Explorez%20nos%20marques"],
  },
}

export default function BrandsPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-x-clip bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl" />
        </div>
        <div className="container mx-auto px-4 py-14 md:py-20 relative z-10 text-center">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/10 ring-1 ring-white/20 text-xs md:text-sm">
            JammShop — Marques
          </span>
          <h1 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight text-balance">
            Marques
          </h1>
          <p className="mt-3 md:mt-4 text-base md:text-lg text-white/90 max-w-2xl mx-auto">
            Explorez toutes les marques disponibles et accédez à leurs produits.
          </p>
        </div>
      </section>

      <Suspense fallback={<div className="container mx-auto px-4 py-10">Chargement des marques…</div>}>
        <BrandsClient />
      </Suspense>
    </div>
  )
}