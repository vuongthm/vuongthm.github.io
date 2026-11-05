import { afterEach, describe, expect, it, vi } from "vitest"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { buildContent } from "../../scripts/content/build.mjs"
import { loadContentConfig } from "../../scripts/content/config.mjs"
import { compileMusic } from "../../scripts/content/corner.mjs"
const folders: string[] = []
afterEach(() => {
  vi.unstubAllEnvs()
  for (const dir of folders.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "vuong-corner-"))
  folders.push(root)
  const app = path.join(root, "app"),
    repo = path.join(root, "content", "my-corner")
  fs.mkdirSync(path.join(app, "site"), { recursive: true })
  fs.mkdirSync(path.join(repo, "vi"), { recursive: true })
  fs.mkdirSync(path.join(repo, "music"), { recursive: true })
  fs.writeFileSync(path.join(app, "site/profile.json"), "{}")
  fs.writeFileSync(path.join(app, "site/paths.json"), "[]")
  fs.writeFileSync(
    path.join(app, "content.sources.json"),
    JSON.stringify({
      locales: ["vi", "en", "ja", "zh"],
      privateContent: "exclude",
      moduleRoots: ["../content"],
      site: { profile: "site/profile.json", paths: "site/paths.json" },
    }),
  )
  fs.writeFileSync(
    path.join(repo, "module.json"),
    JSON.stringify({ id: "my-corner", adapter: "corner", music: "music/tracks.json" }),
  )
  fs.writeFileSync(
    path.join(repo, "music/cover.svg"),
    '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="blue"/></svg>',
  )
  fs.writeFileSync(
    path.join(repo, "music/Bài hát mẫu.lrc"),
    "[ti:Bài hát mẫu]\n[ar:Example]\n[offset:0]\n[00:03.50]Synthetic supplied line\n",
  )
  const track = {
    id: "example",
    title: "Bài hát mẫu",
    artist: "Example",
    youtubeId: "123456789ab",
    mood: "quiet",
    cover: "cover.svg",
    lyrics: "Bài hát mẫu.lrc",
  }
  const writeTracks = (records: unknown[]) =>
    fs.writeFileSync(path.join(repo, "music/tracks.json"), JSON.stringify(records))
  writeTracks([track])
  function article(id: string, extra = "", body = "## A pause\n\nPublic reflection.") {
    fs.writeFileSync(
      path.join(repo, "vi", id + ".md"),
      `---\nid: ${id}\ntitle: ${id}\ncategory: books\n${extra}\n---\n\n${body}\n`,
    )
  }
  const source = () => loadContentConfig(app).sources[0]
  return { app, repo, track, writeTracks, article, source }
}
describe("independent personal-corner modules", () => {
  it("compiles Markdown shelves and Unicode-named lyrics through the same independent manifest", async () => {
    const f = fixture()
    f.article("slow-pages", "sample: true\nshelfStatus: current")
    expect(loadContentConfig(f.app).topics).toHaveLength(0)
    await buildContent(f.app)
    const music = JSON.parse(fs.readFileSync(path.join(f.app, "generated/music.json"), "utf8")),
      db = JSON.parse(fs.readFileSync(path.join(f.app, "generated/content.json"), "utf8"))
    expect(db.entries).toHaveLength(0)
    expect(db.corners).toHaveLength(1)
    expect(db.corners[0].bodies.en).toContain("Public reflection")
    expect(db.corners[0].bodyLocales.en).toBe("vi")
    expect(music[0].lyrics).toBe("/media/my-corner/music/Bài hát mẫu.lrc")
    expect(fs.readFileSync(path.join(f.app, "public", music[0].lyrics), "utf8")).toContain(
      "[00:03.50]",
    )
    expect(
      JSON.parse(fs.readFileSync(path.join(f.app, "generated/modules.json"), "utf8"))[0].count,
    ).toBe(2)
  })
  it("omits draft/private shelves and music before copying their media", async () => {
    const f = fixture()
    f.article("hidden", "visibility: private", "PRIVATE_CORNER_SENTINEL")
    f.article("draft", "status: draft", "PRIVATE_CORNER_SENTINEL")
    f.writeTracks([
      { ...f.track, status: "draft", lyrics: "missing.lrc" },
      { ...f.track, id: "hidden", visibility: "private", lyrics: "missing.lrc" },
    ])
    await buildContent(f.app)
    expect(fs.readFileSync(path.join(f.app, "generated/content.json"), "utf8")).not.toContain(
      "PRIVATE_CORNER_SENTINEL",
    )
    expect(JSON.parse(fs.readFileSync(path.join(f.app, "generated/music.json"), "utf8"))).toEqual(
      [],
    )
  })
  it("keeps individually locked shelf bodies encrypted and emits the correct access route", async () => {
    const f = fixture()
    f.article("locked", "lock: true", "PRIVATE_CORNER_SENTINEL")
    vi.stubEnv("CONTENT_PASSWORDS", JSON.stringify({ "my-corner/locked": "fixture-corner-key" }))
    vi.stubEnv("CONTENT_PASSWORD", "")
    await buildContent(f.app)
    const raw = fs.readFileSync(path.join(f.app, "generated/content.json"), "utf8")
    expect(raw).not.toContain("PRIVATE_CORNER_SENTINEL")
    expect(JSON.parse(raw).corners[0].bodies.vi).toMatch(/^v2:/)
    expect(
      JSON.parse(fs.readFileSync(path.join(f.app, "generated/access.json"), "utf8")),
    ).toContainEqual(expect.objectContaining({ href: "/vi/corner/locked/", back: "/vi/corner/" }))
  })
  it("rejects duplicate track IDs, ambiguous audio sources and invalid category metadata", async () => {
    const f = fixture()
    f.writeTracks([f.track, f.track])
    expect(() => compileMusic(f.source())).toThrow(/duplicate/)
    f.writeTracks([{ ...f.track, src: "audio.mp3" }])
    expect(() => compileMusic(f.source())).toThrow(/one audio source/)
    f.writeTracks([])
    fs.writeFileSync(
      path.join(f.repo, "vi/bad.md"),
      "---\ntitle: Bad\ncategory: arbitrary\n---\nText",
    )
    await expect(buildContent(f.app)).rejects.toThrow(/category/)
  })
  it("rejects manifest and media paths that escape the source repo", async () => {
    const f = fixture()
    expect(() => compileMusic({ ...f.source(), music: "../../outside.json" })).toThrow()
    fs.writeFileSync(path.join(path.dirname(f.repo), "outside.lrc"), "not public")
    f.writeTracks([{ ...f.track, lyrics: "../../outside.lrc" }])
    await expect(buildContent(f.app)).rejects.toThrow(/escapes/)
  })
  it("fails closed instead of publishing a locked audio track as public", () => {
    const f = fixture()
    f.writeTracks([{ ...f.track, lock: true }])
    expect(() => compileMusic(f.source())).toThrow(/private media vault/)
  })
})
