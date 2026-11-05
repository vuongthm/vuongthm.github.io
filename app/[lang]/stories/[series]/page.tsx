import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, BookOpen } from "lucide-react"
import { notFound } from "next/navigation"
import { allStories, getStory, getChapters } from "@/lib/content/server"
import { isLocale, localized, dateLabel } from "@/lib/i18n/config"
import { metadataFor } from "@/lib/seo"
import { copy } from "@/lib/i18n/copy"
import { Gallery } from "@/components/gallery"
import { EncryptedBody } from "@/components/reading/encrypted-body"
import { Markdown } from "@/components/reading/markdown"
import { ChapterList } from "@/components/stories/chapter-list"
export function generateStaticParams() {
  return allStories().map((story) => ({ lang: story.locale, series: story.slug }))
}
type Params = Promise<{ lang: string; series: string }>
export async function generateMetadata({ params }: { params: Params }) {
  const { lang, series } = await params
  if (!isLocale(lang)) return {}
  const story = getStory(series, lang)
  return story ? metadataFor(story.title, story.summary, `/stories/${series}/`, lang) : {}
}
export default async function Page({ params }: { params: Params }) {
  const { lang, series } = await params
  if (!isLocale(lang)) notFound()
  const story = getStory(series, lang)
  if (!story) notFound()
  const chapters = getChapters(series, lang)
  return (
    <main id="main-content" className="story-detail wrap">
      <Link href={localized("/stories/", lang)} className="back-link">
        <ArrowLeft size={14} />
        {copy(lang, "Tất cả chuyện kể", "All stories")}
      </Link>
      <header className="story-detail-hero">
        {story.cover && (
          <Image
            src={story.cover}
            alt={story.title}
            fill
            priority
            unoptimized
            sizes="(max-width:760px) 100vw, 1100px"
          />
        )}
        <div className="story-hero-shade" />
        <div className="story-detail-intro">
          <span className="eyebrow">
            {story.status === "completed"
              ? copy(lang, "ĐÃ HOÀN THÀNH", "COMPLETED")
              : copy(lang, "ĐANG VIẾT", "IN PROGRESS")}
          </span>
          <h1>{story.title}</h1>
          <p>{story.summary}</p>
          <div>
            <span>
              <BookOpen size={14} />
              {chapters.length} {copy(lang, "chương", "chapters")}
            </span>
            <time dateTime={story.date}>{dateLabel(story.date, lang)}</time>
          </div>
        </div>
      </header>
      <div className={`story-detail-layout ${story.photos?.length ? "" : "no-photos"}`}>
        <section className="story-chapters">
          <h2>{copy(lang, "Danh sách chương", "Chapters")}</h2>
          {story.body &&
            (story.encrypted ? (
              <EncryptedBody payload={story.body} />
            ) : (
              <Markdown body={story.body} />
            ))}
          <ChapterList
            chapters={chapters.map(({ body: _body, ...metadata }) => metadata)}
            locale={lang}
          />
        </section>
        {!!story.photos?.length && (
          <section className="story-photo-collection">
            <div className="story-photo-heading">
              <h2>{copy(lang, "Bộ sưu tập hình ảnh", "Photo collection")}</h2>
              <span>{story.photos.length}</span>
            </div>
            <Gallery photos={story.photos} variant="journey" />
          </section>
        )}
      </div>
    </main>
  )
}
