import Link from "next/link"
import { ArrowRight, LockKeyhole } from "lucide-react"
import { notFound } from "next/navigation"
import { isLocale, localized } from "@/lib/i18n/config"
import { topics } from "@/lib/content/topics"
import { getEntryMeta, getPaths } from "@/lib/content/server"
import { metadataFor } from "@/lib/seo"
import { messages } from "@/lib/i18n/messages"
import { PageHeading } from "@/components/layout/page-heading"
import { TopicIcon } from "@/components/knowledge/topic-icon"
import { knowledgeMessages } from "@/lib/i18n/knowledge"

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return isLocale(lang)
    ? metadataFor(messages(lang).topics, knowledgeMessages[lang].directoryIntro, "/topics/", lang)
    : {}
}
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const m = messages(lang),
    k = knowledgeMessages[lang]
  const entries = getEntryMeta(lang),
    paths = getPaths()
  const available = topics.filter((topic) => topic.available !== false)
  const pending = topics.filter((topic) => topic.available === false)
  return (
    <main id="main-content" className="subjects-page">
      <PageHeading eyebrow={m.knowledge} title={m.topics} description={k.directoryIntro} />
      <div className="wrap subjects-index">
        <div className="subject-catalog">
          {available.map((topic) => {
            const count = entries.filter((entry) => entry.topics.includes(topic.id)).length
            const routes = paths.filter(
              (path) => path.topic === topic.id || path.topics?.includes(topic.id),
            ).length
            return (
              <Link
                className={`subject-catalog-item tone-${topic.color}`}
                key={topic.id}
                href={localized(`/topics/${topic.id}/`, lang)}
              >
                <TopicIcon id={topic.id} size={23} />
                <span className="subject-catalog-copy">
                  <h2>{topic.label[lang]}</h2>
                  <span>{topic.description[lang]}</span>
                  <small>
                    {count} {k.articleCount}
                    {routes > 0 && (
                      <>
                        {" "}
                        <span aria-hidden="true">·</span> {routes} {k.routeCount}
                      </>
                    )}
                  </small>
                </span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            )
          })}
        </div>
        {pending.length > 0 && (
          <section className="subjects-pending">
            <h2>{k.upcoming}</h2>
            <ul>
              {pending.map((topic) => (
                <li key={topic.id}>
                  <TopicIcon id={topic.id} size={16} />
                  <span>{topic.label[lang]}</span>
                  <LockKeyhole size={12} aria-hidden="true" />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  )
}
