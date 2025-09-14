"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Search, Shield, Truck, Package, Sparkles } from "lucide-react"
import { useCategories } from "@/lib/hooks/use-categories"
import { cn } from "@/lib/utils"

export function Hero() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { categories } = useCategories()
  const [q, setQ] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const query = q.trim()
    router.push(query ? `/products?query=${encodeURIComponent(query)}` : "/products")
  }

  // External media placeholders (royalty-free)
  const videoSrc = "https://cdn.coverr.co/videos/coverr-online-shopping-1556/1080p.mp4"
  const posterSrc =
    "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1600&auto=format&fit=crop"
  const mobileBg =
    "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1200&auto=format&fit=crop"

  // A/B test lightweight: query param ?ab=hero2 or persisted session choice
  const variant = useMemo(() => {
    const param = searchParams?.get("ab")
    if (param === "hero2" || param === "hero1") return param
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("heroVariant")
      if (stored === "hero2" || stored === "hero1") return stored
      const picked = Math.random() < 0.5 ? "hero1" : "hero2"
      sessionStorage.setItem("heroVariant", picked)
      return picked
    }
    return "hero1"
  }, [searchParams])

  // Video behavior: pause on hidden tab or reduced motion
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    const handlePref = () => {
      if (prefersReduced.matches) {
        video.pause()
      } else {
        // Try play, ignore errors due to autoplay policies (muted=true helps)
        video.play().catch(() => {})
      }
    }
    const onVisibility = () => {
      if (document.hidden) {
        video.pause()
      } else if (!prefersReduced.matches) {
        video.play().catch(() => {})
      }
    }
    handlePref()
    prefersReduced.addEventListener?.("change", handlePref)
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      prefersReduced.removeEventListener?.("change", handlePref)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  const headline =
    variant === "hero2"
      ? (
          <>
            Trouvez tout. <span className="text-yellow-300">Au meilleur prix.</span>
          </>
        )
      : (
          <>
            Achetez malin. Vendez plus. <span className="text-yellow-300">Sans effort.</span>
          </>
        )

  const subline =
    variant === "hero2"
      ? "Comparez en un clin d’œil. Commandez en toute confiance. Livraison rapide partout."
      : "La marketplace de confiance pour découvrir, comparer et commander vos produits au meilleur prix."

  return (
    <section className="relative overflow-hidden">
      {/* Background media */}
      <div className="absolute inset-0">
        {/* Desktop video background */}
        <video
          ref={videoRef}
          className="hidden md:block h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={posterSrc}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
        {/* Mobile image fallback */}
        <div
          className="md:hidden h-full w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${mobileBg})` }}
        />
        {/* Gradient scrim */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/65" />
        {/* Accent glow */}
        <div className="pointer-events-none absolute -bottom-24 left-1/2 h-72 w-[90%] -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
            <Badge className="bg-white/20 text-white border-white/30">Nouveau sur JammShop</Badge>
            <span className="hidden md:inline text-white/80 text-sm">Des milliers d’articles en stock</span>
          </div>

          <h1 className="text-white text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            {headline}
          </h1>
          <p className="mt-3 md:mt-4 text-base md:text-xl text-white/85">{subline}</p>

          {/* Search bar */}
          <form onSubmit={onSearch} className="mt-5 md:mt-8 flex gap-2" aria-label="Recherche de produits">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" aria-hidden="true" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher un produit, une marque, une catégorie..."
                className={cn(
                  "pl-9 pr-3 h-11 md:h-12",
                  "bg-white/90 text-gray-900 placeholder:text-gray-500",
                  "focus:bg-white shadow-lg",
                )}
                aria-label="Saisir votre recherche"
              />
            </div>
            <Button type="submit" className="h-11 md:h-12 px-5 md:px-6 bg-blue-600 hover:bg-blue-700" aria-label="Lancer la recherche">
              Rechercher
            </Button>
          </form>

          {/* Quick actions */}
          <div className="mt-4 md:mt-6 flex flex-wrap gap-2 items-center">
            <Button asChild variant="secondary" className="bg-white text-blue-700 hover:bg-white/90">
              <Link href="/products">
                Découvrir nos produits
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="text-white border-white/60 hover:bg-white hover:text-blue-700">
              <Link href="/auth/register">Devenir vendeur</Link>
            </Button>
            {/* Secondary CTA visible on md+ */}
            <Button asChild variant="outline" className="hidden md:inline-flex text-white border-white/60 hover:bg-white hover:text-blue-700">
              <Link href="/products?promo=1">
                <Sparkles className="mr-2 h-4 w-4" />
                Voir les promos
              </Link>
            </Button>
          </div>

          {/* Trust bar */}
          <div className="mt-6 md:mt-8 grid grid-cols-3 gap-3 text-left">
            <div className="flex items-center gap-2 text-white/90">
              <Truck className="h-5 w-5 text-blue-300" />
              <span className="text-xs md:text-sm">Livraison rapide</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <Shield className="h-5 w-5 text-blue-300" />
              <span className="text-xs md:text-sm">Paiement sécurisé</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <Package className="h-5 w-5 text-blue-300" />
              <span className="text-xs md:text-sm">Retour 30 jours</span>
            </div>
          </div>

          {/* Category quick links (dynamic) */}
          {categories.length > 0 && (
            <div className="mt-6 md:mt-8 flex flex-wrap gap-2">
              {categories.slice(0, 8).map((c) => (
                <Link
                  key={c.id}
                  href={`/categories/${c.slug}`}
                  className="text-xs md:text-sm text-white/90 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-full border border-white/20 transition"
                >
                  {c.name}
                </Link>
              ))}
              <Link
                href="/products"
                className="text-xs md:text-sm text-blue-900 bg-yellow-300 hover:bg-yellow-400 px-3 py-1.5 rounded-full transition"
              >
                Tout voir
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}