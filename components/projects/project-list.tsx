import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { LockBadge } from "@/components/reading/lock-badge"
import type { Project } from "@/lib/content/types"
import type { Locale } from "@/lib/i18n/config"
import { copy } from "@/lib/i18n/copy"

export function ProjectList({ projects, locale }: { projects: Project[]; locale: Locale }) {
  return (
    <section
      className="signpost-garden"
      aria-label={copy(locale, "Những hướng mình đang khám phá", "Directions I’m exploring")}
    >
      <div className="signpost-compass" aria-hidden="true">
        <span>N</span>
        <svg viewBox="0 0 40 40">
          <path d="m20 3 4 13 13 4-13 4-4 13-4-13L3 20l13-4Z" />
          <circle cx="20" cy="20" r="3" />
        </svg>
        <span>S</span>
      </div>
      <p className="signpost-caption">
        {copy(locale, "Mỗi dự án, một hướng khám phá.", "Every project, a direction to explore.")}
      </p>
      <ol className="project-signpost">
        {projects.map((project, index) => (
          <li className="signpost-branch" key={project.slug}>
            <span className="signpost-bolt" aria-hidden="true" />
            <Link
              className={`project-sign sign-tone-${index % 3}`}
              href={project.href}
              prefetch={project.encrypted ? false : undefined}
            >
              <span className="sign-meta">
                <span>
                  {String(index + 1).padStart(2, "0")} / {project.category}
                </span>
                <span>{project.year}</span>
              </span>
              <h2>
                {project.title}
                {project.encrypted && <LockBadge locale={locale} />}
              </h2>
              <p>{project.description[locale]}</p>
              <span className="sign-bottom">
                <span>{project.stack.slice(0, 3).join(" · ")}</span>
                <ArrowRight size={20} aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <div className="signpost-ground" aria-hidden="true">
        <svg viewBox="0 0 500 42">
          <path d="M5 35Q125 8 250 27Q360 12 495 35M205 30l-8-12m38 8 5-17m38 20 10-12" />
        </svg>
      </div>
    </section>
  )
}
