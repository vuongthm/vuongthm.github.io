"use client"

import { useEffect, useState, useRef } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TocItem } from "@/components/features/table-of-contents"
import type { Lang } from "@/lib/data"

interface ReadingProgressBarProps {
  tocItems?: TocItem[]
  lang?: Lang
}

const LABEL: Record<Lang, string> = {
  en: "Table of Contents",
  vi: "Mục lục",
}

function CircularProgress({ progress }: { progress: number }) {
  const circumference = 62.83
  const offset = circumference - (progress / 100) * circumference
  return (
    <div className="relative shrink-0 size-4" aria-hidden="true">
      <svg className="size-4 -rotate-90" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-muted-foreground/20"
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-accent-brand transition-[stroke-dashoffset] duration-75 ease-linear"
        />
      </svg>
    </div>
  )
}

export function ReadingProgressBar({
  tocItems = [],
  lang = "en",
}: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0)
  const [activeId, setActiveId] = useState<string>("")
  const [tocOpen, setTocOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener("resize", check, { passive: true })
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight <= 0) return
      setProgress(Math.min(100, (scrollTop / docHeight) * 100))
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (tocItems.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) setActiveId(visible[0].target.id)
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    )
    tocItems.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [tocItems])

  useEffect(() => {
    if (!tocOpen) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setTocOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [tocOpen])

  const activeItem = tocItems.find((t) => t.id === activeId)
  const hasToc = tocItems.length > 0

  if (!isMobile) {
    return (
      <div
        className="fixed top-14 left-0 right-0 z-[55] h-[2px] bg-transparent pointer-events-none"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Reading progress"
      >
        <div
          className="h-full bg-accent-brand transition-[width] duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="fixed top-14 left-0 right-0 z-[55] lg:hidden"
    >
      <div className="relative h-10 frosted border-b border-border/50">
        <div
          className="absolute inset-y-0 left-0 bg-accent-brand/10 transition-[width] duration-75 ease-linear pointer-events-none"
          style={{ width: `${progress}%` }}
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 left-0 h-[2px] bg-accent-brand transition-[width] duration-75 ease-linear pointer-events-none"
          style={{ width: `${progress}%` }}
          aria-hidden="true"
        />

        {hasToc ? (
          <button
            onClick={() => setTocOpen((o) => !o)}
            className="relative flex items-center w-full h-full px-4 gap-2 text-left"
            aria-expanded={tocOpen}
            aria-label={tocOpen ? "Collapse table of contents" : "Expand table of contents"}
          >
            <CircularProgress progress={progress} />
            <span className="flex-1 text-xs truncate leading-none">
              {activeItem ? (
                <span className="text-foreground font-medium">{activeItem.text}</span>
              ) : (
                <span className="text-muted-foreground">{LABEL[lang]}</span>
              )}
            </span>
            <span className="shrink-0 text-muted-foreground">
              {tocOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </button>
        ) : (
          <div className="relative flex items-center w-full h-full px-4 gap-2" aria-hidden="true">
            <CircularProgress progress={progress} />
          </div>
        )}
      </div>

      {tocOpen && hasToc && (
        <div className="frosted border-b border-border/50 px-4 py-3 max-h-[60vh] overflow-y-auto">
          <nav aria-label="Table of contents">
            <ul className="flex flex-col gap-0.5">
              {tocItems.map((item) => (
                <li
                  key={item.id}
                  style={{
                    paddingLeft: item.level > 2 ? `${(item.level - 2) * 12}px` : 0,
                  }}
                >
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" })
                      setTocOpen(false)
                    }}
                    className={cn(
                      "block py-1.5 text-sm leading-snug transition-colors duration-150",
                      activeId === item.id
                        ? "text-accent-brand font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </div>
  )
}