"use client"
import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { useSite } from "@/components/providers/site-provider"
import type { Locale } from "@/lib/i18n/config"
export function GlossaryTerm({
  children,
  term,
  definition,
}: {
  children: ReactNode
  term: string
  definition: string | Record<Locale, string>
}) {
  const { locale } = useSite(),
    id = useId(),
    trigger = useRef<HTMLButtonElement>(null),
    note = useRef<HTMLSpanElement>(null),
    pinned = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [open, setOpen] = useState(false),
    [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  function cancel() {
    if (timer.current) clearTimeout(timer.current)
  }
  function show() {
    cancel()
    if (!open) setPosition(null)
    setOpen(true)
  }
  function hide() {
    cancel()
    if (!pinned.current) timer.current = setTimeout(() => setOpen(false), 120)
  }
  useEffect(() => {
    if (!open) return
    const place = () => {
      const anchor = trigger.current?.getBoundingClientRect(),
        box = note.current?.getBoundingClientRect()
      if (!anchor || !box) return
      setPosition({
        left: Math.max(
          12,
          Math.min(innerWidth - box.width - 12, anchor.left + anchor.width / 2 - box.width / 2),
        ),
        top:
          anchor.top - box.height - 10 > 8
            ? anchor.top - box.height - 10
            : Math.min(innerHeight - box.height - 12, anchor.bottom + 10),
      })
    }
    const frame = requestAnimationFrame(place)
    const outside = (event: PointerEvent) => {
      if (
        !trigger.current?.contains(event.target as Node) &&
        !note.current?.contains(event.target as Node)
      ) {
        pinned.current = false
        setOpen(false)
      }
    }
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation()
        pinned.current = false
        setOpen(false)
      }
    }
    window.addEventListener("resize", place)
    window.addEventListener("scroll", place, true)
    document.addEventListener("pointerdown", outside)
    document.addEventListener("keydown", key)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", place)
      window.removeEventListener("scroll", place, true)
      document.removeEventListener("pointerdown", outside)
      document.removeEventListener("keydown", key)
    }
  }, [open])
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )
  return (
    <>
      <button
        type="button"
        ref={trigger}
        className="glossary-term"
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") show()
        }}
        onPointerLeave={hide}
        onFocus={() => {
          if (trigger.current?.matches(":focus-visible")) show()
        }}
        onBlur={() => {
          pinned.current = false
          hide()
        }}
        onClick={() => {
          cancel()
          if (pinned.current) {
            pinned.current = false
            setOpen(false)
          } else {
            pinned.current = true
            show()
          }
        }}
      >
        {children}
      </button>
      {open &&
        createPortal(
          <span
            ref={note}
            id={id}
            role="tooltip"
            className="glossary-note"
            style={position ?? { visibility: "hidden" }}
            onPointerEnter={cancel}
            onPointerLeave={hide}
          >
            <strong>{term}</strong>
            <span>{typeof definition === "string" ? definition : definition[locale]}</span>
          </span>,
          document.body,
        )}
    </>
  )
}
