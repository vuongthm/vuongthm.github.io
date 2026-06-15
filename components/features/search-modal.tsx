"use client"

import { useEffect, useState, useRef } from "react"
import { Search, X, BookOpen, FileText, Tag } from "lucide-react"
import { Link } from "@/components/ui/link"
import Fuse from "fuse.js"
import {
  getVisibleSeries,
  getVisibleNotes,
  getAllTags,
  type Series,
  type Note,
} from "@/lib/data"
import { useLang } from "@/components/providers/lang-provider"

interface SearchResult {
  type: "story" | "note" | "tag"
  item: any
}

interface SearchModalProps {
  open: boolean
  onClose: () => void
}

const LABELS = {
  en: {
    placeholder: "Search posts, stories, tags…",
    noResults: "No results found.",
    stories: "Stories",
    notes: "Notes",
    tags: "Tags",
    shortcut: "to search",
  },
  vi: {
    placeholder: "Tìm kiếm bài viết, chuyện kể, thẻ…",
    noResults: "Không tìm thấy kết quả.",
    stories: "Chuyện kể",
    notes: "Ghi chú",
    tags: "Thẻ",
    shortcut: "để tìm kiếm",
  },
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const { lang } = useLang()
  const L = LABELS[lang]
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const storyItems = getVisibleSeries(lang)
  const noteItems = getVisibleNotes(lang)
  const tagItems = getAllTags(lang)
  
  const storyFuse = new Fuse(storyItems, { keys: ["title", "description", "tags"], threshold: 0.35 })
  const noteFuse = new Fuse(noteItems, { keys: ["title", "description", "tags"], threshold: 0.35 })
  const tagFuse = new Fuse(tagItems, { keys: ["tag"], threshold: 0.3 })
  const [isMac, setIsMac] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    setIsMac(navigator.platform.includes("Mac") || navigator.userAgent.includes("Mac"))
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
      }
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery("")
      setResults([])
    }
  }, [open])

  const handleInput = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (!value.trim()) {
        setResults([])
        return
      }
      const storyResults = storyFuse.search(value).map((r) => ({ type: "story" as const, item: r.item }))
      const noteResults = noteFuse.search(value).map((r) => ({ type: "note" as const, item: r.item }))
      const tagResults = tagFuse.search(value).slice(0, 5).map((r) => ({ type: "tag" as const, item: r.item }))
      setResults([...storyResults, ...noteResults, ...tagResults])
    }, 200)
  }

  const storyResults = results.filter((r) => r.type === "story")
  const noteResults = results.filter((r) => r.type === "note")
  const tagResults = results.filter((r) => r.type === "tag")

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-popover border border-border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={16} className="shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            placeholder={L.placeholder}
            className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button onClick={onClose} className="shrink-0 size-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {query && results.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">{L.noResults}</p>}
          {!query && (
            <p className="text-xs text-muted-foreground text-center py-8 flex items-center justify-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded border border-border text-xs font-mono">{isMac ? "⌘K" : "Ctrl+K"}</kbd>
              <span>{L.shortcut}</span>
            </p>
          )}

          {storyResults.length > 0 && (
            <div className="p-2">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1.5 uppercase tracking-wide">{L.stories}</p>
              {storyResults.map((r) => (
                <Link key={r.item.slug} href={`/stories/${r.item.slug}`} onClick={onClose} className="flex items-start gap-3 px-2 py-2.5 rounded-lg hover:bg-muted transition-colors group">
                  <BookOpen size={15} className="shrink-0 mt-0.5 text-muted-foreground group-hover:text-accent-brand" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground text-pretty leading-snug group-hover:text-accent-brand transition-colors">{r.item.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{r.item.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {noteResults.length > 0 && (
            <div className="p-2">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1.5 uppercase tracking-wide">{L.notes}</p>
              {noteResults.map((r) => (
                <Link key={r.item.slug} href={`/notes/${r.item.slug}`} onClick={onClose} className="flex items-start gap-3 px-2 py-2.5 rounded-lg hover:bg-muted transition-colors group">
                  <FileText size={15} className="shrink-0 mt-0.5 text-muted-foreground group-hover:text-accent-brand" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground text-pretty leading-snug group-hover:text-accent-brand transition-colors">{r.item.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{r.item.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {tagResults.length > 0 && (
            <div className="p-2">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1.5 uppercase tracking-wide">{L.tags}</p>
              <div className="px-2 py-2 flex flex-wrap gap-1.5">
                {tagResults.map((r) => (
                  <Link key={r.item.tag} href={`/tags/${r.item.tag}`} onClick={onClose} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs hover:bg-accent-brand hover:text-accent-brand-foreground transition-colors">
                    <Tag size={10} />
                    {r.item.tag} <span className="opacity-60">({r.item.count})</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}