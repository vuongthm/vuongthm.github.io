import { describe, expect, it } from "vitest"
import {
  articleStructure,
  contentModules,
  validateArticleStructure,
} from "../../scripts/content/structure.mjs"
import { compileLearningPaths } from "../../scripts/content/learning.mjs"
import { noteModuleKey, orderNotes } from "./library"
import type { EntryMeta } from "./types"
import { noteSearch } from "./note-search"

const locales = ["vi", "en", "ja", "zh"]
const source = {
  id: "soc-notes",
  modules: contentModules(
    {
      id: "soc-notes",
      modules: [
        { id: "foundations", title: { vi: "Nền tảng", en: "Foundations" }, order: 10 },
        { id: "investigations", title: { vi: "Điều tra", en: "Investigation" }, order: 20 },
      ],
    },
    locales,
  ),
}
const data = { module: "foundations", order: 1, topics: ["soc"] }
const topics = [{ id: "soc" }]
function entry(id: string, locale = "vi", order = 1, module = "foundations") {
  return {
    id,
    translationKey: id,
    locale,
    moduleId: "soc-notes",
    title: id,
    contentModule: source.modules.find((item: { id: string }) => item.id === module),
    order,
    topics: ["soc"],
    weight: 999,
  } as EntryMeta
}
describe("structured note repositories", () => {
  it("searches Vietnamese without accents, including đ, and indexes module labels", () => {
    const article = {
      ...entry("one"),
      title: "Điều tra cảnh báo",
      summary: "Phân biệt cảnh báo, sự kiện và sự cố; bắt đầu triage bằng bằng chứng.",
      tags: [],
    }
    expect(noteSearch([article], "vi").search("dieu tra")[0].item.id).toBe("one")
    expect(noteSearch([article], "vi").search("nen tang")[0].item.id).toBe("one")
    expect(noteSearch([article], "vi").search("bang chung")[0].item.id).toBe("one")
  })
  it("accepts explicit modules, while preserving repositories with a legacy structure", () => {
    expect(
      articleStructure(source, "foundations/vi/intro.md", data, topics).contentModule.title.en,
    ).toBe("Foundations")
    expect(articleStructure({ id: "old" }, "vi/intro.md", {}, [])).toEqual({})
  })
  it("keeps a stable module identity when its storage is grouped under SOC L1", () => {
    const nested = {
      ...source,
      modules: contentModules(
        { id: source.id, modules: [{ ...source.modules[0], path: "soc-l1/foundations" }] },
        locales,
      ),
    }
    const result = articleStructure(nested, "soc-l1/foundations/vi/intro.md", data, topics)
    expect(result.contentModule.id).toBe("foundations")
    expect(result.contentModule.path).toBe("soc-l1/foundations")
    expect(() => articleStructure(nested, "foundations/vi/intro.md", data, topics)).toThrow(
      /expected/,
    )
  })
  it("rejects escaped, ambiguous or reserved storage folders", () => {
    const unit = source.modules[0]
    for (const folder of [
      "../outside",
      "/absolute",
      "soc-l1/../outside",
      "soc-l1/vi",
      "inbox",
      "soc-l1/inbox",
    ])
      expect(() =>
        contentModules({ id: source.id, modules: [{ ...unit, path: folder }] }, locales),
      ).toThrow(/path/)
    expect(() =>
      contentModules(
        { id: source.id, modules: [unit, { ...source.modules[1], path: "foundations/child" }] },
        locales,
      ),
    ).toThrow(/overlapping/)
  })
  it("rejects invalid manifests, misplaced articles, missing order and unknown topics", () => {
    expect(() =>
      contentModules({ id: "notes", modules: [{ id: "../outside", order: 1 }] }, locales),
    ).toThrow(/module/)
    expect(() => articleStructure(source, "investigations/vi/intro.md", data, topics)).toThrow(
      /expected/,
    )
    expect(() =>
      articleStructure(source, "foundations/vi/intro.md", { ...data, module: "missing" }, topics),
    ).toThrow(/declared/)
    expect(() =>
      articleStructure(source, "foundations/vi/intro.md", { ...data, order: 0 }, topics),
    ).toThrow(/order/)
    expect(() =>
      articleStructure(source, "foundations/vi/intro.md", { ...data, topics: ["unknown"] }, topics),
    ).toThrow(/topic/)
    expect(() =>
      articleStructure(
        source,
        "foundations/vi/intro.md",
        { ...data, learning: { path: "course" } },
        topics,
      ),
    ).toThrow(/order/)
  })
  it("rejects duplicate ordering and translated articles with different assignments", () => {
    expect(() => validateArticleStructure([entry("a"), entry("b")])).toThrow(/Duplicate/)
    expect(() => validateArticleStructure([entry("a"), entry("a", "en", 2)])).toThrow(/Translation/)
    expect(() => validateArticleStructure([entry("a"), entry("a", "en")])).not.toThrow()
  })
  it("sorts by topic, module and position independently of date and preserves input", () => {
    const first = entry("first"),
      second = entry("second", "vi", 2),
      other = entry("other", "vi", 1, "investigations")
    const input = [other, second, first]
    expect(orderNotes(input, ["soc"]).map((item) => item.id)).toEqual(["first", "second", "other"])
    expect(input[0]).toBe(other)
    expect(noteModuleKey(first)).toBe("soc-notes/foundations")
  })
  it("validates the absolute learning position, including unpublished steps", () => {
    const course = {
      slug: "course",
      topic: "soc",
      sections: [
        { id: "one", steps: [{ id: "planned" }] },
        { id: "two", steps: [{ id: "live" }] },
      ],
    }
    const config = { sources: [], topics, locales }
    const article = {
      ...entry("article"),
      slug: "article",
      learning: { path: "course", section: "two", step: "live", order: 2 },
    }
    expect(compileLearningPaths(config, [article], [course])[0].entries).toEqual([
      "soc-notes/article",
    ])
    expect(() =>
      compileLearningPaths(
        config,
        [{ ...article, learning: { ...article.learning, order: 1 } }],
        [course],
      ),
    ).toThrow(/order mismatch/)
  })
})
