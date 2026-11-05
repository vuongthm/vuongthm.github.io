import "server-only"
import pages from "@/generated/site-pages.json"
import type { Locale } from "@/lib/i18n/config"
export const photoJournal = (
  pages as { photoJournal?: { encrypted: boolean; bodies: Partial<Record<Locale, string>> } }
).photoJournal
