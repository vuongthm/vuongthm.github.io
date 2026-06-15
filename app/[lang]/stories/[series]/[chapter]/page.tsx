import { getChapter, getVisibleSeries, getChaptersBySeriesSlug } from "@/lib/data"
import ChapterPageClient from "./chapter-page-client"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ lang: "en" | "vi"; series: string; chapter: string }>
}

export const dynamic = "force-static"

export async function generateStaticParams() {
  const params: { lang: string; series: string; chapter: string }[] = []
  for (const lang of ["en", "vi"] as const) {
    for (const series of getVisibleSeries(lang)) {
      for (const chapter of getChaptersBySeriesSlug(series.slug, lang)) {
        params.push({ lang, series: series.slug, chapter: chapter.slug })
      }
    }
  }
  return params
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { series, chapter, lang } = await params
  const chap = getChapter(series, chapter, lang)
  if (!chap) return {}

  return {
    title: chap.title,
    description: chap.preview,
  }
}

export default async function Page({ params }: PageProps) {
  const { series, chapter } = await params
  return <ChapterPageClient series={series} chapter={chapter} />
}