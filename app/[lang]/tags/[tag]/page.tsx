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
    const tags = getAllTags(lang)
    if (tags.length === 0) {
      params.push({ lang, tag: "placeholder" })
    } else {
      for (const { tag } of tags) {
        params.push({ lang, tag })
      }
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
  const { tag, lang } = await params
  return <TagPageClient tag={tag} lang={lang} />
}