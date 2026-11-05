import { notFound } from "next/navigation"
import { allEntries, getChapter, getChapters, translations } from "@/lib/content/server"
import { isLocale } from "@/lib/i18n/config"
import { metadataFor } from "@/lib/seo"
import { headingsFor } from "@/lib/content/markdown"
import { ReaderFrame } from "@/components/reading/reader-frame"
import { Markdown } from "@/components/reading/markdown"
import { EncryptedBody } from "@/components/reading/encrypted-body"
export function generateStaticParams() {
  return allEntries()
    .filter((entry) => entry.seriesSlug)
    .map((entry) => ({ lang: entry.locale, series: entry.seriesSlug!, chapter: entry.slug }))
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; series: string; chapter: string }>
}) {
  const { lang, series, chapter } = await params
  if (!isLocale(lang)) return {}
  const entry = getChapter(series, chapter, lang)
  return entry
    ? {
        ...metadataFor(
          entry.title,
          entry.summary,
          `/stories/${series}/${chapter}`,
          lang,
          translations(entry).map((item) => item.locale),
        ),
        robots: entry.encrypted ? { index: false, follow: false } : undefined,
      }
    : {}
}
export default async function Page({
  params,
}: {
  params: Promise<{ lang: string; series: string; chapter: string }>
}) {
  const { lang, series, chapter } = await params
  if (!isLocale(lang)) notFound()
  const entry = getChapter(series, chapter, lang)
  if (!entry) notFound()
  const chapters = getChapters(series, lang),
    index = chapters.findIndex((item) => item.id === entry.id),
    { body, ...meta } = entry
  const previous = chapters[index - 1],
    next = chapters[index + 1]
  return (
    <main id="main-content">
      <ReaderFrame
        entry={meta}
        headings={entry.encrypted ? [] : headingsFor(body)}
        body={entry.encrypted ? undefined : body}
        translations={translations(entry)}
        previous={previous ? (({ body: _body, ...value }) => value)(previous) : undefined}
        next={next ? (({ body: _body, ...value }) => value)(next) : undefined}
      >
        {entry.encrypted ? <EncryptedBody payload={body} /> : <Markdown body={body} />}
      </ReaderFrame>
    </main>
  )
}
