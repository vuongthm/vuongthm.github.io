import { LockKeyhole } from "lucide-react"
import type { Locale } from "@/lib/i18n/config"
import { contentLockMessages } from "@/lib/i18n/content-lock"
export function LockBadge({ locale }: { locale: Locale }) {
  return (
    <span className="content-lock-badge" title={contentLockMessages[locale].title}>
      <LockKeyhole size={12} aria-hidden="true" />
      <span className="sr-only">{contentLockMessages[locale].title}</span>
    </span>
  )
}
