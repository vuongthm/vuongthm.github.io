import { afterEach, describe, expect, it } from "vitest"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { loadContentConfig } from "../../scripts/content/config.mjs"
import { buildContent } from "../../scripts/content/build.mjs"
const folders: string[] = []
afterEach(() => {
  for (const dir of folders.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "vuong-modules-"))
  folders.push(root)
  const app = path.join(root, "app"),
    content = path.join(root, "content")
  fs.mkdirSync(app)
  fs.mkdirSync(path.join(content, "_site"), { recursive: true })
  fs.writeFileSync(path.join(content, "_site/profile.json"), "{}")
  fs.writeFileSync(path.join(content, "_site/paths.json"), "[]")
  fs.writeFileSync(
    path.join(app, "content.sources.json"),
    JSON.stringify({
      locales: ["vi", "en", "ja", "zh"],
      privateContent: "exclude",
      moduleRoots: ["../content"],
      site: { profile: "../content/_site/profile.json", paths: "../content/_site/paths.json" },
      sources: [],
    }),
  )
  return { root, app, content }
}
function writeModule(content: string, id: string, adapter = "articles") {
  const dir = path.join(content, id)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(
    path.join(dir, "module.json"),
    JSON.stringify({ id, adapter, title: { vi: id, en: id } }),
  )
  return dir
}
function writeArticle(dir: string, id: string, extra = "", body = "## Nội dung\n\nBài viết.") {
  fs.mkdirSync(path.join(dir, "vi"), { recursive: true })
  fs.writeFileSync(
    path.join(dir, "vi", id + ".md"),
    `---\ntitle: ${id}\ndate: 2026-11-04\n${extra}\n---\n\n${body}`,
  )
}
describe("content modules", () => {
  it("discovers new folders without registering them in app code", () => {
    const { app, content } = fixture()
    writeModule(content, "soc-notes")
    expect(loadContentConfig(app).sources.map((x: { id: string }) => x.id)).toEqual(["soc-notes"])
    writeModule(content, "new-notes")
    const next = loadContentConfig(app)
    expect(next.sources).toHaveLength(2)
    expect(next.topics.some((x: { id: string }) => x.id === "new-notes")).toBe(true)
  })
  it("does not discover folders without manifests or private/disabled modules", () => {
    const { app, content } = fixture()
    fs.mkdirSync(path.join(content, "unregistered"))
    const privateFolder = writeModule(content, "private-notes")
    fs.writeFileSync(
      path.join(privateFolder, "module.json"),
      JSON.stringify({ id: "private-notes", adapter: "articles", visibility: "private" }),
    )
    const disabled = writeModule(content, "disabled-notes")
    fs.writeFileSync(
      path.join(disabled, "module.json"),
      JSON.stringify({ id: "disabled-notes", enabled: false }),
    )
    expect(loadContentConfig(app).sources).toEqual([])
  })
  it("accepts flat Markdown and a project-folder README with explicit frontmatter", async () => {
    const { app, content } = fixture(),
      notes = writeModule(content, "flat-notes"),
      projects = writeModule(content, "projects", "projects")
    fs.writeFileSync(
      path.join(notes, "example.md"),
      "---\ntitle: Flat note\ndate: 2026-11-04\n---\n\n## Hello\n",
    )
    fs.mkdirSync(path.join(projects, "readme-project"))
    fs.writeFileSync(
      path.join(projects, "readme-project/README.md"),
      "---\ntitle: Readme project\n---\n\n## Project overview\n",
    )
    await buildContent(app)
    const db = JSON.parse(fs.readFileSync(path.join(app, "generated/content.json"), "utf8"))
    expect(db.entries[0].href).toBe("/vi/modules/flat-notes/example/")
    expect(db.projects[0].id).toBe("readme-project")
    expect(db.projects[0].bodies.vi).toContain("Project overview")
  })
  it("rejects duplicate IDs, unknown adapters and escaped source paths", () => {
    const { app, content } = fixture()
    const dir = writeModule(content, "one")
    writeModule(content, "two")
    fs.writeFileSync(
      path.join(content, "two/module.json"),
      JSON.stringify({ id: "one", adapter: "articles" }),
    )
    expect(() => loadContentConfig(app)).toThrow(/duplicate/)
    fs.rmSync(path.join(content, "two"), { recursive: true })
    fs.writeFileSync(
      path.join(dir, "module.json"),
      JSON.stringify({ id: "one", adapter: "arbitrary-code" }),
    )
    expect(() => loadContentConfig(app)).toThrow(/adapter/)
    fs.writeFileSync(
      path.join(dir, "module.json"),
      JSON.stringify({ id: "one", contentPath: "../../elsewhere" }),
    )
    expect(() => loadContentConfig(app)).toThrow(/escapes/)
  })
  it("builds namespaced articles, relative media and Markdown links while excluding drafts/private files", async () => {
    const { app, content } = fixture()
    const a = writeModule(content, "a-notes"),
      b = writeModule(content, "b-notes")
    writeArticle(a, "intro", "", "## Nội dung\n\n[Tiếp](./next.md)\n\n![Mẫu](../media/pixel.png)")
    writeArticle(a, "next")
    writeArticle(b, "intro")
    writeArticle(a, "private", "visibility: private", "SYNTHETIC_PRIVATE_SENTINEL")
    writeArticle(a, "draft", "status: draft", "SYNTHETIC_PRIVATE_SENTINEL")
    fs.mkdirSync(path.join(a, "media"))
    fs.writeFileSync(
      path.join(a, "media/pixel.png"),
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jS1cAAAAASUVORK5CYII=",
        "base64",
      ),
    )
    await buildContent(app)
    const raw = fs.readFileSync(path.join(app, "generated/content.json"), "utf8"),
      db = JSON.parse(raw)
    expect(db.entries).toHaveLength(3)
    expect(raw).not.toContain("SYNTHETIC_PRIVATE_SENTINEL")
    const intro = db.entries.find(
      (x: { moduleId: string; slug: string }) => x.moduleId === "a-notes" && x.slug === "intro",
    )
    expect(intro.href).toBe("/vi/modules/a-notes/intro/")
    expect(intro.body).toContain("/vi/modules/a-notes/next/")
    expect(intro.body).toContain("/media/a-notes/media/pixel.webp")
    expect(fs.existsSync(path.join(app, "public/media/a-notes/media/pixel.webp"))).toBe(true)
    writeModule(content, "extra-notes")
    writeArticle(path.join(content, "extra-notes"), "added")
    await buildContent(app)
    expect(
      JSON.parse(fs.readFileSync(path.join(app, "generated/modules.json"), "utf8")),
    ).toHaveLength(3)
  })
  it("renders projects and milestones from Markdown with explicit translation fallbacks", async () => {
    const { app, content } = fixture()
    const projects = writeModule(content, "projects", "projects"),
      journey = writeModule(content, "journey", "journey")
    writeArticle(
      projects,
      "project-one",
      "id: project-one\nstack: [TypeScript]\nrepository: https://example.com/repo",
      "## Design\n\n```ts\nconst ready = true\n```",
    )
    writeArticle(
      journey,
      "learning",
      "id: learning\nlabel: Learning\nstatus: current",
      "## Learning\n\nA real milestone.",
    )
    await buildContent(app)
    const db = JSON.parse(fs.readFileSync(path.join(app, "generated/content.json"), "utf8"))
    expect(db.projects[0].bodies.en).toContain("```ts")
    expect(db.projects[0].bodyLocales.en).toBe("vi")
    expect(db.journey[0].bodies.vi).toContain("A real milestone")
    expect(db.entries).toHaveLength(0)
  })
})

