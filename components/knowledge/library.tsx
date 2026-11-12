"use client"

import { useMemo, useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight, LockKeyhole, X } from "lucide-react"
import { useSite } from "@/components/providers/site-provider"
import { topics } from "@/lib/content/topics"
import type { EntryMeta, LearningPath } from "@/lib/content/types"
import { PaginatedList } from "@/components/collections/paginated-list"
import { PathCards } from "@/components/learning/path-cards"
import { filterStudy } from "@/lib/learning/paths"
import { libraryMessages } from "@/lib/i18n/library"
import { knowledgeMessages } from "@/lib/i18n/knowledge"
import { noteModuleKey, orderNotes } from "@/lib/content/library"
import { noteSearch } from "@/lib/content/note-search"
import { NoteListItem } from "./note-list-item"
import { ExpandingSearch } from "./expanding-search"
import { ReadingRail } from "./reading-rail"

function subscribeQuery(callback: () => void) {
  window.addEventListener("popstate", callback)
  window.addEventListener("vuong:query-change", callback)
  return () => {
    window.removeEventListener("popstate", callback)
    window.removeEventListener("vuong:query-change", callback)
  }
}
function navigateQuery(url: string) {
  window.history.replaceState(window.history.state, "", url)
  window.dispatchEvent(new Event("vuong:query-change"))
}

export function Library({
  entries,
  learningEntries = entries,
  paths,
  initialTopic,
  initialTag,
}: {
  entries: EntryMeta[]
  learningEntries?: EntryMeta[]
  paths: LearningPath[]
  initialTopic?: string
  initialTag?: string
}) {
  const { locale, dictionary: m } = useSite()
  const pathname = usePathname()
  const t = libraryMessages[locale],
    k = knowledgeMessages[locale]
  const search = useSyncExternalStore(
    subscribeQuery,
    () => window.location.search,
    () => "",
  )
  const params = useMemo(() => new URLSearchParams(search), [search])
  const query = params.get("q") ?? ""
  const topic = initialTopic ?? params.get("topic") ?? "all"
  const kind = params.get("kind") ?? "all",
    level = params.get("level") ?? "all"
  const study = params.get("path") ?? "all",
    selectedModule = params.get("module") ?? "all"
  const sort = params.get("sort") ?? "newest"
  const courses = paths.filter(
    (path) => topic === "all" || path.topic === topic || path.topics?.includes(topic),
  )
  const selectedPath = courses.find((path) => path.slug === study)
  const readingEntries = selectedPath ? learningEntries : entries
  const fuse = useMemo(() => noteSearch(readingEntries, locale), [readingEntries, locale])
  const filtered = useMemo(() => {
    let list = query.trim() ? fuse.search(query).map(({ item }) => item) : [...readingEntries]
    list = list.filter(
      (entry) =>
        (selectedPath || topic === "all" || entry.topics.includes(topic)) &&
        (selectedModule === "all" || noteModuleKey(entry) === selectedModule) &&
        (kind === "all" || entry.kind === kind) &&
        (level === "all" || entry.level === level) &&
        (!initialTag || entry.tags.includes(initialTag)),
    )
    if (!query.trim()) {
      if (sort === "learning")
        list = orderNotes(
          list,
          topics.map((item) => item.id),
        )
      else list.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    }
    return filterStudy(list, study, paths)
  }, [
    readingEntries,
    fuse,
    query,
    topic,
    kind,
    level,
    selectedModule,
    selectedPath,
    initialTag,
    sort,
    study,
    paths,
  ])
  const filterCount = [kind, level, study, selectedModule].filter((value) => value !== "all").length
  const active = filterCount > 0 || (!initialTopic && topic !== "all") || sort !== "newest"
  function update(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (!value || value === "all" || (key === "sort" && value === "newest")) next.delete(key)
    else next.set(key, value)
    if (key === "topic") for (const field of ["path", "module"]) next.delete(field)
    if (key === "path") next.delete("module")
    if (key === "module") next.delete("path")
    navigateQuery(pathname + (next.size ? `?${next}` : ""))
  }
  const topicCounts = new Map(
    topics.map((item) => [
      item.id,
      entries.filter(
        (entry) =>
          entry.topics.includes(item.id) && (!initialTag || entry.tags.includes(initialTag)),
      ).length,
    ]),
  )
  return (
    <div
      className={`notes-index${initialTopic ? " is-subject" : ""}${!initialTag ? " has-reading-rail" : ""}`}
    >
      {!initialTopic && (
        <aside className="notes-index-sidebar">
          <h2>{t.subjects}</h2>
          <nav aria-label={k.subjectMenu}>
            <button aria-pressed={topic === "all"} onClick={() => update("topic", "all")}>
              <span>{k.viewArticles}</span>
              <small>
                {entries.filter((entry) => !initialTag || entry.tags.includes(initialTag)).length}
              </small>
            </button>
            {topics.map((item) => (
              <button
                key={item.id}
                aria-pressed={topic === item.id}
                disabled={item.available === false}
                onClick={() => update("topic", item.id)}
              >
                <span>{item.label[locale]}</span>
                {item.available === false ? (
                  <LockKeyhole size={12} aria-hidden="true" />
                ) : (
                  <small>{topicCounts.get(item.id) || ""}</small>
                )}
              </button>
            ))}
          </nav>
          <Link className="notes-all-subjects" href={`/${locale}/topics/`}>
            {k.viewSubject}
            <ArrowRight size={14} />
          </Link>
        </aside>
      )}
      <div className="notes-index-main">
        <div className="notes-index-tools">
          <span className="notes-result-count" role="status" aria-live="polite">
            <strong>{filtered.length}</strong> {m.articles}
            {initialTag && ` · #${initialTag}`}
          </span>
          <ExpandingSearch
            value={query}
            onChange={(value) => update("q", value)}
            label={k.search}
            clearLabel={k.clearSearch}
          />
        </div>
        {active && (
          <div className="notes-active-context">
            <span>
              {initialTopic || topic === "all"
                ? k.viewArticles
                : topics.find((item) => item.id === topic)?.label[locale]}
            </span>
            <button onClick={() => navigateQuery(pathname)}>
              <X size={12} />
              {k.resetView}
            </button>
          </div>
        )}
        {selectedPath && (
          <div className="notes-selected-path">
            <PathCards paths={[selectedPath]} locale={locale} compact />
          </div>
        )}
        {filtered.length ? (
          <PaginatedList key={`${pathname}:${search}`} className="notes-article-list" pageSize={5}>
            {filtered.map((entry) => (
              <NoteListItem key={entry.id} entry={entry} locale={locale} />
            ))}
          </PaginatedList>
        ) : (
          <div className="notes-index-empty">
            <h2>{k.noResults}</h2>
            <p>{query || filterCount ? k.tryAgain : k.noArticles}</p>
            {!query && courses.length > 0 && !selectedPath && (
              <div className="notes-related-paths">
                <PathCards paths={courses} locale={locale} compact />
              </div>
            )}
          </div>
        )}
      </div>
      {!initialTag && <ReadingRail paths={courses} entries={learningEntries} />}
    </div>
  )
}
