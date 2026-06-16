"use client"

import { notFound } from "next/navigation"
import { Link } from "@/components/ui/link"
import { useEffect, useRef, useState } from "react"
import { ArrowLeft, List, X, Lock, Unlock, KeyRound } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ReadingProgressBar } from "@/components/features/reading-progress-bar"
import { BackToTop } from "@/components/features/back-to-top"
import { ShareButton } from "@/components/features/share-button"
import { ProseContent } from "@/components/content/prose-content"
import { extractTocItems } from "@/components/features/table-of-contents"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import CryptoJS from "crypto-js" // Import crypto-js for client-side decryption
import { getChapter, getChaptersBySeriesSlug, getSeriesBySlug, formatDate, estimateReadingTime, type Lang } from "@/lib/data"
import { cn } from "@/lib/utils"

interface ChapterPageClientProps {
  series: string
  chapter: string
  lang: Lang
}

export default function ChapterPageClient({ series: seriesSlug, chapter: chapterSlug, lang }: ChapterPageClientProps) {
  const [chapterPanelOpen, setChapterPanelOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const series = getSeriesBySlug(seriesSlug, lang)
  const chapter = getChapter(seriesSlug, chapterSlug, lang)
  if (!chapter || !series) notFound()

  // State management for decryption form
  const [password, setPassword] = useState("")
  const [decryptedText, setDecryptedText] = useState<string | null>(null)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [error, setError] = useState(false)

  const chapters = getChaptersBySeriesSlug(seriesSlug, lang)
  const currentIdx = chapters.findIndex((item) => item.slug === chapterSlug)
  const prevChapter = currentIdx > 0 ? chapters[currentIdx - 1] : null
  const nextChapter = currentIdx < chapters.length - 1 ? chapters[currentIdx + 1] : null

  // Labels for multi-language display
  const LABELS = {
    en: { 
      chapter: "Chapter", 
      prev: "Previous", 
      next: "Next", 
      chapters: "Chapters", 
      minRead: "min read",
      lockedTitle: "Private Chapter",
      lockedDesc: "This chapter is encrypted and private. Please enter the correct password to unlock and read its content.",
      placeholder: "Enter password...",
      unlockBtn: "Unlock Chapter",
      wrongPassword: "Incorrect password. Please try again."
    },
    vi: { 
      chapter: "Chương", 
      prev: "Chương trước", 
      next: "Chương tiếp", 
      chapters: "Danh sách chương", 
      minRead: "phút đọc",
      lockedTitle: "Chương riêng tư",
      lockedDesc: "Nội dung chương truyện này đã được mã hóa bảo mật. Vui lòng nhập đúng mật khẩu để mở khóa và đọc nội dung.",
      placeholder: "Nhập mật khẩu...",
      unlockBtn: "Mở khóa",
      wrongPassword: "Mật khẩu không chính xác. Vui lòng thử lại."
    },
  }
  const L = LABELS[lang]

  // Check sessionStorage on mount to keep unlocked state during the browser session
  useEffect(() => {
    if (chapter.isLocked) {
      const cachedPassword = sessionStorage.getItem(`unlock-chapter-${seriesSlug}-${chapterSlug}`)
      if (cachedPassword) {
        try {
          const bytes = CryptoJS.AES.decrypt(chapter.content, cachedPassword)
          const decrypted = bytes.toString(CryptoJS.enc.Utf8)
          if (decrypted) {
            setDecryptedText(decrypted)
            setIsUnlocked(true)
          }
        } catch (_) {
          sessionStorage.removeItem(`unlock-chapter-${seriesSlug}-${chapterSlug}`)
        }
      }
    }
  }, [chapter.isLocked, chapter.content, seriesSlug, chapterSlug])

  // Decryption handler
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return

    try {
      // Attempt to decrypt using user-provided password
      const bytes = CryptoJS.AES.decrypt(chapter.content, password.trim())
      const decrypted = bytes.toString(CryptoJS.enc.Utf8)

      // If decryption fails, the resulting string will be empty
      if (!decrypted) {
        setError(true)
        toast.error(L.wrongPassword)
        return
      }

      // Unlock successful
      setDecryptedText(decrypted)
      setIsUnlocked(true)
      setError(false)
      toast.success(lang === "en" ? "Chapter unlocked" : "Đã mở khóa chương")
      
      // Save password in sessionStorage to preserve unlocked state on reload
      sessionStorage.setItem(`unlock-chapter-${seriesSlug}-${chapterSlug}`, password.trim())
    } catch (_) {
      setError(true)
      toast.error(L.wrongPassword)
    }
  }

  useEffect(() => {
    if (!chapterPanelOpen) return
    const handler = (e: MouseEvent | TouchEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setChapterPanelOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    document.addEventListener("touchstart", handler)
    return () => {
      document.removeEventListener("mousedown", handler)
      document.removeEventListener("touchstart", handler)
    }
  }, [chapterPanelOpen])

  // Use decrypted text if unlocked, otherwise use raw chapter content (for unlocked public chapters)
  const displayContent = chapter.isLocked ? (decryptedText ?? "") : chapter.content
  const chapterTocItems = extractTocItems(displayContent)
  const readingTime = estimateReadingTime(displayContent)

  return (
    <>
      <Header />
      <ReadingProgressBar tocItems={chapter.isLocked && !isUnlocked ? [] : chapterTocItems} lang={lang} />
      <BackToTop />

      {/* Floating mobile list toggle button */}
      <div className="fixed bottom-[76px] right-6 z-40 lg:hidden">
        <button 
          onClick={() => setChapterPanelOpen((v) => !v)} 
          aria-label={L.chapters} 
          className="size-10 flex items-center justify-center rounded-full bg-background border border-border shadow-lg text-muted-foreground hover:text-foreground hover:border-accent-brand/50 transition-all cursor-pointer"
        >
          <List size={16} />
        </button>
      </div>

      {/* Mobile Chapters selection panel with frosted glass background */}
      {chapterPanelOpen && (
        <div className="fixed inset-0 z-[60] flex items-end lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setChapterPanelOpen(false)} />
          <div ref={panelRef} className="relative w-full frosted border-t border-border rounded-t-2xl max-h-[70vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <List size={14} className="text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">{L.chapters}</p>
              </div>
              <button onClick={() => setChapterPanelOpen(false)} className="size-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            </div>
            <div className="px-5 py-2.5 border-b border-border/50 shrink-0">
              <Link href={`/stories/${seriesSlug}`} onClick={() => setChapterPanelOpen(false)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft size={12} /> {series.title}
              </Link>
            </div>
            <nav className="overflow-y-auto flex-1 px-4 py-3">
              <ul className="flex flex-col gap-0.5">
                {chapters.map((item) => (
                  <li key={item.slug}>
                    <Link href={`/stories/${seriesSlug}/${item.slug}`} onClick={() => setChapterPanelOpen(false)} className={cn("flex items-start gap-2.5 min-h-[44px] py-2.5 px-3 rounded-lg text-sm transition-colors", item.slug === chapterSlug ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground")}>
                      <span className="shrink-0 text-xs text-muted-foreground mt-0.5 w-5 text-right font-mono">{item.part}.</span>
                      <span>{item.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Main content reader section */}
      <main className="pt-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          
          {/* Render password prompt form if the chapter is locked and not yet unlocked */}
          {chapter.isLocked && !isUnlocked ? (
            <div className="flex flex-col items-center justify-center min-h-[70vh] max-w-md mx-auto py-12 px-4">
              <div className="size-16 rounded-2xl bg-muted border border-border flex items-center justify-center text-accent-brand mb-6 shadow-xs animate-bounce">
                <Lock size={28} />
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground text-center mb-3">
                {L.lockedTitle}
              </h1>
              <p className="text-sm text-muted-foreground text-center leading-relaxed mb-8">
                {L.lockedDesc}
              </p>
              
              <form onSubmit={handleUnlock} className="w-full flex flex-col gap-3">
                <div className="relative w-full">
                  <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={L.placeholder}
                    className={cn(
                      "w-full h-11 pl-10 pr-4 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 transition-all",
                      error 
                        ? "border-destructive focus:ring-destructive/20" 
                        : "border-border focus:ring-accent-brand/30 focus:border-accent-brand/60"
                    )}
                    required
                  />
                </div>
                <Button type="submit" variant="default" className="h-11 rounded-xl text-sm font-medium w-full flex items-center gap-2 cursor-pointer bg-accent-brand hover:opacity-95 border-0">
                  <Unlock size={14} />
                  {L.unlockBtn}
                </Button>
              </form>
              
              <Link href={`/stories/${seriesSlug}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-8">
                <ArrowLeft size={13} /> {series.title}
              </Link>
            </div>
          ) : (
            
            /* Render standard chapter reading view when unlocked */
            <div className="flex gap-8 lg:gap-10 py-8 sm:py-12">
              
              {/* Desktop Left Sidebar */}
              <aside className="hidden lg:block w-52 shrink-0">
                <div className="sticky top-20">
                  <Link href={`/stories/${seriesSlug}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
                    <ArrowLeft size={13} /> {series.title}
                  </Link>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">{L.chapters}</p>
                  <nav className="flex flex-col gap-0.5">
                    {chapters.map((item) => (
                      <Link key={item.slug} href={`/stories/${seriesSlug}/${item.slug}`} className={cn("flex items-start gap-2 py-1.5 px-2 rounded-md text-sm transition-colors", item.slug === chapterSlug ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground")}>
                        <span className="shrink-0 text-xs text-muted-foreground mt-0.5 w-4 text-right">{item.part}.</span>
                        <span className="line-clamp-2">{item.title}</span>
                      </Link>
                    ))}
                  </nav>
                </div>
              </aside>

              {/* Main reading content */}
              <article className="flex-1 min-w-0">
                <div className="h-10 lg:hidden" aria-hidden="true" />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6 flex-wrap">
                  <Link href="/stories" className="hover:text-foreground">Stories</Link>
                  <span>/</span>
                  <Link href={`/stories/${seriesSlug}`} className="hover:text-foreground">{series.title}</Link>
                  <span>/</span>
                  <span className="text-foreground">{L.chapter} {chapter.part}</span>
                </div>

                <header className="mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-mono uppercase tracking-widest text-accent-brand flex-1">{L.chapter} {chapter.part}</p>
                    {chapter.isLocked && (
                      <span className="shrink-0 size-7 rounded-full bg-accent-brand/10 border border-accent-brand/20 flex items-center justify-center text-accent-brand" title="Encrypted chapter">
                        <Unlock size={13} />
                      </span>
                    )}
                  </div>
                  <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-foreground leading-tight mb-4">{chapter.title}</h1>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <time dateTime={chapter.date}>{formatDate(chapter.date, lang)}</time>
                    <span>·</span>
                    <span>{readingTime} {L.minRead}</span>
                  </div>
                </header>

                <ProseContent content={displayContent} />
                <div className="flex items-center justify-end mt-10 pt-6 border-t border-border">
                  <ShareButton title={chapter.title} lang={lang} />
                </div>

                <nav className="grid grid-cols-2 gap-3 mt-6">
                  <div>
                    {prevChapter ? (
                      <Link href={`/stories/${seriesSlug}/${prevChapter.slug}`} className="group flex flex-col gap-1.5 py-3 px-4 h-full rounded-xl border border-border hover:border-accent-brand/40 transition-all">
                        <span className="text-xs text-muted-foreground group-hover:text-accent-brand">{L.prev}</span>
                        <span className="text-sm font-medium text-foreground group-hover:text-accent-brand line-clamp-2">{prevChapter.title}</span>
                      </Link>
                    ) : (
                      <div className="py-3 px-4 h-full rounded-xl border border-border/40 opacity-40">
                        <span className="text-xs text-muted-foreground">{L.prev}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    {nextChapter ? (
                      <Link href={`/stories/${seriesSlug}/${nextChapter.slug}`} className="group flex flex-col gap-1.5 py-3 px-4 h-full rounded-xl border border-border hover:border-accent-brand/40 transition-all text-right">
                        <span className="text-xs text-muted-foreground group-hover:text-accent-brand">{L.next}</span>
                        <span className="text-sm font-medium text-foreground group-hover:text-accent-brand line-clamp-2">{nextChapter.title}</span>
                      </Link>
                    ) : (
                      <div className="py-3 px-4 h-full rounded-xl border border-border/40 opacity-40 text-right">
                        <span className="text-xs text-muted-foreground">{L.next}</span>
                      </div>
                    )}
                  </div>
                </nav>
              </article>
            </div>
          )}
        </div>
      </main>
      <Footer lang={lang} />
    </>
  )
}