import { getSeriesBySlug, getVisibleSeries } from "@/lib/data"
import SeriesPageClient from "./series-page-client"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ lang: "en" | "vi"; series: string }>
}

export const dynamic = "force-static"

// Generate static parameters for all series across locales
export async function generateStaticParams() {
  const params: { lang: string; series: string }[] = []
  for (const lang of ["en", "vi"] as const) {
    const seriesList = getVisibleSeries(lang)
    if (seriesList.length === 0) {
      params.push({ lang, series: "placeholder" })
    } else {
      for (const series of seriesList) {
        params.push({ lang, series: series.slug })
      }
    }
  }
  return params
}

// Generate localized metadata for SEO indexing
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { series, lang } = await params
  const s = getSeriesBySlug(series, lang)
  if (!s) return {}

  return {
    title: s.title,
    description: s.description,
  }
}

// Render the standalone server page calling the client view
export default async function Page({ params }: PageProps) {
  const { series, lang } = await params
  return <SeriesPageClient series={series} lang={lang} />
}