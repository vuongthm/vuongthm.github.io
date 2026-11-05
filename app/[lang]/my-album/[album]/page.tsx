import { notFound } from "next/navigation"
import { getAlbums } from "@/lib/content/server"
import { isLocale, localeCodes, localized } from "@/lib/i18n/config"
import { metadataFor } from "@/lib/seo"
import { messages } from "@/lib/i18n/messages"
import { PageHeading } from "@/components/layout/page-heading"
import { Markdown } from "@/components/reading/markdown"
import { EncryptedBody } from "@/components/reading/encrypted-body"
import { Gallery } from "@/components/gallery"
type Params = Promise<{ lang: string; album: string }>
export function generateStaticParams() {
  return localeCodes.flatMap((lang) => getAlbums().map((album) => ({ lang, album: album.slug })))
}
export async function generateMetadata({ params }: { params: Params }) {
  const { lang, album } = await params
  if (!isLocale(lang)) return {}
  const item = getAlbums().find((item) => item.slug === album)
  return item
    ? {
        ...metadataFor(item.title[lang], item.description[lang], `/my-album/${album}/`, lang),
        robots: item.encrypted ? { index: false, follow: false } : undefined,
      }
    : {}
}
export default async function Page({ params }: { params: Params }) {
  const { lang, album } = await params
  if (!isLocale(lang)) notFound()
  const item = getAlbums().find((item) => item.slug === album)
  if (!item) notFound()
  return (
    <main id="main-content">
      <PageHeading
        eyebrow={messages(lang).album}
        title={item.title[lang]}
        description={item.description[lang]}
        back={{ href: localized("/my-album/", lang), label: messages(lang).album }}
      />
      <div className="wrap album-document">
        {item.encrypted ? (
          <EncryptedBody payload={item.bodies[lang]} view="gallery" />
        ) : (
          <>
            <Markdown body={item.bodies[lang]} />
            <Gallery photos={item.items} variant="journal" />
          </>
        )}
      </div>
    </main>
  )
}
