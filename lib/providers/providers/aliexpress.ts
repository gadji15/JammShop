import type { ExternalProduct, ProviderAdapter } from "../types"

// Placeholder implementation: API-first (TODO), fallback mock/scrape
async function fetchByUrl(url: string): Promise<ExternalProduct> {
  // TODO: If API keys exist, call official API here
  // else fallback to scraping component/service
  await new Promise((r) => setTimeout(r, 700))
  return {
    external_id: `aliexpress_${Date.now()}`,
    name: "AliExpress Product",
    description: "Imported via adapter (placeholder).",
    price: Math.floor(Math.random() * 20000) + 2000,
    image_url: "/placeholder.svg?height=420&width=420&query=aliexpress",
    category: "Auto",
    supplier_name: "AliExpress",
    stock_quantity: Math.floor(Math.random() * 300) + 10,
    currency: "USD",
    url,
  }
}

async function search(q: string, limit = 20): Promise<ExternalProduct[]> {
  await new Promise((r) => setTimeout(r, 900))
  return Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
    external_id: `aliexpress_${Date.now()}_${i}`,
    name: `${q} AliExpress #${i + 1}`,
    description: `Search result for ${q} from AliExpress (placeholder)`,
    price: Math.floor(Math.random() * 10000) + 1500,
    image_url: `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(q + " aliexpress")}`,
    category: q,
    supplier_name: "AliExpress",
    stock_quantity: Math.floor(Math.random() * 200) + 5,
    currency: "USD",
  }))
}

export const aliexpressAdapter: ProviderAdapter = {
  key: "aliexpress",
  label: "AliExpress",
  website: "https://aliexpress.com",
  fetchByUrl,
  search,
}