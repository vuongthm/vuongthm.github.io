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
  Bookmark,
  BookmarkCheck,
  Check,
  Focus,
  List,
  Minus,
  Plus,
  Printer,
  Share2,
  Sparkles,
  X,
} from "lucide-react"
import { Dialog } from "@/components/search/dialog"
import { useSite } from "@/components/providers/site-provider"
import { dateLabel, localized, type Locale } from "@/lib/i18n/config"
import { getTopic } from "@/lib/content/topics"
import type { EntryMeta, LearningPath } from "@/lib/content/types"
import { ReaderPathContext } from "@/components/learning/learning-path-view"
import type { Heading } from "@/lib/content/markdown"
import { toggleBookmark, useBookmarks } from "@/lib/bookmarks"
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
  const [active, setActive] = useState(headings[0]?.id ?? ""),
    [size, setSize] = useState(15),
    [focus, setFocus] = useState(false),
    [tocOpen, setTocOpen] = useState(false),
    [shared, setShared] = useState(false)
  const articleRef = useRef<HTMLElement>(null),
    progressRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const tick = () => {
      const article = articleRef.current
      if (!article) return
      const rect = article.getBoundingClientRect(),
        distance = Math.max(1, article.offsetHeight - window.innerHeight + 140),
        value = Math.max(0, Math.min(1, (140 - rect.top) / distance))
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${value})`
      let current = headings[0]?.id ?? ""
      for (const heading of headings) {
        if ((document.getElementById(heading.id)?.getBoundingClientRect().top ?? Infinity) <= 145)
          current = heading.id
      }
      setActive(current)
    }
    tick()
    window.addEventListener("scroll", tick, { passive: true })
    window.addEventListener("resize", tick)
    return () => {
      window.removeEventListener("scroll", tick)
      window.removeEventListener("resize", tick)
    }
  }, [headings])

  useEffect(() => {
    document.documentElement.toggleAttribute("data-reading-focus", focus)
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFocus(false)
    }
    document.addEventListener("keydown", key)
    return () => {
      document.documentElement.removeAttribute("data-reading-focus")
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
  function tocClick(id: string) {
    setActive(id)
    setTocOpen(false)
    requestAnimationFrame(() => {
      const target = document.getElementById(id)
      target?.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      })
      target?.setAttribute("tabindex", "-1")
      target?.focus({ preventScroll: true })
      history.replaceState(null, "", `#${id}`)
    })
  }
  const toc = (
    <ol className="toc-list">
      {headings.map((item) => (
        <li key={item.id} className={item.level > 2 ? "toc-nested" : ""}>
          <a
            href={`#${item.id}`}
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
    <>
      <div
        className="reading-progress"
        ref={progressRef}
        style={{ transform: "scaleX(0)" }}
        aria-hidden="true"
      />
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
              <List size={12} />
              {m.toc}
            </span>
            {headings.length > 0 ? (
              toc
            ) : entry.encrypted ? (
              <p className="reader-locked-note">{contentLockMessages[locale].toc}</p>
            ) : null}
            <div className="reader-aside-note">
              <p>
                {copy(
                  locale,
                  "Ghi chép của một người đang học. Hãy đối chiếu nguồn và thử nghiệm trong môi trường của bạn.",
                  "Notes from someone still learning. Check the sources and test in your own environment.",
                )}
              </p>
            </div>
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
                  <button onClick={() => setFocus(true)} aria-label={m.focus} title={m.focus}>
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
                  <Link
                    href={localized(
                      course
                        ? `/paths/${course.slug}`
                        : entry.seriesSlug
                          ? `/stories/${entry.seriesSlug}`
                          : "/notes",
                      locale,
                    )}
                  >
                    <small>
                      <ArrowLeft size={12} />
                      {m.back}
                    </small>
                    <strong>{entry.seriesSlug ? m.stories : m.knowledge}</strong>
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
      <div className="reader-mobile-tools" data-reading-chrome>
        {headings.length > 0 && (
          <button
            className={tocOpen ? "active" : ""}
            onClick={() => setTocOpen(true)}
            aria-label={m.toc}
            aria-expanded={tocOpen}
            aria-controls="reader-toc-panel"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 4.5h5.5c1.2 0 2.1.4 2.5 1.1.4-.7 1.3-1.1 2.5-1.1H20v15h-5.5c-1.2 0-2.1.4-2.5 1.1-.4-.7-1.3-1.1-2.5-1.1H4zM12 5.6v15M7 9h2M7 12h2M15 9h2M15 12h2" />
            </svg>
          </button>
        )}
      </div>
      {tocOpen && (
        <Dialog label={m.toc} onClose={() => setTocOpen(false)} className="reader-toc-sheet">
          <div className="reader-sheet-heading">
            <h2>{m.toc}</h2>
            <button className="icon-button" aria-label={m.close} onClick={() => setTocOpen(false)}>
              <X size={17} />
            </button>
          </div>
          <div id="reader-toc-panel" className="reader-sheet-content">
            {toc}
          </div>
        </Dialog>
      )}
      {focus && (
        <button className="button primary focus-exit" onClick={() => setFocus(false)}>
          <X size={14} />
          {m.exitFocus} <kbd>Esc</kbd>
        </button>
      )}
    </>
  )
}
