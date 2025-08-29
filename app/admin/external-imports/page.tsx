"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useExternalSuppliers } from "@/lib/hooks/use-external-suppliers"
import { Search, Download, RefreshCw, Package, AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "sonner"

interface ExternalProduct {
  external_id: string
  name: string
  description: string
  price: number
  image_url: string
  category: string
  supplier_name: string
  stock_quantity?: number
}

export default function ExternalImportsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ExternalProduct[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [searching, setSearching] = useState(false)
  const [activeSupplier, setActiveSupplier] = useState<"alibaba" | "jumia">("alibaba")

  const { importing, syncing, fetchAlibabaProducts, fetchJumiaProducts, importProducts, syncExternalProducts } =
    useExternalSuppliers()

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Veuillez entrer un terme de recherche")
      return
    }

    setSearching(true)
    setSearchResults([])
    setSelectedProducts(new Set())

    try {
      let results: ExternalProduct[] = []

      if (activeSupplier === "alibaba") {
        results = await fetchAlibabaProducts(searchQuery)
      } else {
        results = await fetchJumiaProducts(searchQuery)
      }

      setSearchResults(results)
      toast.success(`${results.length} produits trouvés`)
    } catch (error) {
      toast.error("Erreur lors de la recherche")
    } finally {
      setSearching(false)
    }
  }

  const handleProductSelect = (productId: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts)
    if (checked) {
      newSelected.add(productId)
    } else {
      newSelected.delete(productId)
    }
    setSelectedProducts(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(searchResults.map((p) => p.external_id)))
    } else {
      setSelectedProducts(new Set())
    }
  }

  const handleImport = async () => {
    if (selectedProducts.size === 0) {
      toast.error("Veuillez sélectionner au moins un produit")
      return
    }

    const productsToImport = searchResults.filter((p) => selectedProducts.has(p.external_id))

    try {
      const result = await importProducts(activeSupplier, searchQuery, productsToImport)

      if (result.success > 0) {
        setSelectedProducts(new Set())
        // Optionally refresh search results
      }
    } catch (error) {
      toast.error("Erreur lors de l'import")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Import de Fournisseurs Externes</h1>
        <Button onClick={syncExternalProducts} disabled={syncing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Synchronisation..." : "Synchroniser"}
        </Button>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Rechercher des Produits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeSupplier} onValueChange={(value) => setActiveSupplier(value as "alibaba" | "jumia")}>
            <TabsList>
              <TabsTrigger value="alibaba">Alibaba</TabsTrigger>
              <TabsTrigger value="jumia">Jumia</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="search">Terme de recherche</Label>
              <Input
                id="search"
                placeholder="Ex: smartphones, vêtements, électronique..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Recherche...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Rechercher
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Résultats ({searchResults.length} produits)
              </CardTitle>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={selectedProducts.size === searchResults.length && searchResults.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm">Tout sélectionner</span>
                </label>
                <Badge variant="secondary">{selectedProducts.size} sélectionné(s)</Badge>
                <Button onClick={handleImport} disabled={importing || selectedProducts.size === 0}>
                  {importing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Import...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Importer ({selectedProducts.size})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((product) => (
                <div
                  key={product.external_id}
                  className={`border rounded-lg p-4 transition-colors ${
                    selectedProducts.has(product.external_id) ? "border-blue-500 bg-blue-50" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={selectedProducts.has(product.external_id)}
                      onCheckedChange={(checked) => handleProductSelect(product.external_id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <img
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-32 object-cover rounded mb-3"
                      />
                      <h3 className="font-medium text-sm mb-2 line-clamp-2">{product.name}</h3>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{product.description}</p>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-blue-600">{product.price.toLocaleString()} FCFA</span>
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>{product.supplier_name}</span>
                          {product.stock_quantity && <span>Stock: {product.stock_quantity}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              Avantages de l'Import
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>• Accès à des milliers de produits</p>
            <p>• Prix compétitifs des fournisseurs</p>
            <p>• Synchronisation automatique des stocks</p>
            <p>• Gestion centralisée des commandes</p>
            <p>• Catégorisation automatique</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-orange-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              Points d'Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>• Vérifiez la qualité des produits</p>
            <p>• Contrôlez les délais de livraison</p>
            <p>• Adaptez les prix au marché local</p>
            <p>• Gérez les devises et taux de change</p>
            <p>• Respectez les réglementations d'import</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
