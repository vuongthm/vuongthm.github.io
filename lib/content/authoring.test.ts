import { afterEach, describe, expect, it } from "vitest"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { authoringDate } from "../../scripts/content/authoring.mjs"
import { frontmatter } from "../../scripts/content/schema.mjs"

const roots: string[] = []
afterEach(() =>
  roots.splice(0).forEach((root) => fs.rmSync(root, { recursive: true, force: true })),
)
function setup() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "vuong-free-writing-"))
  roots.push(root)
  const content = path.join(root, "content"),
    repository = "soc-notes"
  const directory = path.join(content, repository)
  fs.mkdirSync(directory, { recursive: true })
  fs.writeFileSync(
    path.join(directory, "module.json"),
    JSON.stringify({
      id: repository,
      adapter: "articles",
      defaultTopics: ["soc"],
      modules: [{ id: "analysis", path: "soc-l1/analysis", title: "Analysis", order: 10 }],
    }),
  )
  const options = { content, repository, slug: "unexpected-alert" }
  const read = (file: string) => frontmatter(fs.readFileSync(file, "utf8"), file)
  return { root, directory, options, read }
}
describe("writing independently of a learning path", () => {
  it("uses the current Vietnamese calendar day and supports an explicit date", () => {
    expect(authoringDate(undefined, new Date("2026-11-11T18:00:00Z"))).toBe("2026-11-12")
    expect(authoringDate("2026-11-11")).toBe("2026-11-11")
    expect(() => authoringDate("2026-02-30")).toThrow(/date/)
  })
  it("runs the author-facing CLI without future scaffolds shifting a new article's date", () => {
    const { root, directory, options, read } = setup()
    const app = path.join(root, "app")
    const scripts = path.join(app, "scripts/content")
    fs.mkdirSync(scripts, { recursive: true })
    for (const name of [
      "new",
      "authoring",
      "schema",
      "structure",
      "localized",
      "files",
      "learning-files",
    ])
      fs.copyFileSync(
        path.resolve("scripts/content", name + ".mjs"),
        path.join(scripts, name + ".mjs"),
      )
    fs.symlinkSync(path.resolve("node_modules"), path.join(app, "node_modules"), "dir")
    const run = (...args: string[]) =>
      execFileSync(process.execPath, [path.join(scripts, "new.mjs"), ...args], { encoding: "utf8" })
    const existing = path.join(directory, "soc-l1/analysis/en")
    fs.mkdirSync(existing, { recursive: true })
    fs.writeFileSync(
      path.join(existing, "future.md"),
      "---\ntitle: Future lesson\ndate: 2030-01-01\norder: 12\n---\n",
    )
    run(
      "article",
      options.repository,
      "new-note",
      "--module",
      "analysis",
      "--title",
      "Ý tưởng tự do",
    )
    const article = path.join(directory, "soc-l1/analysis/vi/new-note.md")
    expect(read(article).data.date).toBe(authoringDate(undefined))
    expect(read(article).data.order).toBe(13)
    run("article", options.repository, "new-note", "--module", "analysis", "--lang", "en")
    expect(read(path.join(existing, "new-note.md")).data.order).toBe(13)
    expect(read(article).data.status).toBe("draft")
    expect(read(article).data.title).toBe("Ý tưởng tự do")
    expect(fs.existsSync(path.join(directory, "inbox"))).toBe(false)
  })
})
