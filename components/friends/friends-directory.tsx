"use client"
import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { ArrowUpRight, Globe2, Search, SlidersHorizontal, X } from "lucide-react"
import { Dialog } from "@/components/search/dialog"
import { PaginatedList } from "@/components/collections/paginated-list"
import { friendsMessages } from "@/lib/i18n/friends"
import type { Locale } from "@/lib/i18n/config"
import { filterFriends, type Friend } from "@/lib/friends/directory"

function FriendAvatar({ friend }: { friend: Friend }) {
  const [failed, setFailed] = useState(false)
  return (
    <span className="friend-avatar" aria-hidden="true">
      {friend.avatar && !failed ? (
        <Image
          src={friend.avatar}
          alt=""
          width={56}
          height={56}
          unoptimized
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{friend.initials}</span>
      )}
    </span>
  )
}
export function FriendsDirectory({ friends, locale }: { friends: Friend[]; locale: Locale }) {
  const text = friendsMessages[locale]
  const [query, setQuery] = useState(""),
    [topic, setTopic] = useState(""),
    [sort, setSort] = useState("original"),
    [filtersOpen, setFiltersOpen] = useState(false)
  const topics = [...new Set(friends.flatMap((friend) => friend.topics))]
  const entries = useMemo(
    () => friends.map((friend, index) => ({ ...friend, renderKey: `${friend.id}:${index}` })),
    [friends],
  )
  const filtered = filterFriends(entries, query, topic, sort, locale)
  useEffect(() => {
    const viewport = matchMedia("(min-width: 761px)")
    const close = () => {
      if (viewport.matches) setFiltersOpen(false)
    }
    viewport.addEventListener("change", close)
    return () => viewport.removeEventListener("change", close)
  }, [])
  const fields = () => (
    <>
      <label className="friends-select">
        <span>{text.topic}</span>
        <select value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="">{text.all}</option>
          {topics.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <label className="friends-select">
        <span>{text.sort}</span>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="original">{text.original}</option>
          <option value="az">{text.az}</option>
          <option value="za">{text.za}</option>
        </select>
      </label>
    </>
  )
  return (
    <section className="friends-directory" aria-label={text.title}>
      {filtersOpen && (
        <Dialog
          label={text.filters}
          className="friends-filter-dialog"
          onClose={() => setFiltersOpen(false)}
        >
          <div className="friends-filter-sheet">
            <div className="friends-filter-heading">
              <div>
                <span className="eyebrow">{text.title}</span>
                <h2>{text.filters}</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label={text.close}
                onClick={() => setFiltersOpen(false)}
              >
                <X size={19} />
              </button>
            </div>
            <div className="friends-sheet-fields">{fields()}</div>
            <div className="friends-filter-actions">
              <button
                className="button secondary"
                type="button"
                onClick={() => {
                  setTopic("")
                  setSort("original")
                }}
              >
                {text.reset}
              </button>
              <button
                className="button primary"
                type="button"
                onClick={() => setFiltersOpen(false)}
              >
                {text.show.replace("{count}", String(filtered.length))}
              </button>
            </div>
          </div>
        </Dialog>
      )}
      <div className="friends-tools">
        <label className="friends-search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder={text.search}
            aria-label={text.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button aria-label={text.clear} onClick={() => setQuery("")}>
              <X size={14} />
            </button>
          )}
        </label>
        <div className="friends-desktop-filters">{fields()}</div>
        <button
          type="button"
          className="friends-filter-toggle"
          aria-label={text.filters}
          aria-expanded={filtersOpen}
          aria-haspopup="dialog"
          onClick={() => setFiltersOpen(true)}
        >
          <SlidersHorizontal size={18} />
          <span>{text.filters}</span>
          {(topic || sort !== "original") && <i aria-hidden="true" />}
        </button>
      </div>
      <p className="friends-results" role="status">
        {filtered.length} / {friends.length} {text.websites}
      </p>
      {filtered.length ? (
        <PaginatedList className="friends-grid" pageSize={8} key={`${query}:${topic}:${sort}`}>
          {filtered.map((friend) => (
            <a
              key={friend.renderKey}
              className="friend-card"
              href={friend.website}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="friend-card-top">
                <FriendAvatar friend={friend} />
                <ArrowUpRight size={17} strokeWidth={1.5} aria-hidden="true" />
              </div>
              <span className="friend-alias">{friend.alias}</span>
              <h2>{friend.name}</h2>
              <p>{friend.description[locale]}</p>
              <div className="friend-topics">
                {friend.topics.map((value) => (
                  <span key={value}>{value}</span>
                ))}
              </div>
              <div className="friend-card-bottom">
                <span>
                  <Globe2 size={12} aria-hidden="true" />
                  {new URL(friend.website).hostname}
                </span>
                <small>{friend.websitePlaceholder ? text.placeholderWebsite : text.visit}</small>
              </div>
            </a>
          ))}
        </PaginatedList>
      ) : (
        <div className="friends-empty">
          <Search size={26} strokeWidth={1.25} />
          <h2>{text.empty}</h2>
          <button
            className="text-link"
            onClick={() => {
              setQuery("")
              setTopic("")
            }}
          >
            {text.reset}
          </button>
        </div>
      )}
    </section>
  )
}
