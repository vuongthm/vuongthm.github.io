import { photoJournal } from "@/lib/content/site-pages"
import type { MetadataRoute } from "next"
import {
  allEntries,
  getAlbums,
  getPaths,
  allStories,
  getProjects,
  getContentModules,
  getCornerItems,
} from "@/lib/content/server"
import { topics } from "@/lib/content/topics"
import { localeCodes } from "@/lib/i18n/config"
import { siteConfig } from "@/lib/site.config"
import { getJourney } from "@/lib/content/journey"
export const dynamic = "force-static"
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/notes/",
    "/topics/",
    "/projects/",
    "/modules/",
    "/journey/",
    "/stories/",
    "/about/",
    "/music/",
    "/corner/",
    "/friends/",
    ...(!photoJournal?.encrypted ? ["/my-album/"] : []),
    ...topics.map((topic) => `/topics/${topic.id}/`),
    ...getPaths().map((path) => `/paths/${path.slug}/`),
  ]
  return [
    ...localeCodes.flatMap((locale) => getCornerItems(locale).filter((item) => !item.encrypted).map((item) => ({ url: siteConfig.url + item.href }))),
    ...localeCodes.flatMap((locale) =>
      getAlbums()
        .filter((album) => !album.encrypted)
        .map((album) => ({ url: `${siteConfig.url}/${locale}/my-album/${album.slug}/` })),
    ),
    ...localeCodes.flatMap((locale) =>
      getProjects(locale)
        .filter((item) => !item.encrypted)
        .map((item) => ({ url: siteConfig.url + item.href })),
    ),
    ...localeCodes.flatMap((locale) =>
      getContentModules(locale)
        .filter((item) => ["notes", "articles"].includes(item.adapter))
        .map((item) => ({ url: siteConfig.url + item.href })),
    ),
    ...localeCodes.flatMap((locale) =>
      getJourney(locale)
        .filter((item) => !item.encrypted)
        .map((item) => ({ url: siteConfig.url + item.href })),
    ),
    ...localeCodes.flatMap((locale) =>
      paths.map((path) => ({ url: `${siteConfig.url}/${locale}${path}` })),
    ),
    ...allEntries()
      .filter((entry) => !entry.encrypted)
      .map((entry) => ({
        url: siteConfig.url + entry.href,
        lastModified: new Date(entry.updatedAt),
      })),
    ...allStories()
      .filter((story) => !story.encrypted)
      .map((story) => ({
        url: `${siteConfig.url}/${story.locale}/stories/${story.slug}/`,
        lastModified: new Date(story.date),
      })),
  ]
}
