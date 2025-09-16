export type SupplierKey = "aliexpress" | "alibaba" | "jumia"

export interface ExternalProduct {
  external_id: string
  name: string
  description: string
  price: number
  image_url: string
  category: string
  supplier_name: string
  stock_quantity?: number
  currency?: string
  url?: string
}

export interface ProviderAdapter {
  key: SupplierKey
  label: string
  website?: string
  fetchByUrl: (url: string) => Promise<ExternalProduct>
  search: (q: string, limit?: number) => Promise<ExternalProduct[]>
}