import type { Metadata } from "next"
import { cookies } from "next/headers"
import Link from "next/link"
import { Suspense } from "react"
import { ProductGrid } from "@/components/product/product-grid"
import { ProductGridSkeleton } from "@/components/product/product-loading"

type Brand = {
  id: string
  name: string
  slug?: string | null
}

export const revalidate = 60

type PageProps = { params: { slug: string }; searchParams: { [key: string]: string | string[] | undefined } }

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || ""
  const title = `Marque ${params.slug} | JammShop`
  const desc = `Découvrez les produits de la marque ${params.slug} sur JammShop.`
  const og = `${base}/api/og?title=${encodeURIComponent(`Marque ${params.slug}`)}&subtitle=${encodeURIComponent("Catalogue JammShop")}`
  return {
    title,
    description: desc,
    alternates: { canonical: `/brands/${params.slug}` },
    openGraph: { title, description: desc, url: `/brands/${params.slug}`, images: [{ url: og }] },
    twitter: { card: "summary_large_image", title, description: desc, images: [og] },
  }
}

async function fetchBrand(slug: string): Promise<Brand> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/brands/${slug}`, { cache: "no-store" })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || "Brand fetch error")
  return json.brand
}

export default async function BrandPage({ params, searchParams }: PageProps) {
  const brand = await fetchBrand(params.slug)
  const cookieStore = await cookies()
  const preferred = cookieStore.get("productsView")?.value
  const compact = preferred !== "comfortable"

  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-x-clip bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl" />
        </div>
        <div className="container mx-auto px-4 py-14 md:py-20 relative z-10 text-center">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/10 ring-1 ring-white/20 text-xs md:text-sm">
            JammShop — Marque
          </span>
          <h1 className="mt-4 text-4xl md:text-6xl font-extrabold tracking-tight text-balance">
            {brand.name || brand.slug || brand.id}
          </h1>
          <p className="mt-3 md:mt-4 text-base md:text-lg text-white/90 max-w-2xl mx-auto">
            Tous les produits de cette marque.
          </p>
          <div className="mt-6">
            <Link href="/brands" className="underline text-white/90 hover:text-white">← Retour aux marques</Link>
          </div>
        </div>
      </section>

      <Suspense fallback={<div className="container mx-auto px-4 py-10"><ProductGridSkeleton /></div>}>
        {/* Client fetching via API route with current search params */}
        {/* We keep server simplicity; the grid remains consistent with other pages */}
        <BrandProducts slug={params.slug} compact={compact} searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

// Inline client bridge for fetching products (keeps page server-friendly)
function BrandProducts({ slug, compact, searchParams }: { slug: string; compact: boolean; searchParams: Record<string, any> }) {
  // This component will be RSC until it uses client hooks; we fetch server-side here for simplicity:
  const page = Number(searchParams.page || "1")
  const pageSize = Number(searchParams.pageSize || "24")
  const sort = String(searchParams.sort || "newest")
  const inStock = ["1", "true", "yes"].includes(String(searchParams.inStock || "").toLowerCase())
  const minPrice = searchParams.minPrice ? Number(searchParams.minPrice) : undefined
  const maxPrice = searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined

  const qs = new URLSearchParams()
  qs.set("page", String(page))
  qs.set("pageSize", String(pageSize))
  qs.set("sort", sort)
  if (inStock) qs.set("inStock", "1")
  if (typeof minPrice === "number") qs.set("minPrice", String(minPrice))
  if (typeof maxPrice === "number") qs.set("maxPrice", String(maxPrice))

  // Server-side fetch products
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const dataPromise = fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/brands/${slug}/products?${qs.toString()}`, { cache: "no-store" }).then(r => r.json())

  // eslint-disable-next-line react-hooks/rules-of-hooks
  throw Promise.resolve(dataPromise.then((json) => {
    if (json.error) throw new Error(json.error)
    return (
      <div className="container mx-auto px-4 py-10">
        <ProductGrid products={json.items || []} compact={compact} />
        <div className="mt-6 flex items-center justify-between">
          <Link href={`?${new URLSearchParams({ ...qs, page: String(Math.max(1, page - 1)) }).toString()}`} className="text-sm text-gray-700 hover:underline">
            Précédent
          </Link>
          <span className="text-sm text-gray-600">Page {json.page} / {json.totalPages}</span>
          <Link href={`?${new URLSearchParams({ ...qs, page: String(page + 1) }).toString()}`} className="text-sm text-gray-700 hover:underline">
            Suivant
          </Link>
        </div>
      </div>
    )
  }))
}