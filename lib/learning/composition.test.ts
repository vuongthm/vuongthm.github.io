import { afterEach, describe, expect, it } from "vitest"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { compileLearningPaths } from "../../scripts/content/learning.mjs"
import { learningFiles } from "../../scripts/content/learning-files.mjs"
import { buildContent } from "../../scripts/content/build.mjs"
import { filterStudy, pathEntries } from "./paths"
import type { EntryMeta, LearningPath } from "../content/types"
const locales = ["vi", "en", "ja", "zh"]
const title = { vi: "Linux Fundamentals", en: "Linux Fundamentals", ja: "Linux", zh: "Linux" }
const sources = [{ id: "linux-notes", modules: [{ id: "linux-fundamentals", title, order: 10 }] }]
const config = { locales, sources, topics: [{ id: "linux" }, { id: "security" }] }
const article = (slug = "terminal") => ({
  id: `linux-notes:${slug}`,
  translationKey: `linux-notes:${slug}`,
  slug,
  moduleId: "linux-notes",
  contentModule: sources[0].modules[0],
  locale: "vi",
  title: slug,
  order: 1,
  topics: ["linux"],
})
const course = (slug: string, topic: string) => ({
  slug,
  topic,
  sections: [{ id: "linux", module: "linux-notes/linux-fundamentals" }],
})
const folders: string[] = []
afterEach(() =>
  folders.splice(0).forEach((dir) => fs.rmSync(dir, { recursive: true, force: true })),
)
describe("reusable learning modules", () => {
  it("opens related subjects from public outlines and lists a published article under every assigned subject", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "vuong-related-topics-"))
    folders.push(root)
    const app = path.join(root, "app"),
      content = path.join(root, "content")
    fs.mkdirSync(path.join(app, "site"), { recursive: true })
    fs.writeFileSync(path.join(app, "site/profile.json"), "{}")
    fs.writeFileSync(
      path.join(app, "site/paths.json"),
      JSON.stringify([
        {
          slug: "cyber-security-101",
          topic: "security",
          status: "published",
          sections: [
            { id: "linux", title, steps: [{ id: "terminal", article: "linux-notes:terminal" }] },
          ],
        },
        { ...course("private-path", "cloud"), status: "draft" },
      ]),
    )
    fs.writeFileSync(
      path.join(app, "content.sources.json"),
      JSON.stringify({
        locales,
        moduleRoots: ["../content"],
        sources: [],
        site: { profile: "site/profile.json", paths: "site/paths.json" },
      }),
    )
    for (const id of ["linux", "security", "cloud"]) {
      const directory = path.join(content, id + "-notes")
      fs.mkdirSync(directory, { recursive: true })
      fs.writeFileSync(
        path.join(directory, "module.json"),
        JSON.stringify({
          id: id + "-notes",
          adapter: "articles",
          topic: { id, label: title },
          ...(id === "linux" ? { modules: sources[0].modules } : {}),
        }),
      )
    }
    const directory = path.join(content, "linux-notes/linux-fundamentals/vi")
    fs.mkdirSync(directory, { recursive: true })
    const file = path.join(directory, "terminal.md")
    const draft =
      "---\nid: linux-notes:terminal\ntranslationKey: linux-notes:terminal\ntitle: Terminal\ndescription: PRIVATE_DESCRIPTION_SENTINEL\ndate: 2026-11-11\nstatus: draft\noutline: true\nmodule: linux-fundamentals\norder: 1\ntopics: [linux, security]\n---\n\nPRIVATE_BODY_SENTINEL\n"
    fs.writeFileSync(file, draft)
    // An unreferenced outline must not open its subject.
    fs.writeFileSync(
      path.join(directory, "unlisted.md"),
      draft
        .replaceAll("terminal", "unlisted")
        .replace("order: 1", "order: 2")
        .replace("[linux, security]", "[cloud]"),
    )
    await buildContent(app)
    const registry = JSON.parse(fs.readFileSync(path.join(app, "generated/topics.json"), "utf8"))
    expect(
      registry
        .filter((item: { available: boolean }) => item.available)
        .map((item: { id: string }) => item.id)
        .sort(),
    ).toEqual(["linux", "security"])
    const raw = fs.readFileSync(path.join(app, "generated/content.json"), "utf8")
    expect(raw).not.toContain("SENTINEL")
    expect(JSON.parse(raw).paths[0].topics).toEqual(["security", "linux"])
    fs.writeFileSync(file, draft.replace("status: draft", "status: published"))
    await buildContent(app)
    const db = JSON.parse(fs.readFileSync(path.join(app, "generated/content.json"), "utf8"))
    expect(db.entries).toHaveLength(1)
    for (const topic of ["linux", "security"])
      expect(
        db.entries
          .filter((entry: EntryMeta) => entry.topics.includes(topic))
          .map((entry: EntryMeta) => entry.id),
      ).toEqual(["linux-notes:terminal"])
    expect(db.paths[0].entries).toEqual(["linux-notes/terminal"])
  })
  it("loads each learning path from its own group without tying article topics to storage", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "vuong-grouped-paths-"))
    folders.push(root)
    for (const group of ["pre-security", "cyber-security"]) {
      fs.mkdirSync(path.join(root, group))
      fs.writeFileSync(
        path.join(root, group, "learning-path.json"),
        JSON.stringify({
          slug: group,
          topic: "security",
          sections: [
            { id: "linux", title, steps: [{ id: "terminal", article: "linux-notes:terminal" }] },
          ],
        }),
      )
    }
    const groupedSource = {
      id: "security-notes",
      path: root,
      learningPaths: ["pre-security/learning-path.json", "cyber-security/learning-path.json"],
    }
    const paths = compileLearningPaths(
      { ...config, sources: [...sources, groupedSource] },
      [article()],
      [],
    )
    expect(paths.map((item: LearningPath) => item.slug)).toEqual(["pre-security", "cyber-security"])
    expect(paths.every((item: LearningPath) => item.entries[0] === "linux-notes/terminal")).toBe(
      true,
    )
    expect(
      learningFiles({ ...groupedSource, learningPaths: "pre-security/learning-path.json" }),
    ).toHaveLength(1)
    expect(() => learningFiles({ ...groupedSource, learningPaths: ["../outside.json"] })).toThrow(
      /escape/,
    )
    expect(() =>
      learningFiles({
        ...groupedSource,
        learningPaths: ["pre-security/learning-path.json", "pre-security/learning-path.json"],
      }),
    ).toThrow(/Invalid/)
  })
  it("composes the same module into multiple paths across subjects without article-side assignments", () => {
    const entry = article()
    const paths = compileLearningPaths(
      config,
      [entry],
      [course("linux-basics", "linux"), course("cyber-security-101", "security")],
    )
    for (const item of paths) expect(item.entries).toEqual(["linux-notes/terminal"])
    expect((entry as EntryMeta).learningPaths?.map((item) => item.path)).toEqual([
      "linux-basics",
      "cyber-security-101",
    ])
    expect(
      filterStudy([entry] as EntryMeta[], "cyber-security-101", paths as LearningPath[]),
    ).toHaveLength(1)
    expect(filterStudy([entry] as EntryMeta[], "standalone", paths as LearningPath[])).toHaveLength(
      0,
    )
    const daily = { ...article("daily"), contentModule: undefined }
    expect(
      filterStudy([entry, daily] as EntryMeta[], "standalone", paths as LearningPath[]),
    ).toEqual([daily])
  })
  it("supports selected article references and rejects unknown module or article identities", () => {
    const paths = compileLearningPaths(
      config,
      [article()],
      [
        {
          slug: "selected",
          topic: "security",
          sections: [{ id: "intro", steps: [{ id: "first", article: "linux-notes:terminal" }] }],
        },
      ],
    )
    expect(pathEntries(paths[0] as LearningPath, [article()] as EntryMeta[])).toHaveLength(1)
    expect(() =>
      compileLearningPaths(
        config,
        [],
        [course("unknown", "linux")].map((item) => ({
          ...item,
          sections: [{ id: "one", module: "linux-notes/missing" }],
        })),
      ),
    ).toThrow(/Unknown content module/)
    expect(() =>
      compileLearningPaths(
        config,
        [],
        [
          {
            slug: "unknown",
            topic: "linux",
            sections: [{ id: "one", steps: [{ id: "a", article: "missing" }] }],
          },
        ],
      ),
    ).toThrow(/article reference/)
  })
  it("keeps selected learning order independent of writing dates, module positions and extra articles", () => {
    const foundation = { ...article("foundation"), order: 20, publishedAt: "2026-11-20" }
    const advanced = { ...article("advanced"), order: 1, publishedAt: "2026-11-11" }
    const extra = { ...article("extra"), order: 2, publishedAt: "2026-11-21" }
    const selected = (slug: string, ids: string[]) => ({
      slug,
      topic: "linux",
      sections: [
        { id: "selected", title, steps: ids.map((id) => ({ id, article: `linux-notes:${id}` })) },
      ],
    })
    const paths = compileLearningPaths(
      config,
      [advanced, extra, foundation],
      [
        selected("basics-first", ["foundation", "advanced"]),
        selected("refresher", ["advanced", "foundation"]),
      ],
    )
    expect(paths[0].entries).toEqual(["linux-notes/foundation", "linux-notes/advanced"])
    expect(paths[1].entries).toEqual(["linux-notes/advanced", "linux-notes/foundation"])
    expect((extra as EntryMeta).learningPaths).toBeUndefined()
  })
  it("preserves mixed-repository path references when an article moves to a different repository", () => {
    const stableId = "security-notes:linux-cli-basics"
    const definitions = [
      {
        slug: "pre-security",
        topic: "security",
        sections: [
          {
            id: "operating-systems",
            title,
            steps: [
              { id: "windows-basics", article: "security-notes:windows-basics" },
              { id: "linux-cli-basics", article: stableId },
            ],
          },
        ],
      },
    ]
    const windows = {
      ...article("windows-basics"),
      id: "security-notes:windows-basics",
      translationKey: "security-notes:windows-basics",
      moduleId: "security-notes",
    }
    const original = {
      ...article("linux-cli-basics"),
      id: stableId,
      translationKey: stableId,
      moduleId: "security-notes",
    }
    const before = compileLearningPaths(config, [windows, original], definitions)
    const moved = {
      ...article("linux-cli-basics"),
      id: stableId,
      translationKey: stableId,
      moduleId: "linux-notes",
    }
    const after = compileLearningPaths(
      config,
      [{ ...windows, learning: undefined }, moved],
      definitions,
    )
    expect(before[0].entries).toEqual([
      "security-notes/windows-basics",
      "security-notes/linux-cli-basics",
    ])
    expect(after[0].entries).toEqual([
      "security-notes/windows-basics",
      "linux-notes/linux-cli-basics",
    ])
    expect(after[0].sections[0].steps[1].translationKey).toBe(stableId)
    expect(after[0].sections[0].steps[1].id).toBe("linux-cli-basics")
    expect(definitions[0].sections[0].steps[1].article).toBe(stableId)
  })
  it("builds a public roadmap from opt-in draft titles without leaking descriptions, bodies or private drafts", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "vuong-authoring-"))
    folders.push(root)
    const notes = path.join(root, "content/linux-notes"),
      app = path.join(root, "app")
    fs.mkdirSync(path.join(notes, "linux-fundamentals/vi"), { recursive: true })
    fs.mkdirSync(path.join(app, "site"), { recursive: true })
    fs.writeFileSync(
      path.join(notes, "module.json"),
      JSON.stringify({ ...sources[0], adapter: "articles", topic: { id: "linux", label: title } }),
    )
    fs.writeFileSync(
      path.join(app, "content.sources.json"),
      JSON.stringify({
        locales,
        moduleRoots: ["../content"],
        sources: [],
        site: { profile: "site/profile.json", paths: "site/paths.json" },
      }),
    )
    fs.writeFileSync(path.join(app, "site/profile.json"), "{}")
    fs.writeFileSync(
      path.join(app, "site/paths.json"),
      JSON.stringify([course("linux-basics", "linux")]),
    )
    const draft = (id: string, extra = "", order = 1) =>
      `---\nid: linux-notes:${id}\ntranslationKey: linux-notes:${id}\ntitle: ${id}\ndate: 2026-11-11\nstatus: draft\noutline: true\nmodule: linux-fundamentals\norder: ${order}\ntopics: [linux]\ndescription: PRIVATE_DESCRIPTION_SENTINEL\n${extra}\n---\n\nPRIVATE_BODY_SENTINEL`
    const file = path.join(notes, "linux-fundamentals/vi/terminal.md")
    fs.writeFileSync(file, draft("terminal"))
    fs.writeFileSync(
      path.join(notes, "linux-fundamentals/vi/private.md"),
      draft("private", "visibility: private", 2),
    )
    fs.writeFileSync(
      path.join(notes, "linux-fundamentals/vi/unlisted.md"),
      draft("unlisted", "outline: false", 3).replace("outline: true\n", ""),
    )
    fs.writeFileSync(
      path.join(notes, "linux-fundamentals/vi/locked.md"),
      draft("locked", "lock: true", 4),
    )
    fs.mkdirSync(path.join(notes, "inbox/vi"), { recursive: true })
    fs.mkdirSync(path.join(notes, "inbox/media"), { recursive: true })
    fs.writeFileSync(
      path.join(notes, "inbox/vi/incomplete.md"),
      "---\nbroken: [\nPRIVATE_INBOX_SENTINEL",
    )
    fs.writeFileSync(
      path.join(notes, "inbox/vi/accidentally-published.md"),
      draft("inbox-secret").replace("status: draft", "status: published"),
    )
    fs.writeFileSync(
      path.join(notes, "inbox/media/private.svg"),
      "<svg>PRIVATE_ASSET_SENTINEL</svg>",
    )
    await buildContent(app)
    const raw = fs.readFileSync(path.join(app, "generated/content.json"), "utf8"),
      db = JSON.parse(raw)
    expect(db.entries).toHaveLength(0)
    expect(db.paths[0].sections[0].steps).toHaveLength(1)
    expect(db.paths[0].sections[0].steps[0].entry).toBeUndefined()
    expect(raw).not.toContain("SENTINEL")
    expect(raw).not.toContain("unlisted")
    expect(raw).not.toContain("inbox-secret")
    expect(fs.readFileSync(path.join(app, "generated/search.json"), "utf8")).toBe("[]\n")
    fs.writeFileSync(
      file,
      draft("terminal")
        .replace("status: draft", "status: published")
        .replace("PRIVATE_DESCRIPTION_SENTINEL", '""')
        .replace("PRIVATE_BODY_SENTINEL", "<!-- empty scaffold -->"),
    )
    await expect(buildContent(app)).rejects.toThrow(/description and article body/)
    fs.writeFileSync(file, draft("terminal").replace("status: draft", "status: published"))
    await buildContent(app)
    const published = JSON.parse(fs.readFileSync(path.join(app, "generated/content.json"), "utf8"))
    expect(published.entries).toHaveLength(1)
    expect(published.paths[0].sections[0].steps[0].entry).toBe("linux-notes/terminal")
    fs.appendFileSync(file, "\n![Private](../../inbox/media/private.svg)\n")
    await expect(buildContent(app)).rejects.toThrow(/Move inbox media/)
  })
})
