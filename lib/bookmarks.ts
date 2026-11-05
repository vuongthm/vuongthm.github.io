"use client"
import { useMemo, useSyncExternalStore } from "react"
import { isLocale, type Locale } from "./i18n/config"
export interface Bookmark {
  href: string
  title: string
  locale: Locale
  at: number
}
const key = "vuong:reading-list:v2",
  eventName = "vuong:bookmarks-change"
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback)
  window.addEventListener(eventName, callback)
  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener(eventName, callback)
  }
}
function snapshot() {
  try {
    const current = localStorage.getItem(key)
    if (current) return current
    const legacy: unknown = JSON.parse(localStorage.getItem("vuong:bookmarks") ?? "[]")
    return Array.isArray(legacy)
      ? JSON.stringify(legacy.map((entry) => ({ ...entry, locale: entry.lang })))
      : "[]"
  } catch {
    return "[]"
  }
}
export function useBookmarks() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "[]")
  return useMemo(() => {
    try {
      const data: unknown = JSON.parse(raw)
      return Array.isArray(data)
        ? data.filter(
            (entry): entry is Bookmark =>
              !!entry &&
              typeof entry === "object" &&
              typeof entry.href === "string" &&
              entry.href.startsWith("/") &&
              typeof entry.title === "string" &&
              typeof entry.locale === "string" &&
              isLocale(entry.locale) &&
              typeof entry.at === "number",
          )
        : []
    } catch {
      return []
    }
  }, [raw])
}
export function toggleBookmark(entry: Omit<Bookmark, "at">) {
  try {
    const parsed: unknown = JSON.parse(snapshot()),
      entries: Bookmark[] = Array.isArray(parsed)
        ? parsed.filter((value) => value && typeof value.href === "string")
        : []
    const exists = entries.some((value) => value.href === entry.href)
    localStorage.setItem(
      key,
      JSON.stringify(
        exists
          ? entries.filter((value) => value.href !== entry.href)
          : [{ ...entry, at: Date.now() }, ...entries].slice(0, 100),
      ),
    )
    window.dispatchEvent(new Event(eventName))
  } catch {
    /* Reading remains available when browser storage is disabled. */
  }
}
