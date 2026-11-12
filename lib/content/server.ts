import "server-only"
import { catalogEntries, localizedCatalog } from "./catalog"
import database from "@/generated/content.json"
import moduleRegistry from "@/generated/modules.json"
import type { ContentModule, Project, ContentDatabase, Entry, EntryMeta, CornerItem } from "./types"
import { localized, localeCodes, type Locale } from "@/lib/i18n/config"
import { newestProjects } from "./project-order"
const db = database as ContentDatabase
export function getEntries(locale: Locale) {
  return catalogEntries(db.entries, locale)
}
export function getEntry(slug: string, locale: Locale) {
  return db.entries.find(
    (entry) =>
      entry.slug === slug &&
      entry.locale === locale &&
      !entry.seriesSlug &&
      entry.href.startsWith(`/${locale}/notes/`),
  )
}
export function getEntryMeta(locale: Locale): EntryMeta[] {
  return getEntries(locale).map(({ body: _body, ...meta }) => meta)
}
export function getStories(locale: Locale) {
  const native = db.stories.filter((story) => story.locale === locale)
  const catalog = localizedCatalog(locale)
  if (!catalog) return native
  const available = new Set(native.map((story) => story.slug))
  return [
    ...native,
    ...db.stories
      .filter((story) => story.locale === "en" && !available.has(story.slug))
      .map((story) => {
        const text = (catalog.stories as Record<string, { title: string; summary: string }>)[
          story.slug
        ]
        return {
          ...story,
          locale,
          ...(text ? { title: text.title, summary: text.summary } : {}),
        }
      }),
  ]
}
export function getStory(slug: string, locale: Locale) {
  return getStories(locale).find((story) => story.slug === slug)
}
export function getChapter(series: string, chapter: string, locale: Locale) {
  return db.entries.find(
    (entry) => entry.seriesSlug === series && entry.slug === chapter && entry.locale === locale,
  )
}
export function getChapters(series: string, locale: Locale) {
  const native = db.entries.filter(
    (entry) => entry.seriesSlug === series && entry.locale === locale,
  )
  const catalog = localizedCatalog(locale)
  const list =
    native.length || !catalog
      ? native
      : db.entries.filter((entry) => entry.seriesSlug === series && entry.locale === "en")
  return list
    .map((entry) => {
      if (!catalog || entry.locale === locale) return entry
      const text = (
        catalog.stories as Record<
          string,
          { chapters: Record<string, { title: string; summary: string }> }
        >
      )[series]?.chapters[entry.slug]
      return text ? { ...entry, title: text.title, summary: text.summary } : entry
    })
    .sort((a, b) => (a.part ?? 0) - (b.part ?? 0))
}
export function translations(entry: Entry) {
  return db.entries
    .filter((item) => item.translationKey === entry.translationKey)
    .map((item) => ({ locale: item.locale, href: item.href }))
}
export function allEntries() {
  return db.entries
}
export function allStories() {
  return [
    ...db.stories,
    ...localeCodes.flatMap((locale) =>
      localizedCatalog(locale)
        ? getStories(locale).filter(
            (story) =>
              !db.stories.some((item) => item.locale === locale && item.slug === story.slug),
          )
        : [],
    ),
  ]
}
export function getProjects(locale: Locale): Project[] {
  return newestProjects(
    db.projects.map((item) => ({
      ...item,
      title: item.title[locale],
      body: item.bodies[locale],
      bodyLocale: item.bodyLocales[locale],
      href: localized(`/projects/${item.slug}/`, locale),
    })),
  )
}
export function getProject(slug: string, locale: Locale) {
  return getProjects(locale).find((item) => item.slug === slug)
}
export function getContentModules(locale: Locale): ContentModule[] {
  return (moduleRegistry as Omit<ContentModule, "href">[]).map((item) => ({
    ...item,
    href: localized(
      item.adapter === "corner"
        ? "/corner/"
        : item.adapter === "albums"
          ? "/my-album/"
          : item.adapter === "journey"
            ? "/journey/"
            : item.adapter === "projects"
              ? "/projects/"
              : item.adapter === "stories"
                ? "/stories/"
                : `/modules/${item.id}/`,
      locale,
    ),
    count: ["notes", "articles"].includes(item.adapter)
      ? getEntries(locale).filter((entry) => entry.moduleId === item.id).length
      : item.adapter === "stories"
        ? getStories(locale).filter((story) => story.moduleId === item.id).length
        : item.count,
  }))
}
export function getModuleEntry(moduleId: string, slug: string, locale: Locale) {
  return db.entries.find(
    (entry) =>
      entry.moduleId === moduleId &&
      entry.slug === slug &&
      entry.locale === locale &&
      !entry.seriesSlug,
  )
}
export function getPaths() {
  return db.paths
}

export function getAlbums() {
  return db.albums ?? []
}

export function getCornerItems(locale: Locale): CornerItem[] {
  return (db.corners ?? []).map(({ bodies, bodyLocales, ...item }) => ({
    ...item,
    body: bodies[locale],
    bodyLocale: bodyLocales[locale],
    href: localized(`/corner/${item.slug}/`, locale),
  }))
}
