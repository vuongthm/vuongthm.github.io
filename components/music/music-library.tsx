"use client"
/* eslint-disable @next/next/no-img-element -- Track artwork supports local Blob URLs. */
import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties } from "react"
import {
  AudioLines,
  Heart,
  ListMusic,
  Music2,
  Pause,
  Play,
  Plus,
  Search,
  X,
  LocateFixed,
} from "lucide-react"
import { useSite } from "@/components/providers/site-provider"
import { musicMessages } from "@/lib/i18n/music"
import { activeLyric, parseLyrics, type LyricLine } from "@/lib/music/lyrics"
import type { MusicTrack } from "@/lib/music/types"
export function MusicLibrary({
  tracks,
  current,
  playing,
  favorites,
  lines,
  time,
  localCount,
  onSelect,
  onFavorite,
  onSeek,
  onLyrics,
  onError,
  onNotice,
}: {
  tracks: MusicTrack[]
  current: MusicTrack
  playing: boolean
  favorites: string[]
  lines: LyricLine[]
  time: number
  localCount: number
  onSelect: (track: MusicTrack) => void
  onFavorite: (id: string) => void
  onSeek: (time: number) => void
  onLyrics: (id: string, lines: LyricLine[]) => void
  onError: (message: string) => void
  onNotice: (message: string) => void
}) {
  const { locale } = useSite(),
    text = musicMessages[locale]
  const [query, setQuery] = useState(""),
    [group, setGroup] = useState("all"),
    [panel, setPanel] = useState<"queue" | "lyrics">("queue"),
    [following, setFollowing] = useState(true)
  const lyricFile = useRef<HTMLInputElement>(null),
    lyricPane = useRef<HTMLDivElement>(null),
    active = activeLyric(lines, time)
  const filtered = tracks.filter(
    (track) =>
      (group === "all" ||
        (group === "favorites" && favorites.includes(track.id)) ||
        track.mood === group) &&
      `${track.title} ${track.artist}`
        .toLocaleLowerCase(locale)
        .includes(query.toLocaleLowerCase(locale)),
  )
  useEffect(() => {
    const pane = lyricPane.current,
      line = pane?.querySelector<HTMLElement>('[aria-current="true"]')
    if (!pane || !line || !following) return
    const lineBounds = line.getBoundingClientRect(),
      paneBounds = pane.getBoundingClientRect()
    pane.scrollTo({
      top: Math.max(
        0,
        pane.scrollTop +
          lineBounds.top -
          paneBounds.top -
          pane.clientHeight / 2 +
          lineBounds.height / 2,
      ),
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    })
  }, [active, panel, following, current.id, lines])
  async function importLyrics(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0],
      id = current?.id
    event.target.value = ""
    if (!file || !id) return
    if (file.size > 200000 || !/\.(lrc|txt)$/i.test(file.name)) {
      onError(text.fileError)
      return
    }
    const content = await file.text()
    onLyrics(id, parseLyrics(content))
    setFollowing(true)
    setPanel("lyrics")
    onNotice(text.importLyrics)
  }
  return (
    <>
      <input
        type="file"
        accept=".lrc,.txt"
        ref={lyricFile}
        onChange={(e) => void importLyrics(e)}
        className="sr-only"
        aria-label={text.addLyrics}
      />
      <section className="music-library" aria-label={text.library}>
        <div className="music-panel-tabs" role="tablist" aria-label={text.library}>
          {(["queue", "lyrics"] as const).map((value) => (
            <button
              role="tab"
              key={value}
              id={`music-tab-${value}`}
              aria-selected={panel === value}
              aria-controls={`music-panel-${value}`}
              tabIndex={panel === value ? 0 : -1}
              onKeyDown={(e) => {
                if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
                  e.preventDefault()
                  const next =
                    e.key === "Home"
                      ? "queue"
                      : e.key === "End"
                        ? "lyrics"
                        : panel === "queue"
                          ? "lyrics"
                          : "queue"
                  setPanel(next)
                  document.getElementById(`music-tab-${next}`)?.focus()
                }
              }}
              onClick={() => setPanel(value)}
            >
              {value === "queue" ? <ListMusic size={17} /> : <AudioLines size={17} />}
              <span>{text[value]}</span>
              {value === "queue" && <small>{tracks.length}</small>}
            </button>
          ))}
        </div>
        {panel === "queue" ? (
          <div
            id="music-panel-queue"
            role="tabpanel"
            aria-labelledby="music-tab-queue"
            tabIndex={0}
          >
            <div id="music-panel-lyrics" hidden />
            <div className="music-search">
              <Search size={16} />
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
            </div>
            <div className="music-filters" role="group" aria-label={text.library}>
              {["all", "favorites", "focus", "quiet", ...(localCount ? ["personal"] : [])].map(
                (value) => (
                  <button
                    key={value}
                    className={group === value ? "active" : ""}
                    aria-pressed={group === value}
                    onClick={() => setGroup(value)}
                  >
                    {text[value as "all"]}
                  </button>
                ),
              )}
            </div>
            <div className="music-track-list">
              {filtered.length ? (
                filtered.map((track, index) => (
                  <article
                    className={current.id === track.id ? "music-track active" : "music-track"}
                    key={track.id}
                  >
                    <button
                      className="music-track-main"
                      onClick={() => onSelect(track)}
                      aria-label={`${current.id === track.id && playing ? text.pause : text.play}: ${track.title}`}
                    >
                      <span className="music-track-number">
                        {current.id === track.id && playing ? (
                          <AudioLines size={16} />
                        ) : (
                          String(index + 1).padStart(2, "0")
                        )}
                      </span>
                      <img
                        src={track.cover}
                        alt=""
                        onError={(event) => {
                          event.currentTarget.src = "/hometown/dai-lanh-coast.webp"
                        }}
                      />
                      <span>
                        <strong>{track.title}</strong>
                        <small>{track.artist}</small>
                      </span>
                      <span className="music-track-play">
                        {current.id === track.id && playing ? (
                          <Pause size={15} />
                        ) : (
                          <Play size={15} />
                        )}
                      </span>
                    </button>
                    <button
                      className={
                        favorites.includes(track.id) ? "music-heart active" : "music-heart"
                      }
                      onClick={() => onFavorite(track.id)}
                      aria-label={`${favorites.includes(track.id) ? text.unlike : text.like}: ${track.title}`}
                      aria-pressed={favorites.includes(track.id)}
                    >
                      <Heart
                        size={16}
                        fill={favorites.includes(track.id) ? "currentColor" : "none"}
                      />
                    </button>
                  </article>
                ))
              ) : (
                <p className="music-empty">{text.empty}</p>
              )}
            </div>
            <p className="music-library-note">{localCount ? text.localNote : text.sample}</p>
          </div>
        ) : (
          <div
            id="music-panel-lyrics"
            role="tabpanel"
            aria-labelledby="music-tab-lyrics"
            tabIndex={0}
          >
            <div id="music-panel-queue" hidden />
            <div className="music-lyrics-toolbar">
              <span>{current.title}</span>
              <button onClick={() => lyricFile.current?.click()}>
                <Plus size={14} />
                {text.addLyrics}
              </button>
            </div>
            {lines.some((line) => line.at !== null) && (
              <button
                className="music-lyrics-follow"
                aria-pressed={following}
                onClick={() => setFollowing((value) => !value)}
              >
                <LocateFixed size={14} />
                {following ? text.following : text.follow}
              </button>
            )}
            <div
              className="music-lyrics"
              ref={lyricPane}
              onWheel={() => setFollowing(false)}
              onTouchStart={() => setFollowing(false)}
            >
              {lines.length ? (
                lines.map((line, index) =>
                  line.at !== null ? (
                    <button
                      key={`${index}:${line.at}`}
                      className={active === index ? "active" : ""}
                      aria-current={active === index ? "true" : undefined}
                      onClick={() => {
                        onSeek(line.at!)
                        setFollowing(true)
                      }}
                      aria-label={line.text || text.instrumental}
                    >
                      {line.words?.length
                        ? line.words.map((word, wordIndex) => {
                            const end =
                              line.words![wordIndex + 1]?.at ?? lines[index + 1]?.at ?? word.at + 3
                            const progress = Math.max(
                              0,
                              Math.min(1, (time - word.at) / Math.max(0.1, end - word.at)),
                            )
                            return (
                              <span
                                key={wordIndex}
                                className="lyric-word"
                                style={{ "--lyric-fill": `${progress * 100}%` } as CSSProperties}
                              >
                                {word.text}
                              </span>
                            )
                          })
                        : line.text || (
                            <span className="lyric-interlude" aria-hidden="true">
                              •••
                            </span>
                          )}
                    </button>
                  ) : (
                    <p key={index}>{line.text}</p>
                  ),
                )
              ) : (
                <div className="music-lyrics-empty">
                  <Music2 size={34} strokeWidth={1} />
                  <h3>{text.noLyrics}</h3>
                  <p>{text.lyricsHint}</p>
                  <button className="text-link" onClick={() => lyricFile.current?.click()}>
                    {text.addLyrics}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </>
  )
}
