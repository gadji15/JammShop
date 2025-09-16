export type ScrapedProduct = {
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

function getMeta(content: string, name: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i",
  )
  const m = content.match(re)
  return m ? m[1] : null
}

function extractJsonLD(content: string): any[] {
  const scripts = Array.from(content.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))
  const items: any[] = []
  for (const s of scripts) {
    const txt = s[1]?.trim()
    if (!txt) continue
    try {
      const parsed = JSON.parse(txt)
      if (Array.isArray(parsed)) items.push(...parsed)
      else items.push(parsed)
    } catch {
      // ignore malformed JSON-LD
    }
  }
  return items
}

function extractFirst<T = any>(obj: any | any[], key: string): T | undefined {
  if (!obj) return undefined
  if (Array.isArray(obj)) {
    for (const it of obj) {
      const v = extractFirst(it, key)
      if (v !== undefined) return v as T
    }
    return undefined
  }
  if (obj && typeof obj === "object") {
    if (obj[key] !== undefined) return obj[key]
    for (const k of Object.keys(obj)) {
      const v = extractFirst(obj[k], key)
      if (v !== undefined) return v as T
    }
  }
  return undefined
}

export async function fetchAndExtract(url: string, supplierLabel: string): Promise<ScrapedProduct> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; JammShopBot/1.0)" } })
  if (!res.ok) {
    throw new Error(`Failed to fetch product page (${res.status})`)
  }
  const html = await res.text()

  // Try JSON-LD first
  const jsonld = extractJsonLD(html)
  let name =
    (extractFirst<string>(jsonld, "name") as string) || getMeta(html, "og:title") || getMeta(html, "twitter:title")
  let description =
    (extractFirst<string>(jsonld, "description") as string) ||
    getMeta(html, "og:description") ||
    getMeta(html, "description") ||
    ""
  let image =
    (extractFirst<string | string[]>(jsonld, "image") as any) ||
    getMeta(html, "og:image") ||
    getMeta(html, "twitter:image") ||
    ""
  if (Array.isArray(image)) image = image[0] || ""
  let price =
    Number(extractFirst<string | number>(jsonld, "price")) ||
    Number(extractFirst<string | number>(jsonld, "priceAmount")) ||
    Number(getMeta(html, "product:price:amount")) ||
    0
  let currency =
    (extractFirst<string>(jsonld, "priceCurrency") as string) ||
    getMeta(html, "product:price:currency") ||
    (extractFirst<string>(jsonld, "currency") as string) ||
    undefined

  // Fallbacks
  if (!name) name = url
  if (!image) image = "/placeholder.svg?height=420&width=420&query=product"
  if (!price || !Number.isFinite(price)) price = 10000

  // Stock heuristic (not reliable; default)
  const stock = 50

  return {
    external_id: `${supplierLabel.toLowerCase()}_${Date.now()}`,
    name,
    description,
    price: Math.floor(Number(price)),
    image_url: String(image),
    category: "Auto",
    supplier_name: supplierLabel,
    stock_quantity: stock,
    currency,
    url,
  }
}