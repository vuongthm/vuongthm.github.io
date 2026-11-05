import { notFound } from "next/navigation"
import { isLocale } from "@/lib/i18n/config"
import { musicMessages } from "@/lib/i18n/music"
import { metadataFor } from "@/lib/seo"
import { MusicRoom } from "@/components/music/music-room"
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return isLocale(lang)
    ? metadataFor(musicMessages[lang].title, musicMessages[lang].description, "/music/", lang)
    : {}
}
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  return <MusicRoom />
}
