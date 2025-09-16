import type { ProviderAdapter, SupplierKey } from "./types"
import { aliexpressAdapter } from "./providers/aliexpress"
import { alibabaAdapter } from "./providers/alibaba"
import { jumiaAdapter } from "./providers/jumia"

const registry: Record<SupplierKey, ProviderAdapter> = {
  aliexpress: aliexpressAdapter,
  alibaba: alibabaAdapter,
  jumia: jumiaAdapter,
}

export function getAdapterByKey(key: SupplierKey): ProviderAdapter {
  return registry[key]
}

export function detectProviderFromUrl(url: string): { key: SupplierKey; adapter: ProviderAdapter } | null {
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()
    if (host.includes("aliexpress")) return { key: "aliexpress", adapter: registry.aliexpress }
    if (host.includes("alibaba")) return { key: "alibaba", adapter: registry.alibaba }
    if (host.includes("jumia")) return { key: "jumia", adapter: registry.jumia }
    return null
  } catch {
    return null
  }
}