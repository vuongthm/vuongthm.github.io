import path from "node:path"
import { localizedText } from "./localized.mjs"

const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function contentModules(source, locales) {
  if (source.modules === undefined) return []
  if (!Array.isArray(source.modules) || !source.modules.length)
    throw Error(`${source.id}: modules must be a nonempty list`)
  const seen = new Set()
  const folders = []
  return source.modules
    .map((item) => {
      if (!slug.test(item.id) || seen.has(item.id))
        throw Error(`${source.id}: invalid or duplicate content module`)
      seen.add(item.id)
      const folder = item.path ?? item.id
      if (
        typeof folder !== "string" ||
        !folder
          .split("/")
          .every(
            (part) =>
              slug.test(part) &&
              !["vi", "en", "ja", "zh", "media", "assets", "inbox"].includes(part),
          )
      )
        throw Error(`${source.id}/${item.id}: invalid module path`)
      if (
        folders.some(
          (existing) =>
            existing === folder ||
            existing.startsWith(folder + "/") ||
            folder.startsWith(existing + "/"),
        )
      )
        throw Error(`${source.id}/${item.id}: duplicate or overlapping module path`)
      folders.push(folder)
      if (!Number.isSafeInteger(item.order) || item.order < 1)
        throw Error(`${source.id}/${item.id}: module order must be a positive integer`)
      return {
        id: item.id,
        path: folder,
        title: localizedText(item.title, locales, item.id),
        order: item.order,
      }
    })
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
}

/** Old repositories remain readable; declared modules use an explicit, strict contract. */
export function articleStructure(source, relative, data, topics) {
  const modules = source.modules ?? []
  if (!modules.length) return {}
  const unit = modules.find((item) => item.id === data.module)
  if (!unit) throw Error(`${relative}: module must name a declared content module in ${source.id}`)
  const parts = relative.split(path.sep)
  const folder = unit.path ?? unit.id,
    prefix = folder.split("/")
  if (
    parts.length !== prefix.length + 2 ||
    parts.slice(0, prefix.length).join("/") !== folder ||
    !["vi", "en", "ja", "zh"].includes(parts[prefix.length])
  )
    throw Error(`${relative}: expected ${folder}/<locale>/<article>.md`)
  if (!Number.isSafeInteger(data.order) || data.order < 1)
    throw Error(`${relative}: article order must be a positive integer`)
  if (data.learning && (!Number.isSafeInteger(data.learning.order) || data.learning.order < 1))
    throw Error(`${relative}: a learning assignment requires an explicit positive order`)
  if (
    !Array.isArray(data.topics) ||
    !data.topics.length ||
    data.topics.some((id) => !topics.some((topic) => topic.id === id))
  )
    throw Error(`${relative}: topics must contain known topic IDs`)
  return { contentModule: unit, order: data.order }
}

export function validateArticleStructure(entries) {
  const slots = new Map(),
    translations = new Map(),
    identities = new Set()
  for (const entry of entries.filter((item) => item.contentModule)) {
    const identity = `${entry.moduleId}/${entry.locale}/${entry.id}`
    if (identities.has(identity)) throw Error(`Duplicate article identity: ${identity}`)
    identities.add(identity)
    const slot = `${entry.moduleId}/${entry.contentModule.id}/${entry.locale}/${entry.order}`
    if (slots.has(slot) && slots.get(slot) !== entry.translationKey)
      throw Error(`Duplicate article order: ${slot}`)
    slots.set(slot, entry.translationKey)
    const key = `${entry.moduleId}/${entry.translationKey}`
    const assignment = JSON.stringify([
      entry.contentModule.id,
      entry.order,
      entry.topics,
      entry.learning ?? null,
    ])
    if (translations.has(key) && translations.get(key) !== assignment)
      throw Error(`Translation structure mismatch: ${key}`)
    translations.set(key, assignment)
  }
}
