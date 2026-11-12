import { notFound } from "next/navigation"
import { getPaths } from "@/lib/content/server"
import { isLocale } from "@/lib/i18n/config"
import { designMessages } from "@/lib/i18n/design"
import { metadataFor } from "@/lib/seo"
import { PageHeading } from "@/components/layout/page-heading"
import { PathCards } from "@/components/learning/path-cards"
import { knowledgeMessages } from "@/lib/i18n/knowledge"
import { messages } from "@/lib/i18n/messages"

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return isLocale(lang)
    ? metadataFor(designMessages[lang].paths, designMessages[lang].pathsIntro, "/paths/", lang)
    : {}
}
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const text = designMessages[lang]
  return (
    <main id="main-content" className="paths-directory-page">
      <PageHeading
        eyebrow={messages(lang).knowledge}
        title={knowledgeMessages[lang].pathsTitle}
        description={knowledgeMessages[lang].pathsIntro}
      />
      <div className="wrap paths-directory">
        <PathCards paths={getPaths()} locale={lang} />
        <p className="paths-directory-note">{text.notesDetail}</p>
      </div>
    </main>
  )
}
