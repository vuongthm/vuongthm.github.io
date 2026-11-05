"use client"
import { useSyncExternalStore } from "react"
import Link from "next/link"
import { ArrowRight, BookOpen, Check, ChevronDown, ExternalLink, Route } from "lucide-react"
import { useSite } from "@/components/providers/site-provider"
import type { EntryMeta, LearningPath } from "@/lib/content/types"
import { learningMessages } from "@/lib/i18n/learning"
import { entryForStep, pathEntries } from "@/lib/learning/paths"
import { searchText } from "@/lib/collections/search"
import { LockBadge } from "@/components/reading/lock-badge"
const subscribe = (callback: () => void) => {
  window.addEventListener("storage", callback)
  window.addEventListener("vuong:learning-progress", callback)
  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener("vuong:learning-progress", callback)
  }
}
export function LearningPathView({
  path,
  entries,
  query = "",
  compact = false,
  currentHref,
}: {
  path: LearningPath
  entries: EntryMeta[]
  query?: string
  compact?: boolean
  currentHref?: string
}) {
  const { locale, dictionary } = useSite(),
    text = learningMessages[locale],
    key = `vuong:learning:${path.slug}`
  const saved = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key) ?? "[]"
      } catch {
        return "[]"
      }
    },
    () => "[]",
  )
  let completed: string[] = []
  try {
    const parsed = JSON.parse(saved)
    if (Array.isArray(parsed)) completed = parsed.filter((item) => typeof item === "string")
  } catch {}
  const available = pathEntries(path, entries),
    total =
      path.sections?.reduce((sum, section) => sum + section.steps.length, 0) ?? available.length
  const done =
    path.sections
      ?.flatMap((section) => section.steps)
      .filter((step) => step.entry && completed.includes(step.id)).length ?? 0
  function toggle(step: string) {
    const next = completed.includes(step)
      ? completed.filter((item) => item !== step)
      : [...completed, step]
    try {
      localStorage.setItem(key, JSON.stringify(next))
      window.dispatchEvent(new Event("vuong:learning-progress"))
    } catch {}
  }
  return (
    <section
      className={`learning-path-view${compact ? " is-compact" : ""}`}
      aria-label={path.title[locale]}
    >
      <header className="course-overview">
        <div className="course-overview-title">
          <Route size={23} strokeWidth={1.5} aria-hidden="true" />
          <div>
            <span className="eyebrow">{text.overview}</span>
            <h2>{compact ? path.title[locale] : text.overview}</h2>
          </div>
        </div>
        <p>{path.description[locale]}</p>
        {!compact && path.outcomes && (
          <ul className="course-outcomes">
            {path.outcomes.map((outcome, index) => (
              <li key={index}>
                <Check size={14} aria-hidden="true" />
                {outcome[locale]}
              </li>
            ))}
          </ul>
        )}
        <div className="course-counts">
          <span>
            {path.sections?.length ?? 1} {text.sections}
          </span>
          <span>
            {total} {text.steps}
          </span>
          <span>
            {available.length} {text.available}
          </span>
        </div>
        <div className="course-progress">
          <progress max={total || 1} value={done} aria-label={text.progress} />
          <span>
            {done} / {total} · {text.progress}
          </span>
        </div>
        {!compact && (
          <div className="course-overview-actions">
            {available[0] && (
              <Link className="button primary" href={available[0].href}>
                {text.start}
                <ArrowRight size={15} />
              </Link>
            )}
            {path.source && (
              <a
                className="text-link"
                href={path.source.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {text.source}: {path.source.title}
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        )}
      </header>
      <div className="course-sections">
        {path.sections?.map((section, index) => {
          const items = section.steps.filter(
            (step) =>
              !query ||
              searchText(`${step.title[locale]} ${section.title[locale]}`).includes(
                searchText(query),
              ),
          )
          if (!items.length) return null
          return (
            <details
              className="course-section"
              key={section.id}
              open={
                !!query ||
                section.steps.some((step) => entryForStep(step, available)?.href === currentHref) ||
                index === 0
              }
            >
              <summary>
                <span className="course-section-number">{String(index + 1).padStart(2, "0")}</span>
                <h3>{section.title[locale]}</h3>
                <span>{items.length}</span>
                <ChevronDown size={16} aria-hidden="true" />
              </summary>
              <ol>
                {items.map((step) => {
                  const entry = entryForStep(step, available),
                    learned = completed.includes(step.id)
                  return (
                    <li
                      key={step.id}
                      id={`step-${step.id}`}
                      className={entry ? "course-step" : "course-step is-planned"}
                    >
                      <button
                        className="course-step-check"
                        type="button"
                        disabled={!entry}
                        aria-pressed={learned}
                        aria-label={`${learned ? text.unmark : text.mark}: ${step.title[locale]}`}
                        onClick={() => toggle(step.id)}
                      >
                        {learned ? <Check size={15} /> : <span />}
                      </button>
                      {entry ? (
                        <Link
                          href={entry.href}
                          aria-current={entry.href === currentHref ? "step" : undefined}
                        >
                          <span>
                            <strong>
                              {step.title[locale]}
                              {entry.encrypted && <LockBadge locale={locale} />}
                            </strong>
                            <small>
                              {entry.href === currentHref
                                ? text.reading
                                : `${entry.readingTime} ${dictionary.minutes}`}
                            </small>
                          </span>
                          <ArrowRight size={15} aria-hidden="true" />
                        </Link>
                      ) : (
                        <span className="course-step-pending">
                          <strong>{step.title[locale]}</strong>
                          <small>{text.planned}</small>
                        </span>
                      )}
                    </li>
                  )
                })}
              </ol>
            </details>
          )
        })}
      </div>
      {query &&
        !path.sections?.some((section) =>
          section.steps.some((step) =>
            searchText(`${step.title[locale]} ${section.title[locale]}`).includes(
              searchText(query),
            ),
          ),
        ) && <p className="course-no-results">{text.pending}</p>}
    </section>
  )
}
export function ReaderPathContext({
  path,
  entries,
  entry,
}: {
  path: LearningPath
  entries: EntryMeta[]
  entry: EntryMeta
}) {
  const { locale } = useSite(),
    text = learningMessages[locale],
    section = path.sections?.find((item) => item.id === entry.learning?.section)
  return (
    <details className="reader-course-context">
      <summary>
        <Route size={19} aria-hidden="true" />
        <span>
          <strong>{path.title[locale]}</strong>
          <small>
            {section?.title[locale]} · {text.viewPath}
          </small>
        </span>
        <ChevronDown size={17} aria-hidden="true" />
      </summary>
      <LearningPathView path={path} entries={entries} compact currentHref={entry.href} />
      <Link className="text-link" href={`/${locale}/paths/${path.slug}/`}>
        <BookOpen size={14} />
        {text.overview}
        <ArrowRight size={14} />
      </Link>
    </details>
  )
}
