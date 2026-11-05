import { LockBadge } from "@/components/reading/lock-badge"
import { copy } from "@/lib/i18n/copy"
import { contentLanguage } from "@/lib/i18n/config"
import Link from "next/link"
import { ArrowUpRight, Clock3 } from "lucide-react"
import type { EntryMeta } from "@/lib/content/types"
import type { Locale } from "@/lib/i18n/config"
import { dateLabel } from "@/lib/i18n/config"
import { messages } from "@/lib/i18n/messages"
import { getTopic } from "@/lib/content/topics"
import { TopicIcon } from "./topic-icon"
export function ArticleRow({
  entry,
  locale,
  index,
  compact = false,
}: {
  entry: EntryMeta
  locale: Locale
  index?: number
  compact?: boolean
}) {
  const m = messages(locale),
    topic = getTopic(entry.topics[0])
  return (
    <Link
      href={entry.href}
      prefetch={entry.encrypted ? false : undefined}
      className={`article-row ${compact ? "compact" : ""}`}
    >
      <div className={`article-symbol tone-${topic?.color ?? "teal"}`}>
        {index !== undefined ? (
          <span>{String(index + 1).padStart(2, "0")}</span>
        ) : (
          <TopicIcon id={entry.topics[0]} />
        )}
      </div>
      <div className="article-row-content">
        <div className="article-kicker">
          <span className={`topic-text tone-${topic?.color ?? "teal"}`}>
            {topic?.label[locale] ?? m.knowledge}
          </span>
          <span className="meta-dot">/</span>
          <span>{m[entry.kind]}</span>
          {entry.locale !== locale && (
            <span className="content-language" lang={locale}>
              {contentLanguage(locale, entry.locale)}
            </span>
          )}
          {entry.featured && (
            <span
              className="featured-dot"
              title={copy(locale, "Bài chọn lọc", "Selected article")}
            />
          )}
        </div>
        <h3>
          {entry.title}
          {entry.encrypted && <LockBadge locale={locale} />}
        </h3>
        {!compact && <p>{entry.summary}</p>}
        <div className="article-meta">
          <time dateTime={entry.publishedAt}>{dateLabel(entry.publishedAt, locale)}</time>
          <span>
            <Clock3 size={12} />
            {entry.readingTime} {m.minutes}
          </span>
          <span className="article-level">{m[entry.level]}</span>
        </div>
      </div>
      <ArrowUpRight className="article-row-arrow" size={19} />
    </Link>
  )
}
