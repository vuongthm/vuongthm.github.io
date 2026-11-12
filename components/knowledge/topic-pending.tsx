import Link from "next/link"
import { LockKeyhole, ArrowRight } from "lucide-react"
import type { Locale } from "@/lib/i18n/config"
import { authoringMessages } from "@/lib/i18n/authoring"
export function TopicPending({ locale }: { locale: Locale }) {
  const t = authoringMessages[locale]
  return (
    <section className="topic-pending" aria-label={t.soon}>
      <LockKeyhole size={25} strokeWidth={1.3} />
      <h2>{t.lockedTitle}</h2>
      <p>{t.lockedDetail}</p>
      <Link className="text-link" href={`/${locale}/notes/`}>
        {t.viewPath}
        <ArrowRight size={15} />
      </Link>
    </section>
  )
}
