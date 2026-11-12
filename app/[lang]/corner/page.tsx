import { localeName } from "@/lib/i18n/english-names.mjs"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Music2 } from "lucide-react"
import { notFound } from "next/navigation"
import { isLocale, localized } from "@/lib/i18n/config"
import { cornerMessages } from "@/lib/i18n/corner"
import { metadataFor } from "@/lib/seo"
import { getCornerItems } from "@/lib/content/server"
import music from "@/generated/music.json"
import { readingShelf } from "@/lib/content/site-pages"
import { LockedShelf } from "@/components/corner/locked-shelf"
import { CornerShelf } from "@/components/corner/shelf"
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return isLocale(lang)
    ? {
        ...metadataFor(
          cornerMessages[lang].title,
          cornerMessages[lang].description,
          "/corner/",
          lang,
        ),
        robots: readingShelf?.encrypted ? { index: false, follow: false } : undefined,
      }
    : {}
}
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const text = cornerMessages[lang],
    items = getCornerItems(lang)
      .filter((item) => item.category === "books")
      .map(({ body: _body, ...meta }) => meta)
  return (
    <main id="main-content" className="corner-page">
      <section className="wrap corner-hero" aria-labelledby="corner-title">
        <div>
          <span className="eyebrow">{text.eyebrow}</span>
          <h1 id="corner-title">
            {text.line1}
            <span>{text.line2}</span>
          </h1>
          <p>{text.description}</p>
          <div className="corner-hero-index">
            <span>{text.music}</span>
            <i />
            <span>{text.books}</span>
          </div>
        </div>
        <figure className="corner-window">
          <Image
            src="/hometown/dai-lanh-coast.webp"
            alt={text.photograph}
            fill
            sizes="(max-width:760px) 90vw, 45vw"
            priority
            unoptimized
          />
          <figcaption>
            <span>{localeName("Đại Lãnh", lang)}</span>
            <span>vuong.</span>
          </figcaption>
        </figure>
      </section>
      <div className="corner-content-band">
        <div className="wrap">
          <Link href={localized("/music/", lang)} className="corner-music">
            <div className="corner-music-art" aria-hidden="true">
              {music.slice(1, 4).map((track) => (
                <Image
                  key={track.id}
                  src={track.cover}
                  alt=""
                  width={160}
                  height={160}
                  unoptimized
                />
              ))}
            </div>
            <div className="corner-music-copy">
              <span className="corner-music-label">
                <Music2 size={16} />
                {text.music}
                <small>
                  {music.length} {text.tracks}
                </small>
              </span>
              <h2>{text.musicTitle}</h2>
              <p>{text.musicDescription}</p>
              <span className="corner-listen">
                {text.listen}
                <ArrowRight size={16} />
              </span>
            </div>
          </Link>
          {readingShelf?.encrypted ? (
            <LockedShelf payload={readingShelf.bodies[lang]!} />
          ) : (
            <CornerShelf items={items} />
          )}
        </div>
      </div>
    </main>
  )
}
