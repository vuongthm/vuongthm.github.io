"use client"
import { copy } from "@/lib/i18n/copy"
import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Fuse from "fuse.js"
import { ArrowDownWideNarrow, ArrowRight, BookOpen, Check, Filter, Search, X } from "lucide-react"
import { useSite } from "@/components/providers/site-provider"
import { topics } from "@/lib/content/topics"
import type { EntryMeta, LearningPath } from "@/lib/content/types"
import { localized } from "@/lib/i18n/config"
import { ArticleRow } from "./article-row"
import { PaginatedList } from "@/components/collections/paginated-list"
import { TopicIcon } from "./topic-icon"
import { LearningPathView } from "@/components/learning/learning-path-view"
import { learningMessages } from "@/lib/i18n/learning"
import { filterStudy } from "@/lib/learning/paths"
function subscribeQuery(callback: () => void) {
  window.addEventListener("popstate", callback)
  window.addEventListener("vuong:query-change", callback)
  return () => {
    window.removeEventListener("popstate", callback)
    window.removeEventListener("vuong:query-change", callback)
  }
}
function navigateQuery(url: string) {
  window.history.replaceState(null, "", url)
  window.dispatchEvent(new Event("vuong:query-change"))
}
export function Library({
  entries,
  paths,
  initialTopic,
  initialTag,
}: {
  entries: EntryMeta[]
  paths: LearningPath[]
  initialTopic?: string
  initialTag?: string
}) {
  const { locale, dictionary: m } = useSite(),
    pathname = usePathname()
  const learningText = learningMessages[locale]
  const search = useSyncExternalStore(
    subscribeQuery,
    () => window.location.search,
    () => "",
  )
  const params = useMemo(() => new URLSearchParams(search), [search])
  const [mobileFilters, setMobileFilters] = useState(false)
  useEffect(() => {
    if (!mobileFilters) return
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileFilters(false)
    }
    document.addEventListener("keydown", key)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener("keydown", key)
    }
  }, [mobileFilters])
  const query = params.get("q") ?? "",
    topic = initialTopic ?? params.get("topic") ?? "all",
    kind = params.get("kind") ?? "all",
    level = params.get("level") ?? "all",
    sort = params.get("sort") ?? "learning",
    study = params.get("path") ?? "all"
  const courses = paths.filter((item) => item.sections && (topic === "all" || item.topic === topic))
  const course = courses.find((item) => item.slug === study)
  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (!value || value === "all") next.delete(key)
    else next.set(key, value)
    if (key === "topic") next.delete("path")
    if (key === "path") for (const field of ["kind", "level", "sort"]) next.delete(field)
    navigateQuery(pathname + (next.size ? `?${next}` : ""))
  }
  const fuse = useMemo(
    () =>
      new Fuse(entries, {
        keys: [{ name: "title", weight: 3 }, "summary", "tags", "topics"],
        threshold: 0.35,
        ignoreDiacritics: true,
      }),
    [entries],
  )
  const filtered = useMemo(() => {
    let list = query.trim() ? fuse.search(query).map((result) => result.item) : [...entries]
    list = list.filter(
      (entry) =>
        (topic === "all" || entry.topics.includes(topic)) &&
        (kind === "all" || entry.kind === kind) &&
        (level === "all" || entry.level === level) &&
        (!initialTag || entry.tags.includes(initialTag)),
    )
    if (sort === "newest") list.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    else if (!query)
      list.sort((a, b) => a.weight - b.weight || b.publishedAt.localeCompare(a.publishedAt))
    return filterStudy(list, study, paths)
  }, [entries, fuse, query, topic, kind, level, sort, initialTag, study, paths])
  const path =
    paths.find((item) => item.topic === (topic === "all" ? "networking" : topic)) ?? paths[0]
  const active = topic !== "all" || kind !== "all" || level !== "all" || !!query || study !== "all"
  return (
    <div className={`library-layout${path ? "" : " no-path"}${course ? " course-selected" : ""}`}>
      {!course && (
        <aside
          className={`library-sidebar ${mobileFilters ? "mobile-open" : ""}`}
          aria-label={m.filter}
        >
          <div className="filter-title">
            <span className="eyebrow">{m.filter}</span>
            <button
              className="icon-button mobile-only"
              onClick={() => setMobileFilters(false)}
              aria-label={m.close}
            >
              <X size={17} />
            </button>
          </div>
          {!initialTopic && (
            <div className="filter-group">
              <h2>{m.topics}</h2>
              <button
                className={topic === "all" ? "filter-option active" : "filter-option"}
                aria-pressed={topic === "all"}
                onClick={() => update("topic", "all")}
              >
                <BookOpen size={17} />
                <span>{m.all}</span>
                <small>{entries.length}</small>
              </button>
              {topics.map((item) => {
                const count = entries.filter((entry) => entry.topics.includes(item.id)).length
                return (
                  <button
                    key={item.id}
                    className={`filter-option ${topic === item.id ? "active" : ""}`}
                    aria-pressed={topic === item.id}
                    onClick={() => update("topic", item.id)}
                  >
                    <TopicIcon id={item.id} size={17} />
                    <span>{item.label[locale]}</span>
                    <small>{count}</small>
                  </button>
                )
              })}
            </div>
          )}
          <div className="filter-group">
            <h2>{m.type}</h2>
            {["all", "note", "guide", "lab", "writeup", "reference"].map((value) => (
              <button
                key={value}
                disabled={!!course}
                className={`filter-check ${kind === value ? "active" : ""}`}
                aria-pressed={kind === value}
                onClick={() => update("kind", value)}
              >
                <span className="check-box">{kind === value && <Check size={11} />}</span>
                {value === "all" ? m.all : m[value as "note"]}
              </button>
            ))}
          </div>
          <div className="filter-group">
            <h2>{m.level}</h2>
            <select
              aria-label={m.level}
              disabled={!!course}
              value={level}
              onChange={(event) => update("level", event.target.value)}
            >
              <option value="all">{m.all}</option>
              {["beginner", "intermediate", "advanced"].map((value) => (
                <option value={value} key={value}>
                  {m[value as "beginner"]}
                </option>
              ))}
            </select>
          </div>
          {active && (
            <button
              className="text-link"
              onClick={() => {
                navigateQuery(pathname)
              }}
            >
              <X size={13} />
              {m.reset}
            </button>
          )}
          <button
            className="button primary mobile-only filter-apply"
            onClick={() => setMobileFilters(false)}
          >
            {copy(locale, "Xem", "Show")} {filtered.length} {m.articles}
          </button>
        </aside>
      )}
      <div className="library-main">
        <div className="study-mode">
          <label>
            <span>{learningText.study}</span>
            <select
              value={study}
              aria-label={learningText.study}
              onChange={(event) => update("path", event.target.value)}
            >
              <option value="all">{learningText.all}</option>
              <option value="standalone">{learningText.standalone}</option>
              {courses.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.title[locale]}
                </option>
              ))}
            </select>
          </label>
          {!course &&
            courses.map((item) => (
              <button
                key={item.slug}
                className="study-path-link"
                onClick={() => update("path", item.slug)}
              >
                <BookOpen size={15} />
                <span>{item.title[locale]}</span>
                <ArrowRight size={13} />
              </button>
            ))}
        </div>
        <div className="library-search">
          <Search size={18} />
          <input
            type="search"
            aria-label={m.search}
            placeholder={m.searchHint}
            value={query}
            onChange={(event) => update("q", event.target.value)}
          />
          <kbd>/</kbd>
        </div>
        <div className="library-toolbar">
          <span>
            <strong>{filtered.length}</strong> {m.articles}
            {initialTag && ` · #${initialTag}`}
          </span>
          <div>
            {!course && (
              <button
                className="button small secondary mobile-only"
                onClick={() => setMobileFilters(true)}
              >
                <Filter size={14} />
                {m.filter}
              </button>
            )}
            {course ? (
              <span className="study-order">{learningText.readInOrder}</span>
            ) : (
              <label className="sort-control">
                <ArrowDownWideNarrow size={14} />
                <select
                  disabled={!!course}
                  aria-label={m.sort}
                  value={sort}
                  onChange={(event) => update("sort", event.target.value)}
                >
                  <option value="learning">{m.recommended}</option>
                  <option value="newest">{m.newest}</option>
                </select>
              </label>
            )}
          </div>
        </div>
        {course ? (
          <LearningPathView path={course} entries={entries} query={query} compact />
        ) : filtered.length ? (
          <PaginatedList key={`${pathname}:${search}`} className="article-list">
            {filtered.map((entry) => (
              <ArticleRow entry={entry} locale={locale} key={entry.id} />
            ))}
          </PaginatedList>
        ) : (
          <div className="empty-state">
            <Search size={30} />
            <h2>{m.noResults}</h2>
            <p>{m.trySearch}</p>
            <button className="button secondary" onClick={() => navigateQuery(pathname)}>
              {m.reset}
            </button>
          </div>
        )}
      </div>
      {path && !course && (
        <aside className="library-rail">
          <div className="rail-note">
            <span className="eyebrow">{m.paths}</span>
            <span className="rail-line" />
            <BookOpen size={29} strokeWidth={1.3} />
            <h3>{path.title[locale]}</h3>
            <p>{path.description[locale]}</p>
            <Link className="text-link" href={localized(`/paths/${path.slug}`, locale)}>
              {copy(locale, "Bắt đầu từng bước", "Take the first step")}
              <ArrowRight size={15} />
            </Link>
            <span className="rail-note-bottom">
              {path.entries.length} {m.articles}{" "}
              <span>01 → {String(path.entries.length).padStart(2, "0")}</span>
            </span>
          </div>
        </aside>
      )}
    </div>
  )
}
