export function localizedText(value, locales, fallback = "") {
  if (typeof value === "string") return Object.fromEntries(locales.map((locale) => [locale, value]))
  if (!value || typeof value !== "object" || Array.isArray(value)) value = {}
  const base =
    value.en ??
    value.vi ??
    Object.values(value).find((item) => typeof item === "string") ??
    fallback
  return Object.fromEntries(
    locales.map((locale) => [locale, typeof value[locale] === "string" ? value[locale] : base]),
  )
}
