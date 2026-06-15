import { getSeriesBySlug, getVisibleSeries } from "@/lib/data"
import SeriesPageClient from "./series-page-client"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ lang: "en" | "vi"; series: string }>
}

export const dynamic = "force-static"

export async function generateStaticParams() {
  const params: { lang: string; series: string }[] = []
  for (const lang of ["en", "vi"] as const) {
    for (const series of getVisibleSeries(lang)) {
      params.push({ lang, series: series.slug })
    }
  }
  return params
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { series, lang } = await params
  const s = getSeriesBySlug(series, lang)
  if (!s) return {}

  return {
    title: s.title,
    description: s.description,
  }
}

export default async function Page({ params }: PageProps) {
  const { series } = await params
  return <SeriesPageClient series={series} />
}