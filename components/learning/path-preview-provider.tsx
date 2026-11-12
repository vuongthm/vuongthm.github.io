"use client"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { useSite } from "@/components/providers/site-provider"
import { Dialog } from "@/components/search/dialog"
import { LearningPathView } from "./learning-path-view"
import type { EntryMeta, LearningPath } from "@/lib/content/types"

export function PathPreviewProvider({
  paths,
  entries,
  children,
}: {
  paths: LearningPath[]
  entries: EntryMeta[]
  children: ReactNode
}) {
  const [active, setActive] = useState<LearningPath | null>(null)
  const [closing, setClosing] = useState(false)
  const origin = useRef<HTMLAnchorElement | null>(null)
  function close() {
    setClosing(true)
  }
  const pathname = usePathname(),
    { locale } = useSite()
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setActive(null)
      setClosing(false)
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname])
  useEffect(() => {
    if (!closing || !active) return
    const timer = setTimeout(
      () => {
        setActive(null)
        setClosing(false)
        requestAnimationFrame(() => {
          if (
            origin.current?.isConnected &&
            !origin.current.closest("[inert]") &&
            origin.current.getClientRects().length
          )
            origin.current.focus({ preventScroll: true })
          else {
            const fallback = Array.from(
              document.querySelectorAll<HTMLElement>(".mobile-menu-toggle,.navigation-trigger"),
            ).find((element) => element.getClientRects().length)
            fallback?.focus({ preventScroll: true })
          }
        })
      },
      matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 160,
    )
    return () => clearTimeout(timer)
  }, [closing, active])
  useEffect(() => {
    const click = (event: MouseEvent) => {
      const target =
        event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null
      if (
        !target ||
        target.hasAttribute("download") ||
        (target.target && target.target !== "_self") ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return
      const url = new URL(target.href)
      if (url.origin !== location.origin) return
      const path = paths.find(
        (item) => url.pathname.replace(/\/$/, "") === `/${locale}/paths/${item.slug}`,
      )
      // Release the overview before an article password dialog takes focus.
      if (active && (!path || target.hasAttribute("data-path-preview-skip"))) setActive(null)
      if (!path || target.hasAttribute("data-path-preview-skip") || event.defaultPrevented) return
      event.preventDefault()
      origin.current = target
      target.focus({ preventScroll: true })
      setClosing(false)
      setActive(path)
    }
    document.addEventListener("click", click, true)
    return () => document.removeEventListener("click", click, true)
  }, [active, locale, paths])
  return (
    <>
      <div className="path-preview-surface" inert={!!active}>
        {children}
      </div>
      {active && (
        <Dialog
          className={`path-preview-dialog${closing ? " is-leaving" : ""}`}
          label={active.title[locale]}
          onClose={close}
        >
          <LearningPathView path={active} entries={entries} onClose={close} />
        </Dialog>
      )}
    </>
  )
}
