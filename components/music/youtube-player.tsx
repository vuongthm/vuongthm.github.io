"use client"
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
interface Player {
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (value: number, allowSeekAhead: boolean) => void
  setVolume: (value: number) => void
  mute: () => void
  unMute: () => void
  setPlaybackRate: (value: number) => void
  getCurrentTime: () => number
  getDuration: () => number
  destroy: () => void
  getIframe: () => HTMLIFrameElement
}
interface API {
  Player: new (element: HTMLElement, options: Record<string, unknown>) => Player
}
declare global {
  interface Window {
    YT?: API
    onYouTubeIframeAPIReady?: () => void
  }
}
let loading: Promise<API> | null = null
function loadAPI() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (loading) return loading
  loading = new Promise<API>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady
    const timer = setTimeout(() => {
      loading = null
      reject(Error("youtube unavailable"))
    }, 15000)
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      clearTimeout(timer)
      if (window.YT) resolve(window.YT)
    }
    const script = document.createElement("script")
    script.src = "https://www.youtube.com/iframe_api"
    script.async = true
    script.onerror = () => {
      clearTimeout(timer)
      loading = null
      script.remove()
      reject(Error("youtube unavailable"))
    }
    document.head.append(script)
  })
  return loading
}
export interface YouTubeControls {
  play: () => void
  pause: () => void
  seek: (value: number) => void
  volume: (value: number) => void
  mute: (value: boolean) => void
  speed: (value: number) => void
}
export const YouTubePlayer = forwardRef<
  YouTubeControls,
  {
    id: string
    title: string
    autoPlay: boolean
    volume: number
    muted: boolean
    speed: number
    onTime: (time: number, duration: number) => void
    onPlaying: (value: boolean) => void
    onEnd: () => void
    onError: () => void
  }
>(function YouTubePlayer(props, ref) {
  const container = useRef<HTMLDivElement>(null),
    player = useRef<Player | null>(null),
    ready = useRef(false),
    pending = useRef(props.autoPlay),
    callbacks = useRef(props)
  useEffect(() => {
    callbacks.current = props
  }, [props])
  useImperativeHandle(
    ref,
    () => ({
      play: () => {
        pending.current = true
        if (ready.current) player.current?.playVideo()
      },
      pause: () => {
        pending.current = false
        if (ready.current) player.current?.pauseVideo()
      },
      seek: (value) => {
        if (ready.current) player.current?.seekTo(value, true)
      },
      volume: (value) => {
        if (ready.current) player.current?.setVolume(value * 100)
      },
      mute: (value) => {
        if (ready.current) {
          if (value) player.current?.mute()
          else player.current?.unMute()
        }
      },
      speed: (value) => {
        if (ready.current) player.current?.setPlaybackRate(value)
      },
    }),
    [],
  )
  useEffect(() => {
    let alive = true,
      owned: Player | null = null
    // Render the standard embed immediately; its own controls still work if the parent API script is blocked.
    const host = document.createElement("iframe")
    host.title = props.title
    host.src = `https://www.youtube-nocookie.com/embed/${props.id}?enablejsapi=1&playsinline=1&rel=0&origin=${encodeURIComponent(location.origin)}`
    host.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen"
    host.allowFullscreen = true
    host.referrerPolicy = "strict-origin-when-cross-origin"
    container.current?.append(host)
    loadAPI()
      .then((api) => {
        if (!alive) return
        owned = new api.Player(host, {
          events: {
            onReady: () => {
              if (!alive || !owned) return
              ready.current = true
              const current = callbacks.current
              owned.getIframe().title = current.title
              owned.getIframe().referrerPolicy = "strict-origin-when-cross-origin"
              owned.setVolume(current.volume * 100)
              if (current.muted) owned.mute()
              owned.setPlaybackRate(current.speed)
              current.onTime(owned.getCurrentTime(), owned.getDuration())
              if (pending.current) owned.playVideo()
            },
            onStateChange: (event: { data: number }) => {
              if (!alive) return
              callbacks.current.onPlaying(event.data === 1)
              if (event.data === 0) callbacks.current.onEnd()
            },
            onError: () => {
              if (alive) callbacks.current.onError()
            },
          },
        })
        player.current = owned
      })
      .catch(() => {
        if (alive) callbacks.current.onError()
      })
    const timer = setInterval(() => {
      if (alive && ready.current && owned)
        callbacks.current.onTime(owned.getCurrentTime(), owned.getDuration())
    }, 500)
    return () => {
      alive = false
      ready.current = false
      clearInterval(timer)
      owned?.destroy()
      host.remove()
      player.current = null
    }
  }, [props.id, props.title])
  return <div className="music-video" ref={container} />
})
