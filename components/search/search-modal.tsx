"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, X, TrendingUp } from "lucide-react"
import { useState, useEffect } from "react"
import { useProducts } from "@/lib/hooks/use-products"

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSearch: (query: string) => void
}

export function SearchModal({ isOpen, onClose, onSearch }: SearchModalProps) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<any[]>([])
  const { products } = useProducts()

  // Popular searches
  const popularSearches = [
    "Smartphones",
    "Ordinateurs portables",
    "Vêtements",
    "Chaussures",
    "Électronique",
    "Maison & Jardin",
  ]

  useEffect(() => {
    if (query.length > 2) {
      // Filter products based on query
      const filtered = products
        .filter(
          (product) =>
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.description.toLowerCase().includes(query.toLowerCase()),
        )
        .slice(0, 5)
      setSuggestions(filtered)
    } else {
      setSuggestions([])
    }
  }, [query, products])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query)
    }
  }

  const handleSuggestionClick = (productName: string) => {
    setQuery(productName)
    onSearch(productName)
  }

  const handlePopularSearch = (searchTerm: string) => {
    setQuery(searchTerm)
    onSearch(searchTerm)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 bg-white/95 backdrop-blur-md border-0 shadow-2xl">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="sr-only">Rechercher des produits</DialogTitle>
        </DialogHeader>

        <div className="p-6">
          {/* Search Form */}
          <form onSubmit={handleSubmit} className="relative mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Rechercher des produits, marques, catégories..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-12 h-12 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                autoFocus
              />
              {query && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-10 w-10"
                  onClick={() => setQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>

          {/* Search Suggestions */}
          {suggestions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Suggestions</h3>
              <div className="space-y-2">
                {suggestions.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSuggestionClick(product.name)}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-3"
                  >
                    <Search className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.price} FCFA</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular Searches */}
          {!query && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-medium text-gray-500">Recherches populaires</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((search) => (
                  <Button
                    key={search}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePopularSearch(search)}
                    className="rounded-full hover:bg-blue-50 hover:border-blue-200"
                  >
                    {search}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
