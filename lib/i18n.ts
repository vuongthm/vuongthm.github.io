import type { Lang } from "./data"
import viMessages from "@/i18n/vi.json"
import enMessages from "@/i18n/en.json"

export type Messages = typeof enMessages

const messages: Record<Lang, Messages> = {
  vi: viMessages as Messages,
  en: enMessages,
}

export function getMessages(lang: Lang): Messages {
  return messages[lang] ?? messages.en
}

export function t(lang: Lang, key: string): string {
  const msgs = getMessages(lang)
  const parts = key.split(".")
  let current: any = msgs
  for (const part of parts) {
    if (current == null) return key
    current = current[part]
  }
  return typeof current === "string" ? current : key
}