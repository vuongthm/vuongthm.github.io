import { localizedText } from "./config.mjs"
import { learningMarkdown } from "../../lib/learning/markdown.mjs"
import { composeSections, attachPathMemberships } from "./composition.mjs"
import { readLearningDefinitions } from "./learning-files.mjs"
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export function learningAssignment(value) {
  if (value === undefined || value === null) return undefined
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("learning must contain path, section and step")
  for (const field of ["path", "section", "step"])
    if (typeof value[field] !== "string" || !slug.test(value[field]))
      throw Error(`Invalid learning ${field}`)
  if (value.order !== undefined && (!Number.isSafeInteger(value.order) || value.order < 1))
    throw Error("learning order must be a positive integer")
  return {
    path: value.path,
    section: value.section,
    step: value.step,
    ...(value.order !== undefined ? { order: value.order } : {}),
  }
}
export function validateQuizBlocks(body, file) {
  try {
    learningMarkdown(body)
  } catch (error) {
    throw Error(`${file}: ${error.message}`)
  }
}
export function compileLearningPaths(config, entries, sitePaths, outline = []) {
  const definitions = sitePaths.map((item) => ({ ...item }))
  for (const source of config.sources) {
    if (!source.learningPaths) continue
    definitions.push(
      ...readLearningDefinitions(source).map((item) => ({ ...item, moduleId: source.id })),
    )
  }
  const seen = new Set()
  const paths = definitions
    .filter((item) => item.status !== "draft" && item.visibility !== "private")
    .map((item) => {
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
        result.sections = composeSections(item, config, entries, outline).map((section) => {
          if (!slug.test(section.id) || sections.has(section.id))
            throw Error(`Invalid or duplicate learning section: ${section.id}`)
          sections.add(section.id)
          if (!Array.isArray(section.steps) || (!section.steps.length && !section.module))
            throw Error(`Empty learning section: ${section.id}`)
          return {
            id: section.id,
            ...(section.module ? { module: section.module } : {}),
            title: localizedText(section.title, config.locales, section.id),
            steps: section.steps.map((step) => {
              if (!slug.test(step.id) || steps.has(step.id))
                throw Error(`Invalid or duplicate learning step: ${step.id}`)
              steps.add(step.id)
              return {
                ...step,
                id: step.id,
                title: localizedText(step.title, config.locales, step.id),
              }
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
    const position = course.sections.flatMap((item) => item.steps).indexOf(step) + 1
    if (assignment.order !== undefined && assignment.order !== position)
      throw Error(`Learning order mismatch for ${entry.id}: expected ${position}`)
    const key = `${course.slug}/${section.id}/${step.id}`
    if (assigned.has(key) && assigned.get(key) !== entry.translationKey)
      throw Error(`Multiple articles occupy learning step: ${key}`)
    assigned.set(key, entry.translationKey)
    if (step.translationKey && step.translationKey !== entry.translationKey)
      throw Error(`Multiple articles occupy learning step: ${key}`)
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
    const identities = new Set(
      course.sections?.flatMap((section) => section.steps.map((step) => step.translationKey)) ?? [],
    )
    const members = [...outline, ...entries].filter(
      (entry) =>
        !entry.seriesSlug &&
        (identities.has(entry.translationKey) ||
          course.entries.includes(`${entry.moduleId}/${entry.slug}`)),
    )
    course.topics = [...new Set([course.topic, ...members.flatMap((entry) => entry.topics)])]
  }
  attachPathMemberships(paths, entries)
  return paths
}
