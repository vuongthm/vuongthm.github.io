import { copy } from "@/lib/i18n/copy"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, MapPin } from "lucide-react"
import { notFound } from "next/navigation"
import { isLocale, localized } from "@/lib/i18n/config"
import { messages } from "@/lib/i18n/messages"
import {
  getEntryMeta,
  getPaths,
  getStories,
  getProjects,
  getContentModules,
} from "@/lib/content/server"
import { topics } from "@/lib/content/topics"
import { EditorialCard } from "@/components/knowledge/editorial-card"
import { getJourneyPreviews } from "@/lib/content/journey"
import { JourneyExplorer } from "@/components/journey-explorer"
import { ProjectCard } from "@/components/projects/project-card"
import { HomeActions } from "@/components/home-actions"
import { metadataFor } from "@/lib/seo"

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  return metadataFor(
    copy(lang, "Vuong — Công nghệ & trải nghiệm", "Vuong — Technology & experience"),
    copy(
      lang,
      "Kiến thức công nghệ, dự án cá nhân và những câu chuyện trên hành trình của Vuong.",
      "Technology notes, personal projects, and stories along Vuong’s journey.",
    ),
    "/",
    lang,
  )
}
export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const m = messages(lang),
    entries = getEntryMeta(lang),
    stories = getStories(lang),
    projects = getProjects(lang)
  const latest = [...entries].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 4)
  const modules = getContentModules(lang)
  return (
    <main id="main-content" className="home-page">
      <section className="home-journey">
        <div className="wrap">
          <JourneyExplorer items={getJourneyPreviews(lang)} />
        </div>
      </section>
      <section className="home-reading" aria-labelledby="latest-title">
        <div className="wrap home-reading-layout">
          <div className="home-writing">
            <div className="home-section-heading">
              <div>
                <span className="eyebrow">{m.knowledge}</span>
                <h2 id="latest-title">{copy(lang, "Mới trên trang", "Latest writing")}</h2>
              </div>
              <Link href={localized("/notes/", lang)}>
                {copy(lang, "Tất cả bài viết", "All articles")}
                <ArrowRight size={14} />
              </Link>
            </div>
            <div className="notebook-entries">
              {latest.map((entry) => (
                <EditorialCard key={entry.id} entry={entry} locale={lang} />
              ))}
            </div>
          </div>
          <aside className="home-library-nav" aria-label={m.topics}>
            <div className="home-section-heading">
              <h2>{copy(lang, "Theo chủ đề", "By subject")}</h2>
            </div>
            <nav className="home-topic-links">
              {topics.slice(0, 6).map((topic) => (
                <Link href={localized(`/topics/${topic.id}/`, lang)} key={topic.id}>
                  <span>{topic.label[lang]}</span>
                  <small>{entries.filter((entry) => entry.topics.includes(topic.id)).length}</small>
                </Link>
              ))}
            </nav>
            {topics.length > 6 && (
              <Link className="text-link" href={localized("/topics/", lang)}>
                {copy(lang, "Xem thêm", "Find out more")}
              </Link>
            )}
            <h3>{copy(lang, "Đọc theo lộ trình", "Reading paths")}</h3>
            <div className="home-path-links">
              {getPaths().map((path) => (
                <Link key={path.slug} href={localized(`/paths/${path.slug}/`, lang)}>
                  {path.title[lang]}
                  <small>
                    {path.entries.length} {m.articles}
                  </small>
                </Link>
              ))}
            </div>
            <Link className="home-collections-link" href={localized("/modules/", lang)}>
              {copy(lang, "Các bộ sưu tập", "Content collections")}
              <span>{modules.length}</span>
            </Link>
            <HomeActions />
          </aside>
        </div>
      </section>
      <section className="home-projects" aria-labelledby="projects-title">
        <div className="wrap">
          <div className="home-section-heading">
            <div>
              <span className="eyebrow">{copy(lang, "Dự án cá nhân", "Personal projects")}</span>
              <h2 id="projects-title">{copy(lang, "Những thứ mình xây", "Things I’m building")}</h2>
            </div>
            <Link href={localized("/projects/", lang)}>
              {m.more}
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="home-project-grid">
            {projects.slice(0, 3).map((project) => (
              <ProjectCard
                project={project}
                locale={lang}
                heading="h3"
                variant="cover"
                key={project.slug}
              />
            ))}
          </div>
        </div>
      </section>
      <section className="home-personal" aria-labelledby="personal-title">
        <div className="wrap home-personal-layout">
          <Link className="home-personal-photo" href={localized("/my-album/", lang)}>
            <Image
              src="/hometown/dai-lanh-village.webp"
              alt="Đại Lãnh, Khánh Hòa"
              width={800}
              height={500}
              sizes="(max-width:700px) 100vw, 45vw"
              unoptimized
            />
            <span>
              <MapPin size={11} />
              Đại Lãnh, Khánh Hòa
            </span>
          </Link>
          <div>
            <span className="eyebrow">
              {copy(lang, "Ngoài công nghệ", "Away from the keyboard")}
            </span>
            <h2 id="personal-title">
              {copy(lang, "Câu chuyện trên đường đi", "Stories along the way")}
            </h2>
            <p>
              {copy(
                lang,
                "Quê ở Đại Lãnh, học ở Đà Nẵng. Ở đây còn có chuyện đi học, đi làm và những người mình gặp.",
                "From Đại Lãnh, studying in Đà Nẵng. There are also stories about school, work, and people I meet.",
              )}
            </p>
            <div className="home-story-links">
              {stories.slice(0, 2).map((story) => (
                <Link href={localized(`/stories/${story.slug}/`, lang)} key={story.id}>
                  {story.title}
                </Link>
              ))}
            </div>
            <Link className="text-link" href={localized("/my-album/", lang)}>
              {m.album}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
