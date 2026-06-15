import { getNoteBySlug, getVisibleNotes } from "@/lib/data"
import NotePageClient from "./note-page-client"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ lang: "en" | "vi"; slug: string }>
}

export const dynamic = "force-static"

export async function generateStaticParams() {
  const params: { lang: string; slug: string }[] = []
  for (const lang of ["en", "vi"] as const) {
    for (const note of getVisibleNotes(lang)) {
      params.push({ lang, slug: note.slug })
    }
  }
  return params
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, lang } = await params
  const note = getNoteBySlug(slug, lang)
  if (!note) return {}

  return {
    title: note.title,
    description: note.description,
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params
  return <NotePageClient slug={slug} />
}