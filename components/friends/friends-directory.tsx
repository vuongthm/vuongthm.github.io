"use client"
import { localeName, englishNames } from "@/lib/i18n/english-names.mjs"
import { useMemo, useState } from "react"
import Image from "next/image"
import { ArrowUpRight, Globe2, Search, X } from "lucide-react"
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
  const [query, setQuery] = useState("")
  const entries = useMemo(
    () => friends.map((friend, index) => ({ ...friend, renderKey: `${friend.id}:${index}` })),
    [friends],
  )
  const filtered = filterFriends(entries, query, "", "original", locale)
  return (
    <section className="friends-directory" aria-label={text.title}>
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
      </div>
      {query && (
        <p className="friends-results" role="status">
          {filtered.length} / {friends.length} {text.websites}
        </p>
      )}
      {filtered.length ? (
        <PaginatedList className="friends-grid" pageSize={8} key={query}>
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
              <h2>{localeName(friend.name, locale)}</h2>
              <p>
                {locale === "en"
                  ? englishNames(friend.description[locale])
                  : friend.description[locale]}
              </p>
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
            }}
          >
            {text.reset}
          </button>
        </div>
      )}
    </section>
  )
}
