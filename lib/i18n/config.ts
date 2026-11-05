export const locales = {
  vi: { name: "Tiếng Việt", short: "VI", intl: "vi-VN" },
  en: { name: "English", short: "EN", intl: "en-US" },
  ja: { name: "日本語", short: "JA", intl: "ja-JP" },
  zh: { name: "简体中文", short: "ZH", intl: "zh-CN" },
} as const

export type Locale = keyof typeof locales
export const defaultLocale: Locale = "vi"
export const localeCodes = Object.keys(locales) as Locale[]
export function isLocale(value: string): value is Locale {
  return Object.hasOwn(locales, value)
}
export function localized(path: string, locale: Locale) {
  if (!path.startsWith("/") || path.startsWith("//")) return path
  if (localeCodes.some((code) => path === `/${code}` || path.startsWith(`/${code}/`))) return path
  return `/${locale}${path === "/" ? "/" : path}`
}
export function dateLabel(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locales[locale].intl, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(/^\d{4}-\d{2}-\d{2}$/.test(value) ? { timeZone: "UTC" } : {}),
  }).format(new Date(value))
}

const languageNames: Record<Locale, Record<Locale, string>> = {
  vi: { vi: "Tiếng Việt", en: "Tiếng Anh", ja: "Tiếng Nhật", zh: "Tiếng Trung" },
  en: { vi: "Vietnamese", en: "English", ja: "Japanese", zh: "Chinese" },
  ja: { vi: "ベトナム語", en: "英語", ja: "日本語", zh: "中国語" },
  zh: { vi: "越南语", en: "英语", ja: "日语", zh: "简体中文" },
}
export function languageName(interfaceLocale: Locale, targetLocale: Locale) {
  return languageNames[interfaceLocale][targetLocale]
}
export const contentLanguage = languageName
