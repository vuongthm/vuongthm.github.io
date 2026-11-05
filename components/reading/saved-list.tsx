"use client"
import { copy } from "@/lib/i18n/copy"
import Link from "next/link"
import { ArrowRight, Bookmark, Trash2 } from "lucide-react"
import { useBookmarks, toggleBookmark } from "@/lib/bookmarks"
import { useSite } from "@/components/providers/site-provider"
import { localized, dateLabel } from "@/lib/i18n/config"
export function SavedList() {
  const { locale, dictionary: m } = useSite(),
    entries = useBookmarks().filter((entry) => entry.locale === locale)
  return entries.length ? (
    <div className="saved-list">
      {entries.map((entry) => (
        <div className="saved-row" key={entry.href}>
          <Bookmark size={17} />
          <Link href={entry.href}>
            <h2>{entry.title}</h2>
            <small>{dateLabel(new Date(entry.at).toISOString(), locale)}</small>
          </Link>
          <button
            className="icon-button"
            aria-label={`${m.unsave}: ${entry.title}`}
            onClick={() => toggleBookmark(entry)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  ) : (
    <div className="empty-state">
      <Bookmark size={32} strokeWidth={1.3} />
      <h2>{copy(locale, "Để dành một điều hay cho lần sau.", "Keep a good read for later.")}</h2>
      <p>
        {copy(
          locale,
          "Khi đọc một bài viết, bấm “Lưu bài” để thêm vào đây. Danh sách này chỉ nằm trong trình duyệt của bạn.",
          "Use “Save article” while reading to add it here. Your list stays in this browser.",
        )}
      </p>
      <Link className="button primary" href={localized("/notes", locale)}>
        {m.explore}
        <ArrowRight size={15} />
      </Link>
    </div>
  )
}
