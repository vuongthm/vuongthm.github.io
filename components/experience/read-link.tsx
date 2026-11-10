"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { playSound, unlockSound } from "@/lib/interaction-sound"

export function ReadLink({
  href,
  label,
  encrypted = false,
}: {
  href: string
  label: string
  encrypted?: boolean
}) {
  const timers = useRef<number[]>([])
  useEffect(() => {
    const scheduled = timers.current
    return () => scheduled.forEach(window.clearTimeout)
  }, [])
  function stop() {
    timers.current.splice(0).forEach(window.clearTimeout)
  }
  function sequence() {
    stop()
    if (navigator.userActivation?.hasBeenActive) unlockSound()
    for (let step = 0; step < 3; step++)
      timers.current.push(window.setTimeout(() => playSound("tick", step), step * 85))
  }
  return (
    <Link
      className="journal-read"
      href={href}
      prefetch={encrypted ? false : undefined}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") sequence()
      }}
      onPointerLeave={stop}
      onFocus={(event) => {
        if (event.currentTarget.matches(":focus-visible")) sequence()
      }}
      onBlur={stop}
    >
      <span>{label}</span>
      <span className="read-chevrons" aria-hidden="true">
        <ChevronRight />
        <ChevronRight />
        <ChevronRight />
      </span>
    </Link>
  )
}
