"use client"

import type { Category } from "@/lib/types/database"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Filter, X } from "lucide-react"
import { useState } from "react"

interface ProductFiltersProps {
  categories: Category[]
  onFiltersChange: (filters: ProductFilters) => void
  isOpen: boolean
  onToggle: () => void
}

export interface ProductFilters {
  categories: string[]
  priceRange: [number, number]
  inStock: boolean
  featured: boolean
  sortBy: string
  searchQuery: string
}

const defaultFilters: ProductFilters = {
  categories: [],
  priceRange: [0, 1000],
  inStock: false,
  featured: false,
  sortBy: "newest",
  searchQuery: "",
}

export function ProductFilters({ categories, onFiltersChange, isOpen, onToggle }: ProductFiltersProps) {
  const [filters, setFilters] = useState<ProductFilters>(defaultFilters)

  const updateFilters = (newFilters: Partial<ProductFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    onFiltersChange(updatedFilters)
  }

  const clearFilters = () => {
    setFilters(defaultFilters)
    onFiltersChange(defaultFilters)
  }

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const newCategories = checked
      ? [...filters.categories, categoryId]
      : filters.categories.filter((id) => id !== categoryId)
    updateFilters({ categories: newCategories })
  }

  if (!isOpen) {
    return (
      <Button variant="outline" onClick={onToggle} className="lg:hidden mb-4 bg-transparent">
        <Filter className="h-4 w-4 mr-2" />
        Filtres
      </Button>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filtres</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Effacer
          </Button>
          <Button variant="ghost" size="icon" onClick={onToggle} className="lg:hidden">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Rechercher des produits..."
            value={filters.searchQuery}
            onChange={(e) => updateFilters({ searchQuery: e.target.value })}
          />
        </CardContent>
      </Card>

      {/* Sort */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Trier par</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={filters.sortBy} onValueChange={(value) => updateFilters({ sortBy: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Plus récent</SelectItem>
              <SelectItem value="oldest">Plus ancien</SelectItem>
              <SelectItem value="price-low">Prix croissant</SelectItem>
              <SelectItem value="price-high">Prix décroissant</SelectItem>
              <SelectItem value="name">Nom A-Z</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Catégories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={category.id}
                checked={filters.categories.includes(category.id)}
                onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
              />
              <Label htmlFor={category.id} className="text-sm font-normal">
                {category.name}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Price Range */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Prix</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Slider
            value={filters.priceRange}
            onValueChange={(value) => updateFilters({ priceRange: value as [number, number] })}
            max={1000}
            min={0}
            step={10}
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{filters.priceRange[0]} €</span>
            <span>{filters.priceRange[1]} €</span>
          </div>
        </CardContent>
      </Card>

      {/* Additional Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="inStock"
              checked={filters.inStock}
              onCheckedChange={(checked) => updateFilters({ inStock: checked as boolean })}
            />
            <Label htmlFor="inStock" className="text-sm font-normal">
              En stock uniquement
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="featured"
              checked={filters.featured}
              onCheckedChange={(checked) => updateFilters({ featured: checked as boolean })}
            />
            <Label htmlFor="featured" className="text-sm font-normal">
              Produits vedettes
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
