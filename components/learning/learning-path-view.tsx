"use client"
import { useId, useRef, useSyncExternalStore } from "react"
import Link from "next/link"
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  ExternalLink,
  Route,
  X,
} from "lucide-react"
import { useSite } from "@/components/providers/site-provider"
import type { EntryMeta, LearningPath } from "@/lib/content/types"
import { learningMessages } from "@/lib/i18n/learning"
import { designMessages } from "@/lib/i18n/design"
import { entryForStep } from "@/lib/learning/paths"
import { learningProgress } from "@/lib/learning/progress"
import { searchText } from "@/lib/collections/search"
import { LockBadge } from "@/components/reading/lock-badge"
import { PathMark } from "./path-mark"
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
  matchingIds,
  onClose,
}: {
  path: LearningPath
  entries: EntryMeta[]
  query?: string
  compact?: boolean
  currentHref?: string
  matchingIds?: string[]
  onClose?: () => void
}) {
  const { locale, dictionary } = useSite(),
    text = learningMessages[locale],
    design = designMessages[locale]
  const key = `vuong:learning:${path.slug}`,
    titleId = useId(),
    syllabus = useRef<HTMLDivElement>(null)
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
  const progress = learningProgress(path, entries, saved),
    available = progress.available.map(({ entry }) => entry)
  const Heading = compact ? "h3" : "h1"
  const discovery =
    path.outcomes?.map((outcome) => outcome[locale]) ??
    path.sections?.slice(0, 4).map((section) => section.title[locale]) ??
    []
  function matches(
    step: { title: Record<typeof locale, string>; entry?: string; translationKey?: string },
    section: string,
  ) {
    if (!query.trim()) return true
    const entry = entryForStep(step, available)
    if (entry && matchingIds) return matchingIds.includes(entry.id)
    return searchText(
      `${step.title[locale]} ${section} ${entry?.title ?? ""} ${entry?.summary ?? ""}`,
    ).includes(searchText(query))
  }
  function toggle(step: string) {
    const next = new Set(progress.completed)
    if (next.has(step)) next.delete(step)
    else next.add(step)
    try {
      localStorage.setItem(key, JSON.stringify([...next]))
      window.dispatchEvent(new Event("vuong:learning-progress"))
    } catch {}
  }
  return (
    <section
      className={`learning-path-view path-overview path-tone-${path.slug}${compact ? " is-compact" : ""}`}
      aria-labelledby={titleId}
    >
      <header className="path-overview-heading">
        <div>
          <span className="eyebrow">{design.overview}</span>
          <Heading id={titleId}>{path.title[locale]}</Heading>
        </div>
        {onClose ? (
          <button
            className="icon-button path-overview-close"
            onClick={onClose}
            aria-label={design.close}
          >
            <X size={21} />
          </button>
        ) : (
          !compact && (
            <Link className="path-back" href={`/${locale}/paths/`}>
              <ArrowUpRight size={16} />
              <span>{design.back}</span>
            </Link>
          )
        )}
      </header>
      <div className="path-overview-layout">
        <aside className="path-sidebar">
          <div className="path-identity">
            <PathMark slug={path.slug} />
            <div className="path-identity-caption">
              <span>{design.notes}</span>
              <strong>{design.notesDetail}</strong>
            </div>
          </div>
          <div className="path-facts">
            <span>
              <strong>{path.sections?.length ?? 0}</strong>
              {design.modules}
            </span>
            <span>
              <strong>{progress.total}</strong>
              {design.lessons}
            </span>
          </div>
          {discovery.length > 0 && (
            <div className="path-discover">
              <h2>{design.discover}</h2>
              <ul>
                {discovery.map((item, index) => (
                  <li key={index}>
                    <Check size={13} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {path.source && (
            <a
              className="path-source"
              href={path.source.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {text.source}
              <span>
                {path.source.title}
                <ExternalLink size={12} />
              </span>
            </a>
          )}
          <span className="path-signature" aria-hidden="true">
            vuong<span>.</span>
          </span>
        </aside>
        <div className="path-syllabus" ref={syllabus}>
          <div className="path-introduction">
            <span className="eyebrow">{design.introduction}</span>
            <h2>{text.readInOrder}</h2>
            <p>{path.description[locale]}</p>
          </div>
          <div className="course-sections">
            {path.sections?.map((section, index) => {
              const items = section.steps.filter((step) => matches(step, section.title[locale]))
              if (!items.length) return null
              return (
                <details
                  className="course-section"
                  key={section.id}
                  open={
                    !compact ||
                    !!query ||
                    index === 0 ||
                    section.steps.some(
                      (step) => entryForStep(step, available)?.href === currentHref,
                    )
                  }
                >
                  <summary>
                    <span className="course-section-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <span className="course-module-label">
                        {design.module} {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3>{section.title[locale]}</h3>
                    </div>
                    <span className="course-module-count">{items.length}</span>
                    <ChevronDown size={15} />
                  </summary>
                  <ol>
                    {items.map((step, position) => {
                      const entry = entryForStep(step, available),
                        learned = progress.completed.has(step.id)
                      return (
                        <li
                          key={step.id}
                          id={`${onClose || compact ? titleId + "-" : ""}step-${step.id}`}
                          className={`course-step${entry ? "" : " is-planned"}`}
                        >
                          <span className="course-step-symbol" aria-hidden="true">
                            <BookOpen size={17} strokeWidth={1.5} />
                            <small>{String(position + 1).padStart(2, "0")}</small>
                          </span>
                          {entry ? (
                            <Link
                              href={entry.href}
                              onClick={onClose}
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
                              <ArrowUpRight size={16} />
                            </Link>
                          ) : (
                            <span className="course-step-pending">
                              <strong>{step.title[locale]}</strong>
                            </span>
                          )}
                          {entry ? (
                            <button
                              className="course-step-check"
                              aria-pressed={learned}
                              aria-label={`${learned ? text.unmark : text.mark}: ${step.title[locale]}`}
                              onClick={() => toggle(step.id)}
                            >
                              {learned ? <Check size={15} /> : <span />}
                            </button>
                          ) : (
                            <span className="course-step-state">{design.draft}</span>
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
              section.steps.some((step) => matches(step, section.title[locale])),
            ) && <p className="course-no-results">{dictionary.noResults}</p>}
        </div>
      </div>
      {!compact && (
        <footer className="path-actionbar">
          <div className="path-progress">
            <span>
              {design.progress}
              <strong>
                {progress.done} / {progress.total}
              </strong>
            </span>
            <progress max={progress.total || 1} value={progress.done} aria-label={text.progress} />
          </div>
          <div className="path-actionbar-links">
            {onClose && (
              <Link
                className="path-open-page"
                href={`/${locale}/paths/${path.slug}/`}
                data-path-preview-skip
                onClick={onClose}
              >
                {design.openPage}
                <ArrowUpRight size={13} />
              </Link>
            )}
            {progress.next ? (
              <Link className="button primary" href={progress.next.entry.href} onClick={onClose}>
                {progress.done ? design.resume : text.start}
                <ArrowRight size={16} />
              </Link>
            ) : (
              <button
                className="button primary"
                onClick={() =>
                  syllabus.current?.scrollIntoView({
                    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
                      ? "auto"
                      : "smooth",
                    block: "start",
                  })
                }
              >
                {design.explore}
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </footer>
      )}
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
