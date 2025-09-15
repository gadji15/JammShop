"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { useCategories } from "@/lib/hooks/use-categories"
import { createClient } from "@/lib/supabase/client"
import { Heart, Menu, Search, ShoppingCart, User, Settings } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { SearchModal } from "@/components/search/search-modal"
import { useCart } from "@/lib/hooks/use-cart"

export function Header() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [cartItemsCount, setCartItemsCount] = useState(0)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [hasShadow, setHasShadow] = useState(false)
  const { categories } = useCategories()
  const router = useRouter()
  const supabase = createClient()
  const cart = useCart()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        fetchUserProfile(user.id)
      } else {
        setUserProfile(null)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setUserProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  // Sync cart badge from cart hook
  useEffect(() => {
    setCartItemsCount(cart.getTotalItems ? cart.getTotalItems() : (cart.items?.reduce?.((t: number, it: any) => t + (it?.quantity || 0), 0) || 0))
  }, [cart.items, cart.getTotalItems])

  // Keyboard shortcuts: Cmd/Ctrl+K and '/' to open search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isCmdK = (e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')
      const isSlash = !e.ctrlKey && !e.metaKey && e.key === '/'
      if (isCmdK || isSlash) {
        e.preventDefault()
        setIsSearchOpen(true)
        setIsMenuOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Shadow on scroll for better readability
  useEffect(() => {
    const onScroll = () => setHasShadow(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (!error && data) {
        setUserProfile(data)
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
  }

  const isAdmin = userProfile?.role === "admin" || userProfile?.role === "super_admin"

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query)}`)
      setIsSearchOpen(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <>
      <header className={`sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 ${hasShadow ? "shadow-sm" : ""}`}>
        <div className="container mx-auto px-4">
          {/* Top bar */}
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-1.5 sm:space-x-2 mr-4 sm:mr-6">
                <div className="relative flex-shrink-0">
                  <svg width="24" height="24" viewBox="0 0 32 32" className="drop-shadow-sm sm:w-8 sm:h-8">
                    <defs>
                      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="50%" stopColor="#6366F1" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                      </linearGradient>
                    </defs>
                    <rect width="32" height="32" rx="8" fill="url(#logoGradient)" />
                    <path d="M8 12h16v2H8zm0 4h12v2H8zm0 4h8v2H8z" fill="white" opacity="0.9" />
                    <circle cx="22" cy="20" r="3" fill="white" opacity="0.8" />
                    <path d="M21 19l1 1 2-2" stroke="#3B82F6" strokeWidth="1.5" fill="none" />
                  </svg>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm sm:text-lg md:text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                    JammShop
                  </span>
                  <span className="text-xs text-gray-500 -mt-0.5 hidden md:block">Marketplace</span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6 flex-1">
              <Link href="/products" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Produits
              </Link>

              {/* Categories Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-gray-700 hover:text-blue-600 font-medium">
                    Catégories
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {categories.slice(0, 6).map((category) => (
                    <DropdownMenuItem key={category.id} asChild>
                      <Link href={`/categories/${category.slug}`} className="cursor-pointer">
                        {category.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/products" className="cursor-pointer font-medium">
                      Voir toutes les catégories
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Discover Dropdown to avoid clutter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-gray-700 hover:text-blue-600 font-medium">
                    Découvrir
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/new-arrivals" className="cursor-pointer">
                      Nouveautés
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/deals" className="cursor-pointer">
                      Offres
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/brands" className="cursor-pointer">
                      Marques
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Link href="/contact" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Contact
              </Link>
            </nav>

            {/* Search Icon */}
            <div className="flex-1 flex justify-center md:justify-end md:flex-none">
              <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)} className="hover:bg-gray-100">
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sr-only">Rechercher</span>
              </Button>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-1 sm:space-x-2 ml-2 sm:ml-4">
              {isAdmin && (
                <>
                  <Button variant="ghost" size="icon" asChild className="hidden sm:flex hover:bg-blue-50">
                    <Link href="/admin">
                      <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      <span className="sr-only">Administration</span>
                    </Link>
                  </Button>

                  {/* Quick link to analytics events */}
                  <Button variant="ghost" size="icon" asChild className="hidden sm:flex hover:bg-blue-50">
                    <Link href="/admin/analytics/events" title="Analytics Events">
                      <svg width="20" height="20" viewBox="0 0 24 24" className="text-blue-600">
                        <path fill="currentColor" d="M5 3h2v18H5V3Zm6 6h2v12h-2V9Zm6 4h2v8h-2v-8Z"/>
                      </svg>
                      <span className="sr-only">Analytics Events</span>
                    </Link>
                  </Button>
                </>
              )}

              {/* Wishlist */}
              <Button variant="ghost" size="icon" asChild className="hidden sm:flex">
                <Link href="/wishlist">
                  <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="sr-only">Liste de souhaits</span>
                </Link>
              </Button>

              {/* Cart */}
              <Button variant="ghost" size="icon" className="relative" asChild>
                <Link href="/cart">
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                  {cartItemsCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center text-xs bg-blue-600">
                      {cartItemsCount}
                    </Badge>
                  )}
                  <span className="sr-only">Panier</span>
                </Link>
              </Button>

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="sr-only">Menu utilisateur</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        Mon compte
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="cursor-pointer">
                        Mes commandes
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/wishlist" className="cursor-pointer">
                        Ma liste de souhaits
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="cursor-pointer text-blue-600">
                            <Settings className="h-4 w-4 mr-2" />
                            Administration
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
                      Se déconnecter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden sm:flex items-center space-x-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/auth/login">Connexion</Link>
                  </Button>
                  <Button size="sm" asChild className="bg-blue-600 hover:bg-blue-700">
                    <Link href="/auth/register">Inscription</Link>
                  </Button>
                </div>
              )}

              {/* Enhanced Mobile Menu */}
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="sr-only">Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[88vw] max-w-sm p-0" aria-describedby={undefined}>
                  <div className="flex h-dvh flex-col">
                    {/* Header */}
                    <SheetHeader className="px-4 pt-4 pb-3 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                      <SheetTitle className="sr-only">Menu mobile</SheetTitle>
                      <SheetDescription className="sr-only">Navigation principale de JammShop</SheetDescription>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <svg width="32" height="32" viewBox="0 0 32 32" className="drop-shadow-sm">
                            <defs>
                              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#3B82F6" />
                                <stop offset="50%" stopColor="#6366F1" />
                                <stop offset="100%" stopColor="#8B5CF6" />
                              </linearGradient>
                            </defs>
                            <rect width="32" height="32" rx="8" fill="url(#logoGradient)" />
                            <path d="M8 12h16v2H8zm0 4h12v2H8zm0 4h8v2H8z" fill="white" opacity="0.9" />
                            <circle cx="22" cy="20" r="3" fill="white" opacity="0.8" />
                            <path d="M21 19l1 1 2-2" stroke="#3B82F6" strokeWidth="1.5" fill="none" />
                          </svg>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            JammShop
                          </span>
                          <span className="text-xs text-gray-500 -mt-1 hidden sm:block">Marketplace</span>
                        </div>
                      </div>
                    </SheetHeader>

                    {/* Scrollable Content */}
                    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
                      {/* Search Button */}
                      <Button
                        variant="outline"
                        className="w-full justify-start bg-white text-gray-800 hover:bg-gray-100"
                        onClick={() => {
                          setIsSearchOpen(true)
                          setIsMenuOpen(false)
                        }}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Rechercher des produits
                      </Button>

                      {isAdmin && (
                        <Button
                          variant="outline"
                          className="w-full justify-start bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                          asChild
                        >
                          <Link href="/admin" onClick={() => setIsMenuOpen(false)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Administration
                          </Link>
                        </Button>
                      )}

                      {/* Primary Links */}
                      <div className="space-y-2">
                        <Link
                          href="/products"
                          className="block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-100"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Produits
                        </Link>
                      </div>

                      {/* Categories */}
                      <div className="space-y-2">
                        <div className="px-3 py-2 text-xs uppercase tracking-wide text-gray-500">Catégories</div>
                        <div className="pl-1 space-y-1 max-h-48 overflow-y-auto">
                          {categories.map((category) => (
                            <Link
                              key={category.id}
                              href={`/categories/${category.slug}`}
                              className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              {category.name}
                            </Link>
                          ))}
                        </div>
                        <Link
                          href="/products"
                          className="block rounded-md px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Voir toutes les catégories
                        </Link>
                      </div>

                      {/* Discover */}
                      <div className="space-y-1">
                        <div className="px-3 py-2 text-xs uppercase tracking-wide text-gray-500">Découvrir</div>
                        <Link
                          href="/new-arrivals"
                          className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Nouveautés
                        </Link>
                        <Link
                          href="/deals"
                          className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Offres
                        </Link>
                        <Link
                          href="/brands"
                          className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Marques
                        </Link>
                      </div>

                      {/* Secondary */}
                      <div className="space-y-1 pt-2">
                        <Link
                          href="/contact"
                          className="block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-100"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Contact
                        </Link>
                        <Link
                          href="/about"
                          className="block rounded-md px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-100"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          À propos
                        </Link>
                      </div>
                    </nav>

                    {/* Sticky Footer - Auth Buttons */}
                    {!user && (
                      <div className="sticky bottom-0 bg-white border-t px-3 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
                        <div className="flex gap-2">
                          <Link href="/auth/login" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                            <Button variant="outline" className="w-full">Connexion</Button>
                          </Link>
                          <Link href="/auth/register" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                            <Button className="w-full bg-blue-600 hover:bg-blue-700">Inscription</Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onSearch={handleSearch} />
    </>
  )
}
