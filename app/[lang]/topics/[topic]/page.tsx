import { copy } from "@/lib/i18n/copy"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { topics, getTopic } from "@/lib/content/topics"
import { getEntryMeta, getPaths } from "@/lib/content/server"
import { isLocale, localeCodes, localized } from "@/lib/i18n/config"
import { metadataFor } from "@/lib/seo"
import { PageHeading } from "@/components/layout/page-heading"
import { TopicIcon } from "@/components/knowledge/topic-icon"
import { Library } from "@/components/knowledge/library"
export function generateStaticParams() {
  return localeCodes.flatMap((lang) => topics.map((topic) => ({ lang, topic: topic.id })))
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; topic: string }>
}) {
  const { lang, topic } = await params
  const item = getTopic(topic)
  return isLocale(lang) && item
    ? metadataFor(item.label[lang], item.description[lang], `/topics/${topic}`, lang)
    : {}
}
export default async function Page({
  params,
}: {
  params: Promise<{ lang: string; topic: string }>
}) {
  const { lang, topic } = await params
  if (!isLocale(lang)) notFound()
  const item = getTopic(topic)
  if (!item) notFound()
  return (
    <main id="main-content">
      <PageHeading
        eyebrow={`TOPIC / ${item.id.toUpperCase()}`}
        title={item.label[lang]}
        description={item.description[lang]}
        back={{
          href: localized("/topics", lang),
          label: copy(lang, "Bản đồ chủ đề", "Topic map"),
        }}
      >
        <div className={`topic-title-icon tone-${item.color}`}>
          <TopicIcon id={item.id} size={31} />
        </div>
      </PageHeading>
      <div className="wrap">
        <Suspense>
          <Library entries={getEntryMeta(lang)} paths={getPaths()} initialTopic={item.id} />
        </Suspense>
      </div>
    </main>
  )
}
