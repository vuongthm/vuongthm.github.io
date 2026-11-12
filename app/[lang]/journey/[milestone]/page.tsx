import { EncryptedBody } from "@/components/reading/encrypted-body"
import { Markdown } from "@/components/reading/markdown"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Gallery } from "@/components/gallery"
import { PageHeading } from "@/components/layout/page-heading"
import { getJourney } from "@/lib/content/journey"
import { isLocale, localeCodes, contentLanguage } from "@/lib/i18n/config"
import { copy } from "@/lib/i18n/copy"
import { messages } from "@/lib/i18n/messages"
import { metadataFor } from "@/lib/seo"

type Params = Promise<{ lang: string; milestone: string }>
export function generateStaticParams() {
  return localeCodes.flatMap((lang) =>
    getJourney(lang).map((item) => ({ lang, milestone: item.id })),
  )
}
export async function generateMetadata({ params }: { params: Params }) {
  const { lang, milestone } = await params
  if (!isLocale(lang)) return {}
  const item = getJourney(lang).find((item) => item.id === milestone)
  return item
    ? {
        ...metadataFor(item.title[lang], item.description[lang], `/journey/${item.id}/`, lang),
        robots: item.encrypted ? { index: false, follow: false } : undefined,
      }
    : {}
}
export default async function Page({ params }: { params: Params }) {
  const { lang, milestone } = await params
  if (!isLocale(lang)) notFound()
  const items = getJourney(lang)
  const index = items.findIndex((item) => item.id === milestone)
  const item = items[index]
  if (!item) notFound()
  const m = messages(lang)
  return (
    <main id="main-content">
      <PageHeading
        eyebrow={copy(lang, "Dấu mốc", "Milestones")}
        title={item.title[lang]}
        description={item.description[lang]}
        back={{ href: `/${lang}/journey/`, label: copy(lang, "Hành trình", "Journey") }}
      />
      <div className="wrap">
        <div className={`journey-page-content ${item.photos.length ? "has-photos" : ""}`}>
          <article className="journey-page-copy">
            <div className="journey-page-meta">
              <span>
                {item.period[lang]}
                {item.year && ` · ${item.year}`}
              </span>
              {item.status !== "completed" && (
                <span className="journey-status">
                  {item.status === "planned"
                    ? copy(lang, "Dự định", "Planned")
                    : copy(lang, "Hiện tại", "Current")}
                </span>
              )}
            </div>
            {item.bodyLocale !== lang && (
              <p className="content-language">{contentLanguage(lang, item.bodyLocale)}</p>
            )}
            {item.encrypted ? <EncryptedBody payload={item.body} /> : <Markdown body={item.body} />}
            {item.links.length > 0 && (
              <>
                <h2>{copy(lang, "Đọc tiếp từ dấu mốc này", "Continue from this milestone")}</h2>
                <div className="journey-page-links">
                  {item.links.map((link) => (
                    <Link key={link.href} href={link.href}>
                      {link.title}
                      {link.sourceLocale && link.sourceLocale !== lang && (
                        <small className="content-language">
                          {contentLanguage(lang, link.sourceLocale)}
                        </small>
                      )}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </article>
          {item.photos.length > 0 && <Gallery photos={item.photos} variant="journey" />}
        </div>
        <nav className="journey-page-nav" aria-label={copy(lang, "Dấu mốc", "Milestones")}>
          {items[index - 1] && (
            <Link href={items[index - 1].href}>
              <small>{m.previous}</small>
              {items[index - 1].label[lang]}
            </Link>
          )}
          {items[index + 1] && (
            <Link href={items[index + 1].href}>
              <small>{m.next}</small>
              {items[index + 1].label[lang]}
            </Link>
          )}
        </nav>
      </div>
    </main>
  )
}
