"use client"

import { notFound } from "next/navigation"
import { Link } from "@/components/ui/link"
import { Clock, ArrowLeft } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ReadingProgressBar } from "@/components/features/reading-progress-bar"
import { BackToTop } from "@/components/features/back-to-top"
import { ShareButton } from "@/components/features/share-button"
import { TableOfContents, extractTocItems } from "@/components/features/table-of-contents"
import { ProseContent } from "@/components/content/prose-content"
import { NoteCard } from "@/components/content/note-card"
import { useLang } from "@/components/providers/lang-provider"
import { getNoteBySlug, getRelatedNotes, formatDate, estimateReadingTime } from "@/lib/data"

interface NotePageClientProps {
  slug: string
}

export default function NotePageClient({ slug }: NotePageClientProps) {
  const { lang } = useLang()
  const note = getNoteBySlug(slug, lang)
  if (!note) notFound()

  const related = getRelatedNotes(note, 3)
  const tocItems = extractTocItems(note.content)
  const readingTime = estimateReadingTime(note.content)

  const LABELS = {
    en: { backToNotes: "All Notes", relatedPosts: "Related posts", minRead: "min read", comments: "Comments" },
    vi: { backToNotes: "Tất cả ghi chú", relatedPosts: "Bài liên quan", minRead: "phút đọc", comments: "Bình luận" },
  }
  const L = LABELS[lang]

  return (
    <>
      <Header />
      <ReadingProgressBar tocItems={tocItems} lang={lang} />
      <BackToTop />
      <main className="pt-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-12 py-8 sm:py-12">
            <article className="flex-1 min-w-0">
              <div className="h-10 lg:hidden" aria-hidden="true" />
              <Link href="/notes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
                <ArrowLeft size={13} /> {L.backToNotes}
              </Link>

              <header className="mb-8">
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-semibold text-foreground leading-tight mb-4">{note.title}</h1>
                <p className="text-base text-muted-foreground leading-relaxed mb-4">{note.description}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <time dateTime={note.date}>{formatDate(note.date, lang)}</time>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Clock size={11} /> {readingTime} {L.minRead}</span>
                </div>
              </header>

              <div className="border-t border-border mb-8" />
              <ProseContent content={note.content} />

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
        </div>
      </main>
      <Footer lang={lang} />
    </>
  )
}