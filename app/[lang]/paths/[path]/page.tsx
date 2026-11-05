import { copy } from "@/lib/i18n/copy"
import Link from "next/link"
import { ArrowRight, Route } from "lucide-react"
import { notFound } from "next/navigation"
import { getEntryMeta, getPaths } from "@/lib/content/server"
import { isLocale, localeCodes, localized } from "@/lib/i18n/config"
import { messages } from "@/lib/i18n/messages"
import { metadataFor } from "@/lib/seo"
import { PageHeading } from "@/components/layout/page-heading"
import { ArticleRow } from "@/components/knowledge/article-row"
import { LearningPathView } from "@/components/learning/learning-path-view"
import { learningMessages } from "@/lib/i18n/learning"
export function generateStaticParams() {
  return localeCodes.flatMap((lang) => getPaths().map((item) => ({ lang, path: item.slug })))
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; path: string }>
}) {
  const { lang, path } = await params,
    item = getPaths().find((item) => item.slug === path)
  return isLocale(lang) && item
    ? metadataFor(item.title[lang], item.description[lang], `/paths/${path}`, lang)
    : {}
}
export default async function Page({
  params,
}: {
  params: Promise<{ lang: string; path: string }>
}) {
  const { lang, path } = await params
  if (!isLocale(lang)) notFound()
  const item = getPaths().find((item) => item.slug === path)
  if (!item) notFound()
  const entries = getEntryMeta(lang),
    list = item.entries
      .map((reference) =>
        entries.find((entry) =>
          reference.includes("/")
            ? `${entry.moduleId}/${entry.slug}` === reference
            : entry.slug === reference,
        ),
      )
      .filter((entry) => entry !== undefined),
    m = messages(lang)
  return (
    <main id="main-content">
      <PageHeading
        eyebrow={
          lang === "zh" ? "学习路线" : lang === "ja" ? "学習の道筋" : "LEARNING PATH / STEP BY STEP"
        }
        title={item.title[lang]}
        description={item.sections ? learningMessages[lang].readInOrder : item.description[lang]}
        back={{ href: localized("/notes", lang), label: m.knowledge }}
      />
      {item.sections ? (
        <div className="wrap course-page">
          <LearningPathView path={item} entries={entries} />
        </div>
      ) : (
        <div className="wrap path-page-layout">
          <div>
            {list.map((entry, i) => (
              <ArticleRow key={entry.id} entry={entry} locale={lang} index={i} />
            ))}
          </div>
          <aside className="path-overview">
            <Route size={29} strokeWidth={1.4} />
            <h2>
              {copy(lang, "Một bước nhỏ, hiểu thêm một chút.", "One small step. One clearer idea.")}
            </h2>
            <p>
              {list.length} {m.articles} · {list.reduce((sum, entry) => sum + entry.readingTime, 0)}{" "}
              {m.minutes}
              <br />
              {copy(
                lang,
                "Đọc theo thứ tự, thử giải thích lại bằng lời của mình và quay lại khi cần tra cứu.",
                "Read in order, explain it back in your own words, and return whenever you need a reference.",
              )}
            </p>
            {list[0] && (
              <Link className="button primary" href={list[0].href}>
                {copy(lang, "Bắt đầu bài đầu tiên", "Start the first article")}
                <ArrowRight size={15} />
              </Link>
            )}
          </aside>
        </div>
      )}
    </main>
  )
}
