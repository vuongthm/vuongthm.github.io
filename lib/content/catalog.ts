import type { Entry } from "./types"
import type { Locale } from "@/lib/i18n/config"
import japanese from "@/lib/i18n/ja-catalog.json"
import chinese from "@/lib/i18n/zh-catalog.json"
const catalogs: Partial<Record<Locale, typeof japanese>> = { ja: japanese, zh: chinese }
export function localizedCatalog(locale: Locale) {
  return catalogs[locale]
}

/** Catalog text may be localized; article URLs and source locales always stay truthful. */
export function catalogEntries(entries: Entry[], locale: Locale): Entry[] {
  const native = entries.filter((entry) => entry.locale === locale && !entry.seriesSlug)
  const catalog = localizedCatalog(locale)
  const translated = new Set(native.map((entry) => entry.translationKey))
  const fallback: Entry[] = []
  const priority = ["en", "vi", "ja", "zh"]
  for (const candidateLocale of priority)
    for (const entry of entries) {
      if (
        entry.locale !== candidateLocale ||
        entry.seriesSlug ||
        translated.has(entry.translationKey)
      )
        continue
      translated.add(entry.translationKey)
      fallback.push(entry)
    }
  return [
    ...native,
    ...fallback.map((entry) => {
      const text = (
        catalog?.articles as Record<string, { title: string; summary: string }> | undefined
      )?.[entry.slug]
      return text ? { ...entry, title: text.title, summary: text.summary } : entry
    }),
  ]
}
