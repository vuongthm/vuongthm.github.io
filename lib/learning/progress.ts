import type { EntryMeta, LearningPath } from "@/lib/content/types"
import { entryForStep } from "./paths"

export function learningProgress(path: LearningPath, entries: EntryMeta[], raw: string) {
  let saved: unknown
  try {
    saved = JSON.parse(raw)
  } catch {
    saved = []
  }
  const steps = path.sections?.flatMap((section) => section.steps) ?? []
  const available = steps.flatMap((step) => {
    const entry = entryForStep(step, entries)
    return entry ? [{ step, entry }] : []
  })
  const valid = new Set(available.map(({ step }) => step.id))
  const completed = new Set<string>(
    Array.isArray(saved) ? saved.filter((id) => typeof id === "string" && valid.has(id)) : [],
  )
  return {
    total: steps.length,
    available,
    completed,
    done: completed.size,
    next: available.find(({ step }) => !completed.has(step.id)) ?? available[0],
  }
}
