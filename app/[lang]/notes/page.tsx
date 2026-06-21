"use client"

import { useState, useMemo, useRef, useEffect, use } from "react"
import { Search, X, Hash, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import Image from "next/image"
import Fuse from "fuse.js"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { NoteCard } from "@/components/content/note-card"
import { BackToTop } from "@/components/features/back-to-top"
import { useLang } from "@/components/providers/lang-provider"
import { getVisibleNotes } from "@/lib/data"
import { adSlides, type AdItem } from "../../../lib/ad.config"
import { Link } from "@/components/ui/link"
import { cn } from "@/lib/utils"

const COPY = {
  en: { heading: "Notes", description: "Knowledge, skills, mental models, and lessons — things I've learned and want to share.", searchPlaceholder: "Search notes… or #tag", allTags: "All", noResults: "No notes found." },
  vi: { heading: "Ghi chú", description: "Kiến thức, kỹ năng, mô hình tư duy và bài học — những thứ tôi học được và muốn chia sẻ lại.", searchPlaceholder: "Tìm kiếm ghi chú… hoặc #thẻ", allTags: "Tất cả", noResults: "Không tìm thấy ghi chú nào." },
}

const ITEMS_PER_PAGE = 6

export default function NotesPage({ params }: { params: Promise<{ lang: "en" | "vi" }> }) {
  const { lang } = use(params)
  const c = COPY[lang]
  const [query, setQuery] = useState("")
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggestionIdx, setSuggestionIdx] = useState(-1)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isMobile, setIsMobile] = useState(false)
  
  // States for automatic advertisement slideshow
  const [currentAd, setCurrentAd] = useState(0)
  const [adTransitioning, setAdTransitioning] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  
  const notes = useMemo(() => getVisibleNotes(lang), [lang])
  const noteFuse = useMemo(() => new Fuse(notes, { keys: ["title", "description", "tags"], threshold: 0.35 }), [notes])
  const allTags = useMemo(() => Array.from(new Set(notes.flatMap((note) => note.tags))).sort(), [notes])

  // Detect mobile viewports dynamically to adjust responsive pagination limits
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener("resize", check, { passive: true })
    return () => window.removeEventListener("resize", check)
  }, [])

  // Auto-rotating timer logic for the sidebar advertisement carousel
  useEffect(() => {
    if (adSlides.length <= 1) return
    const interval = setInterval(() => {
      setAdTransitioning(true)
      setTimeout(() => {
        setCurrentAd((prev) => (prev + 1) % adSlides.length)
        setAdTransitioning(false)
      }, 300) // Duration matches transition-opacity class
    }, 5000) // Rotate slide every 5 seconds
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [query, activeTag])

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

  // Get dynamic items per page limit: 4 on Mobile, 6 on Desktop
  const limit = isMobile ? 4 : 6

  // Slice results dynamically based on responsive items limit
  const paginatedNotes = useMemo(() => {
    return filtered.slice((currentPage - 1) * limit, currentPage * limit)
  }, [filtered, currentPage, limit])

  const totalPages = Math.ceil(filtered.length / limit)

  return (
    <>
      <Header />
      <BackToTop />
      <main className="pt-14">
        {/* Header container aligned with max-w-6xl for symmetry */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-12 pb-6 sm:pt-16 sm:pb-8">
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
              className="w-full h-11 pl-9 pr-9 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 transition-all border-border focus:ring-accent-brand/30 focus:border-accent-brand/60"
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

        {/* Two-column responsive grid container (max-w-6xl) */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-9 gap-10 lg:gap-14 items-start">
            
            {/* Left Column (6/9 ratio): Notes list & pagination */}
            <div className="lg:col-span-6">
              {filtered.length === 0 ? (
                <p className="text-muted-foreground text-center py-16">{c.noResults}</p>
              ) : (
                <div className="grid grid-cols-1 gap-0">
                  {paginatedNotes.map((note) => (
                    <div key={note.slug}>
                      <NoteCard note={note} lang={lang} />
                    </div>
                  ))}
                </div>
              )}

              {/* Symmetric Pagination Row */}
              {filtered.length > limit && (
                <div className="flex items-center justify-center gap-4 mt-8 select-none animate-fade-in">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                    className="size-10 rounded-full border border-border bg-background text-muted-foreground flex items-center justify-center hover:text-foreground hover:border-foreground/30 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  <span className="text-xs text-muted-foreground font-mono">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                    className="size-10 rounded-full border border-border bg-background text-muted-foreground shadow-sm flex items-center justify-center hover:text-foreground hover:border-foreground/30 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Right Column (3/9 ratio - Desktop only): Sticky Promotional Slideshow */}
            <div className="hidden lg:block lg:col-span-3 lg:sticky lg:top-24 flex flex-col gap-6">
              
              {/* Enhanced book-like card slideshow */}
              <div className="relative rounded-2xl border-y border-l border-border border-r-[6px] border-r-accent-brand bg-card p-6 shadow-sm overflow-hidden select-none transition-all duration-200 hover:shadow-md hover:border-border/80 min-h-[440px] flex flex-col justify-between">
                <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-black/10 shadow-[1px_0_3px_rgba(0,0,0,0.1)]" />
                
                {/* Visual dot indicators in the top-right corner */}
                <div className="absolute top-5 right-5 flex gap-1 z-10">
                  {adSlides.map((slide: AdItem, idx: number) => (
                    <span
                      key={slide.link + idx} // Fixed: Explicitly typed 'slide' as AdItem and 'idx' as number to satisfy strict compiler
                      className={cn(
                        "size-1.5 rounded-full transition-all duration-200",
                        idx === currentAd ? "bg-accent-brand w-3.5" : "bg-muted-foreground/25"
                      )}
                    />
                  ))}
                </div>

                {/* Fading container driven by local interval state */}
                <div 
                  className="flex flex-col justify-between h-full flex-1 transition-opacity duration-300"
                  style={{ opacity: adTransitioning ? 0 : 1 }}
                >
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-accent-brand mb-3 font-mono">
                      {adSlides[currentAd].badge[lang]}
                    </p>

                    {adSlides[currentAd].image && (
                      <div className="relative aspect-[16/10] w-full rounded-lg overflow-hidden border border-border/40 bg-muted mb-4 shadow-xs">
                        <Image
                          src={adSlides[currentAd].image}
                          alt={adSlides[currentAd].title[lang]}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 100vw, 300px"
                          priority
                        />
                      </div>
                    )}
                    
                    <h3 className="font-serif text-sm sm:text-base font-bold text-foreground leading-tight mb-2">
                      {adSlides[currentAd].title[lang]}
                    </h3>
                    
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                      {adSlides[currentAd].description[lang]}
                    </p>
                  </div>

                  <div className="pt-2">
                    <a
                      href={adSlides[currentAd].link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-brand hover:underline"
                    >
                      {adSlides[currentAd].buttonText[lang]}
                      <ArrowRight size={12} />
                    </a>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      </main>
      <Footer lang={lang} />
    </>
  )
}