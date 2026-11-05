import { notFound } from "next/navigation"
import { MediaVault } from "@/components/vault/media-vault"
import { PageHeading } from "@/components/layout/page-heading"
import { isLocale, localized } from "@/lib/i18n/config"
import { vaultMessages } from "@/lib/vault/messages"
import { metadataFor } from "@/lib/seo"
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const m = vaultMessages(lang)
  return {
    ...metadataFor(m.title, m.intro, "/vault", lang),
    robots: { index: false, follow: false },
  }
}
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const m = vaultMessages(lang)
  return (
    <main id="main-content">
      <PageHeading
        eyebrow={m.private}
        title={m.title}
        description={m.intro}
        back={{ href: localized("/my-album", lang), label: m.back }}
      />
      <div className="wrap">
        <MediaVault />
      </div>
    </main>
  )
}
