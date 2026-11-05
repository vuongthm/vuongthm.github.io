import Link from "next/link"
import { ArrowLeft, ArrowUpRight } from "lucide-react"
import { notFound } from "next/navigation"
import { isLocale, localeCodes, localized, contentLanguage } from "@/lib/i18n/config"
import { cornerMessages } from "@/lib/i18n/corner"
import { getCornerItems } from "@/lib/content/server"
import { metadataFor } from "@/lib/seo"
import { Markdown } from "@/components/reading/markdown"
import { EncryptedBody } from "@/components/reading/encrypted-body"
import { CornerCover } from "@/components/corner/cover"
type Params = Promise<{ lang: string; slug: string }>
export function generateStaticParams() {
  return localeCodes.flatMap((lang) =>
    getCornerItems(lang).map((item) => ({ lang, slug: item.slug })),
  )
}
export async function generateMetadata({ params }: { params: Params }) {
  const { lang, slug } = await params
  if (!isLocale(lang)) return {}
  const item = getCornerItems(lang).find((i) => i.slug === slug)
  return item
    ? {
        ...metadataFor(item.title[lang], item.description[lang], `/corner/${slug}/`, lang),
        robots: item.encrypted ? { index: false, follow: false } : undefined,
      }
    : {}
}
export default async function Page({ params }: { params: Params }) {
  const { lang, slug } = await params
  if (!isLocale(lang)) notFound()
  const item = getCornerItems(lang).find((i) => i.slug === slug),
    text = cornerMessages[lang]
  if (!item) notFound()
  return (
    <main id="main-content" className="wrap corner-detail">
      <Link className="back-link" href={localized("/corner/", lang)}>
        <ArrowLeft size={14} />
        {text.back}
      </Link>
      <div className="corner-detail-layout">
        <div>
          <CornerCover item={item} title={item.title[lang]} />
          {item.source && (
            <a className="text-link" href={item.source} target="_blank" rel="noreferrer">
              {text.source}
              <ArrowUpRight size={14} />
            </a>
          )}
        </div>
        <article>
          <span className="eyebrow">
            {text[item.category]} · {item.sample ? text.sample : text[item.shelfStatus]}
          </span>
          <h1>{item.title[lang]}</h1>
          {item.creator[lang] && <p className="corner-creator">{item.creator[lang]}</p>}
          <p className="corner-detail-lede">{item.description[lang]}</p>
          {item.bodyLocale !== lang && (
            <p className="content-language">{contentLanguage(lang, item.bodyLocale)}</p>
          )}
          {item.encrypted ? <EncryptedBody payload={item.body} /> : <Markdown body={item.body} />}
        </article>
      </div>
    </main>
  )
}
