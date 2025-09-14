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
  const [showSuggest, setShowSuggest] = useState(false)
  const [serverResults, setServerResults] = useState<{ products: any[]; categories: any[] }>({ products: [], categories: [] })
  const [loadingSuggest, setLoadingSuggest] = useState(false)
  const [recent, setRecent] = useState<string[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)

  // load recent on mount
  useEffect(() => {
    try {
      const prev = JSON.parse(localStorage.getItem("heroRecent") || "[]") as string[]
      setRecent(prev)
    } catch {}
  }, [])

  // simple tracking wrapper: Vercel Analytics + Supabase endpoint
  const track = (event: string, props?: Record<string, any>) => {
    try {
      ;(window as any).va?.track?.(event, props)
    } catch {}

    try {
      const body = JSON.stringify({ name: event, props })
      if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
        const blob = new Blob([body], { type: "application/json" })
        navigator.sendBeacon("/api/analytics", blob)
      } else {
        fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {})
      }
    } catch {}
  }

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const query = q.trim()
    track("hero_search", { q_len: query.length, has_query: query.length > 0 })
    if (query) {
      try {
        const prev = JSON.parse(localStorage.getItem("heroRecent") || "[]") as string[]
        const next = [query, ...prev.filter((x) => x !== query)].slice(0, 6)
        localStorage.setItem("heroRecent", JSON.stringify(next))
        setRecent(next)
      } catch {}
    }
    router.push(query ? `/products?query=${encodeURIComponent(query)}` : "/products")
    setShowSuggest(false)
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

  // fire view event
  useEffect(() => {
    track("hero_view", { variant })
  }, [variant])

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
    variant === "hero2" ? (
      <>
        Trouvez tout. <span className="text-yellow-300">Au meilleur prix.</span>
      </>
    ) : (
      <>
        Achetez malin. Vendez plus. <span className="text-yellow-300">Sans effort.</span>
      </>
    )

  const subline =
    variant === "hero2"
      ? "Comparez en un clin d’œil. Commandez en toute confiance. Livraison rapide partout."
      : "La marketplace de confiance pour découvrir, comparer et commander vos produits au meilleur prix."

  // suggestions basées sur l'API (produits + catégories) avec fallback local
  const suggestions = useMemo(() => {
    const local =
      q.trim().length > 0
        ? categories.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 6)
        : []
    if (serverResults.products.length || serverResults.categories.length) {
      return {
        products: serverResults.products,
        categories: serverResults.categories,
      }
    }
    return { products: [], categories: local }
  }, [q, categories, serverResults])

  // Debounced server fetch for suggestions
  useEffect(() => {
    if (!showSuggest) return
    const value = q.trim()
    if (value.length < 2) {
      setServerResults({ products: [], categories: [] })
      setLoadingSuggest(false)
      return
    }
    setLoadingSuggest(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}&limit=6`, { cache: "no-store" })
        const json = await res.json()
        setServerResults({ products: json.products || [], categories: json.categories || [] })
      } catch {
        setServerResults({ products: [], categories: [] })
      } finally {
        setLoadingSuggest(false)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [q, showSuggest])

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
      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
            <Badge className="bg-white/20 text-white border-white/30">Nouveau sur JammShop</Badge>
            <span className="hidden md:inline text-white/80 text-sm">Des milliers d’articles en stock</span>
          </div>

          <h1 className="text-white text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">{headline}</h1>
          <p className="mt-3 md:mt-4 text-base md:text-xl text-white/85">{subline}</p>

          {/* Search bar with suggestions */}
          <form onSubmit={onSearch} className="mt-5 md:mt-8 flex gap-2" aria-label="Recherche de produits">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" aria-hidden="true" />
              <Input
                value={q}
                onChange={(e) => {
                  const value = e.target.value
                  setQ(value)
                  setShowSuggest(true)
                  if (value.trim().length === 0) {
                    setServerResults({ products: [], categories: [] })
                  }
                }}
                onFocus={() => setShowSuggest(true)}
                onBlur={() => setTimeout(() => setShowSuggest(false), 120)}
                placeholder="Rechercher un produit, une marque, une catégorie..."
                className={cn(
                  "pl-9 pr-3 h-11 md:h-12",
                  "bg-white/90 text-gray-900 placeholder:text-gray-500",
                  "focus:bg-white shadow-lg",
                )}
                aria-label="Saisir votre recherche"
              />
              {showSuggest && (
                <div className="absolute z-10 mt-1 w-full rounded-lg bg-white shadow-xl ring-1 ring-black/10 overflow-hidden">
                  <div className="max-h-80 overflow-auto divide-y">
                    {loadingSuggest && <div className="px-3 py-2 text-sm text-gray-500">Recherche…</div>}

                    {/* Recent when empty */}
                    {!loadingSuggest &&
                      q.trim().length === 0 &&
                      recent.length > 0 && (
                        <div className="py-2">
                          <div className="px-3 pb-1 text-xs font-semibold text-gray-500">Recherches récentes</div>
                          <ul>
                            {recent.map((term) => (
                              <li key={term}>
                                <Link
                                  href={`/products?query=${encodeURIComponent(term)}`}
                                  className="block px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
                                  onClick={() => track("hero_recent_click", { q: term })}
                                >
                                  {term}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {/* Server products */}
                    {suggestions.products.length > 0 && (
                      <div className="py-2">
                        <div className="px-3 pb-1 text-xs font-semibold text-gray-500">Produits</div>
                        <ul>
                          {suggestions.products.map((p: any) => (
                            <li key={p.id}>
                              <Link
                                href={`/products/${p.slug}`}
                                onClick={() => track("hero_suggest_click_product", { product: p.slug })}
                                className="block px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
                              >
                                {p.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Server/Local categories */}
                    {suggestions.categories.length > 0 && (
                      <div className="py-2">
                        <div className="px-3 pb-1 text-xs font-semibold text-gray-500">Catégories</div>
                        <ul>
                          {suggestions.categories.map((c: any) => (
                            <li key={c.id}>
                              <Link
                                href={`/categories/${c.slug}`}
                                onClick={() => track("hero_suggest_click_category", { category: c.slug })}
                                className="block px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
                              >
                                {c.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Empty state */}
                    {!loadingSuggest &&
                      q.trim().length > 0 &&
                      suggestions.categories.length === 0 &&
                      suggestions.products.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-500">Aucun résultat</div>
                      )}
                  </div>
                </div>
              )}
            </div>
            <Button
              type="submit"
              className="h-11 md:h-12 px-5 md:px-6 bg-blue-600 hover:bg-blue-700"
              aria-label="Lancer la recherche"
            >
              Rechercher
            </Button>
          </form>

          {/* Quick actions */}
          <div className="mt-4 md:mt-6 flex flex-wrap gap-2 items-center">
            <Button
              asChild
              variant="secondary"
              className="bg-white text-blue-700 hover:bg-white/90"
              onClick={() => track("hero_cta_products")}
            >
              <Link href="/products">
                Découvrir nos produits
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="bg-white/90 text-blue-700 border-white/80 hover:bg-white"
              onClick={() => track("hero_cta_register")}
            >
              <Link href="/auth/register">Devenir vendeur</Link>
            </Button>
            {/* Secondary CTA visible on md+ */}
            <Button
              asChild
              variant="outline"
              className="hidden md:inline-flex bg-white/90 text-blue-700 border-white/80 hover:bg-white"
              onClick={() => track("hero_cta_promos")}
            >
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
                  onClick={() => track("hero_chip_click", { category: c.slug })}
                >
                  {c.name}
                </Link>
              ))}
              <Link
                href="/products"
                className="text-xs md:text-sm text-blue-900 bg-yellow-300 hover:bg-yellow-400 px-3 py-1.5 rounded-full transition"
                onClick={() => track("hero_chip_all")}
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