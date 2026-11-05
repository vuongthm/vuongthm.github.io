import { getEntryMeta } from "@/lib/content/server"
import { isLocale, localeCodes } from "@/lib/i18n/config"
import { siteConfig } from "@/lib/site.config"
export const dynamic = "force-static"
export function generateStaticParams() {
  return localeCodes.map((lang) => ({ lang }))
}
function xml(value: string) {
  return value.replace(
    /[<>&"']/g,
    (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[char]!,
  )
}
export async function GET(_request: Request, { params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) return new Response("Not found", { status: 404 })
  const entries = getEntryMeta(lang)
    .filter((entry) => !entry.encrypted)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Vuong — Field notes</title><link>${siteConfig.url}/${lang}/</link><description>${xml(siteConfig.description[lang])}</description><language>${lang}</language><atom:link href="${siteConfig.url}/${lang}/feed.xml" rel="self" type="application/rss+xml"/>${entries.map((entry) => `<item><title>${xml(entry.title)}</title><link>${siteConfig.url}${entry.href}</link><guid>${siteConfig.url}${entry.href}</guid><description>${xml(entry.summary)}</description><pubDate>${new Date(entry.publishedAt).toUTCString()}</pubDate></item>`).join("")}</channel></rss>`
  return new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } })
}
