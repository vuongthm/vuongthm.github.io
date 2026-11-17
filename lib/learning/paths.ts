import type { EntryMeta, LearningPath } from "@/lib/content/types"
export function pathEntries(path: LearningPath, entries: EntryMeta[]) {
  if (path.sections)
    return path.sections.flatMap((section) =>
      section.steps.flatMap((step) => {
        const entry = entryForStep(step, entries)
        return entry ? [entry] : []
      }),
    )
  return path.entries.flatMap((reference) => {
    const entry = entries.find((item) =>
      reference.includes("/")
        ? `${item.moduleId}/${item.slug}` === reference
        : item.slug === reference,
    )
    return entry ? [entry] : []
  })
}

/** Reading navigation stays inside the published path containing the current article. */
export function readingContext(
  entry: Pick<EntryMeta, "id" | "translationKey" | "learning">,
  paths: LearningPath[],
  entries: EntryMeta[],
): {
  course?: LearningPath
  courseEntries?: EntryMeta[]
  previous?: EntryMeta
  next?: EntryMeta
} {
  const belongs = (candidate: EntryMeta) =>
    candidate.id === entry.id || candidate.translationKey === entry.translationKey
  const courses = paths
    .map((course) => ({ course, courseEntries: pathEntries(course, entries) }))
    .filter(({ courseEntries }) => courseEntries.some(belongs))
  const context = courses.find(({ course }) => course.slug === entry.learning?.path) ?? courses[0]
  if (!context) return {}
  const index = context.courseEntries.findIndex(belongs)
  return {
    ...context,
    previous: context.courseEntries[index - 1],
    next: context.courseEntries[index + 1],
  }
}
export function entryForStep(
  step: { entry?: string; translationKey?: string },
  entries: EntryMeta[],
) {
  return entries.find((entry) =>
    step.translationKey
      ? entry.translationKey === step.translationKey
      : `${entry.moduleId}/${entry.slug}` === step.entry,
  )
}
export function filterStudy(entries: EntryMeta[], mode: string, paths: LearningPath[]) {
  if (mode === "standalone") {
    const assigned = new Set(
      paths.flatMap((path) => pathEntries(path, entries)).map((entry) => entry.translationKey),
    )
    return entries.filter((entry) => !assigned.has(entry.translationKey) && !entry.learning)
  }
  const path = paths.find((item) => item.slug === mode)
  if (!path) return entries
  return pathEntries(path, entries)
}
