import "server-only"
import database from "@/generated/content.json"
import { authorProfile } from "./profile"
import { getEntryMeta, getStories } from "./server"
import { localized, type Locale } from "@/lib/i18n/config"
import { messages } from "@/lib/i18n/messages"
import type { JourneyMilestone, JourneyItem, GalleryPhoto } from "./types"

export function getJourney(locale: Locale): JourneyItem[] {
  const entries = getEntryMeta(locale),
    stories = getStories(locale),
    m = messages(locale)
  return (database.journey as JourneyMilestone[]).map((item) => {
    const story = stories.find((story) => story.slug === item.storySlug)
    const links: JourneyItem["links"] = []
    if (story) links.push({ href: localized(`/stories/${story.slug}`, locale), title: story.title })
    for (const slug of item.entrySlugs ?? []) {
      const entry = entries.find((entry) => entry.slug === slug)
      if (entry) links.push({ href: entry.href, title: entry.title, sourceLocale: entry.locale })
    }
    if (item.page) links.push({ href: localized(`/${item.page}`, locale), title: m[item.page] })
    const photos = [
      ...(item.photos ?? []),
      ...(item.photoSources ?? []).flatMap((src) => {
        const photo = authorProfile.photos.find((photo) => photo.src === src)
        if (photo) return [photo]
        if (src === authorProfile.portrait)
          return [
            {
              src,
              title: { vi: "Vuong", en: "Vuong", ja: "Vuong", zh: "Vuong" },
              place: "Đà Nẵng",
            },
          ]
        return []
      }),
    ]
    if (item.includeStoryCover && story?.cover)
      photos.push({
        src: story.cover,
        title: { vi: story.title, en: story.title, ja: story.title, zh: story.title },
        place: "VNNIC",
      } satisfies GalleryPhoto)
    if (item.illustration) photos.push(item.illustration)
    return {
      ...item,
      body: item.bodies[locale],
      bodyLocale: item.bodyLocales[locale],
      href: localized(`/journey/${item.id}/`, locale),
      links,
      photos,
    }
  })
}

/** The journey overview receives previews, never all milestone Markdown bodies. */
export function getJourneyPreviews(locale: Locale) {
  return getJourney(locale).map(
    ({ id, href, label, title, description, status, sample, photos, year, period }) => ({
      id,
      href,
      label,
      title,
      description,
      status,
      sample,
      photos,
      year,
      period,
    }),
  )
}
