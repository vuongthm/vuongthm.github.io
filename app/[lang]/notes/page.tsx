import { copy } from "@/lib/i18n/copy"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { isLocale } from "@/lib/i18n/config"
import { getEntryMeta, getPaths } from "@/lib/content/server"
import { metadataFor } from "@/lib/seo"
import { PageHeading } from "@/components/layout/page-heading"
import { Library } from "@/components/knowledge/library"
import { knowledgeMessages } from "@/lib/i18n/knowledge"
import { messages } from "@/lib/i18n/messages"
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  return metadataFor(
    copy(lang, "Thư viện kiến thức", "Knowledge library"),
    copy(
      lang,
      "Ghi chú, hướng dẫn và những điều đã học về Network, Security và công nghệ.",
      "Field notes, guides, and lessons on networking, security, and technology.",
    ),
    "/notes",
    lang,
  )
}
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  return (
    <main id="main-content" className="notes-page">
      <PageHeading
        eyebrow={messages(lang).knowledge}
        title={knowledgeMessages[lang].writingTitle}
        description={knowledgeMessages[lang].writingIntro}
      />
      <div className="wrap">
        {lang === "zh" && (
          <p className="content-availability">界面已提供中文。标注“英语”的文章将打开英文原文。</p>
        )}
        {lang === "ja" && (
          <p className="content-availability">
            公開済みの記事から順に読めます。「英語」と表示された記事は英語の原文で開きます。
          </p>
        )}
        <Suspense
          fallback={
            <div className="loading-state">
              {lang === "zh" ? "加载中…" : lang === "ja" ? "読み込み中…" : "Loading library…"}
            </div>
          }
        >
          <Library entries={getEntryMeta(lang)} paths={getPaths()} />
        </Suspense>
      </div>
    </main>
  )
}
