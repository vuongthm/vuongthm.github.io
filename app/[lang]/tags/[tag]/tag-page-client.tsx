"use client"

import { Link } from "@/components/ui/link"
import { ArrowLeft, BookOpen, FileText } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { getPostsByTag, estimateReadingTime, type Lang } from "@/lib/data"
import type { Series, Note } from "@/lib/data"

interface TagPageClientProps {
  tag: string
  lang: Lang
}

const COPY = {
  en: { back: "All tags", tagged: "Posts tagged", noResults: "No posts found for this tag.", story: "Story", note: "Note", minRead: "min read", chapters: (n: number) => `${n} chapter${n === 1 ? "" : "s"}` },
  vi: { back: "Tất cả thẻ", tagged: "Bài viết được gắn thẻ", noResults: "Không tìm thấy bài viết nào cho thẻ này.", story: "Chuyện kể", note: "Ghi chú", minRead: "phút đọc", chapters: (n: number) => `${n} chương` },
}

export default function TagPageClient({ tag, lang }: TagPageClientProps) {
  const c = COPY[lang]
  const decodedTag = decodeURIComponent(tag)
  const posts = getPostsByTag(decodedTag, lang)

  return (
    <>
      <Header />
      <main className="pt-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-16">
          <Link href="/tags" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft size={13} /> {c.back}
          </Link>

          <div className="mb-8 sm:mb-10">
            <p className="text-sm text-muted-foreground mb-1">{c.tagged}</p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground">#{decodedTag}</h1>
            <p className="text-muted-foreground text-sm mt-2">{posts.length} {lang === "en" ? "posts" : "bài"}</p>
          </div>

          {posts.length === 0 ? (
            <p className="text-muted-foreground text-sm">{c.noResults}</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {posts.map((post) => {
                if (post.type === "story") {
                  const series = post.item as Series
                  return (
                    <article key={series.slug} className="py-5 group">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-accent-brand/10 text-accent-brand">
                          <BookOpen size={10} /> {c.story}
                        </span>
                        <span className="text-xs text-muted-foreground">{c.chapters(series.chapterCount)}</span>
                      </div>
                      <Link href={`/stories/${series.slug}`} className="font-serif text-lg font-semibold text-foreground group-hover:text-accent-brand mb-1.5 block">
                        {series.title}
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">{series.description}</p>
                    </article>
                  )
                }

                const note = post.item as Note
                const readingTime = estimateReadingTime(note.content)
                return (
                  <article key={note.slug} className="py-5 group">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        <FileText size={10} /> {c.note}
                      </span>
                      <span className="text-xs text-muted-foreground">{readingTime} {c.minRead}</span>
                    </div>
                    <Link href={`/notes/${note.slug}`} className="font-serif text-lg font-semibold text-foreground group-hover:text-accent-brand mb-1.5 block">
                      {note.title}
                    </Link>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">{note.description}</p>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Footer lang={lang} />
    </>
  )
}