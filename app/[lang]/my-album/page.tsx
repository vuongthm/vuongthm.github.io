import { photoJournal } from "@/lib/content/site-pages"
import { EncryptedBody } from "@/components/reading/encrypted-body"
import { copy } from "@/lib/i18n/copy"
import { notFound } from "next/navigation"
import { isLocale, localized } from "@/lib/i18n/config"
import { metadataFor } from "@/lib/seo"
import { authorProfile } from "@/lib/content/profile"
import { getAlbums } from "@/lib/content/server"
import { PhotoJournal } from "@/components/album/photo-journal"
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return isLocale(lang)
    ? {
        ...metadataFor(
          copy(lang, "Góc ảnh cá nhân", "Photo journal"),
          copy(
            lang,
            "Bộ sưu tập ảnh và những khung hình muốn giữ lại.",
            "A personal photo collection and frames worth keeping.",
          ),
          "/my-album",
          lang,
        ),
        robots: photoJournal?.encrypted ? { index: false, follow: false } : undefined,
      }
    : {}
}
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const payload = photoJournal?.bodies[lang]
  if (photoJournal?.encrypted && !payload)
    throw Error("Missing encrypted photo journal translation")
  return (
    <main id="main-content">
      <header className="wrap journal-heading">
        <div className="journal-heading-copy">
          <span className="eyebrow">{copy(lang, "Bộ sưu tập cá nhân", "Personal collection")}</span>
          <h1>{copy(lang, "Góc ảnh", "Photo journal")}</h1>
          <p>
            {copy(
              lang,
              "Một nơi lưu lại hình ảnh, những nơi chốn và khoảnh khắc đáng nhớ.",
              "A place for photographs, places, and moments to remember.",
            )}
          </p>
        </div>
      </header>
      <div>
        {photoJournal?.encrypted ? (
          <EncryptedBody payload={payload!} view="gallery" />
        ) : (
          <PhotoJournal
            albums={
              getAlbums().length
                ? getAlbums().map((album) => ({
                    id: album.id,
                    title: album.title[lang],
                    description: album.description[lang],
                    story: album.story,
                    cover: album.cover,
                    href: localized(`/my-album/${album.slug}/`, lang),
                    encrypted: album.encrypted,
                    count: album.count,
                    items: album.items,
                  }))
                : [
                    {
                      id: "personal",
                      title: copy(lang, "Bộ sưu tập cá nhân", "Personal collection"),
                      href: localized("/my-album/", lang),
                      items: authorProfile.photos,
                      count: authorProfile.photos.length,
                    },
                  ]
            }
          />
        )}
      </div>
    </main>
  )
}
