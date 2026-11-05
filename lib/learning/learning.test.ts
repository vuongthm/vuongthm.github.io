import { afterEach, describe, expect, it } from "vitest"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { unified } from "unified"
import remarkParse from "remark-parse"
import { parseQuiz, gradeQuiz } from "./quiz.mjs"
import { learningMarkdown } from "./markdown.mjs"
import { glossary, remarkGlossary } from "./glossary"
import { filterStudy, pathEntries } from "./paths"
import { compileLearningPaths, learningAssignment } from "../../scripts/content/learning.mjs"
import type { EntryMeta, LearningPath } from "../content/types"
const quiz = {
  title: "Example",
  questions: [
    {
      id: "first",
      question: "Pick the network layer",
      options: ["Network", "Application", "Physical"],
      answer: 0,
      explanation: "IP routing is a network-layer function.",
    },
  ],
}
const localized = { vi: "Example", en: "Example", ja: "例", zh: "示例" }
const course = {
  slug: "soc-level-1",
  topic: "soc",
  title: localized,
  description: localized,
  sections: [
    {
      id: "intro",
      title: localized,
      steps: [
        { id: "one", title: localized },
        { id: "two", title: localized },
      ],
    },
  ],
}
const config = { sources: [], locales: ["vi", "en", "ja", "zh"], topics: [{ id: "soc" }] }
function entry(
  slug: string,
  learning?: EntryMeta["learning"],
  locale = "vi",
  translationKey = `notes:${slug}`,
) {
  return {
    id: `${locale}:${slug}`,
    moduleId: "notes",
    slug,
    locale,
    translationKey,
    title: slug,
    topics: ["soc"],
    learning,
    href: `/${locale}/notes/${slug}/`,
  } as EntryMeta
}
const folders: string[] = []
afterEach(() => {
  for (const folder of folders.splice(0)) fs.rmSync(folder, { recursive: true, force: true })
})
describe("knowledge quizzes", () => {
  it("validates answers and gives exact, synchronous scores", () => {
    const parsed = parseQuiz(JSON.stringify(quiz))
    expect(gradeQuiz(parsed, {})).toEqual({ correct: 0, total: 1, answered: 0 })
    expect(gradeQuiz(parsed, { first: 0 })).toEqual({ correct: 1, total: 1, answered: 1 })
    expect(gradeQuiz(parsed, { first: 2 })).toEqual({ correct: 0, total: 1, answered: 1 })
    expect(() => parseQuiz({ questions: [{ ...quiz.questions[0], answer: 3 }] })).toThrow(/answer/)
    expect(() => parseQuiz({ questions: [{ ...quiz.questions[0], explanation: "" }] })).toThrow(
      /explanation/,
    )
    expect(() => parseQuiz({ questions: [quiz.questions[0], quiz.questions[0]] })).toThrow(
      /Duplicate/,
    )
  })
  it("separates quiz JSON from searchable article text and preserves normal code", () => {
    const body = `Before\n\n\`\`\`quiz\n${JSON.stringify(quiz)}\n\`\`\`\n\nAfter\n\n\`\`\`json\n{"keep":true}\n\`\`\``
    const result = learningMarkdown(body)
    expect(result.quizzes).toEqual([quiz])
    expect(result.markdown).toContain('"keep":true')
    expect(result.markdown).toContain("After")
    expect(result.markdown).not.toContain("Pick the network layer")
  })
})
describe("glossary annotations", () => {
  it("escapes punctuation in custom glossary aliases", () => {
    glossary.push({ id: "cpp-test", term: "C++", aliases: ["C++"], definition: localized })
    try {
      const processor = unified().use(remarkParse).use(remarkGlossary)
      const tree = processor.runSync(
        processor.parse("C++ is a language; CCCC is a different token."),
      )
      expect(JSON.stringify(tree).match(/glossary:cpp-test/g)).toHaveLength(1)
    } finally {
      glossary.pop()
    }
  })

  it("does not match acronyms embedded in ASCII or Vietnamese words", () => {
    const processor = unified().use(remarkParse).use(remarkGlossary)
    const tree = processor.runSync(processor.parse("SOCIETY ASOC TRAI ĐAI IPaddress"))
    expect(JSON.stringify(tree)).not.toContain("glossary:")
  })

  it("marks first standalone mentions without changing headings, links or code", () => {
    const body =
      "# SOC\n\nSOC and SOC; IP. SOCIETY and ai remain plain.\n\n[SIEM](https://example.com) and `EDR`.\n\n```text\nDNS\n```"
    const processor = unified().use(remarkParse).use(remarkGlossary)
    const tree = processor.runSync(processor.parse(body))
    const serialized = JSON.stringify(tree)
    expect(serialized.match(/glossary:soc/g)).toHaveLength(1)
    expect(serialized).toContain("glossary:ip")
    expect(serialized).not.toContain("glossary:siem")
    expect(serialized).not.toContain("glossary:edr")
    expect(serialized).not.toContain("glossary:dns")
    expect(serialized).not.toContain("glossary:ai")
    expect(serialized).toContain('"url":"https://example.com"')
  })
})
describe("structured learning paths", () => {
  it("never pulls standalone notes into a path based on topic or title", () => {
    const assigned = entry("first", { path: "soc-level-1", section: "intro", step: "one" })
    const standalone = entry("one")
    const [compiled] = compileLearningPaths(
      config,
      [standalone, assigned],
      [course],
    ) as LearningPath[]
    expect(compiled.entries).toEqual(["notes/first"])
    expect(filterStudy([standalone, assigned], "soc-level-1", [compiled])).toEqual([assigned])
    expect(filterStudy([standalone, assigned], "standalone", [compiled])).toEqual([standalone])
    expect(compiled.sections?.[0].steps[1].entry).toBeUndefined()
  })
  it("uses configured step order, independently of date and input order", () => {
    const first = entry("first", { path: "soc-level-1", section: "intro", step: "one" })
    const second = entry("second", { path: "soc-level-1", section: "intro", step: "two" })
    const [compiled] = compileLearningPaths(config, [second, first], [course]) as LearningPath[]
    expect(pathEntries(compiled, [second, first]).map((item) => item.slug)).toEqual([
      "first",
      "second",
    ])
  })
  it("resolves translated slugs by stable translation identity", () => {
    const vi = entry(
      "bai-mot",
      { path: "soc-level-1", section: "intro", step: "one" },
      "vi",
      "same-lesson",
    )
    const en = entry("lesson-one", vi.learning, "en", "same-lesson")
    const [compiled] = compileLearningPaths(config, [vi, en], [course]) as LearningPath[]
    expect(pathEntries(compiled, [vi])).toEqual([vi])
    expect(pathEntries(compiled, [en])).toEqual([en])
  })
  it("rejects unknown slots, conflicting articles and malformed assignments", () => {
    expect(() => learningAssignment({ path: "Bad ID", section: "intro", step: "one" })).toThrow(
      /path/,
    )
    expect(() =>
      compileLearningPaths(
        config,
        [entry("bad", { path: "soc-level-1", section: "missing", step: "one" })],
        [course],
      ),
    ).toThrow(/Unknown learning slot/)
    const one = entry("one", { path: "soc-level-1", section: "intro", step: "one" })
    expect(() =>
      compileLearningPaths(config, [one, entry("different", one.learning)], [course]),
    ).toThrow(/Multiple articles/)
  })
  it("loads course definitions from an independent module and prevents path traversal", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vuong-paths-"))
    folders.push(dir)
    const moduleDir = path.join(dir, "soc")
    fs.mkdirSync(moduleDir)
    fs.writeFileSync(path.join(moduleDir, "learning-paths.json"), JSON.stringify([course]))
    const withSource = {
      ...config,
      sources: [{ id: "soc-notes", path: moduleDir, learningPaths: "learning-paths.json" }],
    }
    expect(compileLearningPaths(withSource, [], [])[0].moduleId).toBe("soc-notes")
    fs.writeFileSync(path.join(dir, "outside.json"), "[]")
    expect(() =>
      compileLearningPaths(
        {
          ...config,
          sources: [{ id: "soc-notes", path: moduleDir, learningPaths: "../outside.json" }],
        },
        [],
        [],
      ),
    ).toThrow(/escape/)
  })
})
