import { englishFields } from "../../lib/i18n/english-names.mjs"
import fs from "node:fs"
import path from "node:path"
import { frontmatter, normalizeDate, assertUnique, publishPolicy, hasLock } from "./schema.mjs"
import { encryptString } from "../../lib/crypto.mjs"
import { loadContentPasswords, contentPassword, encryptMarkdown } from "./locks.mjs"
import { emitAssets } from "./assets.mjs"
import { loadContentConfig, moduleMetadata } from "./config.mjs"
import { compileMusic } from "./corner.mjs"
import { compileCollection } from "./collections.mjs"
import { compileLearningPaths, learningAssignment, validateQuizBlocks } from "./learning.mjs"
import { learningMarkdown } from "../../lib/learning/markdown.mjs"
import { articleStructure, validateArticleStructure } from "./structure.mjs"
import { contentFiles, isInboxPath } from "./files.mjs"

export async function buildContent(root) {
  const config = loadContentConfig(root)
  const output = path.join(root, "generated")
  const entries = [],
    outline = [],
    stories = [],
    usedMedia = new Map(),
    sources = [],
    projects = [],
    albums = [],
    corners = [],
    music = [],
    journey = [],
    localRoutes = new Map(),
    entryFiles = new Map(),
    storyFiles = new Map(),
    privateShelfDetails = new Map()
  const collectionRoute = (item) =>
    albums.includes(item)
      ? "my-album"
      : corners.includes(item)
        ? "corner"
        : item.slug
          ? "projects"
          : "journey"
  const passwords = loadContentPasswords(root)
  const accessRules = [],
    probes = new Map()
  async function protect(href, password, title, back, scope) {
    if (!probes.has(password))
      probes.set(password, await encryptString(password, "vuong-page-access-v1"))
    accessRules.push({
      href,
      title,
      back,
      kind: "content",
      probe: probes.get(password),
      ...(scope ? { scope } : {}),
    })
  }
  const policy = process.env.PUBLISH_ENCRYPTED === "1" ? "encrypt" : config.privateContent
  const passwordOwners = new Map()
  const lockedEntries = new Map(),
    lockedCollections = new Map(),
    lockedStoryBodies = new Map()
  function publication(data, source, id, slug, file) {
    const excluded =
      data.status === "draft" ||
      data.visibility === "private" ||
      (policy === "exclude" && data.lock !== true && data.lock !== "true")
    const password =
      hasLock(data) && !excluded ? contentPassword(passwords, data, source.id, id, slug) : undefined
    const mode = publishPolicy(data, policy, password, path.basename(file))
    if (mode === "encrypt") {
      const owner = `${source.id}/${id}`,
        existing = passwordOwners.get(password)
      if (existing && existing !== owner)
        throw Error(`Use a unique password for each document: ${owner}`)
      passwordOwners.set(password, owner)
    }
    return { mode, password }
  }
  let shelfAccess
  if (config.site.shelf) {
    const file = path.resolve(root, config.site.shelf)
    const { data } = frontmatter(fs.readFileSync(file, "utf8"), file)
    shelfAccess = publication(data, { id: "site" }, "shelf", "shelf", file)
    if (shelfAccess.mode === "exclude")
      throw Error("The reading shelf must be public or password protected.")
  }
  let journeyAccess
  if (config.site.journey) {
    const file = path.resolve(root, config.site.journey)
    const { data } = frontmatter(fs.readFileSync(file, "utf8"), file)
    journeyAccess = publication(data, { id: "site" }, "journey", "journey", file)
    if (journeyAccess.mode === "exclude")
      throw Error("The journey page must be public or password protected.")
  }
  function rememberMedia(source, group, category, body, cover) {
    const urls = [...body.matchAll(/!\[[^\]]*\]\(([^\s)]+)\)/g)].map((match) => match[1])
    if (cover) urls.push(cover)
    for (const url of urls) {
      if (!url.startsWith(`/media/${group}/`)) continue
      const relative = url.slice(`/media/${group}/`.length)
      const parts = relative.split("/")
      const sourcePath = path.resolve(source, parts[0] || category, "media", ...parts.slice(1))
      if (isInboxPath(path.relative(source, sourcePath)))
        throw Error(`Move inbox media into a content module before publishing: ${url}`)
      if (!sourcePath.startsWith(path.resolve(source) + path.sep))
        throw new Error(`Unsafe asset: ${url}`)
      if (fs.existsSync(sourcePath)) {
        if (usedMedia.has(url) && usedMedia.get(url) !== sourcePath)
          throw new Error(
            `Asset URL collision across sources: ${url}. Configure a unique mediaNamespace.`,
          )
        const physical = fs.realpathSync(sourcePath),
          base = fs.realpathSync(source)
        if (!physical.startsWith(base + path.sep)) throw Error(`Media escapes its module: ${url}`)
        usedMedia.set(url, physical)
      } else throw new Error(`Missing referenced asset: ${url}`)
    }
  }
  function registerAsset(url, source, file) {
    const group = source.mediaNamespace ?? source.id
    if (url.startsWith(`/media/${group}/`)) {
      rememberMedia(source.path, group, "", `![](${url})`)
      return url
    }
    if (url.startsWith("/") || /^(?:https?:|data:)/.test(url)) return url
    const absolute = fs.realpathSync(path.resolve(path.dirname(file), decodeURIComponent(url)))
    const base = fs.realpathSync(source.path)
    if (!absolute.startsWith(base + path.sep)) throw Error(`Media escapes its module: ${url}`)
    if (isInboxPath(path.relative(base, absolute)))
      throw Error(`Move inbox media into a content module before publishing: ${url}`)
    const target = `/media/${group}/${path.relative(base, absolute).split(path.sep).join("/")}`
    if (usedMedia.has(target) && usedMedia.get(target) !== absolute)
      throw Error(`Asset URL collision: ${target}`)
    usedMedia.set(target, absolute)
    return target
  }
  function transformBody(body, source, file) {
    return body.replace(
      /!\[([^\]]*)\]\(([^)\s]+)\)/g,
      (_match, alt, url) => `![${alt}](${registerAsset(url, source, file)})`,
    )
  }
  function meta(data, body, locale, slug, sourceId, relative, defaults) {
    body = learningMarkdown(body).markdown
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw Error(`Invalid article slug: ${slug}`)
    const publishedAt = normalizeDate(data.publishedAt ?? data.date, relative)
    const topicList = data.topics ?? defaults ?? []
    if (!Array.isArray(topicList) || !topicList.every((x) => typeof x === "string"))
      throw new Error(`${relative}: topics must be a list`)
    const kind = data.kind ?? "note",
      level = data.level ?? "beginner"
    if (
      !["note", "guide", "lab", "writeup", "reference"].includes(kind) ||
      !["beginner", "intermediate", "advanced"].includes(level)
    )
      throw new Error(`${relative}: invalid kind or level`)
    const stable =
      data.id ??
      `${sourceId}:${relative
        .split(path.sep)
        .filter((x) => x !== locale)
        .join("/")
        .replace(/\.md$/, "")}`
    return {
      id: stable,
      moduleId: sourceId,
      translationKey: data.translationKey ?? stable,
      slug,
      locale,
      title: data.title.trim(),
      summary: data.summary ?? data.description ?? "",
      topics: topicList,
      tags: Array.isArray(data.tags) ? data.tags : [],
      kind,
      level,
      publishedAt,
      updatedAt: normalizeDate(data.updatedAt ?? publishedAt, relative),
      readingTime: Math.max(
        1,
        Math.ceil(
          (body.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu)?.length ?? 0) /
            400 +
            body
              .replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu, " ")
              .trim()
              .split(/\s+/)
              .filter(Boolean).length /
              210,
        ),
      ),
      weight: Number.isFinite(Number(data.weight)) ? Number(data.weight) : 999,
      href: `/${locale}/notes/${slug}/`,
      featured: data.featured === true,
      ...(data.learning ? { learning: learningAssignment(data.learning) } : {}),
    }
  }
  for (const source of config.sources) {
    const base = path.resolve(root, source.path)
    if (!fs.existsSync(base)) {
      if (source.required)
        throw new Error(`Required content source missing: ${source.id} (${base})`)
      continue
    }
    const sourceFiles = contentFiles(base).filter((file) => file.endsWith(".md"))
    sources.push({ id: source.id, files: sourceFiles.length })
    if (source.adapter === "notes" || source.adapter === "articles") {
      for (const file of sourceFiles) {
        const relative = path.relative(base, file),
          parts = relative.split(path.sep)
        const locatedLocale = parts.find((part) => config.locales.includes(part)),
          raw = fs.readFileSync(file, "utf8")
        if (!locatedLocale && !raw.startsWith("---")) continue
        const { data, body } = frontmatter(raw, relative)
        const locale = data.locale ?? locatedLocale ?? source.defaultLocale ?? config.locales[0]
        if (!config.locales.includes(locale)) throw Error(`Unknown content locale: ${locale}`)
        const slug = data.slug ?? path.basename(file, ".md")
        if (data.outline === true && data.status !== "draft" && data.visibility !== "private") {
          const prose = body
            .replace(/<!--[\s\S]*?-->/g, "")
            .replace(/^#{1,6} .+$/gm, "")
            .trim()
          if (!String(data.summary ?? data.description ?? "").trim() || !prose)
            throw Error(
              `${relative}: complete the description and article body before publishing this outline draft`,
            )
        }
        const access = publication(data, source, data.id ?? slug, slug, file)
        if (
          data.status === "draft" &&
          data.outline === true &&
          data.visibility !== "private" &&
          !hasLock(data)
        ) {
          const metadata = meta(data, "", locale, slug, source.id, relative, source.defaultTopics)
          outline.push({
            id: metadata.id,
            translationKey: metadata.translationKey,
            slug,
            locale,
            moduleId: source.id,
            title: metadata.title,
            topics: metadata.topics,
            ...articleStructure(source, relative, data, config.topics),
          })
        }
        if (access.mode === "exclude") continue
        validateQuizBlocks(body, relative)
        const entry = {
          ...meta(data, body, locale, slug, source.id, relative, source.defaultTopics),
          ...articleStructure(source, relative, data, config.topics),
          body,
        }
        const prefix =
          source.discovered && !source.legacyRoutes ? `/modules/${source.id}` : "/notes"
        entry.href = `/${locale}${prefix}/${slug}/`
        localRoutes.set(path.resolve(file), entry.href)
        entryFiles.set(entry, file)
        if (access.mode === "encrypt") {
          entry.encrypted = true
          lockedEntries.set(entry, { source, file, password: access.password })
        } else entry.body = transformBody(body, source, file)
        entries.push(entry)
      }
    } else if (["journey", "projects", "albums", "corner"].includes(source.adapter)) {
      if (source.adapter === "corner")
        music.push(...compileMusic(source, (url, file) => registerAsset(url, source, file)))
      const items = compileCollection(
        source,
        sourceFiles,
        config.locales,
        (body, file) => transformBody(body, source, file),
        (url, file) => registerAsset(url, source, file),
        (data, id, file) =>
          ((source.adapter === "corner" && shelfAccess?.mode === "encrypt") ||
            (source.adapter === "journey" && journeyAccess?.mode === "encrypt")) &&
          !hasLock(data)
            ? "encrypt"
            : publication(data, source, id, id, file).mode,
      )
      for (const item of items)
        if (item.encrypted) {
          const parent =
            source.adapter === "corner"
              ? shelfAccess
              : source.adapter === "journey"
                ? journeyAccess
                : undefined
          const grouped = !item._lockData && parent?.mode === "encrypt"
          const access = grouped
            ? parent
            : publication(item._lockData, source, item.id, item.id, item._lockFile)
          lockedCollections.set(item, {
            source,
            password: access.password,
            group: grouped ? (source.adapter === "corner" ? "shelf" : "journey") : undefined,
          })
          if (source.adapter === "corner") {
            if (grouped)
              privateShelfDetails.set(item.id, {
                readingProgress: item.readingProgress,
                keepsakes: item.keepsakes,
              })
            delete item.readingProgress
            delete item.keepsakes
          }
        }
      ;(source.adapter === "corner"
        ? corners
        : source.adapter === "journey"
          ? journey
          : source.adapter === "albums"
            ? albums
            : projects
      ).push(...items)
    } else if (source.adapter === "stories") {
      const folders = fs
        .readdirSync(base, { withFileTypes: true })
        .filter((item) => item.isDirectory() && !item.name.startsWith("."))
      for (const folder of folders) {
        const configs = config.locales
          .map((locale) => ({ locale, file: path.join(base, folder.name, locale, "series.md") }))
          .filter((item) => fs.existsSync(item.file))
        for (const item of configs) {
          const { data, body: seriesBody } = frontmatter(
            fs.readFileSync(item.file, "utf8"),
            item.file,
          )
          // A lock protects this Markdown body; the landing and other chapters stay accessible.
          const seriesData = {
            ...data,
            lock: hasLock(data),
            locked: false,
            visibility: data.visibility === "encrypted" ? "public" : data.visibility,
          }
          const access = publication(
            seriesData,
            source,
            `${folder.name}/series`,
            "series",
            item.file,
          )
          if (access.mode === "exclude") continue
          const chapterFiles = fs
            .readdirSync(path.dirname(item.file))
            .filter((name) => name.endsWith(".md") && name !== "series.md")
          const chapterIds = []
          for (const filename of chapterFiles) {
            const file = path.join(path.dirname(item.file), filename),
              raw = frontmatter(fs.readFileSync(file, "utf8"), file),
              slug = path.basename(filename, ".md")
            const chapterData = raw.data
            const chapterAccess = publication(
              chapterData,
              source,
              `${folder.name}/${slug}`,
              slug,
              file,
            )
            if (chapterAccess.mode === "exclude") continue
            const id = `${source.id}:${folder.name}:${slug}`
            const entry = {
              ...meta(
                { ...raw.data, description: raw.data.preview ?? "" },
                raw.body,
                item.locale,
                slug,
                source.id,
                `${folder.name}/${filename}`,
                [],
              ),
              id,
              translationKey: id,
              seriesSlug: folder.name,
              part: Number(raw.data.part ?? 1),
              href: `/${item.locale}/stories/${folder.name}/${slug}/`,
              body: raw.body,
            }
            if (chapterAccess.mode === "encrypt") {
              entry.encrypted = true
              lockedEntries.set(entry, { source, file, password: chapterAccess.password })
            } else entry.body = transformBody(raw.body, source, file)
            localRoutes.set(path.resolve(file), entry.href)
            entryFiles.set(entry, file)
            entries.push(entry)
            chapterIds.push(id)
          }
          const cover = data.coverImage ?? ""
          if (cover) rememberMedia(base, source.mediaNamespace ?? "stories", folder.name, "", cover)
          const story = {
            id: `stories:${folder.name}`,
            moduleId: source.id,
            slug: folder.name,
            locale: item.locale,
            title: data.title,
            summary: data.description ?? "",
            cover,
            date: normalizeDate(data.date, item.file),
            status: data.status ?? "ongoing",
            tags: data.tags ?? [],
            chapters: chapterIds,
            encrypted: access.mode === "encrypt",
            body:
              access.mode === "encrypt" ? seriesBody : transformBody(seriesBody, source, item.file),
            photos: (data.gallery ?? data.photos ?? []).map((photo) => {
              const value = typeof photo === "string" ? { src: photo } : photo
              return {
                src: registerAsset(value.src, source, item.file),
                title:
                  typeof value.title === "object"
                    ? value.title
                    : Object.fromEntries(
                        config.locales.map((locale) => [locale, value.title ?? data.title]),
                      ),
                place: value.place ?? "",
              }
            }),
          }
          if (story.encrypted)
            lockedStoryBodies.set(story, { source, file: item.file, password: access.password })
          storyFiles.set(story, item.file)
          localRoutes.set(path.resolve(item.file), `/${item.locale}/stories/${folder.name}/`)
          stories.push(story)
        }
      }
    } else throw new Error(`Unknown content adapter: ${source.adapter}`)
  }
  for (const collection of [entries, outline, stories, projects, journey, albums, corners])
    for (const item of collection) Object.assign(item, englishFields(item))
  validateArticleStructure([...entries, ...outline])
  entries.sort((a, b) => a.weight - b.weight || b.publishedAt.localeCompare(a.publishedAt))
  const sitePaths = englishFields(
    JSON.parse(fs.readFileSync(path.resolve(root, config.site.paths), "utf8")),
  )
  const profile = englishFields(
    JSON.parse(fs.readFileSync(path.resolve(root, config.site.profile), "utf8")),
  )
  for (const collection of [projects, journey, albums, corners]) {
    const ids = new Set()
    for (const item of collection) {
      if (ids.has(item.id)) throw Error(`Duplicate collection ID: ${item.id}`)
      ids.add(item.id)
    }
  }
  for (const item of [...journey, ...projects, ...albums, ...corners])
    for (const [locale, file] of Object.entries(item._sourceFiles))
      localRoutes.set(path.resolve(file), `/${locale}/${collectionRoute(item)}/${item.id}/`)
  function rewriteLinks(body, file) {
    return body.replace(
      /(?<!!)\[([^\]]+)\]\(([^)\s]+\.md)(#[^)]*)?\)/g,
      (match, label, url, hash = "") => {
        if (url.startsWith("/") || /^https?:/.test(url)) return match
        const destination = localRoutes.get(
          path.resolve(path.dirname(file), decodeURIComponent(url)),
        )
        if (!destination)
          throw Error(`Markdown link points to missing or unpublished content: ${url}`)
        return `[${label}](${destination}${hash})`
      },
    )
  }
  for (const entry of entries) {
    entry.body = rewriteLinks(entry.body, entryFiles.get(entry))
    if (entry.encrypted) {
      const lock = lockedEntries.get(entry)
      entry.body = await encryptMarkdown(entry.body, lock.password, lock.source, lock.file, root)
      await protect(
        entry.href,
        lock.password,
        entry.title,
        entry.seriesSlug
          ? `/${entry.locale}/stories/${entry.seriesSlug}/`
          : `/${entry.locale}/notes/`,
      )
    }
  }
  assertUnique(entries)
  for (const story of stories) {
    story.body = rewriteLinks(story.body ?? "", storyFiles.get(story))
    if (story.encrypted) {
      const lock = lockedStoryBodies.get(story)
      story.body = await encryptMarkdown(story.body, lock.password, lock.source, lock.file, root)
    }
  }
  for (const item of [...journey, ...projects, ...albums, ...corners]) {
    for (const locale of config.locales) {
      const file = item._originFiles[locale]
      item.bodies[locale] = rewriteLinks(item.bodies[locale], file)
      if (item.encrypted) {
        const lock = lockedCollections.get(item)
        const photos = item._privatePhotos.map((photo) => ({
          ...photo,
          alt:
            typeof photo.title === "string"
              ? photo.title
              : (photo.title?.[locale] ?? photo.title?.en ?? photo.title?.vi ?? item.title[locale]),
        }))
        item.bodies[locale] = await encryptMarkdown(
          item.bodies[locale],
          lock.password,
          lock.source,
          file,
          root,
          photos,
          { gallery: albums.includes(item) },
        )
        await protect(
          `/${locale}/${collectionRoute(item)}/${item.id}/`,
          lock.password,
          item.title[locale],
          corners.includes(item) ? `/${locale}/shelf/` : `/${locale}/${collectionRoute(item)}/`,
          lock.group ? `/${locale}/${lock.group}/` : undefined,
        )
      }
    }
    delete item._lockData
    delete item._lockFile
    delete item._privatePhotos
    delete item._sourceFiles
    delete item._originFiles
  }
  for (const entry of entries)
    for (const topic of entry.topics)
      if (!config.topics.some((item) => item.id === topic))
        throw Error(`Unregistered topic ${topic} in ${entry.id}`)
  const paths = compileLearningPaths(config, entries, sitePaths, outline)
  const topicAvailability = config.topics.map((topic) => ({
    ...topic,
    available:
      entries.some((entry) => !entry.seriesSlug && entry.topics.includes(topic.id)) ||
      paths.some(
        (course) =>
          course.topics.includes(topic.id) &&
          (course.sections?.some((section) => section.steps.length) || course.entries.length > 0),
      ),
  }))
  // Only assets of published entries are emitted. Never sync an entire private repository.
  const collectionBodies = [...journey, ...projects, ...albums, ...corners].flatMap((item) =>
    config.locales.map((locale) => ({
      body: item.bodies[locale],
      encrypted: item.encrypted,
      item,
      locale,
    })),
  )
  const assetDimensions = await emitAssets(
    root,
    usedMedia,
    [...entries, ...collectionBodies],
    stories,
    config.site.imageVariants ?? [],
  )
  for (const body of collectionBodies) body.item.bodies[body.locale] = body.body
  for (const track of music)
    if (/\.(png|jpe?g)$/i.test(track.cover) && usedMedia.has(track.cover))
      track.cover = track.cover.replace(/\.(png|jpe?g)$/i, ".webp")
  for (const project of [...projects, ...corners]) {
    if (/\.(png|jpe?g)$/i.test(project.cover) && usedMedia.has(project.cover))
      project.cover = project.cover.replace(/\.(png|jpe?g)$/i, ".webp")
    for (const photo of project.photos ?? [])
      if (/\.(png|jpe?g)$/i.test(photo.src) && usedMedia.has(photo.src))
        photo.src = photo.src.replace(/\.(png|jpe?g)$/i, ".webp")
  }
  for (const story of stories)
    for (const photo of story.photos ?? []) {
      if (/\.(png|jpe?g)$/i.test(photo.src) && usedMedia.has(photo.src))
        photo.src = photo.src.replace(/\.(png|jpe?g)$/i, ".webp")
      if (assetDimensions[photo.src]) Object.assign(photo, assetDimensions[photo.src])
    }
  for (const item of albums) {
    if (/\.(png|jpe?g)$/i.test(item.cover) && usedMedia.has(item.cover))
      item.cover = item.cover.replace(/\.(png|jpe?g)$/i, ".webp")
    for (const photo of item.items ?? []) {
      if (/\.(png|jpe?g)$/i.test(photo.src) && usedMedia.has(photo.src))
        photo.src = photo.src.replace(/\.(png|jpe?g)$/i, ".webp")
      if (assetDimensions[photo.src]) Object.assign(photo, assetDimensions[photo.src])
    }
  }
  for (const item of journey)
    for (const photo of item.photos ?? [])
      if (/\.(png|jpe?g)$/i.test(photo.src) && usedMedia.has(photo.src))
        photo.src = photo.src.replace(/\.(png|jpe?g)$/i, ".webp")
  fs.mkdirSync(output, { recursive: true })
  function writeIfChanged(filename, value) {
    const target = path.join(output, filename),
      text = JSON.stringify(value, null, 2) + "\n"
    if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== text)
      fs.writeFileSync(target, text)
  }
  const sitePages = {}
  if (journeyAccess) sitePages.journey = { encrypted: journeyAccess.mode === "encrypt" }
  if (journeyAccess?.mode === "encrypt")
    for (const locale of config.locales)
      await protect(
        `/${locale}/journey/`,
        journeyAccess.password,
        { vi: "Hành trình", en: "Journey", ja: "歩み", zh: "旅程" }[locale] ?? "Journey",
        `/${locale}/`,
        `/${locale}/journey/`,
      )
  if (shelfAccess?.mode === "encrypt") {
    sitePages.shelf = { encrypted: true, bodies: {} }
    for (const locale of config.locales) {
      const items = corners
        .filter((item) => item.category === "books")
        .map(({ bodies: _bodies, bodyLocales, ...meta }) => ({
          ...meta,
          ...privateShelfDetails.get(meta.id),
          bodyLocale: bodyLocales[locale],
          href: `/${locale}/corner/${meta.slug}/`,
        }))
      sitePages.shelf.bodies[locale] = await encryptString(
        shelfAccess.password,
        JSON.stringify(items),
      )
      for (const route of ["shelf", "corner"])
        await protect(
          `/${locale}/${route}/`,
          shelfAccess.password,
          { vi: "Đọc sách", en: "Reading", ja: "読書", zh: "读书" }[locale] ?? "Reading",
          `/${locale}/`,
          `/${locale}/shelf/`,
        )
    }
  }
  if (config.site.photoJournal) {
    const file = path.resolve(root, config.site.photoJournal)
    const { data, body } = frontmatter(fs.readFileSync(file, "utf8"), file)
    const source = { id: "site", path: path.dirname(file) }
    const access = publication(data, source, "my-album", "my-album", file)
    if (access.mode === "exclude")
      throw Error(
        "Photo journal page must be public or password protected; use lock: true to show its password form.",
      )
    sitePages.photoJournal = { encrypted: access.mode === "encrypt", bodies: {} }
    if (access.mode === "encrypt")
      for (const locale of config.locales) {
        const photos = (profile.photos ?? []).map((photo) => ({
          src: photo.src,
          alt: photo.title[locale],
          place: photo.place,
        }))
        await protect(`/${locale}/my-album/`, access.password, data.title, `/${locale}/about/`)
        sitePages.photoJournal.bodies[locale] = await encryptMarkdown(
          body,
          access.password,
          source,
          file,
          root,
          photos,
          { gallery: true },
        )
      }
  }
  for (const locale of config.locales)
    accessRules.push({
      href: `/${locale}/vault/`,
      back: `/${locale}/my-album/`,
      title: {
        vi: "Kho riêng",
        en: "Private archive",
        ja: "プライベートアーカイブ",
        zh: "私人档案",
      }[locale],
      kind: "vault",
    })
  writeIfChanged("access.json", accessRules)
  if (new Set(music.map((track) => track.id)).size !== music.length)
    throw Error("Duplicate music track ID across modules")
  writeIfChanged("content.json", { entries, stories, projects, paths, journey, albums, corners })
  writeIfChanged("music.json", music)
  writeIfChanged("site-pages.json", sitePages)
  writeIfChanged("profile.json", profile)
  writeIfChanged("topics.json", topicAvailability)
  writeIfChanged(
    "modules.json",
    config.sources.map((source) => ({
      ...moduleMetadata(source),
      available:
        !["notes", "articles"].includes(source.adapter) ||
        source.defaultTopics?.some((id) =>
          topicAvailability.some((topic) => topic.id === id && topic.available),
        ) === true,
      count:
        source.adapter === "corner"
          ? corners.filter((item) => item.moduleId === source.id).length +
            music.filter((item) => item.moduleId === source.id).length
          : source.adapter === "projects"
            ? projects.filter((item) => item.moduleId === source.id).length
            : source.adapter === "albums"
              ? albums.filter((item) => item.moduleId === source.id).length
              : source.adapter === "journey"
                ? journey.filter((item) => item.moduleId === source.id).length
                : source.adapter === "stories"
                  ? stories.filter((item) => item.moduleId === source.id).length
                  : entries.filter((item) => item.moduleId === source.id && !item.seriesSlug)
                      .length,
    })),
  )
  writeIfChanged("assets.json", assetDimensions)
  writeIfChanged(
    "search.json",
    entries
      .filter((entry) => !entry.encrypted)
      .map(({ body, ...meta }) => ({
        ...meta,
        excerpt: learningMarkdown(body)
          .markdown.replace(/!\[[^\]]*\]\([^)]+\)/g, "")
          .replace(/[#*`>|]/g, "")
          .slice(0, 2200),
      })),
  )
  writeIfChanged("manifest.json", {
    sources,
    entries: entries.length,
    stories: stories.length,
    assets: usedMedia.size,
  })
  console.log(
    `[Content] Validated ${entries.length} localized entries, ${stories.length} stories, ${usedMedia.size} public assets. Private content: ${policy}.`,
  )
}
