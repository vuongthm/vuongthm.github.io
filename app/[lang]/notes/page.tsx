import { copy } from "@/lib/i18n/copy"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { isLocale } from "@/lib/i18n/config"
import { getEntryMeta, getPaths } from "@/lib/content/server"
import { metadataFor } from "@/lib/seo"
import { PageHeading } from "@/components/layout/page-heading"
import { Library } from "@/components/knowledge/library"
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
    <main id="main-content">
      <PageHeading
        eyebrow={copy(lang, "Bài viết", "Writing")}
        title={copy(lang, "Thư viện kiến thức", "Knowledge library")}
        description={copy(
          lang,
          "Những điều mình đã học và thử làm. Tìm theo chủ đề, loại bài hoặc khái niệm bạn quan tâm.",
          "Things I’ve learned and put into practice. Browse by subject, article type, or a concept you’re curious about.",
        )}
      />
      <div className="wrap">
        {lang === "zh" && (
          <p className="content-availability">界面已提供中文。标注“英语”的文章将打开英文原文。</p>
        )}
        {lang === "ja" && (
          <p className="content-availability">
            日本語の記事はOSIモデルのサンプルです。「英語」と表示された記事は英語の本文を開きます。
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
