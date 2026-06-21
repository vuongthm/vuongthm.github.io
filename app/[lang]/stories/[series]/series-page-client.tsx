"use client"

import { notFound } from "next/navigation"
import Image from "next/image"
import { Link } from "@/components/ui/link"
import { ArrowLeft, BookOpen, Calendar, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BackToTop } from "@/components/features/back-to-top"
import { getSeriesBySlug, getChaptersBySeriesSlug, formatDate, type Lang } from "@/lib/data"
import { cn } from "@/lib/utils"

interface SeriesPageClientProps {
  series: string
  lang: Lang
}

const STATUS_LABELS = {
  ongoing: { en: "Ongoing", vi: "Đang viết" },
  completed: { en: "Completed", vi: "Hoàn thành" },
}

export default function SeriesPageClient({ series: seriesSlug, lang }: SeriesPageClientProps) {
  const series = getSeriesBySlug(seriesSlug, lang)
  if (!series) notFound()

  const chapters = getChaptersBySeriesSlug(seriesSlug, lang)

  return (
    <>
      <Header />
      <BackToTop />
      <main className="pt-14">
        {/* Cover image banner aligned with max-w-6xl */}
        <div className="relative h-[45vh] min-h-[280px] max-h-[420px] overflow-hidden bg-muted">
          <Image src={series.coverImage} alt={series.title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
          <div className="absolute top-6 left-0 right-0 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <Link href="/stories" className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors">
              <ArrowLeft size={14} /> {lang === "en" ? "All Stories" : "Tất cả chuyện kể"}
            </Link>
          </div>
          <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-8">
            <Badge className={cn("mb-3 border-0 text-xs", series.status === "ongoing" ? "bg-accent-brand/90 text-accent-brand-foreground" : "bg-white/20 text-white")}>
              {STATUS_LABELS[series.status][lang]}
            </Badge>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-tight">{series.title}</h1>
          </div>
        </div>

        {/* Series summary aligned with max-w-6xl */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mb-6">{series.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1.5"><BookOpen size={14} /> {series.chapterCount} {lang === "en" ? "chapters" : "chương"}</span>
            <span className="flex items-center gap-1.5"><Calendar size={14} /> {lang === "en" ? "Started" : "Bắt đầu"} {formatDate(series.startDate, lang)}</span>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8"><div className="border-t border-border" /></div>

        {/* 
          Two-column grid container (max-w-6xl):
          - Splits into 6/9 left column (chapters) and 3/9 right column (sticky CSS book cover) on desktop.
          - Standard 1-column layout on mobile.
          - Applied lg:sticky lg:top-24 DIRECTLY to the lg:col-span-3 grid child to ensure perfect sticky behavior.
        */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-9 gap-10 lg:gap-14 items-start">
            
            {/* Left Column (6/9 ratio): Chapters list */}
            <div className="lg:col-span-6 min-w-0">
              <h2 className="font-serif text-xl font-semibold text-foreground mb-6">
                {lang === "en" ? "Chapters" : "Danh sách chương"}
              </h2>
              <div className="flex flex-col">
                {chapters.map((chapter) => (
                  <Link 
                    key={chapter.slug} 
                    href={`/stories/${seriesSlug}/${chapter.slug}`} 
                    className="group flex items-start gap-4 py-4 border-b border-border last:border-0 hover:bg-muted/30 -mx-3 px-3 rounded-lg transition-colors"
                  >
                    <span className="shrink-0 w-7 h-7 mt-0.5 rounded-full bg-muted flex items-center justify-center text-xs font-mono text-muted-foreground group-hover:bg-accent-brand group-hover:text-accent-brand-foreground transition-colors">
                      {chapter.part}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-medium text-foreground group-hover:text-accent-brand transition-colors mb-1">{chapter.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{chapter.preview}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(chapter.date, lang)}</p>
                    </div>
                    <ChevronRight size={16} className="shrink-0 mt-1 text-muted-foreground group-hover:text-accent-brand transition-colors" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Right Column (3/9 ratio - Desktop only): Sticky CSS Book Mockup */}
            <div className="hidden lg:flex lg:col-span-3 lg:sticky lg:top-24 flex-col items-center">
              
              {/* CSS Book Cover container */}
              <div className="relative w-48 h-64 rounded-r-lg bg-surface border-y border-r border-border shadow-md flex flex-col justify-between p-5 overflow-hidden transition-all duration-300 hover:shadow-lg border-l-[6px] border-l-accent-brand select-none">
                {/* Real book spine shadow effect */}
                <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-black/10 shadow-[1px_0_3px_rgba(0,0,0,0.1)]" />
                
                {/* Top-left category tag */}
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 font-mono">
                  {lang === "en" ? "Memoir" : "Hồi ký"}
                </div>
                
                {/* Centered book title */}
                <div className="my-auto">
                  <h3 className="font-heading text-base font-bold text-foreground leading-tight line-clamp-3">
                    {series.title}
                  </h3>
                  <div className="w-8 h-[2px] bg-accent-brand/40 mt-3" />
                </div>
                
                {/* Bottom-right author details */}
                <div className="text-right">
                  <p className="text-xs font-semibold text-foreground font-serif">
                    Vuong
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    {formatDate(series.startDate, lang)}
                  </p>
                </div>
              </div>

              {/* Excerpt under the book cover */}
              <div className="mt-6 text-center w-full max-w-xs border-t border-border/60 pt-5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80 mb-3">
                  {lang === "en" ? "EXCERPT" : "ĐỀ TỪ"}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed italic px-3">
                  &ldquo;{series.description}&rdquo;
                </p>
              </div>

            </div>

          </div>
        </div>
      </main>
      <Footer lang={lang} />
    </>
  )
}