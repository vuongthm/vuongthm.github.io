import type { Metadata } from "next"
import { pageAlternates, siteConfig } from "./site.config"
import type { Locale } from "./i18n/config"
export function metadataFor(
  title: string,
  description: string,
  path: string,
  locale: Locale,
  available?: Locale[],
): Metadata {
  return {
    title: `${title} · vuongthm`,
    description,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      ...pageAlternates(path, locale, available),
      types: { "application/rss+xml": `${siteConfig.url}/${locale}/feed.xml` },
    },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "vuongthm — Field notes",
      locale: { vi: "vi_VN", en: "en_US", ja: "ja_JP", zh: "zh_CN" }[locale],
      url: siteConfig.url + `/${locale}${path}`,
    },
    twitter: { card: "summary", title, description },
    icons: {
      icon: { url: "/icon.svg?v=blue-white-2", type: "image/svg+xml" },
      apple: "/apple-icon.png?v=blue-white-2",
    },
  }
}
export function jsonLd(value: Record<string, unknown>) {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}