describe("multi-repository photo journals", () => {
  it("merges independent album modules and publishes videos without image processing", async () => {
    const { app, content } = fixture()
    for (const name of ["album1", "album2"]) {
      const dir = writeModule(content, name, "albums")
      fs.mkdirSync(path.join(dir, "media"))
      fs.writeFileSync(path.join(dir, "media/clip.webm"), Buffer.from("public-video-fixture"))
      writeArticle(
        dir,
        `${name}-collection`,
        "items:\n  - src: ../media/clip.webm\n    title: Example video",
      )
    }
    await buildContent(app)
    const db = JSON.parse(fs.readFileSync(path.join(app, "generated/content.json"), "utf8"))
    expect(db.albums).toHaveLength(2)
    expect(db.albums.find((album: { moduleId: string }) => album.moduleId === "album1").story).toBe(
      false,
    )
    expect(db.albums.find((album: { moduleId: string }) => album.moduleId === "album2").story).toBe(
      false,
    )
    expect(db.albums.map((item: { moduleId: string }) => item.moduleId)).toEqual([
      "album1",
      "album2",
    ])
    expect(db.albums[0].items[0].kind).toBe("video")
    expect(fs.readFileSync(path.join(app, "public/media/album1/media/clip.webm"), "utf8")).toBe(
      "public-video-fixture",
    )
  })
})

describe("album repositories", () => {
  it("merges independent public photo/video albums, emits media and excludes drafts", async () => {
    const { app, content } = fixture()
    const one = writeModule(content, "album-one", "albums"),
      two = writeModule(content, "album-two", "albums")
    fs.mkdirSync(path.join(one, "media"))
    fs.writeFileSync(
      path.join(one, "media/photo.png"),
      Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jS1cAAAAASUVORK5CYII=",
        "base64",
      ),
    )
    fs.mkdirSync(path.join(two, "media"))
    fs.writeFileSync(path.join(two, "media/clip.webm"), "synthetic-video-bytes")
    writeArticle(one, "first", "story: true\nitems:\n  - src: ../media/photo.png\n    title: Photo")
    writeArticle(two, "second", "items:\n  - src: ../media/clip.webm\n    title: Video")
    writeArticle(two, "unpublished", "status: draft\nitems: []")
    await buildContent(app)
    const db = JSON.parse(fs.readFileSync(path.join(app, "generated/content.json"), "utf8"))
    expect(db.albums).toHaveLength(2)
    expect(
      db.albums.find((album: { moduleId: string }) => album.moduleId === "album-one").story,
    ).toBe(true)
    expect(
      db.albums.find((album: { moduleId: string }) => album.moduleId === "album-two").story,
    ).toBe(false)
    expect(db.albums[0].items[0].src).toMatch(/album-one\/media\/photo.webp$/)
    expect(db.albums[1].items[0].kind).toBe("video")
    expect(fs.readFileSync(path.join(app, "public", db.albums[1].items[0].src), "utf8")).toBe(
      "synthetic-video-bytes",
    )
    expect(db.albums[0].bodyLocales.en).toBe("vi")
  })
})
