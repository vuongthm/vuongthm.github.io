import { notFound } from "next/navigation"
import { Document } from "@/components/providers/document"
import { SiteProvider } from "@/components/providers/site-provider"
import { MusicProvider } from "@/components/music/music-provider"
import music from "@/generated/music.json"
import type { MusicTrack } from "@/lib/music/types"
import { SiteShell } from "@/components/layout/site-shell"
import { isLocale, localeCodes } from "@/lib/i18n/config"
import { getEntryMeta } from "@/lib/content/server"
import { PageAccess } from "@/components/providers/page-access"
import access from "@/generated/access.json"
import type { AccessRule } from "@/lib/content/access"
import search from "@/generated/search.json"
import type { SearchEntry } from "@/lib/content/types"
export function generateStaticParams() {
  return localeCodes.map((lang) => ({ lang }))
}
export const dynamicParams = false
export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  return (
    <Document locale={lang}>
      <SiteProvider
        locale={lang}
        searchEntries={getEntryMeta(lang)
          .filter((meta) => !meta.encrypted)
          .map((meta) => ({
            ...((search as SearchEntry[]).find((entry) => entry.href === meta.href) ?? {
              excerpt: "",
            }),
            ...meta,
          }))}
      >
        <MusicProvider tracks={music as MusicTrack[]}>
          <SiteShell>
            <PageAccess rules={access as AccessRule[]}>{children}</PageAccess>
          </SiteShell>
        </MusicProvider>
      </SiteProvider>
    </Document>
  )
}
