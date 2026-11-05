import { EncryptedBody } from "@/components/reading/encrypted-body"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { Github } from "@/components/brand/github"
import { getProject, getProjects } from "@/lib/content/server"
import { isLocale, localeCodes, localized, contentLanguage } from "@/lib/i18n/config"
import { copy } from "@/lib/i18n/copy"
import { metadataFor } from "@/lib/seo"
import { Markdown } from "@/components/reading/markdown"
import { Gallery } from "@/components/gallery"
type Params = Promise<{ lang: string; project: string }>
export function generateStaticParams() {
  return localeCodes.flatMap((lang) =>
    getProjects(lang).map((item) => ({ lang, project: item.slug })),
  )
}
export async function generateMetadata({ params }: { params: Params }) {
  const { lang, project } = await params
  if (!isLocale(lang)) return {}
  const item = getProject(project, lang)
  return item
    ? {
        ...metadataFor(item.title, item.description[lang], `/projects/${project}/`, lang),
        robots: item.encrypted ? { index: false, follow: false } : undefined,
      }
    : {}
}
export default async function Page({ params }: { params: Params }) {
  const { lang, project } = await params
  if (!isLocale(lang)) notFound()
  const item = getProject(project, lang)
  if (!item) notFound()
  return (
    <main id="main-content" className="project-detail wrap">
      <Link className="back-link" href={localized("/projects/", lang)}>
        <ArrowLeft size={14} />
        {copy(lang, "Dự án cá nhân", "Personal projects")}
      </Link>
      <header className="project-detail-heading">
        <div>
          <span className="eyebrow">
            {item.category} · {item.year}
          </span>
          <h1>{item.title}</h1>
          <p>{item.description[lang]}</p>
        </div>
        {item.repository && (
          <a className="button secondary" href={item.repository} target="_blank" rel="noreferrer">
            <Github size={16} />
            {copy(lang, "Xem mã nguồn", "Source code")}
          </a>
        )}
      </header>
      {item.cover && (
        <figure className="project-cover">
          <Image src={item.cover} alt={item.title} width={1200} height={660} unoptimized priority />
          <figcaption>{copy(lang, "Tổng quan dự án", "Project overview")}</figcaption>
        </figure>
      )}
      <div className="project-detail-layout">
        <article className="project-detail-body">
          {item.bodyLocale !== lang && (
            <p className="content-language">{contentLanguage(lang, item.bodyLocale)}</p>
          )}
          {item.encrypted ? <EncryptedBody payload={item.body} /> : <Markdown body={item.body} />}
        </article>
        <aside className="project-facts">
          <h2>{copy(lang, "Thông tin dự án", "Project information")}</h2>
          <dl>
            <div>
              <dt>{copy(lang, "Lĩnh vực", "Category")}</dt>
              <dd>{item.category}</dd>
            </div>
            <div>
              <dt>{copy(lang, "Trạng thái", "Status")}</dt>
              <dd>
                {item.status === "active"
                  ? copy(lang, "Đang phát triển", "In progress")
                  : copy(lang, "Đang tìm hiểu", "Exploring")}
              </dd>
            </div>
            <div>
              <dt>{copy(lang, "Công nghệ", "Technology")}</dt>
              <dd className="stack-tags">
                {item.stack.map((tool) => (
                  <span key={tool}>{tool}</span>
                ))}
              </dd>
            </div>
          </dl>
          {item.repository && (
            <a className="text-link" href={item.repository} target="_blank" rel="noreferrer">
              <Github size={14} />
              {copy(lang, "Xem mã nguồn", "Source code")}
            </a>
          )}
        </aside>
      </div>
      {!!item.photos?.length && <Gallery photos={item.photos} variant="journal" />}
    </main>
  )
}
