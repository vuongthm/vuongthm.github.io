import type { Project } from "./types"

type DatedProject = Pick<Project, "slug" | "year" | "publishedAt">
function timestamp(project: DatedProject) {
  if (project.publishedAt && Number.isFinite(Date.parse(project.publishedAt)))
    return Date.parse(project.publishedAt)
  const year = project.year.match(/\b(?:19|20)\d{2}\b/)?.[0]
  return year ? Date.parse(`${year}-01-01`) : 0
}
export function newestProjects<T extends DatedProject>(projects: readonly T[]): T[] {
  return projects
    .map((project, index) => ({ project, index }))
    .sort((a, b) => timestamp(b.project) - timestamp(a.project) || a.index - b.index)
    .map(({ project }) => project)
}
