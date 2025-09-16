import type { ExternalProduct, ProviderAdapter } from "../types"
import { fetchAndExtract } from "../scrape"

async function fetchByUrl(url: string): Promise<ExternalProduct> {
  const apiKey = process.env.JUMIA_API_KEY
  if (apiKey) {
    // TODO: Implement official/partner API client for Jumia using JUMIA_API_KEY if available.
    // Normalize into ExternalProduct or fall back to scraping if API fails.
  }
  return fetchAndExtract(url, "Jumia")
}

async function search(q: string, limit = 20): Promise<ExternalProduct[]> {
  // TODO: Implement real search via API or curated cache
  await new Promise((r) => setTimeout(r, 500))
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