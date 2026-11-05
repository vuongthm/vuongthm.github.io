import { PaginatedList } from "@/components/collections/paginated-list"
import { copy } from "@/lib/i18n/copy"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { notFound } from "next/navigation"
import { isLocale, localized } from "@/lib/i18n/config"
import { topics } from "@/lib/content/topics"
import { getEntries } from "@/lib/content/server"
import { metadataFor } from "@/lib/seo"
import { messages } from "@/lib/i18n/messages"
import { PageHeading } from "@/components/layout/page-heading"
import { contentLanguage } from "@/lib/i18n/config"
import { TopicIcon } from "@/components/knowledge/topic-icon"
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return isLocale(lang)
    ? metadataFor(
        copy(lang, "Bản đồ chủ đề", "Topic map"),
        copy(
          lang,
          "Khám phá Network, Security, SOC, Cloud, AI và Linux.",
          "Explore networking, security, SOC, cloud, AI, and Linux.",
        ),
        "/topics",
        lang,
      )
    : {}
}
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const m = messages(lang),
    entries = getEntries(lang)
  return (
    <main id="main-content">
      <PageHeading
        eyebrow={copy(lang, "Thư viện", "Library")}
        title={copy(lang, "Khám phá theo chủ đề", "Browse by subject")}
        description={copy(
          lang,
          "Ghi chú, hướng dẫn và bài thực hành, sắp xếp theo lĩnh vực để dễ tìm và đọc tiếp.",
          "Notes, guides, and practical work, organized by subject so you can find your next read.",
        )}
      />
      <div className="wrap subject-directory">
        <div className="subject-directory-meta">
          <span>
            {topics.length} {m.topics.toLocaleLowerCase(lang)}
          </span>
          <span>
            {entries.length} {m.articles}
          </span>
        </div>
        <PaginatedList className="subject-directory-grid">
          {topics.map((topic) => {
            const articles = entries.filter((entry) => entry.topics.includes(topic.id)),
              first = articles[0]
            return (
              <article className="subject-card" key={topic.id}>
                <div className="subject-card-heading">
                  <span className="subject-card-icon">
                    <TopicIcon id={topic.id} size={21} />
                  </span>
                  <h2>
                    <Link href={localized(`/topics/${topic.id}`, lang)}>{topic.label[lang]}</Link>
                  </h2>
                  <small>{String(articles.length).padStart(2, "0")}</small>
                </div>
                <p>{topic.description[lang]}</p>
                <div className="subject-card-reading">
                  {first ? (
                    <>
                      <span>{copy(lang, "Bắt đầu từ bài này", "Start with this article")}</span>
                      <Link href={first.href}>
                        <span className="subject-reading-title">{first.title}</span>
                        {first.locale !== lang && (
                          <small className="content-language">
                            {contentLanguage(lang, first.locale)}
                          </small>
                        )}
                      </Link>
                    </>
                  ) : (
                    <span className="subject-card-empty">{m.available}</span>
                  )}
                </div>
                <Link className="subject-card-more" href={localized(`/topics/${topic.id}`, lang)}>
                  {articles.length
                    ? `${articles.length} ${m.articles}`
                    : copy(lang, "Khám phá chủ đề", "Explore this subject")}
                  <ArrowUpRight size={14} />
                </Link>
              </article>
            )
          })}
        </PaginatedList>
      </div>
    </main>
  )
}
