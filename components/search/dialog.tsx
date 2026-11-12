"use client"
import { useScrollLock } from "@/lib/hooks/use-scroll-lock"
import { useEffect, useRef, type ReactNode } from "react"
export function Dialog({
  label,
  onClose,
  children,
  className = "",
}: {
  label: string
  onClose: () => void
  children: ReactNode
  className?: string
}) {
  useScrollLock(true)
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])
  useEffect(() => {
    const previous = document.activeElement as HTMLElement
    const focusable = () =>
      Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input,textarea,select,[tabindex="0"]',
        ) ?? [],
      ).filter((el) => el.getClientRects().length > 0)
    focusable()[0]?.focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        closeRef.current()
      }
      if (e.key === "Tab") {
        const list = focusable(),
          first = list[0],
          last = list[list.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener("keydown", key)
    return () => {
      document.removeEventListener("keydown", key)
      previous?.focus()
    }
  }, [])
  return (
    <div
      className={`dialog-backdrop ${className}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="dialog-panel" role="dialog" aria-modal="true" aria-label={label} ref={ref}>
        {children}
      </div>
    </div>
  )
}
