import { PaginatedList } from "@/components/collections/paginated-list"
import { ProjectCard } from "./project-card"
import type { Project } from "@/lib/content/types"
import type { Locale } from "@/lib/i18n/config"
export function ProjectList({ projects, locale }: { projects: Project[]; locale: Locale }) {
  return (
    <PaginatedList className="project-directory-grid">
      {projects.map((project) => (
        <ProjectCard key={project.slug} project={project} locale={locale} />
      ))}
    </PaginatedList>
  )
}
