import { getAllTags } from "@/lib/data"
import TagPageClient from "./tag-page-client"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ lang: "en" | "vi"; tag: string }>
}

export const dynamic = "force-static"

export async function generateStaticParams() {
  const params: { lang: string; tag: string }[] = []
  for (const lang of ["en", "vi"] as const) {
    for (const { tag } of getAllTags(lang)) {
      params.push({ lang, tag })
    }
  }
  return params
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag } = await params
  const decodedTag = decodeURIComponent(tag)
  return {
    title: `#${decodedTag}`,
    description: `Posts tagged with #${decodedTag}`,
  }
}

export default async function Page({ params }: PageProps) {
  const { tag } = await params
  return <TagPageClient tag={tag} />
}