import { notFound } from "next/navigation"
import { allEntries, getEntry } from "@/lib/content/server"
import { isLocale } from "@/lib/i18n/config"
import { ArticlePage, articleMetadata } from "@/components/reading/article-page"
type Params = Promise<{ lang: string; slug: string }>
export function generateStaticParams() {
  return allEntries()
    .filter((entry) => !entry.seriesSlug && entry.href.startsWith(`/${entry.locale}/notes/`))
    .map((entry) => ({ lang: entry.locale, slug: entry.slug }))
}
export async function generateMetadata({ params }: { params: Params }) {
  const { lang, slug } = await params
  if (!isLocale(lang)) return {}
  const entry = getEntry(slug, lang)
  return entry ? articleMetadata(entry, lang) : {}
}
export default async function Page({ params }: { params: Params }) {
  const { lang, slug } = await params
  if (!isLocale(lang)) notFound()
  const entry = getEntry(slug, lang)
  if (!entry) notFound()
  return <ArticlePage entry={entry} />
}
