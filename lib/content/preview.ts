import type { EntryMeta } from "./types"

/** Extend public summaries with published prose. Locked articles expose metadata only. */
export function articlePreview(
  entry: Pick<EntryMeta, "summary" | "encrypted" | "title">,
  excerpt?: string,
) {
  if (entry.encrypted || !excerpt) return entry.summary
  const paragraphs = excerpt
    .split(/\n\s*\n/)
    .map((part) =>
      part
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((part) => part.length > 75 && !part.startsWith("---") && !part.includes("|"))
  let preview = entry.summary.trim()
  for (const paragraph of paragraphs) {
    if (preview.length >= 300) break
    if (paragraph.includes(preview) || preview.includes(paragraph)) {
      if (paragraph.length > preview.length) preview = paragraph
    } else preview += ` ${paragraph}`
  }
  if (preview.length <= 350) return preview
  const cut = preview.slice(0, 347).replace(/\s+\S*$/, "")
  return `${cut}…`
}
