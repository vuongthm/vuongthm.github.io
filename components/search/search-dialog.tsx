"use client"
import { copy } from "@/lib/i18n/copy"
import { useEffect, useMemo, useState } from "react"
import { contentLanguage } from "@/lib/i18n/config"
import Link from "next/link"
import Fuse from "fuse.js"
import { ArrowDownLeft, ArrowUpRight, FileText, Search, X } from "lucide-react"
import { useSite } from "@/components/providers/site-provider"
import { Dialog } from "./dialog"
import { getTopic } from "@/lib/content/topics"
import { knowledgeMessages } from "@/lib/i18n/knowledge"
export function SearchDialog() {
  const { searchOpen, setSearchOpen } = useSite()
  return searchOpen ? <SearchContent onClose={() => setSearchOpen(false)} /> : null
}
function SearchContent({ onClose }: { onClose: () => void }) {
  const { locale, dictionary: m, searchEntries } = useSite(),
    [query, setQuery] = useState(""),
    [index, setIndex] = useState(0)
  const fuse = useMemo(
    () =>
      new Fuse(searchEntries, {
        keys: [
          { name: "title", weight: 3 },
          { name: "summary", weight: 2 },
          "tags",
          "topics",
          "excerpt",
        ],
        threshold: 0.35,
        ignoreDiacritics: true,
      }),
    [searchEntries],
  )
  const found = query.trim()
    ? fuse.search(query, { limit: 8 }).map((item) => item.item)
    : searchEntries.filter((item) => !item.seriesSlug).slice(0, 5)
  useEffect(() => {
    document.getElementById(`search-result-${index}`)?.scrollIntoView({ block: "nearest" })
  }, [index])
  return (
    <Dialog label={m.search} onClose={onClose} className="search-dialog">
      <div className="search-field" data-search-field>
        <Search size={18} />
        <input
          type="search"
          autoComplete="off"
          aria-label={m.search}
          placeholder={knowledgeMessages[locale].search}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setIndex(0)
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && found.length) {
              event.preventDefault()
              setIndex(Math.min(index + 1, found.length - 1))
            }
            if (event.key === "ArrowUp") {
              event.preventDefault()
              setIndex(Math.max(index - 1, 0))
            }
            if (event.key === "Enter" && !event.nativeEvent.isComposing && found[index]) {
              event.preventDefault()
              document.getElementById(`search-result-${index}`)?.click()
            }
          }}
        />
        <button className="icon-button" onClick={onClose} aria-label={m.close}>
          <X size={18} />
        </button>
      </div>
      <div className="search-body">
        <div className="eyebrow" role="status" aria-live="polite">
          {query
            ? `${found.length} ${m.results}`
            : copy(locale, "ĐIỂM BẮT ĐẦU", "A PLACE TO START")}
        </div>
        {found.length ? (
          found.map((entry, i) => (
            <Link
              id={`search-result-${i}`}
              className={`search-result ${i === index ? "selected" : ""}`}
              key={entry.id}
              href={entry.href}
              onClick={onClose}
              onMouseEnter={() => setIndex(i)}
            >
              <FileText size={18} />
              <span>
                <strong>
                  {entry.title}
                  {entry.locale !== locale && (
                    <small className="content-language">
                      {contentLanguage(locale, entry.locale)}
                    </small>
                  )}
                </strong>
                <small>
                  {entry.seriesSlug
                    ? m.stories
                    : (getTopic(entry.topics[0])?.label[locale] ?? m.knowledge)}{" "}
                  · {entry.readingTime} {m.minutes}
                </small>
              </span>
              <ArrowUpRight size={16} />
            </Link>
          ))
        ) : (
          <div className="empty-state">
            <Search size={26} />
            <h3>{m.noResults}</h3>
            <p>{m.trySearch}</p>
          </div>
        )}
      </div>
      <div className="search-bottom">
        <span>
          <ArrowDownLeft size={13} /> Enter · Esc
        </span>
      </div>
    </Dialog>
  )
}
