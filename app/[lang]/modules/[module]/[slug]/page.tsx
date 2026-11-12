import { notFound } from "next/navigation"
import { allEntries, getModuleEntry } from "@/lib/content/server"
import { isLocale, localeCodes } from "@/lib/i18n/config"
import { ArticlePage, articleMetadata } from "@/components/reading/article-page"
type Params = Promise<{ lang: string; module: string; slug: string }>
export function generateStaticParams() {
  const routes = allEntries()
    .filter(
      (entry) =>
        !entry.seriesSlug && entry.moduleId && entry.href.startsWith(`/${entry.locale}/modules/`),
    )
    .map((entry) => ({ lang: entry.locale, module: entry.moduleId!, slug: entry.slug }))
  // Reserved values cannot be authored as slugs; Page below turns them into noindex 404s.
  return routes.length
    ? routes
    : localeCodes.map((lang) => ({ lang, module: "_empty", slug: "_empty" }))
}
export async function generateMetadata({ params }: { params: Params }) {
  const { lang, module, slug } = await params
  if (!isLocale(lang)) return {}
  const entry = getModuleEntry(module, slug, lang)
  return entry ? articleMetadata(entry, lang) : {}
}
export default async function Page({ params }: { params: Params }) {
  const { lang, module, slug } = await params
  if (!isLocale(lang)) notFound()
  const entry = getModuleEntry(module, slug, lang)
  if (!entry || !entry.href.startsWith(`/${lang}/modules/`)) notFound()
  return <ArticlePage entry={entry} />
}
