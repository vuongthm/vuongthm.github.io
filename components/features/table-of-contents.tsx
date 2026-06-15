"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { Lang } from "@/lib/data"

export interface TocItem {
  id: string
  text: string
  level: number
}

interface TocProps {
  items: TocItem[]
  lang?: Lang
  className?: string
  spinningDot?: boolean
}

const LABEL: Record<Lang, string> = {
  en: "Table of Contents",
  vi: "Mục lục",
}

export function TableOfContents({ items, lang = "en", className, spinningDot = false }: TocProps) {
  const [activeId, setActiveId] = useState<string>("")

  useEffect(() => {
    if (items.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    )
    items.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [items])

  if (items.length === 0) return null

  return (
    <nav aria-label="Table of contents" className={cn("text-sm", className)}>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
        {LABEL[lang]}
      </p>
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const isActive = activeId === item.id
          const indent = item.level > 2 ? (item.level - 2) * 12 : 0

          return (
            <li key={item.id} style={{ paddingLeft: `${indent}px` }} className="flex items-center gap-1.5">
              {spinningDot && (
                <span
                  className={cn(
                    "shrink-0 size-2.5 rounded-full border-2 transition-colors duration-150",
                    isActive ? "border-accent-brand border-t-transparent toc-spin-dot" : "border-transparent"
                  )}
                  aria-hidden="true"
                />
              )}
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" })
                }}
                className={cn(
                  "block py-0.5 leading-snug transition-colors duration-150 flex-1",
                  isActive ? "text-accent-brand font-medium" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.text}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function extractTocItems(content: string): TocItem[] {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm
  const items: TocItem[] = []
  let match
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    const id = text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-")
    items.push({ id, text, level })
  }
  return items
}