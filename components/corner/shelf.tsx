"use client"
import { useRef, useState, type CSSProperties, type PointerEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, Bookmark } from "lucide-react"
import { useSite } from "@/components/providers/site-provider"
import type { CornerItem } from "@/lib/content/types"
import { cornerMessages } from "@/lib/i18n/corner"
import { personalSpaces } from "@/lib/i18n/personal-spaces"
import { searchText } from "@/lib/collections/search"
import { ExpandingSearch } from "@/components/knowledge/expanding-search"

type Book = Omit<CornerItem, "body">
const cloth = ["#28578b", "#a34d32", "#346c62"]
function BookCover({ item }: { item: Book }) {
  const { locale } = useSite()
  const ref = useRef<HTMLDivElement>(null)
  function tilt(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches)
      return
    const rect = event.currentTarget.getBoundingClientRect()
    ref.current?.style.setProperty(
      "--tilt-x",
      `${-((event.clientY - rect.top) / rect.height - 0.5) * 12}deg`,
    )
    ref.current?.style.setProperty(
      "--tilt-y",
      `${-16 + ((event.clientX - rect.left) / rect.width - 0.5) * 24}deg`,
    )
  }
  return (
    <div
      className="book-cover-stage"
      onPointerMove={tilt}
      onPointerLeave={() => {
        ref.current?.style.removeProperty("--tilt-x")
        ref.current?.style.removeProperty("--tilt-y")
      }}
    >
      <div className="book-draw" key={item.id}>
        <div className="book-object" ref={ref} aria-hidden="true">
          <div className="book-back" />
          <div className="book-page-block" />
          <div className="book-cover-face">
            {item.cover ? (
              <Image src={item.cover} alt="" fill sizes="190px" unoptimized />
            ) : (
              <span>{item.title[locale]}</span>
            )}
          </div>
          <div className="book-binding" />
        </div>
      </div>
    </div>
  )
}

export function CornerShelf({ items }: { items: Book[] }) {
  const { locale } = useSite(),
    text = cornerMessages[locale],
    t = personalSpaces[locale]
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState("")
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const books = items.filter((item) => item.category === "books")
  const filtered = books.filter((item) =>
    searchText(
      `${item.title[locale]} ${item.creator[locale]} ${item.description[locale]}`,
    ).includes(searchText(query)),
  )
  const active = filtered.find((item) => item.id === selectedId) ?? filtered[0]
  const notes = active?.keepsakes?.[locale] ?? []
  const color =
    cloth[
      Math.max(
        0,
        books.findIndex((item) => item.id === active?.id),
      ) % cloth.length
    ]
  return (
    <section className="interactive-shelf" aria-labelledby="shelf-title">
      <div className="reading-shelf-tools">
        <div>
          <h2 id="shelf-title">{t.pickBook}</h2>
          <p>{t.shelfHint}</p>
        </div>
        <ExpandingSearch
          value={query}
          onChange={setQuery}
          label={text.search}
          clearLabel={text.reset}
        />
      </div>
      {active ? (
        <>
          <div className="reading-workbench">
            <div className="bookcase">
              <div className="bookcase-spines" role="group" aria-label={text.shelf}>
                {filtered.map((book, index) => (
                  <button
                    key={book.id}
                    className={`book-spine${active.id === book.id ? " is-pulled" : ""}`}
                    style={
                      {
                        "--book-cloth":
                          cloth[books.findIndex((item) => item.id === book.id) % cloth.length],
                        "--spine-height": `${232 + (index % 3) * 13}px`,
                      } as CSSProperties
                    }
                    aria-label={`${t.book}: ${book.title[locale]}`}
                    aria-pressed={active.id === book.id}
                    aria-controls="reading-book"
                    ref={(node) => {
                      buttons.current[index] = node
                    }}
                    onClick={() => setSelectedId(book.id)}
                    onKeyDown={(event) => {
                      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
                      event.preventDefault()
                      const next =
                        (index + (event.key === "ArrowRight" ? 1 : -1) + filtered.length) %
                        filtered.length
                      setSelectedId(filtered[next].id)
                      buttons.current[next]?.focus({ preventScroll: true })
                    }}
                    data-ui-sound="page"
                  >
                    <span className="spine-number">
                      {String(books.indexOf(book) + 1).padStart(2, "0")}
                    </span>
                    <span className="spine-title">{book.title[locale]}</span>
                    <Bookmark size={14} strokeWidth={1.3} aria-hidden="true" />
                  </button>
                ))}
              </div>
              <div className="bookcase-ledge" aria-hidden="true" />
              <span className="bookcase-label">
                {books.length} · {text.books}
              </span>
            </div>
            <div
              className="reading-book"
              id="reading-book"
              style={{ "--book-cloth": color } as CSSProperties}
            >
              <BookCover item={active} key={active.id} />
              <div className="reading-book-copy" aria-live="polite" aria-atomic="true">
                <span className="eyebrow">{text[active.shelfStatus]}</span>
                <h3>{active.title[locale]}</h3>
                <small>{active.creator[locale]}</small>
                <p>{active.description[locale]}</p>
                {active.readingProgress !== undefined && (
                  <div className="book-progress">
                    <div>
                      <span>{t.readingProgress}</span>
                      <strong>{active.readingProgress}%</strong>
                    </div>
                    <progress
                      value={active.readingProgress}
                      max={100}
                      aria-label={t.readingProgress}
                    />
                  </div>
                )}
                <Link className="text-link" href={active.href}>
                  {text.open}
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          </div>
          {notes.length > 0 && (
            <section className="reading-keepsakes" aria-labelledby="keepsakes-title">
              <h3 id="keepsakes-title">
                <Bookmark size={14} />
                {t.keepsakes}
              </h3>
              <ul className="keepsake-papers" key={active.id}>
                {notes.map((note, index) => (
                  <li key={`${index}:${note}`}>
                    <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    <p>{note}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : (
        <div className="corner-empty" role="status">
          <p>{text.empty}</p>
          <button className="text-link" onClick={() => setQuery("")}>
            {text.reset}
          </button>
        </div>
      )}
    </section>
  )
}
