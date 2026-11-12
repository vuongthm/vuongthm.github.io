import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import type { EntryMeta } from "@/lib/content/types"
import { contentLanguage, dateLabel, type Locale } from "@/lib/i18n/config"
import { messages } from "@/lib/i18n/messages"
import { getTopic } from "@/lib/content/topics"
import { LockBadge } from "@/components/reading/lock-badge"

export function NoteListItem({ entry, locale }: { entry: EntryMeta; locale: Locale }) {
  const m = messages(locale)
  const subject = getTopic(entry.topics.find((id) => id !== "security") ?? entry.topics[0])
  return (
    <article className="note-item">
      <div className="note-item-meta">
        <span className="note-item-subject">{subject?.label[locale] ?? m.knowledge}</span>
        <span aria-hidden="true">·</span>
        <span>{m[entry.kind]}</span>
        {entry.locale !== locale && (
          <span className="content-language">{contentLanguage(locale, entry.locale)}</span>
        )}
      </div>
      <h2>
        <Link href={entry.href} prefetch={entry.encrypted ? false : undefined}>
          {entry.title}
          {entry.encrypted && <LockBadge locale={locale} />}
          <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </h2>
      <p>{entry.summary}</p>
      <time dateTime={entry.publishedAt}>{dateLabel(entry.publishedAt, locale)}</time>
    </article>
  )
}
