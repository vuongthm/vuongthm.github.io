"use client"
import { useState } from "react"
import Link from "next/link"
import { ArrowDownUp, ArrowRight, Search, X } from "lucide-react"
import { LockBadge } from "@/components/reading/lock-badge"
import { dateLabel, type Locale } from "@/lib/i18n/config"
import { copy } from "@/lib/i18n/copy"
import { searchText } from "@/lib/collections/search"
import type { EntryMeta } from "@/lib/content/types"

export function ChapterList({ chapters, locale }: { chapters: EntryMeta[]; locale: Locale }) {
  const [query, setQuery] = useState(""),
    [reverse, setReverse] = useState(false)
  const text = {
    vi: {
      search: "Tìm chương…",
      clear: "Xóa tìm kiếm",
      order: "Đảo thứ tự chương",
      empty: "Không tìm thấy chương phù hợp.",
      list: "Danh sách chương",
    },
    en: {
      search: "Find a chapter…",
      clear: "Clear search",
      order: "Reverse chapter order",
      empty: "No matching chapters.",
      list: "Chapters",
    },
    ja: {
      search: "章を検索…",
      clear: "検索をクリア",
      order: "章の順番を逆にする",
      empty: "該当する章はありません。",
      list: "章一覧",
    },
    zh: {
      search: "搜索章节…",
      clear: "清空搜索",
      order: "反转章节顺序",
      empty: "没有匹配的章节。",
      list: "章节列表",
    },
  }[locale]
  const filtered = chapters.filter((chapter) =>
    searchText(`${chapter.part} ${chapter.title} ${chapter.summary}`).includes(searchText(query)),
  )
  if (reverse) filtered.reverse()
  return (
    <div className="chapter-browser">
      <div className="chapter-tools">
        <label className="chapter-search">
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={text.search}
            aria-label={text.search}
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label={text.clear}>
              <X size={14} />
            </button>
          )}
        </label>
        <button
          className="chapter-order"
          onClick={() => setReverse((value) => !value)}
          aria-pressed={reverse}
          aria-label={text.order}
          title={text.order}
        >
          <ArrowDownUp size={16} />
        </button>
        <span className="chapter-count" aria-live="polite">
          {filtered.length} / {chapters.length}
        </span>
      </div>
      <div className="chapter-scroll" role="region" aria-label={text.list} tabIndex={0}>
        {filtered.length ? (
          <ol className="chapter-list">
            {filtered.map((chapter) => (
              <li key={chapter.id}>
                <Link
                  href={chapter.href}
                  className="story-chapter-link"
                  prefetch={chapter.encrypted ? false : undefined}
                >
                  <span className="story-part">{String(chapter.part).padStart(2, "0")}</span>
                  <div>
                    <h3>
                      {chapter.title}
                      {chapter.encrypted && <LockBadge locale={locale} />}
                    </h3>
                    <p>{chapter.summary}</p>
                    <small>
                      {dateLabel(chapter.publishedAt, locale)} · {chapter.readingTime}{" "}
                      {copy(locale, "phút đọc", "min read")}
                    </small>
                  </div>
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="chapter-empty">{text.empty}</p>
        )}
      </div>
    </div>
  )
}
