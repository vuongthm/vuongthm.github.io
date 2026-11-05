import { notFound } from "next/navigation"
import { JourneyExplorer } from "@/components/journey-explorer"
import { getJourneyPreviews } from "@/lib/content/journey"
import { isLocale } from "@/lib/i18n/config"
import { copy } from "@/lib/i18n/copy"
import { metadataFor } from "@/lib/seo"
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return isLocale(lang)
    ? metadataFor(
        copy(lang, "Hành trình", "Journey"),
        copy(
          lang,
          "Những nơi đã đến, điều đã học và những thứ đang làm.",
          "Places, lessons, and things I’m building.",
        ),
        "/journey/",
        lang,
      )
    : {}
}
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  return (
    <main id="main-content" className="wrap journey-index">
      <JourneyExplorer items={getJourneyPreviews(lang)} />
    </main>
  )
}
