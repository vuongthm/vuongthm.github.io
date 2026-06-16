"use client"

import { notFound } from "next/navigation"
import { Link } from "@/components/ui/link"
import { useState, useEffect } from "react"
import { Clock, ArrowLeft, Lock, Unlock, KeyRound } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ReadingProgressBar } from "@/components/features/reading-progress-bar"
import { BackToTop } from "@/components/features/back-to-top"
import { ShareButton } from "@/components/features/share-button"
import { TableOfContents, extractTocItems } from "@/components/features/table-of-contents"
import { ProseContent } from "@/components/content/prose-content"
import { NoteCard } from "@/components/content/note-card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import CryptoJS from "crypto-js" // Import crypto-js for client-side decryption
import { cn } from "@/lib/utils" // Import class merging utility to resolve ReferenceError
import { getNoteBySlug, getRelatedNotes, formatDate, estimateReadingTime, type Lang } from "@/lib/data"

interface NotePageClientProps {
  slug: string
  lang: Lang
}

export default function NotePageClient({ slug, lang }: NotePageClientProps) {
  const note = getNoteBySlug(slug, lang)
  if (!note) notFound()

  // State management for decryption form
  const [password, setPassword] = useState("")
  const [decryptedText, setDecryptedText] = useState<string | null>(null)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [error, setError] = useState(false)

  // Labels for multi-language display
  const LABELS = {
    en: { 
      backToNotes: "All Notes", 
      relatedPosts: "Related posts", 
      minRead: "min read", 
      lockedTitle: "Private Note",
      lockedDesc: "This note is encrypted and private. Please enter the correct password to unlock and read its content.",
      placeholder: "Enter password...",
      unlockBtn: "Unlock Note",
      wrongPassword: "Incorrect password. Please try again."
    },
    vi: { 
      backToNotes: "Tất cả ghi chú", 
      relatedPosts: "Bài liên quan", 
      minRead: "phút đọc", 
      lockedTitle: "Ghi chú riêng tư",
      lockedDesc: "Nội dung ghi chú này đã được mã hóa bảo mật. Vui lòng nhập đúng mật khẩu để mở khóa và đọc nội dung.",
      placeholder: "Nhập mật khẩu...",
      unlockBtn: "Mở khóa",
      wrongPassword: "Mật khẩu không chính xác. Vui lòng thử lại."
    },
  }
  const L = LABELS[lang]

  // Check sessionStorage on mount to keep unlocked state during the browser session
  useEffect(() => {
    if (note.isLocked) {
      const cachedPassword = sessionStorage.getItem(`unlock-note-${slug}`)
      if (cachedPassword) {
        try {
          const bytes = CryptoJS.AES.decrypt(note.content, cachedPassword)
          const decrypted = bytes.toString(CryptoJS.enc.Utf8)
          if (decrypted) {
            setDecryptedText(decrypted)
            setIsUnlocked(true)
          }
        } catch (_) {
          sessionStorage.removeItem(`unlock-note-${slug}`)
        }
      }
    }
  }, [note.isLocked, note.content, slug])

  // Decryption handler
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return

    try {
      // Attempt to decrypt the ciphertext using the user-provided password
      const bytes = CryptoJS.AES.decrypt(note.content, password.trim())
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
      toast.success(lang === "en" ? "Note unlocked" : "Đã mở khóa ghi chú")
      
      // Save password in sessionStorage to preserve unlocked state on reload
      sessionStorage.setItem(`unlock-note-${slug}`, password.trim())
    } catch (_) {
      setError(true)
      toast.error(L.wrongPassword)
    }
  }

  const related = getRelatedNotes(note, 3)
  
  // Use decrypted text if unlocked, otherwise use raw note content (for unlocked public notes)
  const displayContent = note.isLocked ? (decryptedText ?? "") : note.content
  const tocItems = extractTocItems(displayContent)
  const readingTime = estimateReadingTime(displayContent)

  return (
    <>
      <Header />
      <ReadingProgressBar tocItems={note.isLocked && !isUnlocked ? [] : tocItems} lang={lang} />
      <BackToTop />
      <main className="pt-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          
          {/* Render password prompt form if the note is locked and not yet unlocked */}
          {note.isLocked && !isUnlocked ? (
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
              
              <Link href="/notes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-8">
                <ArrowLeft size={13} /> {L.backToNotes}
              </Link>
            </div>
          ) : (
            
            /* Render standard reading view when unlocked */
            <div className="flex gap-12 py-8 sm:py-12">
              <article className="flex-1 min-w-0">
                <div className="h-10 lg:hidden" aria-hidden="true" />
                <Link href="/notes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
                  <ArrowLeft size={13} /> {L.backToNotes}
                </Link>

                <header className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-foreground leading-tight flex-1">{note.title}</h1>
                    {note.isLocked && (
                      <span className="shrink-0 size-7 rounded-full bg-accent-brand/10 border border-accent-brand/20 flex items-center justify-center text-accent-brand" title="Encrypted note">
                        <Unlock size={13} />
                      </span>
                    )}
                  </div>
                  <p className="text-base text-muted-foreground leading-relaxed mb-4">{note.description}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <time dateTime={note.date}>{formatDate(note.date, lang)}</time>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Clock size={11} /> {readingTime} {L.minRead}</span>
                  </div>
                </header>

                <div className="border-t border-border mb-8" />
                <ProseContent content={displayContent} />

                <div className="flex flex-wrap items-center justify-between gap-4 mt-10 pt-6 border-t border-border">
                  <div className="flex flex-wrap gap-1.5">
                    {note.tags.map((tag) => (
                      <Link key={tag} href={`/tags/${tag}`} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground hover:bg-accent-brand hover:text-accent-brand-foreground transition-colors duration-150">
                        {tag}
                      </Link>
                    ))}
                  </div>
                  <ShareButton title={note.title} lang={lang} />
                </div>

                {related.length > 0 && (
                  <section className="mt-12">
                    <h2 className="font-serif text-xl font-semibold text-foreground mb-4">{L.relatedPosts}</h2>
                    <div>
                      {related.map((item) => (
                        <NoteCard key={item.slug} note={item} lang={lang} variant="compact" />
                      ))}
                    </div>
                  </section>
                )}
              </article>

              {tocItems.length > 0 && (
                <aside className="hidden lg:block w-56 shrink-0">
                  <div className="sticky top-24">
                    <TableOfContents items={tocItems} lang={lang} spinningDot />
                  </div>
                </aside>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer lang={lang} />
    </>
  )
}