"use client"
import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Search, X } from "lucide-react"
import { useSite } from "@/components/providers/site-provider"
import type { CornerItem } from "@/lib/content/types"
import { cornerMessages } from "@/lib/i18n/corner"
import { searchText } from "@/lib/collections/search"
import { PaginatedList } from "@/components/collections/paginated-list"
import { LockBadge } from "@/components/reading/lock-badge"
import { CornerCover } from "./cover"
export function CornerShelf({ items }: { items: Omit<CornerItem, "body">[] }) {
  const { locale } = useSite(),
    text = cornerMessages[locale]
  const [category, setCategory] = useState("all"),
    [query, setQuery] = useState("")
  const filtered = items.filter(
    (item) =>
      (category === "all" || item.category === category) &&
      searchText(
        item.title[locale] + " " + item.creator[locale] + " " + item.description[locale],
      ).includes(searchText(query)),
  )
  return (
    <section className="corner-shelf" aria-labelledby="shelf-title">
      <div className="corner-shelf-heading">
        <div>
          <span className="eyebrow">{text.note}</span>
          <h2 id="shelf-title">{text.shelf}</h2>
          <p>{text.shelfDescription}</p>
        </div>
      </div>
      <div className="corner-shelf-tools">
        <div className="corner-categories" role="group" aria-label={text.shelf}>
          {(["all", "books", "films", "podcasts"] as const).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={category === key}
              onClick={() => setCategory(key)}
            >
              {text[key]}
              <span>
                {key === "all"
                  ? items.length
                  : items.filter((item) => item.category === key).length}
              </span>
            </button>
          ))}
        </div>
        <label className="corner-search">
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={text.search}
            aria-label={text.search}
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label={text.reset}>
              <X size={14} />
            </button>
          )}
        </label>
      </div>
      {filtered.length ? (
        <PaginatedList key={`${category}:${query}`} className="corner-shelf-grid" pageSize={6}>
          {filtered.map((item) => (
            <Link href={item.href} key={item.id} className="corner-card">
              <CornerCover item={item} title={item.title[locale]} />
              <div className="corner-card-body">
                <div className="corner-card-meta">
                  <span>{text[item.category]}</span>
                  <span>{item.sample ? text.sample : text[item.shelfStatus]}</span>
                </div>
                <h3>
                  {item.title[locale]}
                  {item.encrypted && <LockBadge locale={locale} />}
                </h3>
                {item.creator[locale] && <small>{item.creator[locale]}</small>}
                <p>{item.description[locale]}</p>
                <span className="corner-card-open">
                  {text.open}
                  <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </PaginatedList>
      ) : (
        <div className="corner-empty">
          <p>{text.empty}</p>
          <button
            className="text-link"
            onClick={() => {
              setQuery("")
              setCategory("all")
            }}
          >
            {text.reset}
            <ArrowRight size={14} />
          </button>
        </div>
      )}
      {filtered.some((item) => item.sample) && <p className="corner-sample-note">{text.samples}</p>}
    </section>
  )
}
