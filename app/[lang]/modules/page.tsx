import { notFound } from "next/navigation"
import { isLocale, localized } from "@/lib/i18n/config"
import { messages } from "@/lib/i18n/messages"
import { knowledgeMessages } from "@/lib/i18n/knowledge"
import { LegacyCollections } from "@/components/knowledge/legacy-collections"
import { metadataFor } from "@/lib/seo"

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return isLocale(lang)
    ? {
        ...metadataFor(
          messages(lang).topics,
          knowledgeMessages[lang].subjectsIntro,
          "/topics/",
          lang,
        ),
        robots: { index: false, follow: true },
      }
    : {}
}
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  return (
    <main id="main-content" className="wrap">
      <LegacyCollections
        href={localized("/topics/", lang)}
        label={knowledgeMessages[lang].oldCollections}
      />
    </main>
  )
}
