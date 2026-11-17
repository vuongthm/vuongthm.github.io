"use client"
import { contentLockMessages } from "@/lib/i18n/content-lock"
import { UnlockContext } from "./unlock-context"
import { copy } from "@/lib/i18n/copy"
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import profile from "@/site/profile.json"
import {
  ArrowLeft,
  ArrowRight,
  CornerDownLeft,
  ChevronDown,
  Bookmark,
  BookmarkCheck,
  Check,
  Focus,
  Minus,
  Plus,
  Printer,
  Share2,
  Sparkles,
} from "lucide-react"
import { ReadingProgress } from "./reading-progress"
import { useReaderNavigation } from "@/lib/hooks/use-reader-navigation"
import { useSite } from "@/components/providers/site-provider"
import { dateLabel, localized, type Locale } from "@/lib/i18n/config"
import { getTopic } from "@/lib/content/topics"
import type { EntryMeta, LearningPath } from "@/lib/content/types"
import { ReaderPathContext } from "@/components/learning/learning-path-view"
import type { Heading } from "@/lib/content/markdown"
import { toggleBookmark, useBookmarks } from "@/lib/bookmarks"
import { libraryMessages } from "@/lib/i18n/library"
const EMPTY_HEADINGS: Heading[] = []
export function ReaderFrame({
  entry,
  headings: initialHeadings,
  body,
  translations,
  previous,
  next,
  children,
  course,
  courseEntries,
}: {
  entry: EntryMeta
  headings: Heading[]
  body?: string
  translations: { locale: Locale; href: string }[]
  previous?: EntryMeta
  next?: EntryMeta
  children: ReactNode
  course?: LearningPath
  courseEntries?: EntryMeta[]
}) {
  const { locale, dictionary: m, openAssistant } = useSite(),
    bookmarks = useBookmarks(),
    saved = bookmarks.some((item) => item.href === entry.href)
  const [unlocked, setUnlocked] = useState<{ href: string; headings: Heading[] } | null>(null)
  const headings = entry.encrypted
    ? unlocked?.href === entry.href
      ? unlocked.headings
      : EMPTY_HEADINGS
    : initialHeadings
  const updateUnlockedHeadings = useCallback(
    (value: Heading[]) => setUnlocked({ href: entry.href, headings: value }),
    [entry.href],
  )
  const [size, setSize] = useState(15),
    [focus, setFocus] = useState(false),
    [tocOpen, setTocOpen] = useState(false),
    [shared, setShared] = useState(false)
  const articleRef = useRef<HTMLElement>(null),
    progressRef = useRef<HTMLDivElement>(null)
  const focusOpener = useRef<HTMLButtonElement>(null),
    focusExit = useRef<HTMLButtonElement>(null)
  const hadFocus = useRef(false)
  const mobileTocRef = useRef<HTMLElement>(null)
  const mobileTocButton = useRef<HTMLButtonElement>(null)
  const { active, navigate } = useReaderNavigation(headings, articleRef, progressRef)
  const activeHeading = headings.find((heading) => heading.id === active)
  const progressRing = (
    <ReadingProgress
      label={
        { vi: "Tiến độ đọc", en: "Reading progress", ja: "読書の進捗", zh: "阅读进度" }[locale]
      }
    />
  )

  useEffect(() => {
    document.documentElement.toggleAttribute("data-reading-focus", focus)
    const frame = requestAnimationFrame(() => {
      if (focus) {
        hadFocus.current = true
        focusExit.current?.focus({ preventScroll: true })
      } else if (hadFocus.current) {
        hadFocus.current = false
        focusOpener.current?.focus({ preventScroll: true })
      }
    })
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFocus(false)
    }
    document.addEventListener("keydown", key)
    return () => {
      document.documentElement.removeAttribute("data-reading-focus")
      cancelAnimationFrame(frame)
      document.removeEventListener("keydown", key)
    }
  }, [focus])
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: entry.title, url: location.href })
      else {
        await navigator.clipboard.writeText(location.href)
        setShared(true)
        setTimeout(() => setShared(false), 1800)
      }
    } catch {
      /* A dismissed native share sheet requires no error UI. */
    }
  }
  useEffect(() => {
    const viewport = matchMedia("(max-width: 760px)")
    const close = () => {
      if (!viewport.matches) setTocOpen(false)
    }
    viewport.addEventListener("change", close)
    return () => viewport.removeEventListener("change", close)
  }, [])
  useEffect(() => {
    if (!tocOpen) return
    const frame = requestAnimationFrame(() => {
      const list = mobileTocRef.current?.querySelector<HTMLElement>(".reader-toc-content")
      const current = list?.querySelector<HTMLElement>("[aria-current=location]")
      if (list && current)
        list.scrollTop +=
          current.getBoundingClientRect().top - list.getBoundingClientRect().top - 76
    })
    const outside = (event: PointerEvent) => {
      if (!mobileTocRef.current?.contains(event.target as Node)) setTocOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setTocOpen(false)
      mobileTocButton.current?.focus({ preventScroll: true })
    }
    document.addEventListener("pointerdown", outside)
    document.addEventListener("keydown", escape)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener("pointerdown", outside)
      document.removeEventListener("keydown", escape)
    }
  }, [tocOpen])
  function tocClick(id: string) {
    setTocOpen(false)
    navigate(id)
  }
  const toc = (
    <ol className="toc-list">
      {headings.map((item) => (
        <li key={item.id} className={item.level > 2 ? "toc-nested" : ""}>
          <a
            href={`#${item.id}`}
            data-ui-sound="select"
            aria-current={active === item.id ? "location" : undefined}
            className={active === item.id ? "active" : ""}
            onClick={(event) => {
              event.preventDefault()
              tocClick(item.id)
            }}
          >
            {item.text}
          </a>
        </li>
      ))}
    </ol>
  )
  return (
    <div className="reader-surface" ref={progressRef}>
      {headings.length > 0 && (
        <nav
          className="reader-mobile-toc"
          ref={mobileTocRef}
          aria-label={m.toc}
          data-reading-chrome
        >
          <div className="wrap">
            <button
              className="reader-toc-toggle"
              ref={mobileTocButton}
              aria-label={`${m.toc}: ${activeHeading?.text ?? ""}`}
              aria-expanded={tocOpen}
              aria-controls="reader-toc-panel"
              onClick={() => setTocOpen((value) => !value)}
            >
              {progressRing}
              <span className="reader-toc-current">{activeHeading?.text ?? m.toc}</span>
              <ChevronDown size={15} aria-hidden="true" />
            </button>
          </div>
          <div
            className="reader-toc-dropdown"
            data-open={tocOpen}
            aria-hidden={!tocOpen}
            inert={!tocOpen}
          >
            <div className="reader-toc-clip">
              <div id="reader-toc-panel" className="reader-toc-content wrap">
                {toc}
              </div>
            </div>
          </div>
        </nav>
      )}
      <div className="wrap">
        <div className="reader-breadcrumb" data-reading-chrome>
          <Link href={`/${locale}/`}>{m.home}</Link>
          <span>/</span>
          <Link href={localized(entry.seriesSlug ? "/stories" : "/notes", locale)}>
            {entry.seriesSlug ? m.stories : m.knowledge}
          </Link>
          <span>/</span>
          <span>{entry.title}</span>
        </div>
        <div className="reader-grid">
          <aside className="reader-sidebar" data-reading-chrome>
            <span className="eyebrow">
              {progressRing}
              {m.toc}
            </span>
            {headings.length > 0 ? (
              toc
            ) : entry.encrypted ? (
              <p className="reader-locked-note">{contentLockMessages[locale].toc}</p>
            ) : null}
          </aside>
          <article
            className="reader-article"
            ref={articleRef}
            style={{ "--reading-size": `${size}px` } as React.CSSProperties}
          >
            {course && courseEntries && (
              <ReaderPathContext path={course} entries={courseEntries} entry={entry} />
            )}
            <header className="article-header">
              <div className="eyebrow">
                {entry.seriesSlug
                  ? `${m.stories} / ${String(entry.part ?? 1).padStart(2, "0")}`
                  : `${getTopic(entry.topics[0])?.label[locale] ?? m.knowledge} / ${m[entry.kind]}`}
              </div>
              <h1>{entry.title}</h1>
              {entry.summary && <p>{entry.summary}</p>}
              <div className="article-author">
                <span className="author-avatar">
                  <Image src={profile.portrait} alt="" width={29} height={29} unoptimized />
                </span>
                <strong>Vuong</strong>
                <span className="meta-separator">/</span>
                <time dateTime={entry.publishedAt}>{dateLabel(entry.publishedAt, locale)}</time>
                <span className="meta-separator">·</span>
                <span>
                  {entry.readingTime} {m.minutes}
                </span>
                {!entry.seriesSlug && (
                  <>
                    <span className="meta-separator">·</span>
                    <span>{m[entry.level]}</span>
                  </>
                )}
              </div>
              <div className="article-actions" data-reading-chrome>
                <button
                  className={saved ? "active" : ""}
                  aria-pressed={saved}
                  data-ui-sound="switch"
                  onClick={() => toggleBookmark({ href: entry.href, title: entry.title, locale })}
                >
                  {saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}{" "}
                  {saved ? m.unsave : m.save}
                </button>
                <button onClick={share}>
                  {shared ? <Check size={13} /> : <Share2 size={13} />}{" "}
                  {shared ? m.copied : m.share}
                </button>
                {body && !entry.encrypted && (
                  <button
                    onClick={() => openAssistant({ title: entry.title, body, href: entry.href })}
                  >
                    <Sparkles size={13} />
                    {m.summary}
                  </button>
                )}
                <button
                  className="print-action"
                  aria-label={m.print}
                  title={m.print}
                  onClick={() => window.print()}
                >
                  <Printer size={13} />
                </button>
                <div className="reading-size" role="group" aria-label={m.textSize}>
                  <button
                    aria-label={copy(locale, "Giảm cỡ chữ", "Smaller text")}
                    disabled={size <= 12}
                    onClick={() => setSize((value) => Math.max(12, value - 1))}
                  >
                    <Minus size={12} />
                  </button>
                  <button
                    className="reading-size-reset"
                    onClick={() => setSize(15)}
                    aria-label={`${m.textSize}: ${size}px. ${copy(locale, "Đặt lại cỡ chữ", "Reset text size")}`}
                    title={copy(locale, "Đặt lại cỡ chữ", "Reset text size")}
                  >
                    {size}
                  </button>
                  <button
                    aria-label={copy(locale, "Tăng cỡ chữ", "Larger text")}
                    disabled={size >= 18}
                    onClick={() => setSize((value) => Math.min(18, value + 1))}
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    ref={focusOpener}
                    onClick={() => setFocus(true)}
                    aria-label={m.focus}
                    title={m.focus}
                  >
                    <Focus size={14} />
                  </button>
                </div>
              </div>
            </header>
            <UnlockContext.Provider value={updateUnlockedHeadings}>
              {children}
            </UnlockContext.Provider>
            <div className="article-end">
              <div className="article-tags">
                {entry.tags.map((tag) => (
                  <Link key={tag} href={localized(`/tags/${encodeURIComponent(tag)}`, locale)}>
                    #{tag}
                  </Link>
                ))}
              </div>
              {course && (
                <div className="reader-bottom-nav">
                  {previous ? (
                    <Link href={previous.href}>
                      <small>
                        <ArrowLeft size={12} />
                        {m.previous}
                      </small>
                      <strong>{previous.title}</strong>
                    </Link>
                  ) : (
                    <Link href={localized(`/paths/${course.slug}`, locale)}>
                      <small>
                        <ArrowLeft size={12} />
                        {m.back}
                      </small>
                      <strong>{course.title[locale]}</strong>
                    </Link>
                  )}
                  {next && (
                    <Link href={next.href}>
                      <small>
                        {m.next}
                        <ArrowRight size={12} />
                      </small>
                      <strong>{next.title}</strong>
                    </Link>
                  )}
                </div>
              )}
            </div>
            <div className="translation-links">
              {translations.map((item) => (
                <Link key={item.locale} href={item.href} data-translation={item.locale}>
                  {item.locale}
                </Link>
              ))}
            </div>
          </article>
        </div>
      </div>
      {focus && (
        <button
          className="focus-exit"
          ref={focusExit}
          onClick={() => setFocus(false)}
          aria-label={m.exitFocus}
          title={libraryMessages[locale].focusHint}
        >
          <span className="focus-exit-icon">
            <CornerDownLeft size={17} strokeWidth={1.5} />
          </span>
          <span>{libraryMessages[locale].focusBack}</span>
          <kbd>esc</kbd>
        </button>
      )}
    </div>
  )
}
