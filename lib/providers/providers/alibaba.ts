import type { ExternalProduct, ProviderAdapter } from "../types"

async function fetchByUrl(url: string): Promise<ExternalProduct> {
  await new Promise((r) => setTimeout(r, 700))
  return {
    external_id: `alibaba_${Date.now()}`,
    name: "Alibaba Product",
    description: "Imported via adapter (placeholder).",
    price: Math.floor(Math.random() * 30000) + 3000,
    image_url: "/placeholder.svg?height=420&width=420&query=alibaba",
    category: "Auto",
    supplier_name: "Alibaba",
    stock_quantity: Math.floor(Math.random() * 500) + 10,
    currency: "USD",
    url,
  }
}

async function search(q: string, limit = 20): Promise<ExternalProduct[]> {
  await new Promise((r) => setTimeout(r, 900))
  return Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
    external_id: `alibaba_${Date.now()}_${i}`,
    name: `${q} Alibaba #${i + 1}`,
    description: `Search result for ${q} from Alibaba (placeholder)`,
    price: Math.floor(Math.random() * 20000) + 2500,
    image_url: `/placeholder.svg?height=300&width=300&query=${encodeURIComponent(q + " alibaba")}`,
    category: q,
    supplier_name: "Alibaba",
    stock_quantity: Math.floor(Math.random() * 400) + 5,
    currency: "USD",
  }))
}

export const alibabaAdapter: ProviderAdapter = {
  key: "alibaba",
  label: "Alibaba",
  website: "https://alibaba.com",
  fetchByUrl,
  search,
}