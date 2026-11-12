import Link from "next/link"
import { ArrowRight, Rss } from "lucide-react"
import { notFound } from "next/navigation"
import { copy } from "@/lib/i18n/copy"
import { editorial } from "@/lib/i18n/editorial"
import { contentLanguage, isLocale, localized } from "@/lib/i18n/config"
import { messages } from "@/lib/i18n/messages"
import { getEntryMeta, getPaths } from "@/lib/content/server"
import { topics, getTopic } from "@/lib/content/topics"
import { LockBadge } from "@/components/reading/lock-badge"
import { ReadLink } from "@/components/experience/read-link"
import { Contour, NotebookOrbit } from "@/components/brand/contour"
import { studio } from "@/lib/i18n/studio"
import searchIndex from "@/generated/search.json"
import { articlePreview } from "@/lib/content/preview"
import { metadataFor } from "@/lib/seo"

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  return metadataFor(
    copy(lang, "Vuong — Công nghệ & trải nghiệm", "Vuong — Technology & experience"),
    editorial[lang].homeDescription,
    "/",
    lang,
  )
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const m = messages(lang),
    t = editorial[lang]
  const entries = getEntryMeta(lang)
  const latest = [...entries].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 6)
  return (
    <main id="main-content" className="home-page journal-home">
      <header className="studio-hero">
        <div className="wrap studio-hero-inner">
          <div className="journal-intro">
            <span className="hero-kicker">{studio[lang].heroKicker}</span>
            <h1>{t.homeTitle}</h1>
            <p>{t.homeDescription}</p>
            <span className="hero-footnote">{studio[lang].heroFootnote}</span>
          </div>
          <NotebookOrbit />
        </div>
        <Contour />
      </header>
      <div className="journal-layout wrap">
        <section className="journal-writing" aria-labelledby="latest-title">
          <h2 className="section-label" id="latest-title">
            {t.latest}
          </h2>
          <div className="journal-posts">
            {latest.map((entry) => (
              <article className="journal-post" key={entry.id}>
                <div className="journal-post-meta">
                  <span>{getTopic(entry.topics[0])?.label[lang] ?? m.knowledge}</span>
                  {entry.locale !== lang && (
                    <span className="content-language">{contentLanguage(lang, entry.locale)}</span>
                  )}
                </div>
                <h3>
                  <Link href={entry.href} prefetch={entry.encrypted ? false : undefined}>
                    {entry.title}
                    {entry.encrypted && <LockBadge locale={lang} />}
                  </Link>
                </h3>
                <p>
                  {articlePreview(
                    entry,
                    searchIndex.find((item) => item.href === entry.href)?.excerpt,
                  )}
                </p>
                <div className="journal-post-bottom">
                  <ReadLink
                    href={entry.href}
                    label={copy(lang, "Đọc bài", "Read article")}
                    encrypted={entry.encrypted}
                  />
                </div>
              </article>
            ))}
          </div>
          <Link className="journal-all" href={localized("/notes/", lang)}>
            {t.allArticles}
            <ArrowRight size={17} />
          </Link>
        </section>
        <aside className="journal-sidebar" aria-label={t.categories}>
          <section>
            <h2 className="section-label">{t.categories}</h2>
            <nav className="journal-topics">
              {topics.map((topic) => (
                <Link
                  key={topic.id}
                  data-hover-sound="key"
                  href={localized(`/topics/${topic.id}/`, lang)}
                >
                  {topic.label[lang]}
                </Link>
              ))}
            </nav>
          </section>
          <section>
            <h2 className="section-label">{t.paths}</h2>
            <nav className="journal-paths">
              {getPaths()
                .slice(0, 3)
                .map((path) => (
                  <Link href={localized(`/paths/${path.slug}/`, lang)} key={path.slug}>
                    <ArrowRight size={16} />
                    <span>{path.title[lang]}</span>
                  </Link>
                ))}
            </nav>
          </section>
          <a className="journal-rss" href={`/${lang}/feed.xml`}>
            <Rss size={16} />
            {t.subscribe}
          </a>
        </aside>
      </div>
    </main>
  )
}
