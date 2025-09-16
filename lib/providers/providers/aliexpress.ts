import type { ExternalProduct, ProviderAdapter } from "../types"
import { fetchAndExtract } from "../scrape"

// API-first (TODO with official AliExpress API), fallback to scraping
async function fetchByUrl(url: string): Promise<ExternalProduct> {
  const apiKey = process.env.ALIEXPRESS_API_KEY
  if (apiKey) {
    // TODO: Implement official API client using ALIEXPRESS_API_KEY
    // Return normalized ExternalProduct
    // If API call fails, fall back to scraping
  }
  return fetchAndExtract(url, "AliExpress")
}

async function search(q: string, limit = 20): Promise<ExternalProduct[]> {
  // TODO: Implement real search via API or a curated catalog/cache
  await new Promise((r) => setTimeout(r, 500))
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