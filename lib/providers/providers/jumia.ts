import type { ExternalProduct, ProviderAdapter } from "../types"

async function fetchByUrl(url: string): Promise<ExternalProduct> {
  await new Promise((r) => setTimeout(r, 700))
  return {
    external_id: `jumia_${Date.now()}`,
    name: "Jumia Product",
    description: "Imported via adapter (placeholder).",
    price: Math.floor(Math.random() * 15000) + 1500,
    image_url: "/placeholder.svg?height=420&width=420&query=jumia",
    category: "Auto",
    supplier_name: "Jumia",
    stock_quantity: Math.floor(Math.random() * 300) + 10,
    currency: "XOF",
    url,
  }
}

async function search(q: string, limit = 20): Promise<ExternalProduct[]> {
  await new Promise((r) => setTimeout(r, 900))
  return Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
    external_id: `jumia_${Date.now()}_${i}`,
    name: `${q} Jumia #${i + 1}`,
    description: `Search result for ${q} from Jumia (placeholder)`,
    price: Math.floor(Math.random() * 12000) + 1200,
    image_url: `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(q + " jumia")}`,
    category: q,
    supplier_name: "Jumia",
    stock_quantity: Math.floor(Math.random() * 200) + 5,
    currency: "XOF",
  }))
}

export const jumiaAdapter: ProviderAdapter = {
  key: "jumia",
  label: "Jumia",
  website: "https://jumia.com",
  fetchByUrl,
  search,
}