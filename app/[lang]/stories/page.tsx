import { PaginatedList } from "@/components/collections/paginated-list"
import { CoverCard } from "@/components/collections/cover-card"
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
    <main id="main-content">
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
            Đại Lãnh <ArrowRight size={12} /> Đà Nẵng
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
        <PaginatedList className="story-grid">
          {stories.map((story) => (
            <CoverCard
              key={story.id}
              href={localized(`/stories/${story.slug}`, lang)}
              cover={story.cover}
              title={story.title}
              description={story.summary}
              label={
                story.status === "completed"
                  ? copy(lang, "ĐÃ HOÀN THÀNH", "COMPLETED")
                  : copy(lang, "ĐANG VIẾT", "IN PROGRESS")
              }
              meta={<time dateTime={story.date}>{story.date.slice(0, 4)}</time>}
              footer={
                <>
                  {story.chapters.length} {copy(lang, "chương", "chapters")}
                </>
              }
              encrypted={story.encrypted}
              locale={lang}
            />
          ))}
        </PaginatedList>
      </div>
    </main>
  )
}
