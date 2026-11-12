import { localeName } from "@/lib/i18n/english-names.mjs"
import { notFound } from "next/navigation"
import { ArrowDown, ArrowRight } from "lucide-react"
import { getJourneyPreviews } from "@/lib/content/journey"
import { isLocale } from "@/lib/i18n/config"
import { copy } from "@/lib/i18n/copy"
import { metadataFor } from "@/lib/seo"
import { LifeRoad } from "@/components/journey/life-road"
import { personalSpaces } from "@/lib/i18n/personal-spaces"
import { journeyPage } from "@/lib/content/site-pages"
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return isLocale(lang)
    ? {
        ...metadataFor(
          copy(lang, "Hành trình", "Journey"),
          copy(
            lang,
            "Những nơi đã đến, điều đã học và những thứ đang làm.",
            "Places, lessons, and things I’m building.",
          ),
          "/journey/",
          lang,
        ),
        robots: journeyPage?.encrypted ? { index: false, follow: false } : undefined,
      }
    : {}
}
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const milestones = getJourneyPreviews(lang)
  const text = personalSpaces[lang]
  return (
    <main id="main-content" className="wrap journey-index life-road-page">
      <header className="life-road-heading">
        <span className="eyebrow">{text.roadKicker}</span>
        <h1>{text.road}</h1>
        <p>{text.roadIntro}</p>
        <span className="journey-origin">
          {localeName("Đại Lãnh", lang)} <ArrowRight size={14} /> {localeName("Đà Nẵng", lang)}
        </span>
        <span className="road-scroll-hint">
          <ArrowDown size={14} />
          {text.followRoad}
        </span>
      </header>
      <LifeRoad items={milestones} locale={lang} />
      <p className="road-open-end">{text.continues}</p>
    </main>
  )
}
