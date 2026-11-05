import { ArrowRight } from "lucide-react"
import { copy } from "@/lib/i18n/copy"
import { LockBadge } from "@/components/reading/lock-badge"
import { contentLanguage } from "@/lib/i18n/config"
import Link from "next/link"
import type { EntryMeta } from "@/lib/content/types"
import { dateLabel, type Locale } from "@/lib/i18n/config"
import { messages } from "@/lib/i18n/messages"
import { getTopic } from "@/lib/content/topics"

/** A content-sized article link; the selected variant adds emphasis without changing its structure. */
export function EditorialCard({
  entry,
  locale,
  lead = false,
}: {
  entry: EntryMeta
  locale: Locale
  lead?: boolean
}) {
  const m = messages(locale)
  const shortDate = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(entry.publishedAt))
  return (
    <Link
      className={`writing-entry${lead ? " writing-selected" : ""}`}
      href={entry.href}
      prefetch={entry.encrypted ? false : undefined}
    >
      {!lead && (
        <time
          className="writing-entry-date"
          dateTime={entry.publishedAt}
          aria-label={dateLabel(entry.publishedAt, locale)}
        >
          <span>{shortDate}</span>
          <span>{entry.publishedAt.slice(0, 4)}</span>
        </time>
      )}
      <div className="writing-entry-copy">
        <div className="writing-entry-topic">
          <span>{getTopic(entry.topics[0])?.label[locale] ?? m.knowledge}</span>
          <span>{m[entry.kind]}</span>
          {entry.locale !== locale && (
            <span className="content-language" lang={locale}>
              {contentLanguage(locale, entry.locale)}
            </span>
          )}
        </div>
        <h3>
          {entry.title}
          {entry.encrypted && <LockBadge locale={locale} />}
        </h3>
        <p>{entry.summary}</p>
        <div className="writing-entry-meta">
          <time className="writing-inline-date" dateTime={entry.publishedAt}>
            {dateLabel(entry.publishedAt, locale)}
          </time>
          <span>
            {entry.readingTime} {m.minutes}
          </span>
          <span className="writing-read-link">
            {copy(locale, "Đọc bài", "Read article")}
            <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  )
}
