import Link from "next/link"
import { ArrowLeft } from "lucide-react"
export function PageHeading({
  eyebrow,
  title,
  description,
  back,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  back?: { href: string; label: string }
  children?: React.ReactNode
}) {
  return (
    <div className="page-heading wrap">
      {back && (
        <Link className="back-link" href={back.href}>
          <ArrowLeft size={14} />
          {back.label}
        </Link>
      )}
      <div className="eyebrow">{eyebrow}</div>
      <div className="page-heading-row">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {children}
      </div>
    </div>
  )
}
