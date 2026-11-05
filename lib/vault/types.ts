import type { Locale } from "@/lib/i18n/config"
export type VaultItem = {
  id: string
  previewId?: string
  title: Record<Locale, string>
  name: string
  type: string
  kind: "image" | "video"
  bytes: number
}
export type VaultCatalog = { version: 1; items: VaultItem[] }
export type VaultDescriptor = {
  version: 1
  configured: boolean
  salt?: string
  iterations?: number
  manifest?: string
}
