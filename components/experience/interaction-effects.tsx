"use client"

import { useEffect, useSyncExternalStore } from "react"
import { Moon, Sun, Volume2, VolumeX } from "lucide-react"
import { useTheme } from "next-themes"
import { useSite } from "@/components/providers/site-provider"
import { experience } from "@/lib/i18n/experience"
import {
  type Sound,
  playSound,
  setSoundEnabled,
  soundEnabled,
  subscribeSound,
  unlockSound,
} from "@/lib/interaction-sound"

const subscribe = () => () => {}
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const { dictionary: m } = useSite()
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
  const dark = mounted && resolvedTheme === "dark"
  return (
    <button
      className="icon-button theme-toggle"
      data-ui-sound="switch"
      aria-label={m.theme}
      title={m.theme}
      aria-pressed={dark}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}

export function SoundToggle() {
  const enabled = useSyncExternalStore(subscribeSound, soundEnabled, () => true)
  const { locale } = useSite()
  const t = experience[locale]
  return (
    <button
      className="icon-button sound-toggle"
      aria-label={enabled ? t.soundOn : t.soundOff}
      aria-pressed={enabled}
      title={enabled ? t.soundOn : t.soundOff}
      data-sound="off"
      onClick={() => {
        setSoundEnabled(!enabled)
        if (!enabled) {
          unlockSound()
          setTimeout(() => playSound("open"), 40)
        }
      }}
    >
      {enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
    </button>
  )
}

export function InteractionEffects() {
  useEffect(() => {
    const unlock = () => unlockSound()
    const hover = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !(event.target instanceof Element)) return
      const tag = event.target.closest(".journal-home .journal-sidebar .journal-topics a")
      if (!tag || (event.relatedTarget instanceof Node && tag.contains(event.relatedTarget))) return
      if (navigator.userActivation?.hasBeenActive) unlockSound()
      playSound("key")
    }
    const click = (event: MouseEvent) => {
      if (!event.isTrusted || !(event.target instanceof Element)) return
      // React may replace a toggle's icon before this delegated listener runs.
      const element =
        event
          .composedPath()
          .find(
            (node): node is HTMLElement =>
              node instanceof HTMLElement && node.matches("a[href],button"),
          ) ?? event.target.closest<HTMLElement>("a[href],button")
      if (
        !element ||
        element.matches(":disabled,[aria-disabled='true']") ||
        element.closest("[data-sound='off'],.music-player,.music-controls")
      )
        return
      if (
        element.getAttribute("role") === "option" &&
        element.getAttribute("aria-selected") === "true"
      )
        return
      const requested = element.dataset.uiSound
      const kind: Sound =
        requested === "menu"
          ? element.getAttribute("aria-expanded") === "true"
            ? "open"
            : "dismiss"
          : requested === "switch" ||
              requested === "select" ||
              requested === "page" ||
              requested === "lock"
            ? requested
            : element.matches(".album-photo,.photo-viewer-nav button")
              ? "page"
              : element.hasAttribute("aria-expanded")
                ? "open"
                : "tap"
      playSound(kind)
    }
    document.addEventListener("pointerdown", unlock, { passive: true })
    document.addEventListener("keydown", unlock)
    document.addEventListener("click", click)
    document.addEventListener("pointerover", hover, { passive: true })
    return () => {
      document.removeEventListener("pointerdown", unlock)
      document.removeEventListener("keydown", unlock)
      document.removeEventListener("click", click)
      document.removeEventListener("pointerover", hover)
    }
  }, [])
  return null
}
