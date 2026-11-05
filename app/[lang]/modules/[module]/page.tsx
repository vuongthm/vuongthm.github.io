import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getContentModules, getEntryMeta, getPaths } from "@/lib/content/server"
import { isLocale, localeCodes, localized } from "@/lib/i18n/config"
import { copy } from "@/lib/i18n/copy"
import { metadataFor } from "@/lib/seo"
import { PageHeading } from "@/components/layout/page-heading"
import { Library } from "@/components/knowledge/library"
type Params = Promise<{ lang: string; module: string }>
export function generateStaticParams() {
  return localeCodes.flatMap((lang) =>
    getContentModules(lang)
      .filter((item) => ["notes", "articles"].includes(item.adapter))
      .map((item) => ({ lang, module: item.id })),
  )
}
export async function generateMetadata({ params }: { params: Params }) {
  const { lang, module } = await params
  if (!isLocale(lang)) return {}
  const item = getContentModules(lang).find((item) => item.id === module)
  return item
    ? metadataFor(item.title[lang], item.description[lang], `/modules/${module}/`, lang)
    : {}
}
export default async function Page({ params }: { params: Params }) {
  const { lang, module } = await params
  if (!isLocale(lang)) notFound()
  const item = getContentModules(lang).find((item) => item.id === module)
  if (!item || !["notes", "articles"].includes(item.adapter)) notFound()
  return (
    <main id="main-content">
      <PageHeading
        eyebrow={copy(lang, "Thư viện", "Library")}
        title={item.title[lang]}
        description={item.description[lang]}
        back={{
          href: localized("/modules/", lang),
          label: copy(lang, "Các bộ sưu tập", "Content collections"),
        }}
      />
      <div className="wrap">
        <Suspense>
          <Library
            entries={getEntryMeta(lang).filter((entry) => entry.moduleId === module)}
            paths={getPaths().filter((path) => item.topics.includes(path.topic))}
          />
        </Suspense>
      </div>
    </main>
  )
}
