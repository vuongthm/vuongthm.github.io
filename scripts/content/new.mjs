import fs from "node:fs"
import path from "node:path"
import { frontmatter } from "./schema.mjs"
import { authoringDate, moduleOrders } from "./authoring.mjs"
import { learningFiles, readLearningDefinitions } from "./learning-files.mjs"
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
function moduleFolder(value) {
  if (typeof value !== "string") throw Error("Invalid module folder")
  value.split("/").forEach((part) => {
    slug(part)
    if (["vi", "en", "ja", "zh", "media", "assets", "inbox"].includes(part))
      throw Error("Reserved module folder")
  })
  return value
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
    definition.modules = [
      { id: "foundations", title: { vi: "Nền tảng", en: "Foundations" }, order: 10 },
    ]
  }
  if (adapter === "corner") definition.music = "music/tracks.json"
  const repository = argument("--repository", `vuongthm/${id}`)
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) throw Error("Use owner/repo for --repository")
  const manifestFile = path.join(root, "content.sources.json")
  const config = JSON.parse(fs.readFileSync(manifestFile, "utf8"))
  if ((config.repositories ?? []).some((repo) => repo.id === id))
    throw Error(`Repository is already registered: ${id}`)
  create(path.join(content, id, "module.json"), JSON.stringify(definition, null, 2) + "\n")
  if (definition.modules)
    for (const folder of ["vi", "en", "media"])
      create(path.join(content, id, "foundations", folder, ".gitkeep"), "")
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
} else if (kind === "section") {
  const repository = slug(args[0]),
    id = slug(args[1])
  const file = path.join(content, repository, "module.json")
  const definition = JSON.parse(fs.readFileSync(file, "utf8"))
  if (!["notes", "articles"].includes(definition.adapter))
    throw Error("Choose an article repository")
  definition.modules ??= []
  if (definition.modules.some((item) => item.id === id)) throw Error(`Module already exists: ${id}`)
  const order = Number(
    argument("--order", String(Math.max(0, ...definition.modules.map((item) => item.order)) + 10)),
  )
  if (!Number.isSafeInteger(order) || order < 1)
    throw Error("Module order must be a positive integer")
  const title = argument("--title", pretty(id))
  const group = argument("--group"),
    folder = moduleFolder(group ? `${slug(group)}/${id}` : id)
  if (
    definition.modules.some((item) => {
      const existing = item.path ?? item.id
      return (
        existing === folder ||
        existing.startsWith(folder + "/") ||
        folder.startsWith(existing + "/")
      )
    })
  )
    throw Error("Module folders must not overlap")
  if (fs.existsSync(path.join(content, repository, folder)))
    throw Error(`Folder already exists: ${folder}`)
  definition.modules.push({
    id,
    ...(group ? { path: folder } : {}),
    title: { vi: title, en: argument("--title-en", title) },
    order,
  })
  for (const child of ["vi", "en", "media"])
    create(path.join(content, repository, folder, child, ".gitkeep"), "")
  fs.writeFileSync(file, JSON.stringify(definition, null, 2) + "\n")
} else if (kind === "path") {
  const id = slug(args[0]),
    owner = argument("--repo"),
    topic = slug(argument("--topic", "security"))
  const refs = argument("--modules", "").split(",").filter(Boolean)
  if (!refs.length) throw Error("Choose --modules repo/module,repo/module")
  const seen = new Set()
  for (const ref of refs) {
    const parts = ref.split("/")
    if (parts.length !== 2) throw Error("Use repo/module for each module reference")
    parts.forEach(slug)
    const definition = JSON.parse(
      fs.readFileSync(path.join(content, parts[0], "module.json"), "utf8"),
    )
    if (!definition.modules?.some((item) => item.id === parts[1]) || seen.has(ref))
      throw Error(`Unknown or duplicate module: ${ref}`)
    seen.add(ref)
  }
  const manifestFile = owner ? path.join(content, slug(owner), "module.json") : undefined
  const definition = owner ? JSON.parse(fs.readFileSync(manifestFile, "utf8")) : undefined
  const group = argument("--group")
  if (group && !owner) throw Error("A grouped learning path requires --repo")
  const relative = group ? `${slug(group)}/learning-path.json` : "learning-paths.json"
  const file = owner ? path.join(content, owner, relative) : path.join(root, "site/paths.json")
  if (group && fs.existsSync(file)) throw Error(`Learning path already exists in group: ${group}`)
  const existingData = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : []
  const existing = Array.isArray(existingData) ? existingData : [existingData]
  if (existing.some((item) => item.slug === id)) throw Error(`Path already exists: ${id}`)
  const title = argument("--title", pretty(id))
  existing.push({
    slug: id,
    title: { vi: title, en: argument("--title-en", title) },
    description: { vi: "", en: "" },
    topic,
    status: "draft",
    sections: refs.map((ref) => ({ id: ref.replace("/", "-"), module: ref })),
  })
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(group ? existing[0] : existing, null, 2) + "\n")
  if (owner && !learningFiles(definition).includes(relative)) {
    definition.learningPaths = [...learningFiles(definition), relative]
    fs.writeFileSync(manifestFile, JSON.stringify(definition, null, 2) + "\n")
  }
  console.log(`[Content] Created draft path ${id}. Its modules are shared; no Markdown was copied.`)
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
  const unit =
    kind === "article"
      ? argument(
          "--module",
          definition.modules?.length === 1 ? definition.modules[0].id : undefined,
        )
      : undefined
  if (
    kind === "article" &&
    definition.modules?.length &&
    !definition.modules.some((item) => item.id === unit)
  )
    throw Error(`Choose --module: ${definition.modules.map((item) => item.id).join(", ")}`)
  const unitId = unit ? slug(unit) : undefined
  const unitFolder = unitId
    ? moduleFolder(definition.modules?.find((item) => item.id === unitId)?.path ?? unitId)
    : undefined
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
        : path.join(content, moduleId, ...(unitFolder ? [unitFolder] : []), locale, id + ".md")
  const counterpart =
    kind === "article"
      ? ["vi", "en", "ja", "zh"]
          .filter((lang) => lang !== locale)
          .map((lang) => path.join(path.dirname(path.dirname(file)), lang, id + ".md"))
          .filter((target) => fs.existsSync(target))
          .map((target) => frontmatter(fs.readFileSync(target, "utf8"), target).data)[0]
      : undefined
  const date = authoringDate(argument("--date", counterpart?.publishedAt ?? counterpart?.date))
  const lines = [
    `id: ${JSON.stringify(counterpart?.id ?? `${moduleId}:${id}`)}`,
    `title: ${JSON.stringify(argument("--title", pretty(id)))}`,
    `description: ""`,
    `status: draft`,
  ]
  if (kind === "article") {
    lines.push(
      `translationKey: ${JSON.stringify(counterpart?.translationKey ?? counterpart?.id ?? `${moduleId}:${id}`)}`,
      `slug: ${id}`,
    )
    lines.push(`date: ${date}`, "kind: note", "level: beginner")
    if (args.includes("--outline")) lines.push("outline: true")
    if (unitFolder) {
      const existing = path.join(content, moduleId, unitFolder, locale)
      const used = fs.existsSync(existing)
        ? fs
            .readdirSync(existing)
            .filter((name) => name.endsWith(".md"))
            .map(
              (name) =>
                frontmatter(fs.readFileSync(path.join(existing, name), "utf8")).data.order ?? 0,
            )
        : []
      const allOrders = moduleOrders(path.join(content, moduleId), unitFolder)
      const order = Number(
        argument("--order", String(counterpart?.order ?? Math.max(0, ...allOrders) + 1)),
      )
      if (
        !Number.isSafeInteger(order) ||
        order < 1 ||
        used.includes(order) ||
        (!counterpart && allOrders.includes(order))
      )
        throw Error("Choose a unique, positive article --order within this module and locale")
      const topicIds = argument(
        "--topics",
        (
          counterpart?.topics ??
          definition.defaultTopics ?? [definition.topic?.id ?? moduleId]
        ).join(","),
      )
        .split(",")
        .map(slug)
      lines.push(`module: ${unitId}`, `order: ${order}`, `topics: ${JSON.stringify(topicIds)}`)
    }
    const courseId = argument("--path", counterpart?.learning?.path)
    if (courseId) {
      const section = slug(argument("--section", counterpart?.learning?.section)),
        step = slug(argument("--step", counterpart?.learning?.step))
      const courses = [
        ...JSON.parse(fs.readFileSync(path.join(root, "site/paths.json"), "utf8")),
        ...readLearningDefinitions({ ...definition, path: path.join(content, moduleId) }),
      ]
      const course = courses.find((item) => item.slug === slug(courseId))
      const chapter = course?.sections?.find((item) => item.id === section)
      if (chapter?.module) {
        if (chapter.module !== `${moduleId}/${unitId}`)
          throw Error("This article belongs to a different content module")
      } else {
        const slot = chapter?.steps?.find((item) => item.id === step)
        if (!slot) throw Error("Unknown learning path, section or step")
        const order = course.sections.flatMap((item) => item.steps ?? []).indexOf(slot) + 1
        lines.push(
          "learning:",
          `  path: ${courseId}`,
          `  section: ${section}`,
          `  step: ${step}`,
          `  order: ${order}`,
        )
      }
    } else if (argument("--section") || argument("--step"))
      throw Error("Learning assignments require --path, --section and --step together")
  } else {
    lines[0] = `id: ${id}`
    if (kind === "corner") lines.push(`category: ${category}`, "shelfStatus: planned", "order: 100")
    else if (kind === "album") lines.push("items: []")
    else if (kind === "project")
      lines.push(
        "category: Personal project",
        "stack: []",
        `date: ${date}`,
        `year: "${date.slice(0, 4)}"`,
      )
    else lines.push(`label: ${JSON.stringify(pretty(id))}`, "order: 100")
  }
  create(
    file,
    "---\n" +
      lines.join("\n") +
      "\n---\n\n## " +
      (locale === "vi" ? "Nội dung" : "Overview") +
      "\n\n" +
      (locale === "vi" ? "<!-- Viết nội dung tại đây. -->" : "<!-- Write your content here. -->") +
      "\n",
  )
  console.log(
    "[Content] Draft created. Publish by changing status, then pnpm dev updates automatically.",
  )
} else
  throw Error(
    "Usage: pnpm content:new module <repo> | section <repo> <module> [--group soc-l2] [--title title] | path <id> --modules repo/module,repo/module [--repo owner-repo] [--topic security] | article <repo> <slug> [--module id] [--topics soc,security] [--order 1] [--date YYYY-MM-DD] [--outline] | project <slug> | milestone <slug> | album <module> <slug> | corner <module> <slug>",
  )
