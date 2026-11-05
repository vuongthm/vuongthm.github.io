"use client"
/* eslint-disable @next/next/no-img-element -- Persistent music artwork also supports local Blob URLs. */
import { useEffect, useRef, useState, type CSSProperties } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowUpRight, Music2, Pause, Play, SkipBack, SkipForward, X } from "lucide-react"
import { useSite } from "@/components/providers/site-provider"
import { localized } from "@/lib/i18n/config"
import { musicMessages } from "@/lib/i18n/music"
import { clockTime } from "@/lib/music/lyrics"
import { useMusic } from "./music-provider"
import { YouTubePlayer } from "./youtube-player"

type Bounds = { top: number; left: number; width: number; height: number }
export function MusicPlayerSlot() {
  const { setSlot, current } = useMusic()
  return (
    <div
      id="music-player-slot"
      className={`music-player-slot${current?.youtubeId ? "" : " is-audio"}`}
      ref={setSlot}
    >
      {current && <img src={current.cover} alt="" aria-hidden="true" />}
    </div>
  )
}
export function MusicPlaybackSurface() {
  const { locale, dictionary } = useSite(),
    text = musicMessages[locale],
    path = usePathname(),
    inRoom = path.replace(/\/$/, "") === `/${locale}/music`
  const {
    slot,
    current,
    active,
    setActive,
    playing,
    setPlaying,
    time,
    setTime,
    duration,
    setDuration,
    volume,
    muted,
    speed,
    repeat,
    videoError,
    setVideoError,
    setError,
    youtube: youtubeRef,
    audio: audioRef,
    wantPlay: wantPlayRef,
    seek,
    advance,
    toggle,
    close,
  } = useMusic()
  const [bounds, setBounds] = useState<Bounds | null>(null),
    frame = useRef(0)
  useEffect(() => {
    const measure = () => {
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(() => {
        if (!slot) {
          setBounds(null)
          return
        }
        const r = slot.getBoundingClientRect()
        setBounds((previous) =>
          previous &&
          Math.abs(previous.top - r.top) < 0.5 &&
          Math.abs(previous.left - r.left) < 0.5 &&
          Math.abs(previous.width - r.width) < 0.5 &&
          Math.abs(previous.height - r.height) < 0.5
            ? previous
            : { top: r.top, left: r.left, width: r.width, height: r.height },
        )
      })
    }
    const observer = new ResizeObserver(measure)
    if (slot) observer.observe(slot)
    measure()
    window.addEventListener("scroll", measure, { passive: true })
    window.addEventListener("resize", measure)
    return () => {
      cancelAnimationFrame(frame.current)
      observer.disconnect()
      window.removeEventListener("scroll", measure)
      window.removeEventListener("resize", measure)
    }
  }, [slot, path])
  const docked = active && !inRoom,
    show = !!current && (active || inRoom)
  useEffect(() => {
    document.body.toggleAttribute("data-music-docked", !!docked)
    return () => document.body.removeAttribute("data-music-docked")
  }, [docked])
  if (!current) return null
  const style: CSSProperties | undefined =
    inRoom && bounds
      ? { top: bounds.top, left: bounds.left, width: bounds.width, height: bounds.height }
      : undefined
  return (
    <>
      {(active || inRoom) && !current.youtubeId && (
        <audio
          ref={audioRef}
          src={current.src}
          preload="metadata"
          onPlay={() => {
            setPlaying(true)
            setActive(true)
            wantPlayRef.current = true
          }}
          onPause={() => setPlaying(false)}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              audioRef.current.volume = volume
              audioRef.current.muted = muted
              audioRef.current.playbackRate = speed
            }
            setDuration(audioRef.current?.duration ?? 0)
            setTime(0)
          }}
          onTimeUpdate={() => setTime(audioRef.current?.currentTime ?? 0)}
          onError={() => setError(text.error)}
          onEnded={() => {
            if (repeat === "one") {
              seek(0)
              void audioRef.current?.play()
            } else advance(1, true)
          }}
        />
      )}

      {show && (
        <section
          className={`music-playback-surface${current.youtubeId ? " is-video" : " is-audio"}`}
          hidden={!inRoom || !bounds}
          style={style}
          aria-label={current.title}
        >
          {current.youtubeId && videoError !== current.id ? (
            <YouTubePlayer
              key={current.youtubeId}
              ref={youtubeRef}
              id={current.youtubeId}
              title={current.title}
              autoPlay={active}
              volume={volume}
              muted={muted}
              speed={speed}
              onTime={(value, length) => {
                setTime(value)
                setDuration(length)
              }}
              onPlaying={(value) => {
                setPlaying(value)
                if (value) {
                  setActive(true)
                  wantPlayRef.current = true
                }
              }}
              onError={() => {
                setError(text.youtubeError)
                setVideoError(current.id)
              }}
              onEnd={() => {
                if (repeat === "one") {
                  seek(0)
                  youtubeRef.current?.play()
                } else advance(1, true)
              }}
            />
          ) : current.youtubeId ? (
            <div className="music-video-fallback">
              <img src={current.cover} alt="" />
              <div>
                <Music2 size={26} />
                <a href={current.source} target="_blank" rel="noreferrer">
                  {text.youtubeOpen}
                  <ArrowUpRight size={14} />
                </a>
                <button
                  onClick={() => {
                    setVideoError("")
                    setError("")
                  }}
                >
                  {text.youtubeRetry}
                </button>
              </div>
            </div>
          ) : (
            <div className="music-artwork">
              <img
                src={current.cover}
                alt=""
                onError={(event) => {
                  event.currentTarget.src = "/hometown/dai-lanh-coast.webp"
                }}
              />
              <span
                className={playing ? "music-indicator is-playing" : "music-indicator"}
                aria-hidden="true"
              >
                <i />
                <i />
                <i />
                <i />
              </span>
              <span className="music-artwork-label">vuong. / listening room</span>
            </div>
          )}
        </section>
      )}
      {docked && (
        <aside className="music-dock" aria-label={text.title}>
          <div className="music-dock-inner wrap">
            <Link className="music-dock-track" href={localized("/music/", locale)}>
              <img src={current.cover} alt="" />
              <span>
                <strong>{current.title}</strong>
                <small>{current.artist}</small>
              </span>
            </Link>
            <div className="music-dock-controls">
              <button onClick={() => advance(-1)} aria-label={text.previous}>
                <SkipBack size={17} />
              </button>
              {current.youtubeId && videoError === current.id ? (
                <a
                  href={current.source}
                  target="_blank"
                  rel="noreferrer"
                  className="music-dock-toggle"
                  aria-label={text.youtubeOpen}
                >
                  <ArrowUpRight size={20} />
                </a>
              ) : (
                <button
                  className="music-dock-toggle"
                  onClick={toggle}
                  aria-label={playing ? text.pause : text.play}
                >
                  {playing ? (
                    <Pause size={19} fill="currentColor" />
                  ) : (
                    <Play size={19} fill="currentColor" />
                  )}
                </button>
              )}
              <button onClick={() => advance(1)} aria-label={text.next}>
                <SkipForward size={17} />
              </button>
            </div>
            <div className="music-dock-timeline">
              <input
                type="range"
                min="0"
                max={duration || 1}
                value={Math.min(time, duration || 0)}
                disabled={!duration}
                step=".1"
                aria-label={text.seek}
                onChange={(event) => seek(Number(event.target.value))}
              />
              <span>
                {clockTime(time)} / {clockTime(duration)}
              </span>
            </div>
            <Link
              className="music-dock-open"
              href={localized("/music/", locale)}
              aria-label={text.title}
            >
              <Music2 size={17} />
            </Link>
            <button
              className="music-dock-close"
              onClick={close}
              aria-label={dictionary.close}
              title={dictionary.close}
            >
              <X size={19} />
            </button>
          </div>
          <span className="music-dock-progress" aria-hidden="true">
            <i style={{ width: `${duration ? Math.min(100, (time / duration) * 100) : 0}%` }} />
          </span>
        </aside>
      )}
    </>
  )
}
