import { describe, expect, it } from "vitest"
import type { EntryMeta, LearningPath } from "../content/types"
import { readingContext } from "./paths"

const article = (slug: string, path?: string) =>
  ({
    id: `notes:${slug}:en`,
    translationKey: `notes:${slug}`,
    moduleId: "notes",
    slug,
    ...(path ? { learning: { path } } : {}),
  }) as EntryMeta
const path = (slug: string, articles: EntryMeta[]) =>
  ({ slug, entries: articles.map((item) => `notes/${item.slug}`) }) as LearningPath

describe("reading navigation within learning paths", () => {
  const first = article("first"),
    middle = article("middle"),
    last = article("last")
  const standalone = article("independent")
  const entries = [last, standalone, first, middle]
  const course = path("security", [first, middle, last])

  it("does not navigate from standalone articles to unrelated articles", () => {
    expect(readingContext(standalone, [course], entries)).toEqual({})
    expect(readingContext(article("missing", "security"), [course], entries)).toEqual({})
  })
  it("follows outline order even when article metadata has no path assignment", () => {
    const context = readingContext(middle, [course], entries)
    expect(context.course).toBe(course)
    expect(context.previous).toBe(first)
    expect(context.next).toBe(last)
    expect(readingContext(first, [course], entries).previous).toBeUndefined()
    expect(readingContext(last, [course], entries).next).toBeUndefined()
  })
  it("prefers the declared path when an article is reused across outlines", () => {
    const preferred = path("soc", [middle, first])
    const context = readingContext(
      { ...first, learning: { path: "soc" } } as EntryMeta,
      [course, preferred],
      entries,
    )
    expect(context.course).toBe(preferred)
    expect(context.previous).toBe(middle)
    expect(context.next).toBeUndefined()
  })
})
