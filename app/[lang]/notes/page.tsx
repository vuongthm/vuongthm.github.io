"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Search, X, Hash } from "lucide-react"
import Fuse from "fuse.js"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { NoteCard } from "@/components/content/note-card"
import { BackToTop } from "@/components/features/back-to-top"
import { useLang } from "@/components/providers/lang-provider"
import { getVisibleNotes } from "@/lib/data"
import { cn } from "@/lib/utils"

const COPY = {
  en: { heading: "Notes", description: "Knowledge, skills, mental models, and lessons — things I've learned and want to share.", searchPlaceholder: "Search notes… or #tag", allTags: "All", noResults: "No notes found." },
  vi: { heading: "Ghi chú", description: "Kiến thức, kỹ năng, mô hình tư duy và bài học — những thứ tôi học được và muốn chia sẻ lại.", searchPlaceholder: "Tìm kiếm ghi chú… hoặc #thẻ", allTags: "Tất cả", noResults: "Không tìm thấy ghi chú nào." },
}

export default function NotesPage() {
  const { lang } = useLang()
  const c = COPY[lang]
  const [query, setQuery] = useState("")
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggestionIdx, setSuggestionIdx] = useState(-1)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  
  const notes = useMemo(() => getVisibleNotes(lang), [lang])
  const noteFuse = useMemo(() => new Fuse(notes, { keys: ["title", "description", "tags"], threshold: 0.35 }), [notes])
  const allTags = useMemo(() => Array.from(new Set(notes.flatMap((note) => note.tags))).sort(), [notes])

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    if (q.startsWith("#")) {
      const tagQ = q.slice(1).toLowerCase()
      const matched = allTags.filter((t) => t.toLowerCase().includes(tagQ))
      setSuggestions(matched.map((t) => `#${t}`))
    } else {
      const results = noteFuse.search(q, { limit: 5 })
      const titles = results.map((r) => r.item.title)
      const tagMatches = allTags.filter((t) => t.toLowerCase().includes(q.toLowerCase())).map((t) => `#${t}`)
      setSuggestions([...titles, ...tagMatches].slice(0, 8))
    }
    setShowSuggestions(true)
    setSuggestionIdx(-1)
  }, [query, noteFuse, allTags])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!inputRef.current?.contains(e.target as Node) && !suggestionsRef.current?.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSuggestionIdx((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSuggestionIdx((i) => Math.max(i - 1, -1))
    } else if (e.key === "Enter" && suggestionIdx >= 0) {
      e.preventDefault()
      selectSuggestion(suggestions[suggestionIdx])
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  const selectSuggestion = (s: string) => {
    if (s.startsWith("#")) {
      setActiveTag(s.slice(1))
      setQuery("")
    } else {
      setQuery(s)
    }
    setShowSuggestions(false)
    setSuggestionIdx(-1)
  }

  const filtered = useMemo(() => {
    let currentNotes = notes
    if (query.trim().startsWith("#")) {
      const tagQ = query.trim().slice(1).toLowerCase()
      currentNotes = currentNotes.filter((n) => n.tags.some((t) => t.toLowerCase().includes(tagQ)))
    } else if (query.trim()) {
      currentNotes = noteFuse.search(query.trim()).map((r) => r.item)
    }
    if (activeTag) {
      currentNotes = currentNotes.filter((n) => n.tags.includes(activeTag))
    }
    return currentNotes
  }, [query, activeTag, notes, noteFuse])

  return (
    <>
      <Header />
      <BackToTop />
      <main className="pt-14">
        {/* Tối ưu hóa bề ngang danh mục căn lề chuẩn với thiết kế gốc */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-12 pb-6 sm:pt-16 sm:pb-8">
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground text-balance mb-3 text-center sm:text-left">{c.heading}</h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-xl text-pretty mb-8 text-center sm:text-left">{c.description}</p>

          <div className="relative mb-6">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => query && setShowSuggestions(true)}
              placeholder={c.searchPlaceholder}
              className="w-full h-11 pl-9 pr-9 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-accent-brand/30 focus:border-accent-brand/60 transition-all"
            />
            {query && (
              <button onClick={() => { setQuery(""); setSuggestions([]); setShowSuggestions(false) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            )}

            {showSuggestions && suggestions.length > 0 && (
              <div ref={suggestionsRef} className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden" role="listbox">
                {suggestions.map((s, i) => (
                  <button
                    key={s}
                    role="option"
                    aria-selected={i === suggestionIdx}
                    onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s) }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors",
                      i === suggestionIdx ? "bg-accent-brand/10 text-accent-brand" : "text-foreground hover:bg-muted"
                    )}
                  >
                    {s.startsWith("#") && <Hash size={12} className="shrink-0 text-accent-brand" />}
                    <span className="truncate">{s.startsWith("#") ? s.slice(1) : s}</span>
                    {s.startsWith("#") && <span className="ml-auto text-xs text-muted-foreground shrink-0">tag</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
            <button onClick={() => setActiveTag(null)} className={cn("px-3 py-1 rounded-full text-xs font-medium transition-colors duration-150", activeTag === null ? "bg-accent-brand text-accent-brand-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>{c.allTags}</button>
            {allTags.map((tag) => (
              <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} className={cn("px-3 py-1 rounded-full text-xs font-medium transition-colors duration-150", activeTag === tag ? "bg-accent-brand text-accent-brand-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>{tag}</button>
            ))}
          </div>
        </div>

        {/* Thiết lập danh sách 1 cột dọc (grid-cols-1) tối ưu không gian đọc và lề hover */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-16">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-16">{c.noResults}</p>
          ) : (
            <div className="grid grid-cols-1 gap-0">
              {filtered.map((note) => (
                <div key={note.slug}>
                  <NoteCard note={note} lang={lang} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer lang={lang} />
    </>
  )
}