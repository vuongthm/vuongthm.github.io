import Link from "next/link"
import { existsSync } from "node:fs"
import path from "node:path"
import { ArrowLeft, ArrowUpRight, Mail, Network } from "lucide-react"
import { notFound } from "next/navigation"
import { isLocale, localized } from "@/lib/i18n/config"
import { friendsMessages } from "@/lib/i18n/friends"
import { metadataFor } from "@/lib/seo"
import { siteConfig } from "@/lib/site.config"
import { FriendsDirectory } from "@/components/friends/friends-directory"
import data from "@/site/friends.json"
import type { Friend } from "@/lib/friends/directory"
const friends: Friend[] = data
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return isLocale(lang)
    ? metadataFor(friendsMessages[lang].title, friendsMessages[lang].description, "/friends/", lang)
    : {}
}
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const text = friendsMessages[lang]
  const publicRoot = path.resolve(process.cwd(), "public")
  const directory = friends.map((friend) => {
    const avatarPath = friend.avatar ? path.resolve(publicRoot, `.${friend.avatar}`) : undefined
    return {
      ...friend,
      avatar:
        avatarPath && avatarPath.startsWith(`${publicRoot}${path.sep}`) && existsSync(avatarPath)
          ? friend.avatar
          : undefined,
    }
  })
  return (
    <main id="main-content" className="wrap friends-page">
      <Link className="back-link" href={localized("/about/", lang)}>
        <ArrowLeft size={14} />
        {text.back}
      </Link>
      <header className="friends-heading">
        <div>
          <span className="eyebrow">{text.eyebrow}</span>
          <h1>{text.headline}</h1>
          <p>{text.description}</p>
        </div>
        <div className="friends-count">
          <Network size={24} strokeWidth={1.25} />
          <strong>{String(friends.length).padStart(2, "0")}</strong>
          <span>{text.websites}</span>
        </div>
      </header>
      <FriendsDirectory friends={directory} locale={lang} />
      <section className="friends-invite">
        <div>
          <span className="eyebrow">{text.connect}</span>
          <h2>{text.note}</h2>
          <p>{text.contact}</p>
        </div>
        <a className="text-link" href={`mailto:${siteConfig.email}`}>
          <Mail size={16} />
          {siteConfig.email}
          <ArrowUpRight size={14} />
        </a>
      </section>
    </main>
  )
}
