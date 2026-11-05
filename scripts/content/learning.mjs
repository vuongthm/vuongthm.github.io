import fs from "node:fs"
import path from "node:path"
import { localizedText } from "./config.mjs"
import { learningMarkdown } from "../../lib/learning/markdown.mjs"
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export function learningAssignment(value) {
  if (value === undefined || value === null) return undefined
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("learning must contain path, section and step")
  for (const field of ["path", "section", "step"])
    if (typeof value[field] !== "string" || !slug.test(value[field]))
      throw Error(`Invalid learning ${field}`)
  return { path: value.path, section: value.section, step: value.step }
}
export function validateQuizBlocks(body, file) {
  try {
    learningMarkdown(body)
  } catch (error) {
    throw Error(`${file}: ${error.message}`)
  }
}
export function compileLearningPaths(config, entries, sitePaths) {
  const definitions = sitePaths.map((item) => ({ ...item }))
  for (const source of config.sources) {
    if (!source.learningPaths) continue
    if (typeof source.learningPaths !== "string" || path.isAbsolute(source.learningPaths))
      throw Error(`Invalid learningPaths file: ${source.id}`)
    const base = fs.realpathSync(source.path),
      file = fs.realpathSync(path.resolve(base, source.learningPaths))
    if (!file.startsWith(base + path.sep)) throw Error(`Learning paths escape module: ${source.id}`)
    const data = JSON.parse(fs.readFileSync(file, "utf8"))
    if (!Array.isArray(data)) throw Error(`Learning paths must be an array: ${source.id}`)
    definitions.push(...data.map((item) => ({ ...item, moduleId: source.id })))
  }
  const seen = new Set()
  const paths = definitions.map((item) => {
    if (!slug.test(item.slug) || seen.has(item.slug))
      throw Error(`Invalid or duplicate learning path: ${item.slug}`)
    seen.add(item.slug)
    const result = {
      ...item,
      title: localizedText(item.title, config.locales, item.slug),
      description: localizedText(item.description, config.locales),
      entries: item.sections ? [] : (item.entries ?? []),
    }
    if (!config.topics.some((topic) => topic.id === item.topic))
      throw Error(`Unknown learning path topic: ${item.topic}`)
    if (item.sections) {
      if (!Array.isArray(item.sections) || !item.sections.length)
        throw Error(`Empty learning path sections: ${item.slug}`)
      const sections = new Set(),
        steps = new Set()
      result.sections = item.sections.map((section) => {
        if (!slug.test(section.id) || sections.has(section.id))
          throw Error(`Invalid or duplicate learning section: ${section.id}`)
        sections.add(section.id)
        if (!Array.isArray(section.steps) || !section.steps.length)
          throw Error(`Empty learning section: ${section.id}`)
        return {
          id: section.id,
          title: localizedText(section.title, config.locales, section.id),
          steps: section.steps.map((step) => {
            if (!slug.test(step.id) || steps.has(step.id))
              throw Error(`Invalid or duplicate learning step: ${step.id}`)
            steps.add(step.id)
            return { id: step.id, title: localizedText(step.title, config.locales, step.id) }
          }),
        }
      })
    }
    return result
  })
  const assigned = new Map()
  for (const entry of entries.filter((item) => !item.seriesSlug && item.learning)) {
    const assignment = entry.learning,
      course = paths.find((item) => item.slug === assignment.path && item.sections)
    const section = course?.sections.find((item) => item.id === assignment.section),
      step = section?.steps.find((item) => item.id === assignment.step)
    if (!step)
      throw Error(
        `Unknown learning slot for ${entry.id}: ${assignment.path}/${assignment.section}/${assignment.step}`,
      )
    if (!entry.topics.includes(course.topic)) throw Error(`Learning topic mismatch: ${entry.id}`)
    const key = `${course.slug}/${section.id}/${step.id}`
    if (assigned.has(key) && assigned.get(key) !== entry.translationKey)
      throw Error(`Multiple articles occupy learning step: ${key}`)
    assigned.set(key, entry.translationKey)
    step.entry = `${entry.moduleId}/${entry.slug}`
    step.translationKey = entry.translationKey
  }
  for (const course of paths) {
    if (course.sections)
      course.entries = course.sections.flatMap((section) =>
        section.steps.flatMap((step) => (step.entry ? [step.entry] : [])),
      )
    for (const reference of course.entries) {
      const matches = entries.filter(
        (entry) =>
          !entry.seriesSlug &&
          (reference.includes("/")
            ? `${entry.moduleId}/${entry.slug}` === reference
            : entry.slug === reference),
      )
      if (!matches.length) throw Error(`Missing path entry: ${reference}`)
      if (new Set(matches.map((entry) => entry.translationKey)).size > 1)
        throw Error(`Ambiguous path entry; use module-id/slug: ${reference}`)
    }
  }
  return paths
}
