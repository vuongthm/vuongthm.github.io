"use client"
import Link from "next/link"
import { ArrowRight, Bookmark } from "lucide-react"
import { useSyncExternalStore } from "react"
import { useSite } from "@/components/providers/site-provider"
import type { EntryMeta, LearningPath } from "@/lib/content/types"
import { useBookmarks } from "@/lib/bookmarks"
import { learningProgress } from "@/lib/learning/progress"
import { knowledgeMessages } from "@/lib/i18n/knowledge"
import { designMessages } from "@/lib/i18n/design"

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback)
  window.addEventListener("vuong:learning-progress", callback)
  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener("vuong:learning-progress", callback)
  }
}
function RailPath({ path, entries }: { path: LearningPath; entries: EntryMeta[] }) {
  const { locale } = useSite(),
    k = knowledgeMessages[locale],
    d = designMessages[locale]
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(`vuong:learning:${path.slug}`) ?? "[]"
      } catch {
        return "[]"
      }
    },
    () => "[]",
  )
  const progress = learningProgress(path, entries, raw)
  return (
    <div className="reading-rail-path">
      <Link href={`/${locale}/paths/${path.slug}/`}>
        <span>{path.title[locale]}</span>
        <ArrowRight size={13} />
      </Link>
      <small>
        {path.sections?.length ?? 0} {d.modules} <span>·</span> {progress.total} {d.lessons}
      </small>
      {progress.done > 0 && (
        <>
          <progress
            value={progress.done}
            max={progress.total}
            aria-label={`${path.title[locale]}: ${progress.done}/${progress.total}`}
          />
          {progress.next && (
            <Link className="reading-rail-resume" href={progress.next.entry.href}>
              {k.continueReading}
              <ArrowRight size={12} />
            </Link>
          )}
        </>
      )}
    </div>
  )
}
export function ReadingRail({ paths, entries }: { paths: LearningPath[]; entries: EntryMeta[] }) {
  const { locale, dictionary: m } = useSite(),
    k = knowledgeMessages[locale],
    d = designMessages[locale]
  const saved = useBookmarks().filter((entry) => entry.locale === locale)
  return (
    <aside className="notes-reading-rail" aria-label={k.continueReading}>
      {paths.length > 0 && (
        <section>
          <h2>{d.paths}</h2>
          {paths.slice(0, 3).map((path) => (
            <RailPath key={path.slug} path={path} entries={entries} />
          ))}
        </section>
      )}
      <section className="reading-rail-saved">
        <h2>
          <Bookmark size={14} />
          {m.saved}
        </h2>
        {saved.length ? (
          saved.slice(0, 3).map((entry) => (
            <Link key={entry.href} href={entry.href} className="reading-rail-bookmark">
              {entry.title}
            </Link>
          ))
        ) : (
          <p>{k.savedHint}</p>
        )}
        <Link className="reading-rail-all" href={`/${locale}/saved/`}>
          {k.readingList}
          <ArrowRight size={13} />
        </Link>
      </section>
    </aside>
  )
}
