import { localizedText } from "./localized.mjs"

/** A path is an ordered view over reusable modules and stable article identities. */
export function composeSections(course, config, entries, outline = []) {
  const catalog = new Map()
  for (const entry of [...outline, ...entries].filter((item) => !item.seriesSlug)) {
    const key = entry.translationKey
    if (!catalog.has(key)) catalog.set(key, { ...entry, titles: {}, published: false })
    const record = catalog.get(key)
    record.titles[entry.locale] = entry.title
    if (entries.includes(entry)) {
      record.published = true
      record.entry = `${entry.moduleId}/${entry.slug}`
    }
  }
  function reference(value) {
    const matches = [...catalog.values()].filter(
      (item) => item.id === value || item.translationKey === value,
    )
    if (matches.length !== 1)
      throw Error(`Unknown or ambiguous article reference in ${course.slug}: ${value}`)
    return matches[0]
  }
  function stepFor(record, id) {
    return {
      id,
      title: localizedText(record.titles, config.locales, record.title),
      translationKey: record.translationKey,
      ...(record.published ? { entry: record.entry } : {}),
    }
  }
  return course.sections.map((section) => {
    let unit
    if (section.module) {
      const parts = section.module.split("/")
      const source = config.sources.find((item) => item.id === parts[0])
      unit = parts.length === 2 ? source?.modules?.find((item) => item.id === parts[1]) : undefined
      if (!unit) throw Error(`Unknown content module in ${course.slug}: ${section.module}`)
    }
    let steps = section.steps
    if (steps === undefined && unit) {
      const [sourceId, unitId] = section.module.split("/")
      steps = [...catalog.values()]
        .filter((item) => item.moduleId === sourceId && item.contentModule?.id === unitId)
        .sort((a, b) => a.order - b.order || a.translationKey.localeCompare(b.translationKey))
        .map((item) => stepFor(item, `${sourceId}-${item.slug}`))
    } else if (Array.isArray(steps)) {
      steps = steps.map((step) => {
        if (!step.article) return step
        const record = reference(step.article)
        if (unit && `${record.moduleId}/${record.contentModule?.id}` !== section.module)
          throw Error(`Article outside selected module in ${course.slug}: ${step.article}`)
        return {
          ...stepFor(record, step.id ?? `${record.moduleId}-${record.slug}`),
          ...(step.title ? { title: step.title } : {}),
        }
      })
    }
    return { ...section, title: section.title ?? unit?.title, steps }
  })
}

export function attachPathMemberships(paths, entries) {
  for (const entry of entries.filter((item) => !item.seriesSlug)) {
    const memberships = []
    for (const course of paths) {
      let order = 0
      for (const section of course.sections ?? [])
        for (const step of section.steps) {
          order++
          if (
            step.entry &&
            (step.translationKey === entry.translationKey ||
              (!step.translationKey && step.entry === `${entry.moduleId}/${entry.slug}`))
          )
            memberships.push({ path: course.slug, section: section.id, step: step.id, order })
        }
    }
    if (memberships.length) {
      entry.learningPaths = memberships
      entry.learning ??= memberships[0]
    }
  }
}
