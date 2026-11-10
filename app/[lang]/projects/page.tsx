import { copy } from "@/lib/i18n/copy"
import { ProjectList } from "@/components/projects/project-list"
import { notFound } from "next/navigation"
import { isLocale } from "@/lib/i18n/config"
import { getProjects } from "@/lib/content/server"
import { metadataFor } from "@/lib/seo"
import { PageHeading } from "@/components/layout/page-heading"
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return isLocale(lang)
    ? metadataFor(
        copy(lang, "Dự án cá nhân", "Personal projects"),
        copy(
          lang,
          "Những thứ Vuong đang xây và những bài học trong quá trình làm.",
          "Things Vuong is building and lessons from the process.",
        ),
        "/projects",
        lang,
      )
    : {}
}
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  return (
    <main id="main-content" className="projects-page">
      <PageHeading
        eyebrow={copy(lang, "Dự án cá nhân", "Personal projects")}
        title={copy(lang, "Những thứ mình đang làm.", "Things I’m working on.")}
        description={copy(
          lang,
          "Một nơi lưu lại những ý tưởng đã thành hình. Có thứ dùng được, có thứ còn đang thử — tất cả đều để hiểu sâu hơn.",
          "A record of ideas taking shape. Some are useful, some are still experiments — all are a way to understand more deeply.",
        )}
      />
      <div className="wrap project-directory">
        <ProjectList projects={getProjects(lang)} locale={lang} />
      </div>
    </main>
  )
}
