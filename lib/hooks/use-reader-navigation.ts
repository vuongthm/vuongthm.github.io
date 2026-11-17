"use client"

import { useCallback, useEffect, useRef, useState, type RefObject } from "react"
import type { Heading } from "@/lib/content/markdown"
import { readingProgress, READING_PROGRESS_CIRCUMFERENCE } from "@/lib/reading/progress"

/** Native anchor scrolling and scroll tracking share the same CSS offsets. */
export function useReaderNavigation(
  headings: Heading[],
  articleRef: RefObject<HTMLElement | null>,
  progressRef: RefObject<HTMLDivElement | null>,
) {
  const [active, setActive] = useState(headings[0]?.id ?? "")
  const navigateRef = useRef<(id: string) => void>(() => {})

  useEffect(() => {
    const article = articleRef.current
    if (!article) return
    let frame = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    let navigating: string | null = null
    // A short last section may not reach the top of the viewport. Keep the
    // clicked heading selected there until the reader actually moves again.
    let landed: { id: string; y: number } | null = null
    const elements = () =>
      headings.flatMap((heading) => {
        const element = document.getElementById(heading.id)
        return element && article.contains(element) ? [{ ...heading, element }] : []
      })
    const update = () => {
      frame = 0
      const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
      const body = article.querySelector<HTMLElement>(".prose")
      const progress = body
        ? readingProgress(
            body.getBoundingClientRect().top,
            body.offsetHeight,
            window.innerHeight,
            padding,
          )
        : 0
      if (progressRef.current) {
        progressRef.current.querySelectorAll(".reader-progress-ring").forEach((ring) => {
          ring.setAttribute("aria-valuenow", String(Math.round(progress * 100)))
          const arc = ring.querySelector<SVGCircleElement>(".reader-progress-fill")
          if (arc) {
            arc.style.strokeDashoffset = String(READING_PROGRESS_CIRCUMFERENCE * (1 - progress))
            arc.style.strokeOpacity = progress > 0 ? "1" : "0"
          }
        })
      }
      if (navigating) return
      if (landed && Math.abs(window.scrollY - landed.y) <= 2) return
      landed = null
      const targets = elements()
      let current = targets[0]?.id ?? ""
      for (const target of targets) {
        const margin = parseFloat(getComputedStyle(target.element).scrollMarginTop) || 0
        if (target.element.getBoundingClientRect().top <= padding + margin + 2) current = target.id
      }
      setActive(current)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    const resize = () => {
      landed = null
      schedule()
    }
    const finish = () => {
      clearTimeout(timer)
      if (!navigating) return
      const target = elements().find((heading) => heading.id === navigating)?.element
      if (target) {
        const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
        const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0
        const top = Math.max(
          0,
          Math.min(
            window.scrollY + target.getBoundingClientRect().top - padding - margin,
            document.documentElement.scrollHeight - window.innerHeight,
          ),
        )
        // Page entrance animations or images can move the heading during a
        // smooth scroll. Reconcile its final position with the same CSS offset.
        if (Math.abs(window.scrollY - top) > 1) window.scrollTo({ top, behavior: "instant" })
      }
      landed = { id: navigating, y: window.scrollY }
      setActive(navigating)
      navigating = null
    }
    const scroll = () => {
      schedule()
      if (navigating) {
        clearTimeout(timer)
        timer = setTimeout(finish, 180)
      }
    }
    const interrupt = () => {
      navigating = null
      landed = null
      clearTimeout(timer)
    }
    const key = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key))
        interrupt()
    }
    const go = (id: string, replaceHash = true, focusHeading = true) => {
      const target = elements().find((heading) => heading.id === id)?.element
      if (!target) return
      clearTimeout(timer)
      landed = null
      navigating = id
      setActive(id)
      target.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        block: "start",
      })
      if (focusHeading) {
        target.setAttribute("tabindex", "-1")
        target.focus({ preventScroll: true })
      }
      if (replaceHash) history.replaceState(history.state, "", `#${encodeURIComponent(id)}`)
      timer = setTimeout(finish, 180)
    }
    navigateRef.current = go
    const fromHash = () => {
      try {
        const id = decodeURIComponent(location.hash.slice(1))
        if (id) go(id, false, false)
      } catch {
        // Ignore malformed external fragments.
      }
    }
    const anchorClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return
      const link = (event.target as Element).closest<HTMLAnchorElement>("a[href]")
      if (!link || link.target || link.hasAttribute("download")) return
      const url = new URL(link.href, location.href)
      if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return
      try {
        const id = decodeURIComponent(url.hash.slice(1))
        if (!headings.some((heading) => heading.id === id)) return
        event.preventDefault()
        go(id)
      } catch {
        // Leave malformed links to the browser.
      }
    }
    const observer = new ResizeObserver(resize)
    observer.observe(article)
    article.addEventListener("click", anchorClick)
    window.addEventListener("scroll", scroll, { passive: true })
    window.addEventListener("scrollend", finish)
    window.addEventListener("resize", resize)
    window.addEventListener("hashchange", fromHash)
    window.addEventListener("wheel", interrupt, { passive: true })
    window.addEventListener("touchstart", interrupt, { passive: true })
    window.addEventListener("pointerdown", interrupt, { passive: true })
    window.addEventListener("keydown", key)
    schedule()
    fromHash()
    return () => {
      navigateRef.current = () => {}
      observer.disconnect()
      cancelAnimationFrame(frame)
      clearTimeout(timer)
      article.removeEventListener("click", anchorClick)
      window.removeEventListener("scroll", scroll)
      window.removeEventListener("scrollend", finish)
      window.removeEventListener("resize", resize)
      window.removeEventListener("hashchange", fromHash)
      window.removeEventListener("wheel", interrupt)
      window.removeEventListener("touchstart", interrupt)
      window.removeEventListener("pointerdown", interrupt)
      window.removeEventListener("keydown", key)
    }
  }, [headings, articleRef, progressRef])

  const navigate = useCallback((id: string) => navigateRef.current(id), [])
  return { active, navigate }
}
