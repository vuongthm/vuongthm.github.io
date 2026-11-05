import registry from "@/generated/topics.json"
import type { Locale } from "@/lib/i18n/config"
export interface Topic {
  id: string
  label: Record<Locale, string>
  description: Record<Locale, string>
  color: string
  symbol: string
}
export const topics = registry as Topic[]
export function getTopic(id: string) {
  return topics.find((topic) => topic.id === id)
}
