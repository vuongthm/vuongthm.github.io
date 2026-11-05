import { LockBadge } from "@/components/reading/lock-badge"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import type { Project } from "@/lib/content/types"
import type { Locale } from "@/lib/i18n/config"
import { copy } from "@/lib/i18n/copy"
import { CoverCard } from "@/components/collections/cover-card"
export function ProjectCard({
  project,
  locale,
  heading: Heading = "h2",
  variant = "detail",
}: {
  project: Project
  locale: Locale
  heading?: "h2" | "h3"
  variant?: "detail" | "cover"
}) {
  if (variant === "cover")
    return (
      <CoverCard
        href={project.href}
        cover={project.cover}
        title={project.title}
        description={project.description[locale]}
        label={project.category}
        footer={copy(locale, "Xem dự án", "Project details")}
        heading={Heading}
        encrypted={project.encrypted}
        locale={locale}
      />
    )
  return (
    <Link className="project-preview" href={project.href} key={project.slug}>
      {project.cover && (
        <div className="project-preview-image">
          <Image src={project.cover} alt="" width={960} height={528} unoptimized />
        </div>
      )}
      <div className="project-preview-copy">
        <div className="project-preview-meta">
          <span>{project.category}</span>
          <span>{project.year}</span>
        </div>
        <Heading>
          {project.title}
          {project.encrypted && <LockBadge locale={locale} />}
        </Heading>
        <p>{project.description[locale]}</p>
        <div className="stack-tags">
          {project.stack.slice(0, 4).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <span className="project-preview-action">
          {copy(locale, "Xem dự án", "Project details")}
          <ArrowRight size={14} aria-hidden="true" />
        </span>
      </div>
    </Link>
  )
}
