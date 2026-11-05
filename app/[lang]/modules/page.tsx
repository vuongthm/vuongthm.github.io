import { PaginatedList } from "@/components/collections/paginated-list"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getContentModules } from "@/lib/content/server"
import { isLocale } from "@/lib/i18n/config"
import { copy } from "@/lib/i18n/copy"
import { metadataFor } from "@/lib/seo"
import { PageHeading } from "@/components/layout/page-heading"
import { TopicIcon } from "@/components/knowledge/topic-icon"
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return isLocale(lang)
    ? metadataFor(
        copy(lang, "Các bộ sưu tập", "Content collections"),
        copy(
          lang,
          "Kiến thức, dự án và câu chuyện, sắp xếp thành những không gian riêng.",
          "Knowledge, projects, and stories, each with their own space.",
        ),
        "/modules/",
        lang,
      )
    : {}
}
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const modules = getContentModules(lang)
  return (
    <main id="main-content">
      <PageHeading
        eyebrow={copy(lang, "Thư viện", "Library")}
        title={copy(lang, "Các bộ sưu tập", "Content collections")}
        description={copy(
          lang,
          "Kiến thức, dự án và câu chuyện, sắp xếp thành những không gian riêng.",
          "Knowledge, projects, and stories, each with their own space.",
        )}
      />
      <div className="wrap">
        <PaginatedList className="module-directory">
          {modules.map((module) => (
            <Link href={module.href} key={module.id} className="module-card">
              <TopicIcon id={module.topics[0] ?? "book"} size={20} />
              <h2>{module.title[lang]}</h2>
              <p>{module.description[lang]}</p>
            </Link>
          ))}
        </PaginatedList>
      </div>
    </main>
  )
}
