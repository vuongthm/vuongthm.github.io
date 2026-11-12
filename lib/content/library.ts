import type { EntryMeta } from "./types"
export const noteModuleKey = (entry: EntryMeta) =>
  `${entry.moduleId}/${entry.contentModule?.id ?? ""}`
export function orderNotes(entries: EntryMeta[], topicOrder: string[]) {
  const rank = (entry: EntryMeta) => {
    const index = topicOrder.indexOf(entry.topics[0])
    return index < 0 ? topicOrder.length : index
  }
  return [...entries].sort(
    (a, b) =>
      rank(a) - rank(b) ||
      (a.moduleId ?? "").localeCompare(b.moduleId ?? "") ||
      (a.contentModule?.order ?? 999) - (b.contentModule?.order ?? 999) ||
      (a.order ?? a.weight) - (b.order ?? b.weight) ||
      a.title.localeCompare(b.title),
  )
}
