import { copy } from "@/lib/i18n/copy"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getEntryMeta, getPaths } from "@/lib/content/server"
import { isLocale, localized, localeCodes } from "@/lib/i18n/config"
import { metadataFor } from "@/lib/seo"
import { PageHeading } from "@/components/layout/page-heading"
import { Library } from "@/components/knowledge/library"
export function generateStaticParams() {
  const routes = localeCodes.flatMap((lang) =>
    [...new Set(getEntryMeta(lang).flatMap((entry) => entry.tags))].map((tag) => ({ lang, tag })),
  )
  return routes.length ? routes : localeCodes.map((lang) => ({ lang, tag: "_empty" }))
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; tag: string }>
}) {
  const { lang, tag } = await params
  return isLocale(lang)
    ? metadataFor(
        `#${tag}`,
        lang === "zh"
          ? `关于 ${tag} 的文章。`
          : lang === "ja"
            ? `${tag}に関する記事。`
            : lang === "vi"
              ? `Bài viết về ${tag}.`
              : `Articles about ${tag}.`,
        `/tags/${encodeURIComponent(tag)}`,
        lang,
      )
    : {}
}
export default async function Page({ params }: { params: Promise<{ lang: string; tag: string }> }) {
  const { lang, tag } = await params
  if (!isLocale(lang)) notFound()
  const entries = getEntryMeta(lang)
  if (!entries.some((entry) => entry.tags.includes(tag))) notFound()
  return (
    <main id="main-content">
      <PageHeading
        eyebrow={
          lang === "zh" ? "关键词" : lang === "ja" ? "キーワード" : "KEYWORD / FOLLOW THE THREAD"
        }
        title={`#${tag}`}
        description={copy(
          lang,
          "Những trang kiến thức được nối với nhau bằng một khái niệm.",
          "Pages connected by a shared concept.",
        )}
        back={{
          href: localized("/tags", lang),
          label: copy(lang, "Chỉ mục từ khóa", "Keyword index"),
        }}
      />
      <div className="wrap">
        <Suspense>
          <Library entries={entries} paths={getPaths()} initialTag={tag} />
        </Suspense>
      </div>
    </main>
  )
}
