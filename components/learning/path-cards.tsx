import Link from "next/link"
import { ArrowUpRight, Route } from "lucide-react"
import type { LearningPath } from "@/lib/content/types"
import type { Locale } from "@/lib/i18n/config"
import { designMessages } from "@/lib/i18n/design"
import { PathMark } from "./path-mark"

export function PathCards({
  paths,
  locale,
  compact = false,
}: {
  paths: LearningPath[]
  locale: Locale
  compact?: boolean
}) {
  const text = designMessages[locale]
  return (
    <div className={`path-card-grid${compact ? " is-compact" : ""}`}>
      {paths.map((path, index) => (
        <Link
          key={path.slug}
          href={`/${locale}/paths/${path.slug}/`}
          className={`path-card path-tone-${path.slug}`}
        >
          <div className="path-card-art">
            <span className="path-card-number">0{index + 1}</span>
            <PathMark slug={path.slug} small />
          </div>
          <div className="path-card-copy">
            <span className="eyebrow">
              <Route size={12} /> {text.paths}
            </span>
            <h2>{path.title[locale]}</h2>
            <p>{path.description[locale]}</p>
            <div className="path-card-stats">
              <span>
                {path.sections?.length ?? 0} {text.modules}
              </span>
              <span>
                {path.sections?.reduce((n, s) => n + s.steps.length, 0) ?? path.entries.length}{" "}
                {text.lessons}
              </span>
            </div>
            <span className="path-card-open">
              {text.more}
              <ArrowUpRight size={17} />
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
