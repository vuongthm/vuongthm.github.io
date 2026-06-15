"use client"

import { notFound } from "next/navigation"
import Image from "next/image"
import { Link } from "@/components/ui/link"
import { ArrowLeft, BookOpen, Calendar, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BackToTop } from "@/components/features/back-to-top"
import { useLang } from "@/components/providers/lang-provider"
import { getSeriesBySlug, getChaptersBySeriesSlug, formatDate } from "@/lib/data"
import { cn } from "@/lib/utils"

interface SeriesPageClientProps {
  series: string
}

const STATUS_LABELS = {
  ongoing: { en: "Ongoing", vi: "Đang viết" },
  completed: { en: "Completed", vi: "Hoàn thành" },
}

export default function SeriesPageClient({ series: seriesSlug }: SeriesPageClientProps) {
  const { lang } = useLang()
  const series = getSeriesBySlug(seriesSlug, lang)
  if (!series) notFound()

  const chapters = getChaptersBySeriesSlug(seriesSlug, lang)

  return (
    <>
      <Header />
      <BackToTop />
      <main className="pt-14">
        <div className="relative h-[45vh] min-h-[280px] max-h-[420px] overflow-hidden bg-muted">
          <Image src={series.coverImage} alt={series.title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
          <div className="absolute top-6 left-0 right-0 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Link href="/stories" className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors">
              <ArrowLeft size={14} /> {lang === "en" ? "All Stories" : "Tất cả chuyện kể"}
            </Link>
          </div>
          <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8">
            <Badge className={cn("mb-3 border-0 text-xs", series.status === "ongoing" ? "bg-accent-brand/90 text-accent-brand-foreground" : "bg-white/20 text-white")}>
              {STATUS_LABELS[series.status][lang]}
            </Badge>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-tight">{series.title}</h1>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mb-6">{series.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1.5"><BookOpen size={14} /> {series.chapterCount} {lang === "en" ? "chapters" : "chương"}</span>
            <span className="flex items-center gap-1.5"><Calendar size={14} /> {lang === "en" ? "Started" : "Bắt đầu"} {formatDate(series.startDate, lang)}</span>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="border-t border-border" /></div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <h2 className="font-serif text-xl font-semibold text-foreground mb-6">{lang === "en" ? "Chapters" : "Danh sách chương"}</h2>
          <div className="flex flex-col max-w-2xl">
            {chapters.map((chapter) => (
              <Link key={chapter.slug} href={`/stories/${seriesSlug}/${chapter.slug}`} className="group flex items-start gap-4 py-4 border-b border-border last:border-0 hover:bg-muted/30 -mx-3 px-3 rounded-lg transition-colors">
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
      </main>
      <Footer lang={lang} />
    </>
  )
}