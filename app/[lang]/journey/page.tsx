import { localeName } from "@/lib/i18n/english-names.mjs"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, MoveUpRight } from "lucide-react"
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
  const milestones = getJourneyPreviews(lang)
  return (
    <main id="main-content" className="wrap journey-index">
      <header className="journey-editorial-heading">
        <span className="eyebrow">
          {copy(lang, "Một cuốn sổ đang viết tiếp", "A journal still being written")}
        </span>
        <h1>{copy(lang, "Mỗi chặng, một chút lớn lên.", "A little growth, along the way.")}</h1>
        <p>
          {copy(
            lang,
            "Những nơi mình đi qua, điều mình học được và những bước chân tiếp theo. Không phải một đường thẳng, chỉ là hành trình của mình.",
            "Places I’ve been, things I’ve learned, and the next steps. Not a straight line, just my own way forward.",
          )}
        </p>
        <span className="journey-origin">
          {localeName("Đại Lãnh", lang)} <ArrowRight size={14} /> {localeName("Đà Nẵng", lang)}
        </span>
      </header>
      <ol className="journey-journal">
        {milestones.map((item, index) => (
          <li className={`journey-spread is-${item.status}`} key={item.id}>
            <span className="journey-stop" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="journey-spread-copy">
              <span className="eyebrow">{item.label[lang]}</span>
              <h2>
                <Link href={item.href}>{item.title[lang]}</Link>
              </h2>
              <p>{item.description[lang]}</p>
              <Link className="text-link" href={item.href}>
                {copy(lang, "Dừng lại ở chặng này", "Visit this chapter")}
                <MoveUpRight size={15} />
              </Link>
            </div>
            {item.photos[0] ? (
              <Link className="journey-spread-photo" href={item.href} aria-label={item.title[lang]}>
                <Image
                  src={item.photos[0].src}
                  alt={item.photos[0].title[lang]}
                  fill
                  sizes="(max-width:760px) 90vw, 40vw"
                  unoptimized
                />
                <span>{localeName(item.photos[0].place || item.label[lang], lang)}</span>
              </Link>
            ) : (
              <div className="journey-spread-drawing" aria-hidden="true">
                <svg viewBox="0 0 340 220">
                  <path d="M30 170Q90 70 170 120T310 48M32 180h276M80 180v-28m5 28v-36m177 36v-52" />
                  <circle cx="169" cy="117" r="12" />
                  <path d="m163 117 5 5 9-12" />
                </svg>
                <span>{item.label[lang]}</span>
              </div>
            )}
          </li>
        ))}
      </ol>
      <p className="journey-open-end">
        {copy(lang, "Và hành trình vẫn đang tiếp tục…", "And the journey continues…")}
      </p>
    </main>
  )
}
