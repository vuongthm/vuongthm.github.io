import type { ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { LockBadge } from "@/components/reading/lock-badge"
import type { Locale } from "@/lib/i18n/config"

export function CoverCard({
  href,
  cover,
  title,
  description,
  label,
  meta,
  footer,
  heading: Heading = "h2",
  encrypted,
  locale,
}: {
  href: string
  cover?: string
  title: string
  description: string
  label: string
  meta?: ReactNode
  footer?: ReactNode
  heading?: "h2" | "h3"
  encrypted?: boolean
  locale: Locale
}) {
  return (
    <Link className="cover-card" href={href} prefetch={encrypted ? false : undefined}>
      <div className="cover-card-media">
        {cover && (
          <Image
            src={cover}
            alt=""
            fill
            sizes="(max-width:700px) 100vw, (max-width:1000px) 50vw, 33vw"
            unoptimized
          />
        )}
      </div>
      <div className="cover-card-copy">
        <div className="cover-card-meta">
          <span className="eyebrow">{label}</span>
          {meta}
        </div>
        <Heading>
          {title}
          {encrypted && <LockBadge locale={locale} />}
        </Heading>
        <p>{description}</p>
        <div className="cover-card-foot">
          <span>{footer}</span>
          <ArrowRight size={14} aria-hidden="true" />
        </div>
      </div>
    </Link>
  )
}
