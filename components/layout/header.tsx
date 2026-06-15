"use client"

import { Link } from "@/components/ui/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { Sun, Moon, Search, Menu, X, Hash } from "lucide-react"
import { useTheme } from "next-themes"
import { useLang } from "@/components/providers/lang-provider"
import { cn } from "@/lib/utils"
import Fuse from "fuse.js"
import {
  getVisibleSeries,
  getVisibleNotes,
  getAllTags,
  type Series,
  type Note,
} from "@/lib/data"

const NAV_LINKS = [
  { key: "home", href: "/" },
  { key: "stories", href: "/stories" },
  { key: "notes", href: "/notes" },
  { key: "tags", href: "/tags" },
  { key: "about", href: "/about" },
] as const

const NAV_LABELS: Record<string, { en: string; vi: string }> = {
  home: { en: "Home", vi: "Trang chủ" },
  stories: { en: "Stories", vi: "Chuyện kể" },
  notes: { en: "Notes", vi: "Ghi chú" },
  tags: { en: "Tags", vi: "Thẻ" },
  about: { en: "About", vi: "Về tôi" },
}

type SearchResult =
  | { type: "story"; item: Series }
  | { type: "note"; item: Note }
  | { type: "tag"; item: { tag: string; count: number } }

const SEARCH_LABELS = {
  en: {
    placeholder: "Search posts, stories, tags… or #tag",
    noResults: "No results found.",
    stories: "Stories",
    notes: "Notes",
    tags: "Tags",
  },
  vi: {
    placeholder: "Tìm kiếm bài viết, chuyện kể… hoặc #thẻ",
    noResults: "Không tìm thấy kết quả.",
    stories: "Chuyện kể",
    notes: "Ghi chú",
    tags: "Thẻ",
  },
}

interface HeaderProps {
  onSearchOpen?: () => void
}

