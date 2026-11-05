import fs from "node:fs"
import path from "node:path"
const root = path.resolve(import.meta.dirname, "../.."),
  content = path.resolve(root, "../content")
const [kind, ...args] = process.argv.slice(2)
function slug(value) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value ?? ""))
    throw Error("Use lowercase letters, numbers and hyphens for the ID.")
  return value
}
function argument(name, fallback) {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : fallback
}
const pretty = (value) =>
  value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
function create(file, text) {
  if (fs.existsSync(file)) throw Error(`Already exists: ${path.relative(root, file)}`)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, text)
  console.log(`[Content] Created ${path.relative(root, file)}`)
}
if (kind === "module") {
  const id = slug(args[0]),
    adapter = argument("--type", "articles"),
    title = argument("--title", pretty(id))
  if (
    !["articles", "notes", "journey", "projects", "stories", "albums", "corner"].includes(adapter)
  )
    throw Error("Unsupported module type")
  const definition = {
    id,
    adapter,
    title: { vi: title, en: title },
    description: { vi: "", en: "" },
    order: 100,
  }
  if (["articles", "notes"].includes(adapter)) {
    const topic = argument("--topic", id.replace(/-notes$/, ""))
    definition.topic = {
      id: slug(topic),
      label: definition.title,
      description: definition.description,
      symbol: "book",
      color: "blue",
    }
  }
  if (adapter === "corner") definition.music = "music/tracks.json"
  const repository = argument("--repository", `vuongthm/${id}`)
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) throw Error("Use owner/repo for --repository")
  const manifestFile = path.join(root, "content.sources.json")
  const config = JSON.parse(fs.readFileSync(manifestFile, "utf8"))
  if ((config.repositories ?? []).some((repo) => repo.id === id))
    throw Error(`Repository is already registered: ${id}`)
  create(path.join(content, id, "module.json"), JSON.stringify(definition, null, 2) + "\n")
  create(
    path.join(content, id, ".github/workflows/notify-root.yml"),
    fs.readFileSync(path.join(import.meta.dirname, "templates/notify-site.yml"), "utf8"),
  )
  if (adapter === "corner") create(path.join(content, id, "music/tracks.json"), "[]\n")
  config.repositories ??= []
  config.repositories.push({
    id,
    repository,
    ref: "main",
  })
  fs.writeFileSync(manifestFile, JSON.stringify(config, null, 2) + "\n")
  console.log(
    "[Content] Repository registered. Push the new content repo and website config; configure WEBSITE_NOTIFY_KEY in the content repo.",
  )
} else if (
  kind === "article" ||
  kind === "project" ||
  kind === "milestone" ||
  kind === "album" ||
  kind === "corner"
) {
  const moduleId = ["article", "album", "corner"].includes(kind)
      ? slug(args[0])
      : kind === "project"
        ? "projects"
        : "journey",
    id = slug(args[["article", "album", "corner"].includes(kind) ? 1 : 0]),
    locale = argument("--lang", "vi")
  if (!["vi", "en", "ja", "zh"].includes(locale)) throw Error("Unsupported locale")
  const definition = JSON.parse(
    fs.readFileSync(path.join(content, moduleId, "module.json"), "utf8"),
  )
  if (kind === "article" && !["notes", "articles"].includes(definition.adapter))
    throw Error("Choose an article module")
  if (kind === "album" && definition.adapter !== "albums") throw Error("Choose an albums module")
  const category = argument("--category", "books")
  if (
    kind === "corner" &&
    (definition.adapter !== "corner" || !["books", "films", "podcasts"].includes(category))
  )
    throw Error("Choose a corner module and category books|films|podcasts")
  const file =
    kind === "project"
      ? path.join(content, moduleId, id, locale, "index.md")
      : kind === "corner"
        ? path.join(content, moduleId, category, locale, id + ".md")
        : path.join(content, moduleId, locale, id + ".md")
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
  const lines = [
    `id: ${moduleId}:${id}`,
    `title: ${JSON.stringify(pretty(id))}`,
    `description: ""`,
    `status: draft`,
  ]
  if (kind === "article") lines.push(`date: ${date}`, "kind: note", "level: beginner")
  else {
    lines[0] = `id: ${id}`
    if (kind === "corner") lines.push(`category: ${category}`, "shelfStatus: planned", "order: 100")
    else if (kind === "album") lines.push("items: []")
    else if (kind === "project") lines.push("category: Personal project", "stack: []")
    else lines.push(`label: ${JSON.stringify(pretty(id))}`, "order: 100")
  }
  create(
    file,
    "---\n" +
      lines.join("\n") +
      "\n---\n\n## " +
      (locale === "vi" ? "Nội dung" : "Overview") +
      "\n\n" +
      (locale === "vi" ? "Viết nội dung tại đây." : "Write your content here.") +
      "\n",
  )
  console.log(
    "[Content] Draft created. Publish by changing status, then pnpm dev updates automatically.",
  )
} else
  throw Error(
    "Usage: pnpm content:new module <id> [--type articles|projects|journey|stories|albums|corner] | article <module> <slug> | project <slug> | milestone <slug> | album <module> <slug> | corner <module> <slug> [--category books|films|podcasts]",
  )
