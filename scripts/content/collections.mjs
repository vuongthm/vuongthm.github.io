import fs from "node:fs"
import path from "node:path"
import { frontmatter, publishPolicy, hasLock } from "./schema.mjs"

export function compileCollection(
  source,
  files,
  locales,
  transformBody = (body) => body,
  transformPhoto = (value) => value,
  publicationFor = (data, _id, file) => publishPolicy(data, "exclude", undefined, file),
) {
  const groups = new Map()
  for (const file of files) {
    const locatedLocale = path
        .relative(source.path, file)
        .split(path.sep)
        .find((part) => locales.includes(part)),
      raw = fs.readFileSync(file, "utf8")
    if (!locatedLocale && !raw.startsWith("---")) continue
    const { data, body } = frontmatter(raw, file)
    const locale = data.locale ?? locatedLocale ?? source.defaultLocale ?? locales[0]
    if (!locales.includes(locale)) throw Error(`Unknown collection locale: ${locale}`)
    if (data.status === "draft" || data.visibility === "private") continue
    const filename = path.basename(file, ".md"),
      parent = path.basename(path.dirname(file))
    const id =
      data.id ??
      data.slug ??
      (["index", "readme"].includes(filename.toLowerCase())
        ? locales.includes(parent)
          ? path.basename(path.dirname(path.dirname(file)))
          : parent
        : filename)
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw Error(`Invalid collection ID: ${id}`)
    if (!groups.has(id)) groups.set(id, [])
    const list = groups.get(id)
    if (list.some((item) => item.locale === locale))
      throw Error(`Duplicate ${source.adapter} translation: ${id}/${locale}`)
    list.push({ data, body, file, locale })
  }
  return [...groups]
    .map(([id, records]) => {
      const base =
        records.find((item) => item.locale === "vi") ??
        records.find((item) => item.locale === "en") ??
        records[0]
      const fallback = records.find((item) => item.locale === "en") ?? base
      const locking = records.find((item) => hasLock(item.data))
      const publication = publicationFor(locking?.data ?? base.data, id, locking?.file ?? base.file)
      if (publication === "exclude") return undefined
      const encrypted = publication === "encrypt"
      function text(key, defaultValue = "") {
        return Object.fromEntries(
          locales.map((locale) => {
            const native = records.find((item) => item.locale === locale)
            const translation = records
              .map((item) => item.data.translations?.[locale])
              .find(Boolean)
            return [
              locale,
              native?.data[key] ?? translation?.[key] ?? fallback.data[key] ?? defaultValue,
            ]
          }),
        )
      }
      const bodies = {},
        bodyLocales = {}
      for (const locale of locales) {
        const native = records.find((item) => item.locale === locale),
          translated = records.find(
            (item) => typeof item.data.translations?.[locale]?.body === "string",
          )
        const rawBody =
          native?.body ?? (translated ? translated.data.translations[locale].body : fallback.body)
        bodies[locale] = encrypted
          ? rawBody
          : transformBody(rawBody, (native ?? translated ?? fallback).file)
        bodyLocales[locale] = native?.locale ?? (translated ? locale : fallback.locale)
      }
      const common = {
        id,
        moduleId: source.id,
        encrypted,
        _lockData: locking?.data,
        _lockFile: locking?.file,
        _privatePhotos: encrypted
          ? [
              ...(base.data.items ?? base.data.photos ?? []).map((photo) => {
                const value = typeof photo === "string" ? { src: photo } : photo
                return { ...value, file: base.file }
              }),
              ...(base.data.photoSources ?? []).map((src) => ({ src, file: base.file })),
              ...(base.data.illustration ? [{ ...base.data.illustration, file: base.file }] : []),
            ]
          : [],
        _sourceFiles: Object.fromEntries(records.map((record) => [record.locale, record.file])),
        _originFiles: Object.fromEntries(
          locales.map((locale) => [
            locale,
            (
              records.find((record) => record.locale === locale) ??
              records.find((record) => record.data.translations?.[locale]?.body) ??
              fallback
            ).file,
          ]),
        ),
        title: text("title"),
        description: text("description"),
        bodies,
        bodyLocales,
        order: Number(base.data.order ?? base.data.weight ?? 999),
      }
      if (source.adapter === "corner") {
        const category = base.data.category,
          shelfStatus = base.data.shelfStatus ?? "planned"
        if (!["books", "films", "podcasts"].includes(category))
          throw Error(`Invalid corner category: ${id}`)
        if (!["planned", "current", "finished"].includes(shelfStatus))
          throw Error(`Invalid corner shelf status: ${id}`)
        if (base.data.source && !/^https?:\/\//.test(base.data.source))
          throw Error(`Invalid corner source URL: ${id}`)
        return {
          ...common,
          slug: id,
          category,
          creator: text("creator"),
          cover: base.data.cover ? transformPhoto(base.data.cover, base.file) : "",
          sample: base.data.sample === true,
          shelfStatus,
          ...(base.data.source ? { source: base.data.source } : {}),
        }
      }
      if (source.adapter === "albums") {
        const media = base.data.items ?? base.data.photos ?? []
        if (!Array.isArray(media)) throw Error(`Album items must be a list: ${id}`)
        const items = media.map((photo) => {
          const value = typeof photo === "string" ? { src: photo } : photo
          if (!value?.src || typeof value.src !== "string")
            throw Error(`Album item needs src: ${id}`)
          const kind = /\.(mp4|webm)(?:[?#].*)?$/i.test(value.src) ? "video" : "image"
          return {
            src: encrypted ? value.src : transformPhoto(value.src, base.file),
            kind,
            title:
              typeof value.title === "object"
                ? Object.fromEntries(
                    locales.map((locale) => [
                      locale,
                      value.title[locale] ?? value.title.en ?? value.title.vi ?? "",
                    ]),
                  )
                : Object.fromEntries(
                    locales.map((locale) => [locale, value.title ?? base.data.title]),
                  ),
            place: value.place ?? "",
            date: value.date ?? "",
          }
        })
        return {
          ...common,
          slug: id,
          story: base.data.story === true,
          cover: base.data.cover ? transformPhoto(base.data.cover, base.file) : "",
          items: encrypted ? [] : items,
          count: items.length,
        }
      }
      if (source.adapter === "journey") {
        if (!["completed", "current", "planned"].includes(base.data.status ?? "current"))
          throw Error(`Invalid journey status: ${id}`)
        const photos = (encrypted ? [] : (base.data.photos ?? [])).map((photo) => {
          const value = typeof photo === "string" ? { src: photo } : photo
          return {
            src: transformPhoto(value.src, base.file),
            title: typeof value.title === "object" ? value.title : text("title"),
            place: value.place ?? "",
          }
        })
        return {
          ...common,
          label: text("label", base.data.title),
          period: text("period", ""),
          status: base.data.status ?? "current",
          year: base.data.year ? String(base.data.year) : undefined,
          sample: base.data.sample === true,
          photoSources: encrypted ? [] : (base.data.photoSources ?? []),
          photos,
          illustration: encrypted ? undefined : base.data.illustration,
          includeStoryCover: !encrypted && base.data.includeStoryCover === true,
          storySlug: base.data.storySlug,
          entrySlugs: base.data.entrySlugs ?? [],
          page: base.data.page,
        }
      }
      const repository = base.data.repository ?? base.data.href
      if (repository && !/^https:\/\//.test(repository))
        throw Error(`Project repository must use HTTPS: ${id}`)
      return {
        ...common,
        slug: id,
        repository,
        cover: base.data.cover ? transformPhoto(base.data.cover, base.file) : "",
        photos: (encrypted ? [] : (base.data.photos ?? [])).map((photo) => {
          const value = typeof photo === "string" ? { src: photo } : photo
          return {
            src: transformPhoto(value.src, base.file),
            title: typeof value.title === "object" ? value.title : text("title"),
            place: value.place ?? "",
          }
        }),
        category: base.data.category ?? "Personal project",
        stack: base.data.stack ?? [],
        status: base.data.status ?? "active",
        year: String(base.data.year ?? ""),
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
}
