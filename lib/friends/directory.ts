import type { Locale } from "@/lib/i18n/config"
export interface Friend {
  id: string
  name: string
  alias: string
  website: string
  websitePlaceholder?: boolean
  avatar?: string
  avatarSource?: string
  initials: string
  topics: string[]
  description: Record<Locale, string>
}
