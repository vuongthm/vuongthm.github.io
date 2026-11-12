import { notFound } from "next/navigation"
import { isLocale } from "@/lib/i18n/config"
import { editorial } from "@/lib/i18n/editorial"
import { cornerMessages } from "@/lib/i18n/corner"
import { getCornerItems } from "@/lib/content/server"
import { metadataFor } from "@/lib/seo"
import { PageHeading } from "@/components/layout/page-heading"
import { readingShelf } from "@/lib/content/site-pages"
import { LockedShelf } from "@/components/corner/locked-shelf"
import { CornerShelf } from "@/components/corner/shelf"

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  return {
    ...metadataFor(editorial[lang].shelf, cornerMessages[lang].shelfDescription, "/shelf/", lang),
    robots: readingShelf?.encrypted ? { index: false, follow: false } : undefined,
  }
}
export default async function Shelf({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const text = cornerMessages[lang]
  const items = getCornerItems(lang)
    .filter((item) => item.category === "books")
    .map(({ body: _body, ...meta }) => meta)
  return (
    <main id="main-content" className="shelf-page">
      <PageHeading
        eyebrow={text.note}
        title={editorial[lang].shelf}
        description={text.shelfDescription}
      />
      <div className="wrap">
        {readingShelf?.encrypted ? (
          <LockedShelf payload={readingShelf.bodies[lang]!} />
        ) : (
          <CornerShelf items={items} />
        )}
      </div>
    </main>
  )
}
