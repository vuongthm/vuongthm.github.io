"use client"
import { useRef } from "react"
import { MusicLibrary } from "./music-library"
import { useMusic } from "./music-provider"
import { MusicPlayerSlot } from "./music-surface"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Clock3,
  Heart,
  Pause,
  Play,
  Plus,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react"
import { useSite } from "@/components/providers/site-provider"
import { localized } from "@/lib/i18n/config"
import { musicMessages } from "@/lib/i18n/music"
import { clockTime } from "@/lib/music/lyrics"

export function MusicRoom() {
  const { locale, dictionary } = useSite(),
    text = musicMessages[locale]
  const {
    allTracks,
    current,
    playing,
    time,
    duration,
    volume,
    setVolume,
    muted,
    setMuted,
    random,
    setRandom,
    repeat,
    setRepeat,
    speed,
    setSpeed,
    sleep,
    setSleep,
    favorites,
    lyrics,
    setLyrics,
    error,
    setError,
    notice,
    setNotice,
    videoError,
    seek,
    select,
    toggle,
    advance,
    favorite,
    importAudio,
    localCount,
  } = useMusic()
  const files = useRef<HTMLInputElement>(null)
  if (!current)
    return (
      <main className="wrap music-room" id="main-content">
        <h1>{text.title}</h1>
        <p>{text.empty}</p>
      </main>
    )
  return (
    <main className="wrap music-room" id="main-content">
      <header className="music-heading">
        <div>
          <Link className="back-link" href={localized("/", locale)}>
            <ArrowLeft size={14} />
            {dictionary.home}
          </Link>
          <span className="eyebrow">{text.intro}</span>
          <h1>{text.title}</h1>
          <p>{text.description}</p>
        </div>
        <button className="button secondary" onClick={() => files.current?.click()}>
          <Plus size={15} />
          {text.open}
        </button>
      </header>
      <input
        type="file"
        accept="audio/*,.mp3,.m4a,.ogg,.flac"
        multiple
        ref={files}
        onChange={importAudio}
        className="sr-only"
        aria-label={text.open}
      />

      <div className="music-layout">
        <section className="music-now" aria-labelledby="now-title">
          <MusicPlayerSlot />
          {error && videoError !== current.id && (
            <p className="music-feedback" role="alert">
              {error}
            </p>
          )}
          <div className="music-now-meta">
            <div>
              <span className="eyebrow">{playing ? text.playing : text.paused}</span>
              <h2 id="now-title">{current.title}</h2>
              <p>{current.artist}</p>
            </div>
            <button
              className={favorites.includes(current.id) ? "music-heart active" : "music-heart"}
              onClick={() => favorite(current.id)}
              aria-label={favorites.includes(current.id) ? text.unlike : text.like}
              aria-pressed={favorites.includes(current.id)}
            >
              <Heart size={21} fill={favorites.includes(current.id) ? "currentColor" : "none"} />
            </button>
          </div>
          <div className="music-seek">
            <input
              type="range"
              min="0"
              max={Number.isFinite(duration) && duration > 0 ? duration : 1}
              value={Math.min(time, duration || 0)}
              step=".1"
              disabled={!duration}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label={text.seek}
            />
            <div>
              <time>{clockTime(time)}</time>
              <time>{clockTime(duration)}</time>
            </div>
          </div>
          <div className="music-controls">
            <button
              onClick={() => setRandom(!random)}
              aria-pressed={random}
              aria-label={text.shuffle}
              className={random ? "active" : ""}
            >
              <Shuffle size={18} />
            </button>
            <button onClick={() => advance(-1)} aria-label={text.previous}>
              <SkipBack size={22} fill="currentColor" />
            </button>
            {current.youtubeId && videoError === current.id ? (
              <a
                className="music-play"
                href={current.source}
                target="_blank"
                rel="noreferrer"
                aria-label={text.youtubeOpen}
              >
                <ArrowUpRight size={23} />
              </a>
            ) : (
              <button
                className="music-play"
                onClick={toggle}
                aria-label={playing ? text.pause : text.play}
              >
                {playing ? (
                  <Pause size={24} fill="currentColor" />
                ) : (
                  <Play size={24} fill="currentColor" />
                )}
              </button>
            )}

            <button onClick={() => advance(1)} aria-label={text.next}>
              <SkipForward size={22} fill="currentColor" />
            </button>
            <button
              className={repeat !== "off" ? "active" : ""}
              onClick={() => setRepeat(repeat === "off" ? "all" : repeat === "all" ? "one" : "off")}
              aria-label={`${text.repeat}: ${repeat === "off" ? text.off : repeat === "all" ? text.all : text.one}`}
              aria-pressed={repeat !== "off"}
            >
              {repeat === "one" ? <Repeat1 size={19} /> : <Repeat size={19} />}
            </button>
          </div>
          <div className="music-utilities">
            <div className="music-volume">
              <button onClick={() => setMuted(!muted)} aria-label={muted ? text.unmute : text.mute}>
                {muted || !volume ? <VolumeX size={17} /> : <Volume2 size={17} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step=".01"
                value={muted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value))
                  setMuted(false)
                }}
                aria-label={text.volume}
              />
            </div>
            <label>
              <span className="sr-only">{text.speed}</span>
              <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                {[0.75, 1, 1.25, 1.5].map((value) => (
                  <option key={value} value={value}>
                    {value}×
                  </option>
                ))}
              </select>
            </label>
            <label className="music-sleep">
              <Clock3 size={14} />
              <span className="sr-only">{text.sleep}</span>
              <select value={sleep} onChange={(e) => setSleep(Number(e.target.value))}>
                <option value="0">{text.sleep}</option>
                {[15, 30, 60].map((value) => (
                  <option key={value} value={value}>
                    {value} {text.minutes}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {current.source && (
            <div className="music-credit">
              <span>{text.credit}</span>
              <p>{current.performer}</p>
              <a href={current.source} target="_blank" rel="noreferrer">
                {current.license}
                <ArrowUpRight size={12} />
              </a>
            </div>
          )}
        </section>
        <MusicLibrary
          tracks={allTracks}
          current={current}
          playing={playing}
          favorites={favorites}
          lines={lyrics[current.id] ?? []}
          time={time}
          localCount={localCount}
          onSelect={select}
          onFavorite={favorite}
          onSeek={seek}
          onLyrics={(id, value) => setLyrics((previous) => ({ ...previous, [id]: value }))}
          onError={setError}
          onNotice={setNotice}
        />
      </div>
      {notice && (
        <p className="music-feedback" role="status">
          <Check size={14} />
          {notice}
        </p>
      )}
    </main>
  )
}
