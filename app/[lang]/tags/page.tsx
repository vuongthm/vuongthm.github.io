import { copy } from "@/lib/i18n/copy"
import Link from "next/link"
import { notFound } from "next/navigation"
import { isLocale, localized } from "@/lib/i18n/config"
import { getEntries } from "@/lib/content/server"
import { metadataFor } from "@/lib/seo"
import { PageHeading } from "@/components/layout/page-heading"
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return isLocale(lang)
    ? metadataFor(
        copy(lang, "Chỉ mục từ khóa", "Keyword index"),
        copy(
          lang,
          "Những khái niệm xuất hiện trong thư viện.",
          "Concepts found across the library.",
        ),
        "/tags",
        lang,
      )
    : {}
}
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const counts = new Map<string, number>()
  getEntries(lang).forEach((entry) =>
    entry.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)),
  )
  return (
    <main id="main-content">
      <PageHeading
        eyebrow={
          lang === "zh"
            ? "关键词索引"
            : lang === "ja"
              ? "キーワード索引"
              : "INDEX / SMALL CONNECTIONS"
        }
        title={copy(lang, "Tìm từ một khái niệm.", "Start with a concept.")}
        description={copy(
          lang,
          "Một chỉ mục nhỏ của những ý tưởng xuất hiện trong thư viện. Nếu muốn nhìn tổng thể, hãy khám phá bản đồ chủ đề.",
          "A small index of ideas across the library. For the bigger picture, explore the topic map.",
        )}
      />
      <div className="wrap tag-index">
        {[...counts]
          .sort((a, b) => a[0].localeCompare(b[0], lang))
          .map(([tag, count]) => (
            <Link href={localized(`/tags/${encodeURIComponent(tag)}`, lang)} key={tag}>
              <span>#{tag}</span>
              <small>{count}</small>
            </Link>
          ))}
      </div>
    </main>
  )
}
