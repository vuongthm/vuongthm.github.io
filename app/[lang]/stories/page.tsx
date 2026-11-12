import { localeName } from "@/lib/i18n/english-names.mjs"
import { PaginatedList } from "@/components/collections/paginated-list"
import Link from "next/link"
import Image from "next/image"
import { LockBadge } from "@/components/reading/lock-badge"
import { copy } from "@/lib/i18n/copy"
import { ArrowRight } from "lucide-react"
import { notFound } from "next/navigation"
import { getStories } from "@/lib/content/server"
import { isLocale, localized } from "@/lib/i18n/config"
import { metadataFor } from "@/lib/seo"
import { messages } from "@/lib/i18n/messages"
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return isLocale(lang)
    ? metadataFor(
        copy(lang, "Chuyện kể", "Stories"),
        copy(lang, "Những câu chuyện phía sau các dòng code.", "The stories behind the code."),
        "/stories",
        lang,
      )
    : {}
}
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const stories = getStories(lang),
    m = messages(lang)
  return (
    <main id="main-content" className="stories-salon">
      <header className="wrap story-index-heading">
        <div>
          <span className="eyebrow">{copy(lang, "Góc lưu giữ cá nhân", "Personal archive")}</span>
          <h1>{copy(lang, "Chuyện trên đường đi", "Stories along the way")}</h1>
          <p>
            {copy(
              lang,
              "Chuyện đi học, đi làm và lớn lên.",
              "Stories of school, work, and growing up.",
            )}
          </p>
        </div>
        <div className="story-index-aside">
          <span>
            {localeName("Đại Lãnh", lang)} <ArrowRight size={12} /> {localeName("Đà Nẵng", lang)}
          </span>
          <small>
            {stories.length} {m.stories.toLocaleLowerCase(lang)} ·{" "}
            {stories.reduce((sum, story) => sum + story.chapters.length, 0)}{" "}
            {copy(lang, "chương", "chapters")}
          </small>
        </div>
      </header>
      {lang === "zh" && (
        <p className="wrap content-availability">
          介绍页面提供中文，故事正文目前提供英语与越南语版本。
        </p>
      )}
      {lang === "ja" && (
        <p className="wrap content-availability">
          紹介ページは日本語です。ストーリー本文は英語・ベトナム語で公開しています。
        </p>
      )}
      <div className="wrap">
        <PaginatedList className="story-exhibition" pageSize={8}>
          {stories.map((story, index) => (
            <article className="story-exhibit" id={`story-${story.slug}`} key={story.id}>
              <Link
                className="story-exhibit-image"
                href={localized(`/stories/${story.slug}`, lang)}
                prefetch={story.encrypted ? false : undefined}
                aria-label={story.title}
              >
                <Image
                  src={story.cover}
                  alt=""
                  fill
                  sizes={
                    index === 0 ? "(max-width:760px) 90vw, 54vw" : "(max-width:760px) 90vw, 44vw"
                  }
                  unoptimized
                  priority={index === 0}
                />
                <span className="story-exhibit-number">{String(index + 1).padStart(2, "0")}</span>
              </Link>
              <div className="story-exhibit-copy">
                <span className="eyebrow">
                  {story.date.slice(0, 4)} <span aria-hidden="true">/</span> {story.chapters.length}{" "}
                  {copy(lang, "chương", "chapters")}
                </span>
                <h2>
                  <Link
                    href={localized(`/stories/${story.slug}`, lang)}
                    prefetch={story.encrypted ? false : undefined}
                  >
                    {story.title}
                    {story.encrypted && <LockBadge locale={lang} />}
                  </Link>
                </h2>
                <p>{story.summary}</p>
                <Link
                  className="text-link"
                  href={localized(`/stories/${story.slug}`, lang)}
                  prefetch={story.encrypted ? false : undefined}
                >
                  {copy(lang, "Mở câu chuyện", "Open the story")}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </PaginatedList>
      </div>
    </main>
  )
}
