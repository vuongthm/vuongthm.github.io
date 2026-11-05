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
  if (mode === "standalone") return entries.filter((entry) => !entry.learning)
  const path = paths.find((item) => item.slug === mode && item.sections)
  if (!path) return entries
  return pathEntries(path, entries).filter((entry) => entry.learning?.path === path.slug)
}
