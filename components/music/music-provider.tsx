"use client"
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type ChangeEvent,
} from "react"
import { useSite } from "@/components/providers/site-provider"
import { musicMessages } from "@/lib/i18n/music"
import { parseLyrics, type LyricLine } from "@/lib/music/lyrics"
import type { MusicTrack } from "@/lib/music/types"
import type { YouTubeControls } from "./youtube-player"
import { MusicPlaybackSurface } from "./music-surface"

function useMusicController(tracks: MusicTrack[]) {
  const { locale } = useSite(),
    text = musicMessages[locale]
  const [imported, setImported] = useState<MusicTrack[]>([]),
    [selected, setSelected] = useState(tracks[0]?.id ?? ""),
    [playing, setPlaying] = useState(false),
    [time, setTime] = useState(0),
    [duration, setDuration] = useState(0),
    [volume, setVolume] = useState(0.7),
    [muted, setMuted] = useState(false),
    [random, setRandom] = useState(false),
    [repeat, setRepeat] = useState<"off" | "all" | "one">("off"),
    [speed, setSpeed] = useState(1),
    [sleep, setSleep] = useState(0),
    [favorites, setFavorites] = useState<string[]>([]),
    [lyrics, setLyrics] = useState<Record<string, LyricLine[]>>({}),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [videoError, setVideoError] = useState(""),
    [active, setActive] = useState(false),
    [slot, setSlot] = useState<HTMLDivElement | null>(null)
  const youtube = useRef<YouTubeControls>(null)
  const audio = useRef<HTMLAudioElement>(null),
    urls = useRef<string[]>([]),
    wantPlay = useRef(false)
  const allTracks = useMemo(() => [...tracks, ...imported], [tracks, imported]),
    current = allTracks.find((track) => track.id === selected) ?? allTracks[0]
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const value = JSON.parse(localStorage.getItem("vuong:music:favorites") ?? "[]")
        if (Array.isArray(value)) setFavorites(value.filter((x) => typeof x === "string"))
      } catch {}
    })
    return () => cancelAnimationFrame(frame)
  }, [])
  useEffect(() => {
    const owned = urls.current
    return () => {
      for (const url of owned) URL.revokeObjectURL(url)
    }
  }, [])
  useEffect(() => {
    const node = audio.current
    youtube.current?.volume(volume)
    youtube.current?.mute(muted)
    youtube.current?.speed(speed)
    if (!node) return
    node.volume = volume
    node.muted = muted
    node.playbackRate = speed
  }, [volume, muted, speed, current?.src])
  useEffect(() => {
    const node = audio.current
    if (!node || current?.youtubeId) return
    node.load()
    if (wantPlay.current)
      void node.play().catch(() => {
        wantPlay.current = false
        setError(text.error)
      })
  }, [current?.src, current?.youtubeId, text.error])
  useEffect(() => {
    if (!current?.lyrics) return
    const controller = new AbortController(),
      id = current.id
    fetch(current.lyrics, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw Error()
        return r.text()
      })
      .then((value) => {
        if (!controller.signal.aborted)
          setLyrics((previous) => ({ ...previous, [id]: parseLyrics(value.slice(0, 200000)) }))
      })
      .catch(() => {})
    return () => controller.abort()
  }, [current?.id, current?.lyrics])
  useEffect(() => {
    if (!sleep) return
    const timer = setTimeout(() => {
      audio.current?.pause()
      youtube.current?.pause()
      wantPlay.current = false
      setSleep(0)
      setNotice(text.sleepDone)
    }, sleep * 60000)
    return () => clearTimeout(timer)
  }, [sleep, text.sleepDone])
  useEffect(() => {
    if (!("mediaSession" in navigator) || !current || current.youtubeId) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist,
      artwork: [{ src: current.cover }],
    })
    const shift = (delta: number) => {
      const node = audio.current
      if (node && Number.isFinite(node.duration))
        node.currentTime = Math.max(0, Math.min(node.duration, node.currentTime + delta))
    }
    const handlers = {
      play: () => void audio.current?.play(),
      pause: () => audio.current?.pause(),
      seekbackward: () => shift(-10),
      seekforward: () => shift(10),
    }
    for (const [name, handler] of Object.entries(handlers))
      navigator.mediaSession.setActionHandler(name as MediaSessionAction, handler)
    return () => {
      for (const name of Object.keys(handlers))
        navigator.mediaSession.setActionHandler(name as MediaSessionAction, null)
      navigator.mediaSession.metadata = null
    }
  }, [current])
  function seek(value: number) {
    if (current?.youtubeId) {
      if (!youtube.current) return
      youtube.current?.seek(Math.max(0, Math.min(duration || value, value)))
      setTime(Math.max(0, value))
      return
    }
    const node = audio.current
    if (node && Number.isFinite(node.duration)) {
      node.currentTime = Math.max(0, Math.min(node.duration, value))
      setTime(node.currentTime)
    }
  }
  function select(track: MusicTrack) {
    setActive(true)
    setError("")
    setNotice("")
    if (track.id === current?.id) {
      toggle()
      return
    }
    wantPlay.current = true
    setTime(0)
    setDuration(0)
    setSelected(track.id)
  }
  function toggle() {
    setActive(true)
    if (current?.youtubeId) {
      setError("")
      wantPlay.current = !playing
      if (playing) youtube.current?.pause()
      else youtube.current?.play()
      return
    }
    if (!audio.current) return
    if (playing) {
      wantPlay.current = false
      audio.current.pause()
    } else {
      setError("")
      wantPlay.current = true
      void audio.current.play().catch(() => {
        wantPlay.current = false
        setError(text.error)
      })
    }
  }
  function advance(direction: number, automatic = false) {
    if (!current || !allTracks.length) return
    let index = allTracks.findIndex((t) => t.id === current.id) + direction
    if (random && allTracks.length > 1) {
      const choices = allTracks.filter((t) => t.id !== current.id)
      select(choices[Math.floor(Math.random() * choices.length)])
      return
    }
    if (automatic && index >= allTracks.length && repeat === "off") {
      wantPlay.current = false
      return
    }
    index = (index + allTracks.length) % allTracks.length
    const next = allTracks[index]
    if (next.id === current.id) {
      seek(0)
      if (automatic) {
        if (current.youtubeId) youtube.current?.play()
        else void audio.current?.play()
      }
      return
    }
    select(next)
  }
  function favorite(id: string) {
    const next = favorites.includes(id) ? favorites.filter((x) => x !== id) : [...favorites, id]
    setFavorites(next)
    try {
      localStorage.setItem(
        "vuong:music:favorites",
        JSON.stringify(next.filter((x) => !x.startsWith("local-"))),
      )
    } catch {}
  }
  function importAudio(event: ChangeEvent<HTMLInputElement>) {
    const values = [...(event.target.files ?? [])],
      added: MusicTrack[] = []
    for (const file of values) {
      if (!(/^audio\//.test(file.type) || /\.(mp3|wav|ogg|m4a|flac|aac|webm)$/i.test(file.name)))
        continue
      const src = URL.createObjectURL(file)
      urls.current.push(src)
      added.push({
        id: `local-${crypto.randomUUID()}`,
        title: file.name.replace(/\.[^.]+$/, ""),
        artist: text.fromDevice,
        src,
        cover: "/hometown/dai-lanh-coast.webp",
        mood: "personal",
      })
    }
    setImported((previous) => [...previous, ...added])
    setError(added.length ? "" : text.fileError)
    event.target.value = ""
  }

  function close() {
    wantPlay.current = false
    audio.current?.pause()
    youtube.current?.pause()
    seek(0)
    setPlaying(false)
    setActive(false)
    setNotice("")
    setError("")
  }
  return {
    slot,
    setSlot,
    allTracks,
    current,
    playing,
    setPlaying,
    time,
    setTime,
    duration,
    setDuration,
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
    setVideoError,
    youtube,
    audio,
    wantPlay,
    active,
    setActive,
    seek,
    select,
    toggle,
    advance,
    favorite,
    importAudio,
    close,
    localCount: imported.length,
  }
}
const MusicContext = createContext<ReturnType<typeof useMusicController> | null>(null)
export function MusicProvider({ tracks, children }: { tracks: MusicTrack[]; children: ReactNode }) {
  const controller = useMusicController(tracks)
  return (
    <MusicContext.Provider value={controller}>
      {children}
      <MusicPlaybackSurface />
    </MusicContext.Provider>
  )
}
export function useMusic() {
  const value = useContext(MusicContext)
  if (!value) throw Error("MusicProvider is required")
  return value
}
