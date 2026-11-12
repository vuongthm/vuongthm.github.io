import fs from "node:fs"
import path from "node:path"
import { contentModules } from "./structure.mjs"
import { localizedText } from "./localized.mjs"
export { localizedText } from "./localized.mjs"
const adapters = new Set([
  "notes",
  "articles",
  "stories",
  "projects",
  "journey",
  "albums",
  "corner",
])
const moduleId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const excludedModule = (source) =>
  source.enabled === false ||
  source.status === "draft" ||
  ["private", "encrypted"].includes(source.visibility) ||
  source.locked === true

function readModule(base, expectedId) {
  const data = JSON.parse(fs.readFileSync(path.join(base, "module.json"), "utf8"))
  const id = data.id ?? path.basename(base)
  if (expectedId && id !== expectedId)
    throw Error(`Repository module ID mismatch: expected ${expectedId}, received ${id}`)
  const contentPath = path.resolve(base, data.contentPath ?? ".")
  if (contentPath !== base && !contentPath.startsWith(base + path.sep))
    throw Error(`Module contentPath escapes its folder: ${id}`)
  return {
    ...data,
    id,
    adapter: data.adapter ?? "articles",
    path: contentPath,
    required: true,
    discovered: true,
  }
}

export function loadContentConfig(root, { allowMissingRepositories = false } = {}) {
  const config = JSON.parse(fs.readFileSync(path.join(root, "content.sources.json"), "utf8"))
  const sources = [...(config.sources ?? [])].map((source) => ({
    ...source,
    path: path.resolve(root, source.path),
  }))
  const localModules = []
  for (const location of config.moduleRoots ?? []) {
    const directory = path.resolve(root, location)
    // The local collection workspace is optional in the independent website repo.
    if (!fs.existsSync(directory)) continue
    for (const folder of fs
      .readdirSync(directory, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))) {
      if (!folder.isDirectory() || folder.name.startsWith(".") || folder.name.startsWith("_"))
        continue
      const base = path.join(directory, folder.name)
      if (fs.existsSync(path.join(base, "module.json"))) localModules.push(readModule(base))
    }
  }
  sources.push(...localModules)
  const repositories = [],
    registered = new Set()
  for (const repo of config.repositories ?? []) {
    if (!moduleId.test(repo.id) || registered.has(repo.id))
      throw Error(`Invalid or duplicate repository ID: ${repo.id}`)
    registered.add(repo.id)
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo.repository))
      throw Error(`Invalid GitHub repository: ${repo.id}`)
    if (repo.ref && !/^[\w./-]+$/.test(repo.ref)) throw Error(`Invalid repository ref: ${repo.id}`)
    const destination = path.join(root, ".content-sources", repo.id)
    const local = localModules.some((source) => source.id === repo.id)
    repositories.push({ ...repo, destination, local })
    if (local) continue
    if (fs.existsSync(path.join(destination, "module.json"))) {
      sources.push(readModule(destination, repo.id))
    } else if (!allowMissingRepositories) {
      throw Error(
        `Missing repository module ${repo.id}. Run pnpm content to fetch ${repo.repository}; its root must contain module.json.`,
      )
    }
  }
  // Private/disabled local modules must also suppress their remote counterpart.
  const publicSources = sources.filter((source) => !excludedModule(source))
  const seen = new Set()
  for (const source of publicSources) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(source.id) || seen.has(source.id))
      throw Error(`Invalid or duplicate module ID: ${source.id}`)
    seen.add(source.id)
    if (!adapters.has(source.adapter)) throw Error(`Unknown content adapter: ${source.adapter}`)
    source.title = localizedText(source.title, config.locales, source.id)
    source.description = localizedText(source.description, config.locales, "")
    source.mediaNamespace ??= source.id
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(source.mediaNamespace))
      throw Error(`Invalid media namespace: ${source.id}`)
    source.order = Number(source.order ?? 999)
    if (!Number.isFinite(source.order)) throw Error(`Invalid module order: ${source.id}`)
    source.modules = contentModules(source, config.locales)
    if (["articles", "notes"].includes(source.adapter) && !source.topic)
      source.topic = {
        id: source.defaultTopics?.[0] ?? source.id,
        label: source.title,
        description: source.description,
        color: "blue",
        symbol: "book",
      }
    if (source.topic) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(source.topic.id))
        throw Error(`Invalid topic ID: ${source.id}`)
      source.topic = {
        ...source.topic,
        label: localizedText(source.topic.label, config.locales, source.title.en),
        description: localizedText(source.topic.description, config.locales, source.description.en),
        color: source.topic.color ?? "blue",
        symbol: source.topic.symbol ?? "book",
      }
      source.defaultTopics ??= [source.topic.id]
    }
  }
  publicSources.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
  const topics = []
  for (const source of publicSources)
    if (source.topic && !topics.some((topic) => topic.id === source.topic.id))
      topics.push(source.topic)
  return { ...config, sources: publicSources, repositories, topics }
}
export function moduleMetadata(source) {
  return {
    id: source.id,
    adapter: source.adapter,
    title: source.title,
    description: source.description,
    order: source.order,
    topics: source.defaultTopics ?? [],
    modules: source.modules ?? [],
  }
}
