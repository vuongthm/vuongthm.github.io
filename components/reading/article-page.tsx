import { getEntryMeta, getPaths, translations } from "@/lib/content/server"
import type { Entry } from "@/lib/content/types"
import type { Locale } from "@/lib/i18n/config"
import { headingsFor } from "@/lib/content/markdown"
import { metadataFor, jsonLd } from "@/lib/seo"
import { siteConfig } from "@/lib/site.config"
import { ReaderFrame } from "./reader-frame"
import { Markdown } from "./markdown"
import { EncryptedBody } from "./encrypted-body"
import { pathEntries } from "@/lib/learning/paths"
import { learningMarkdown } from "@/lib/learning/markdown.mjs"
export function articleMetadata(entry: Entry, lang: Locale) {
  return {
    ...metadataFor(
      entry.title,
      entry.summary,
      entry.href.replace(/^\/[a-z]{2}/, ""),
      lang,
      translations(entry).map((item) => item.locale),
    ),
    robots: entry.encrypted ? { index: false, follow: false } : undefined,
  }
}
export function ArticlePage({ entry }: { entry: Entry }) {
  const lang = entry.locale
  const course = entry.learning
    ? getPaths().find((path) => path.slug === entry.learning?.path)
    : undefined
  const metadata = getEntryMeta(lang)
  const list = course
      ? pathEntries(course, metadata)
      : metadata.filter((item) => !item.encrypted && !item.learning),
    index = list.findIndex((item) => item.id === entry.id)
  const { body, ...meta } = entry
  return (
    <main id="main-content">
      {!entry.encrypted && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: entry.title,
              description: entry.summary,
              datePublished: entry.publishedAt,
              dateModified: entry.updatedAt,
              inLanguage: lang,
              author: { "@type": "Person", name: "Vuong", url: siteConfig.url + `/${lang}/about/` },
              mainEntityOfPage: siteConfig.url + entry.href,
            }),
          }}
        />
      )}
      <ReaderFrame
        entry={meta}
        course={course}
        courseEntries={course ? list : undefined}
        headings={entry.encrypted ? [] : headingsFor(body)}
        body={entry.encrypted ? undefined : learningMarkdown(body).markdown}
        translations={translations(entry)}
        previous={index > 0 ? list[index - 1] : undefined}
        next={index >= 0 ? list[index + 1] : undefined}
      >
        {entry.encrypted ? <EncryptedBody payload={body} /> : <Markdown body={body} />}
      </ReaderFrame>
    </main>
  )
}