export function Header({ onSearchOpen: _unused }: HeaderProps) {
  const pathname = usePathname()
  const { setTheme, resolvedTheme } = useTheme()
  const { lang, setLang } = useLang()
  const [mounted, setMounted] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const [mobileOpen, setMobileOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const mobileButtonRef = useRef<HTMLButtonElement>(null)

  const [searchExpanded, setSearchExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const storyItems = getVisibleSeries(lang)
  const noteItems = getVisibleNotes(lang)
  const tagItems = getAllTags(lang)
  const storyFuse = new Fuse(storyItems, {
    keys: ["title", "description", "tags"],
    threshold: 0.35,
    includeScore: true,
  })
  const noteFuse = new Fuse(noteItems, {
    keys: ["title", "description", "tags"],
    threshold: 0.35,
    includeScore: true,
  })
  const tagFuse = new Fuse(tagItems, { keys: ["tag"], threshold: 0.3, includeScore: true })

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const handler = () => setMobileOpen(false)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [mobileOpen])

  useEffect(() => {
    if (!mobileOpen) return
    const handler = (e: MouseEvent) => {
      if (
        mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node) &&
        mobileButtonRef.current && !mobileButtonRef.current.contains(e.target as Node)
      ) {
        setMobileOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [mobileOpen])

  useEffect(() => {
    if (!searchExpanded) return
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        collapseSearch()
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [searchExpanded])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (searchExpanded) collapseSearch()
        else if (mobileOpen) setMobileOpen(false)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [searchExpanded, mobileOpen])

  const collapseSearch = () => {
    setSearchExpanded(false)
    setSearchQuery("")
    setSearchResults([])
    setShowResults(false)
  }

  const openSearch = () => {
    setSearchExpanded(true)
    setTimeout(() => searchInputRef.current?.focus(), 80)
  }

  const handleSearchInput = (value: string) => {
    setSearchQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }
    debounceRef.current = setTimeout(() => {
      if (value.trim().startsWith("#")) {
        const tagQ = value.trim().slice(1).toLowerCase()
        const matched = tagItems.filter((t) => t.tag.toLowerCase().includes(tagQ))
        setSearchResults(
          matched.slice(0, 6).map((t) => ({ type: "tag" as const, item: t }))
        )
      } else {
        const stories = storyFuse.search(value).slice(0, 3).map((r) => ({ type: "story" as const, item: r.item }))
        const notes = noteFuse.search(value).slice(0, 4).map((r) => ({ type: "note" as const, item: r.item }))
        const tags = tagFuse.search(value).slice(0, 3).map((r) => ({ type: "tag" as const, item: r.item }))
        setSearchResults([...stories, ...notes, ...tags])
      }
      setShowResults(true)
    }, 180)
  }

  const isNavActive = (href: string) => {
    if (!pathname) return false
    const cleanPath = pathname.replace(/^\/[a-z]{2}/, "") || "/"
    return href === "/" ? cleanPath === "/" : cleanPath.startsWith(href)
  }

  const SL = SEARCH_LABELS[lang]
  const storyResults = searchResults.filter((r) => r.type === "story") as { type: "story"; item: Series }[]
  const noteResults  = searchResults.filter((r) => r.type === "note")  as { type: "note";  item: Note }[]
  const tagResults   = searchResults.filter((r) => r.type === "tag")   as { type: "tag";   item: { tag: string; count: number } }[]
  const hasResults   = searchResults.length > 0

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "frosted header-fade-bottom border-b border-border/50 shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 h-14 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="font-serif text-lg font-semibold text-foreground hover:text-accent-brand transition-colors duration-150 shrink-0"
          aria-label="Vuong's Blog — home"
        >
          vuong<span className="text-accent-brand">.</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7" aria-label="Main navigation">
          {NAV_LINKS.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              className={cn(
                "text-[13px] font-medium transition-colors duration-150",
                isNavActive(href)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {NAV_LABELS[key][lang]}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <div ref={searchContainerRef} className="relative flex items-center">
            {searchExpanded ? (
              <div className="flex items-center gap-0.5">
                <div className="relative">
                  <Search
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    placeholder={SL.placeholder}
                    className="h-8 pl-7 pr-7 w-44 sm:w-60 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground text-xs outline-none focus:ring-2 focus:ring-accent-brand/30 focus:border-accent-brand/60 transition-all duration-200"
                    aria-label="Search"
                    aria-expanded={showResults && hasResults}
                    aria-haspopup="listbox"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("")
                        setSearchResults([])
                        setShowResults(false)
                        searchInputRef.current?.focus()
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Clear search"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
                <button
                  onClick={collapseSearch}
                  aria-label="Close search"
                  className="size-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={openSearch}
                aria-label="Open search"
                className="size-9 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
              >
                <Search size={16} />
              </button>
            )}

            {searchExpanded && showResults && hasResults && (
              <div
                className="absolute top-full right-0 mt-2 w-72 sm:w-80 bg-popover border border-border rounded-xl shadow-xl z-[200] overflow-hidden"
                role="listbox"
                aria-label="Search results"
              >
                {storyResults.length > 0 && (
                  <div>
                    <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {SL.stories}
                    </p>
                    {storyResults.map(({ item }) => (
                      <Link
                        key={item.slug}
                        href={`/stories/${item.slug}`}
                        onClick={collapseSearch}
                        role="option"
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <Search size={12} className="shrink-0 text-muted-foreground" />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
                {noteResults.length > 0 && (
                  <div className={storyResults.length > 0 ? "border-t border-border" : ""}>
                    <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {SL.notes}
                    </p>
                    {noteResults.map(({ item }) => (
                      <Link
                        key={item.slug}
                        href={`/notes/${item.slug}`}
                        onClick={collapseSearch}
                        role="option"
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <Search size={12} className="shrink-0 text-muted-foreground" />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
                {tagResults.length > 0 && (
                  <div className={(storyResults.length > 0 || noteResults.length > 0) ? "border-t border-border" : ""}>
                    <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {SL.tags}
                    </p>
                    {tagResults.map(({ item }) => (
                      <Link
                        key={item.tag}
                        href={`/tags/${item.tag}`}
                        onClick={collapseSearch}
                        role="option"
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <Hash size={12} className="shrink-0 text-accent-brand" />
                        <span className="truncate">{item.tag}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {searchExpanded && showResults && !hasResults && searchQuery && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-popover border border-border rounded-xl shadow-xl z-[200] px-4 py-5">
                <p className="text-sm text-muted-foreground text-center">{SL.noResults}</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setLang(lang === "en" ? "vi" : "en")}
            aria-label={`Switch to ${lang === "en" ? "Vietnamese" : "English"}`}
            className="h-9 px-2 flex items-center justify-center rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
          >
            {lang === "en" ? "VI" : "EN"}
          </button>

          {mounted && (
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
              className="size-9 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
            >
              {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}

          <div className="relative md:hidden">
            <button
              ref={mobileButtonRef}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-haspopup="menu"
              className="size-9 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
            >
              <Menu size={16} />
            </button>

            {mobileOpen && (
              <div
                ref={mobileMenuRef}
                role="menu"
                aria-label="Mobile navigation"
                className="absolute top-full right-0 mt-2 w-48 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-[200]"
              >
                {NAV_LINKS.map(({ key, href }) => (
                  <Link
                    key={key}
                    href={href}
                    role="menuitem"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center min-h-[44px] px-4 text-sm font-medium transition-colors duration-150",
                      isNavActive(href)
                        ? "text-foreground bg-muted"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    {NAV_LABELS[key][lang]}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}