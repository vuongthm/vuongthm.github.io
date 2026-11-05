"use client"
/* eslint-disable @next/next/no-img-element -- Album sources also support remote and decrypted media. */
import { useRef, useState, type KeyboardEvent } from "react"
import Link from "next/link"
import { Images, LockKeyhole, BookOpen, Album, Camera, ArrowRight } from "lucide-react"
import { useSite } from "@/components/providers/site-provider"
import { localized } from "@/lib/i18n/config"
import { AlbumBrowser } from "./album-browser"
import { albumMessages } from "@/lib/i18n/album"
import { vaultMessages } from "@/lib/vault/messages"
import { PaginatedList } from "@/components/collections/paginated-list"
import type { GalleryPhoto } from "@/lib/content/types"
type AlbumPreview = {
  id: string
  title: string
  description?: string
  cover?: string
  href: string
  encrypted?: boolean
  story?: boolean
  items: GalleryPhoto[]
  count: number
}
type View = "photos" | "albums" | "stories"
const tabs = [
  { id: "photos", icon: Images },
  { id: "albums", icon: Album },
  { id: "stories", icon: BookOpen },
] as const
export function PhotoJournal({ albums }: { albums: AlbumPreview[] }) {
  const { locale, dictionary } = useSite(),
    words = albumMessages(locale)
  const [view, setView] = useState<View>("photos"),
    [selected, setSelected] = useState("all"),
    [kind, setKind] = useState("all"),
    [more, setMore] = useState(false)
  const tablist = useRef<HTMLDivElement>(null)
  const publicAlbums = albums.filter((album) => !album.encrypted)
  const selectedAlbum = publicAlbums.find((album) => album.id === selected),
    selection = selectedAlbum?.id ?? "all"
  const photos = publicAlbums
    .filter((album) => selection === "all" || album.id === selection)
    .flatMap((album) => album.items)
    .filter((item) => kind === "all" || (item.kind ?? "image") === kind)
  const stories = publicAlbums.filter((album) => album.story)
  function keyboard(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % 3
        : event.key === "ArrowLeft"
          ? (index + 2) % 3
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? 2
              : null
    if (next === null) return
    event.preventDefault()
    setView(tabs[next].id)
    tablist.current?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus()
  }
  function cover(album: AlbumPreview) {
    return album.cover || album.items.find((item) => item.kind !== "video")?.src
  }
  return (
    <section className="photo-journal wrap">
      <div className="journal-nav">
        <div className="journal-tabs" role="tablist" aria-label={dictionary.album} ref={tablist}>
          {tabs.map(({ id, icon: Icon }, index) => (
            <button
              key={id}
              id={`journal-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={view === id}
              aria-controls={`journal-panel-${id}`}
              tabIndex={view === id ? 0 : -1}
              onKeyDown={(event) => keyboard(event, index)}
              onClick={() => setView(id)}
            >
              <Icon size={16} />
              {words[id]}
            </button>
          ))}
        </div>
        <span className="journal-library-count">
          {publicAlbums.length} {words.collection}
        </span>
      </div>
      <div
        className="journal-panel"
        role="tabpanel"
        id={`journal-panel-${view}`}
        aria-labelledby={`journal-tab-${view}`}
        tabIndex={0}
      >
        {view === "photos" && (
          <>
            <div className="journal-toolbar">
              <select
                className="journal-album-picker"
                aria-label={dictionary.album}
                value={selection}
                onChange={(event) => setSelected(event.target.value)}
              >
                <option value="all">{words.all}</option>
                {publicAlbums.map((album) => (
                  <option key={album.id} value={album.id}>
                    {album.title} · {album.count}
                  </option>
                ))}
              </select>
              <select
                aria-label={dictionary.type}
                value={kind}
                onChange={(event) => setKind(event.target.value)}
              >
                <option value="all">{dictionary.all}</option>
                <option value="image">{words.images}</option>
                <option value="video">{words.videos}</option>
              </select>
            </div>
            <AlbumBrowser
              photos={photos}
              resetKey={`${selection}:${kind}`}
              action={
                selectedAlbum ? <Link href={selectedAlbum.href}>{words.open}</Link> : undefined
              }
            />
          </>
        )}
        {view === "albums" && (
          <PaginatedList className="journal-album-grid" pageSize={6}>
            {publicAlbums.map((album) => (
              <Link className="journal-album-card" href={album.href} key={album.id}>
                <span className="journal-album-cover">
                  {cover(album) ? (
                    <img src={cover(album)} alt="" loading="lazy" />
                  ) : (
                    <Camera size={26} />
                  )}
                  <span className="journal-album-count">
                    {album.count} {words.count}
                  </span>
                </span>
                <h2>{album.title}</h2>
                {album.description && <p>{album.description}</p>}
              </Link>
            ))}
          </PaginatedList>
        )}
        {view === "stories" &&
          (stories.length ? (
            <PaginatedList className="journal-story-grid" pageSize={6}>
              {stories.map((album) => (
                <Link className="journal-story-card" href={album.href} key={album.id}>
                  {cover(album) && <img src={cover(album)} alt="" loading="lazy" />}
                  <span className="journal-story-shade" />
                  <span className="journal-story-copy">
                    <small>{words.visualStory}</small>
                    <h2>{album.title}</h2>
                    {album.description && <p>{album.description}</p>}
                    <span>
                      {words.open}
                      <ArrowRight size={14} />
                    </span>
                  </span>
                </Link>
              ))}
            </PaginatedList>
          ) : (
            <p className="journal-empty">{words.noStories}</p>
          ))}
      </div>
      {tabs
        .filter((tab) => tab.id !== view)
        .map((tab) => (
          <div
            key={tab.id}
            hidden
            role="tabpanel"
            id={`journal-panel-${tab.id}`}
            aria-labelledby={`journal-tab-${tab.id}`}
          />
        ))}
      <div className="journal-more">
        <button
          className="text-link"
          aria-expanded={more}
          aria-controls="journal-private"
          onClick={() => setMore(!more)}
        >
          {words.more}
          <span aria-hidden="true">{more ? "−" : "+"}</span>
        </button>
        {more && (
          <div id="journal-private" className="journal-private">
            <h2>{words.private}</h2>
            {albums
              .filter((album) => album.encrypted)
              .map((album) => (
                <Link href={album.href} key={album.id}>
                  <LockKeyhole size={14} />
                  <span>{album.title}</span>
                </Link>
              ))}
            <Link href={localized("/vault/", locale)}>
              <LockKeyhole size={14} />
              <span>{vaultMessages(locale).title}</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
