import { afterEach, describe, expect, it, vi } from "vitest"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { buildContent } from "../../scripts/content/build.mjs"
import { publishPolicy, frontmatter, hasLock } from "../../scripts/content/schema.mjs"
import { contentPassword, loadContentPasswords } from "../../scripts/content/locks.mjs"
import { decryptString } from "../crypto.mjs"
import { parseUnlockedDocument } from "./unlock"
const PASSWORD = "fixture-only-password-9283"
const folders: string[] = []
afterEach(() => {
  vi.unstubAllEnvs()
  for (const folder of folders.splice(0)) fs.rmSync(folder, { recursive: true, force: true })
})
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "vuong-locked-")),
    app = path.join(root, "app"),
    content = path.join(root, "content")
  folders.push(root)
  fs.mkdirSync(path.join(app, "site"), { recursive: true })
  fs.mkdirSync(content)
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
  vi.stubEnv("CONTENT_PASSWORD", "")
  vi.stubEnv("CONTENT_PASSWORDS", "")
  vi.stubEnv("PUBLISH_ENCRYPTED", "0")
  return { root, app, content }
}
function moduleFolder(content: string, id: string, adapter = "articles") {
  const dir = path.join(content, id)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, "module.json"), JSON.stringify({ id, adapter }))
  return dir
}
function write(
  dir: string,
  file: string,
  metadata = "",
  body = "## Protected heading\n\nSYNTHETIC_LOCKED_BODY",
) {
  const target = path.join(dir, file)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, `---\ntitle: Example\ndate: 2026-11-04\n${metadata}\n---\n\n${body}`)
  const data = frontmatter(fs.readFileSync(target, "utf8"), target).data
  const moduleFile = path.join(dir, "module.json"),
    adapter = fs.existsSync(moduleFile)
      ? JSON.parse(fs.readFileSync(moduleFile, "utf8")).adapter
      : "site"
  const parts = file.split("/"),
    name = path.basename(file, ".md")
  if (hasLock(data) && !data.lockKey) {
    const app = path.join(path.dirname(path.dirname(dir)), "app"),
      credentials = path.join(app, "passwords.json")
    const values = fs.existsSync(credentials)
      ? JSON.parse(fs.readFileSync(credentials, "utf8"))
      : {}
    const id =
      adapter === "stories"
        ? `${parts[0]}/${name}`
        : adapter === "site"
          ? "my-album"
          : (data.id ?? data.slug ?? name)
    const key = `${path.basename(dir)}/${id}`
    if (!values[key])
      values[key] = Object.keys(values).length
        ? `${PASSWORD}-${Object.keys(values).length}`
        : PASSWORD
    fs.writeFileSync(credentials, JSON.stringify(values))
  }
  return target
}
function database(app: string) {
  return JSON.parse(fs.readFileSync(path.join(app, "generated/content.json"), "utf8"))
}
const pixel = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jS1cAAAAASUVORK5CYII=",
  "base64",
)

describe("Markdown lock field", () => {
  it("never falls back to a shared default and rejects credentials reused across articles", async () => {
    expect(contentPassword({ default: PASSWORD }, { lock: true }, "notes", "one")).toBeUndefined()
    expect(() =>
      contentPassword({ default: PASSWORD }, { lockKey: "default" }, "notes", "one"),
    ).toThrow(/default/)
    const { app, content } = fixture(),
      notes = moduleFolder(content, "notes")
    write(notes, "vi/one.md", "lock: true")
    write(notes, "vi/two.md", "lock: true")
    fs.writeFileSync(
      path.join(app, "passwords.json"),
      JSON.stringify({ "notes/one": PASSWORD, "notes/two": PASSWORD }),
    )
    await expect(buildContent(app)).rejects.toThrow(/unique password/)
  })

  it("encrypts an explicit lock even when legacy private-content publication is disabled", () => {
    expect(publishPolicy({ lock: true }, "exclude", PASSWORD, "example")).toBe("encrypt")
    expect(publishPolicy({ lock: false }, "exclude", undefined, "example")).toBe("public")
    expect(publishPolicy({ lock: true, status: "draft" }, "exclude", undefined, "example")).toBe(
      "exclude",
    )
    expect(
      publishPolicy({ lock: true, visibility: "private" }, "exclude", undefined, "example"),
    ).toBe("exclude")
    expect(() => publishPolicy({ lock: "some-password" }, "exclude", PASSWORD, "example")).toThrow(
      /true or false/,
    )
  })
  it("keeps plaintext out of generated catalogs/search and rejects wrong passwords", async () => {
    const { app, content } = fixture(),
      dir = moduleFolder(content, "notes")
    write(dir, "vi/protected.md", "lock: true")
    write(dir, "vi/open.md", "lock: false", "## Public heading")
    await buildContent(app)
    const db = database(app),
      locked = db.entries.find((entry: { slug: string }) => entry.slug === "protected")
    expect(locked.encrypted).toBe(true)
    expect(fs.readFileSync(path.join(app, "generated/content.json"), "utf8")).not.toContain(
      "SYNTHETIC_LOCKED_BODY",
    )
    expect(fs.readFileSync(path.join(app, "generated/content.json"), "utf8")).not.toContain(
      PASSWORD,
    )
    expect(fs.readFileSync(path.join(app, "generated/search.json"), "utf8")).not.toContain(
      "protected",
    )
    expect(await decryptString("wrong-password", locked.body)).toBeNull()
    expect(parseUnlockedDocument((await decryptString(PASSWORD, locked.body))!).body).toContain(
      "SYNTHETIC_LOCKED_BODY",
    )
  })
  it("fails closed without a configured key, with weak keys, or with a missing explicit group", async () => {
    const { app, content } = fixture(),
      dir = moduleFolder(content, "notes")
    write(dir, "vi/secret.md", "lock: true")
    fs.writeFileSync(path.join(app, "passwords.json"), "{}")
    await expect(buildContent(app)).rejects.toThrow(/CONTENT_PASSWORDS/)
    fs.writeFileSync(path.join(app, "passwords.json"), JSON.stringify({ "notes/secret": "short" }))
    await expect(buildContent(app)).rejects.toThrow(/8 characters/)
    fs.writeFileSync(path.join(app, "passwords.json"), JSON.stringify({ "notes/secret": PASSWORD }))
    write(dir, "vi/secret.md", "lock: true\nlockKey: missing-group")
    await expect(buildContent(app)).rejects.toThrow(/requires a password/)
    write(dir, "vi/secret.md", "lock: true\npassword: do-not-store-this")
    await expect(buildContent(app)).rejects.toThrow(/Do not put passwords in Markdown/)
    expect(fs.existsSync(path.join(app, "generated/content.json"))).toBe(false)
  })
  it("opens exact short test passphrases and rejects padding or an earlier password after rotation", async () => {
    const { app, content } = fixture(),
      dir = moduleFolder(content, "notes")
    write(dir, "vi/secret.md", "lock: true")
    const values = path.join(app, "passwords.json")
    fs.writeFileSync(values, JSON.stringify({ "notes/secret": "demo-first" }))
    await buildContent(app)
    const entry = JSON.parse(fs.readFileSync(path.join(app, "generated/content.json"), "utf8"))
      .entries[0]
    expect(await decryptString("demo-first", entry.body)).not.toBeNull()
    expect(await decryptString("demo-first ", entry.body)).toBeNull()
    fs.writeFileSync(values, JSON.stringify({ "notes/secret": "demo-second" }))
    await buildContent(app)
    const rotated = JSON.parse(fs.readFileSync(path.join(app, "generated/content.json"), "utf8"))
      .entries[0]
    expect(await decryptString("demo-second", rotated.body)).not.toBeNull()
    expect(await decryptString("demo-first", rotated.body)).toBeNull()
  })
  it("bundles inline/reference images and attachments inside ciphertext without publishing original media", async () => {
    const { app, content } = fixture(),
      dir = moduleFolder(content, "notes")
    fs.mkdirSync(path.join(dir, "media"))
    fs.writeFileSync(path.join(dir, "media/private.png"), pixel)
    fs.writeFileSync(path.join(dir, "media/private.txt"), "PRIVATE_ATTACHMENT_FIXTURE")
    write(
      dir,
      "vi/protected.md",
      "lock: true",
      "## Protected\n\n![Image](../media/private.png)\n\n![Reference][photo]\n\n[photo]: ../media/private.png\n\n[Download](../media/private.txt)\n\n[Open note](./open.md#hello)",
    )
    write(dir, "vi/open.md", "", "## Hello")
    await buildContent(app)
    const locked = database(app).entries.find(
        (entry: { slug: string }) => entry.slug === "protected",
      ),
      opened = parseUnlockedDocument((await decryptString(PASSWORD, locked.body))!)
    expect(opened.assets).toHaveLength(2)
    expect(Buffer.from(opened.assets[0].data, "base64")).toEqual(pixel)
    expect(Buffer.from(opened.assets[1].data, "base64").toString()).toBe(
      "PRIVATE_ATTACHMENT_FIXTURE",
    )
    expect(opened.body).toContain("/vi/modules/notes/open/#hello")
    expect(fs.existsSync(path.join(app, "public/media/notes/media/private.png"))).toBe(false)
    expect(JSON.parse(fs.readFileSync(path.join(app, "generated/assets.json"), "utf8"))).toEqual({})
  })
  it("rasterizes safe SVG images and refuses scripts or external references", async () => {
    const { app, content } = fixture(),
      dir = moduleFolder(content, "notes")
    fs.mkdirSync(path.join(dir, "media"))
    const image = path.join(dir, "media/graphic.svg")
    fs.writeFileSync(
      image,
      '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="blue"/></svg>',
    )
    write(dir, "vi/protected.md", "lock: true", "![Vector](../media/graphic.svg)")
    await buildContent(app)
    const opened = parseUnlockedDocument(
      (await decryptString(PASSWORD, database(app).entries[0].body))!,
    )
    expect(opened.assets[0].type).toBe("image/webp")
    expect(Buffer.from(opened.assets[0].data, "base64").subarray(8, 12).toString()).toBe("WEBP")
    fs.writeFileSync(
      image,
      '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://example.invalid/private.png"/></svg>',
    )
    await expect(buildContent(app)).rejects.toThrow(/active content or external/)
  })
  it("rejects traversal and symlink escapes instead of copying private files into the bundle", async () => {
    const { root, app, content } = fixture(),
      dir = moduleFolder(content, "notes")
    fs.writeFileSync(path.join(root, "outside.png"), pixel)
    write(dir, "vi/secret.md", "lock: true", "![Escape](../../../outside.png)")
    await expect(buildContent(app)).rejects.toThrow(/escapes/)
    fs.symlinkSync(path.join(root, "outside.png"), path.join(dir, "linked.png"))
    write(dir, "vi/secret.md", "lock: true", "![Escape](../linked.png)")
    await expect(buildContent(app)).rejects.toThrow(/escapes/)
  })
  it("encrypts a whole project/milestone translation group and its frontmatter photos", async () => {
    const { app, content } = fixture(),
      project = moduleFolder(content, "projects", "projects"),
      journey = moduleFolder(content, "journey", "journey")
    write(project, "one/vi/index.md", "id: one\nlock: true")
    write(project, "one/en/index.md", "id: one", "## English body also protected")
    fs.mkdirSync(path.join(journey, "media"))
    fs.writeFileSync(path.join(journey, "media/private.png"), pixel)
    write(
      journey,
      "vi/stage.md",
      "id: stage\nstatus: current\nlock: true\nphotos: [../media/private.png]",
    )
    await buildContent(app)
    const db = database(app)
    expect(db.journey[0].photos).toEqual([])
    for (const item of [db.projects[0], db.journey[0]])
      for (const locale of ["vi", "en", "ja", "zh"]) {
        expect(item.encrypted).toBe(true)
        expect(item.bodies[locale]).toMatch(/^v2:/)
        expect(
          await decryptString(
            loadContentPasswords(app)[`${item.moduleId}/${item.id}`],
            item.bodies[locale],
          ),
        ).not.toBeNull()
      }
    expect(
      parseUnlockedDocument((await decryptString(PASSWORD, db.projects[0].bodies.en))!).body,
    ).toContain("English body also protected")
    expect(
      parseUnlockedDocument(
        (await decryptString(loadContentPasswords(app)["journey/stage"], db.journey[0].bodies.vi))!,
      ).assets,
    ).toHaveLength(1)
    expect(fs.readFileSync(path.join(app, "generated/content.json"), "utf8")).not.toMatch(
      /SYNTHETIC_LOCKED_BODY|English body also protected|private\.png/,
    )
  })
  it("keeps story introductions and galleries public when individual chapters are protected", async () => {
    const { app, content } = fixture(),
      stories = moduleFolder(content, "stories", "stories")
    fs.mkdirSync(path.join(stories, "first/media"), { recursive: true })
    fs.writeFileSync(path.join(stories, "first/media/cover.png"), pixel)
    write(
      stories,
      "first/vi/series.md",
      "coverImage: /media/stories/first/cover.png",
      "Public series introduction",
    )
    write(stories, "first/vi/chapter-1.md", "part: 1\nlock: true")
    await buildContent(app)
    const db = database(app)
    expect(db.stories[0].encrypted).toBe(false)
    expect(db.stories[0].cover).toBe("/media/stories/first/cover.webp")
    expect(fs.existsSync(path.join(app, "public", db.stories[0].cover))).toBe(true)
    expect(db.stories[0].body).toBe("Public series introduction")
    expect(db.stories[0].chapters).toContain("stories:first:chapter-1")
    expect(db.entries[0].encrypted).toBe(true)
    expect(await decryptString(PASSWORD, db.entries[0].body)).not.toBeNull()
    expect(fs.readFileSync(path.join(app, "generated/content.json"), "utf8")).not.toContain(
      "SYNTHETIC_LOCKED_BODY",
    )
  })
  it("locks only the marked series Markdown body without hiding its gallery or locking other chapters", async () => {
    const { app, content } = fixture(),
      stories = moduleFolder(content, "stories", "stories")
    fs.mkdirSync(path.join(stories, "sample/media"), { recursive: true })
    fs.writeFileSync(path.join(stories, "sample/media/cover.png"), pixel)
    write(
      stories,
      "sample/vi/series.md",
      "lock: true\ncoverImage: /media/stories/sample/cover.png\ngallery: [/media/stories/sample/cover.png]",
    )
    write(stories, "sample/vi/chapter-1.md", "part: 1", "Public chapter")
    await buildContent(app)
    const db = database(app)
    expect(db.stories[0].encrypted).toBe(true)
    expect(db.stories[0].photos).toHaveLength(1)
    expect(db.stories[0].photos[0].src).toMatch(/cover.webp$/)
    expect(db.entries[0].encrypted).not.toBe(true)
    expect(
      parseUnlockedDocument((await decryptString(PASSWORD, db.stories[0].body))!).body,
    ).toContain("SYNTHETIC_LOCKED_BODY")
    expect(fs.readFileSync(path.join(app, "generated/content.json"), "utf8")).not.toContain(
      "SYNTHETIC_LOCKED_BODY",
    )
  })
  it("keeps independent article passwords separate in navigation probes and payloads", async () => {
    const { app, content } = fixture(),
      notes = moduleFolder(content, "notes")
    const other = "another-fixture-password-6421"
    vi.stubEnv("CONTENT_PASSWORDS", JSON.stringify({ first: PASSWORD, second: other }))
    write(notes, "vi/first.md", "lock: true\nlockKey: first")
    write(notes, "vi/second.md", "lock: true\nlockKey: second")
    await buildContent(app)
    const rules = JSON.parse(fs.readFileSync(path.join(app, "generated/access.json"), "utf8"))
    const first = rules.find((rule: { href: string }) => rule.href.includes("/first/"))
    const second = rules.find((rule: { href: string }) => rule.href.includes("/second/"))
    expect(await decryptString(PASSWORD, first.probe)).toBe("vuong-page-access-v1")
    expect(await decryptString(other, second.probe)).toBe("vuong-page-access-v1")
    expect(await decryptString(PASSWORD, second.probe)).toBeNull()
    const db = database(app)
    expect(
      await decryptString(
        other,
        db.entries.find((entry: { slug: string }) => entry.slug === "first").body,
      ),
    ).toBeNull()
    expect(fs.readFileSync(path.join(app, "generated/access.json"), "utf8")).not.toContain(PASSWORD)
  })
  it("encrypts private album media and captions while retaining a public cover", async () => {
    const { app, content } = fixture(),
      album = moduleFolder(content, "album2", "albums")
    fs.mkdirSync(path.join(album, "media"))
    fs.writeFileSync(path.join(album, "media/cover.png"), pixel)
    fs.writeFileSync(path.join(album, "media/private.webm"), Buffer.from("PRIVATE_VIDEO_SENTINEL"))
    write(
      album,
      "vi/private-album.md",
      "id: private-album\nlock: true\ncover: ../media/cover.png\nitems:\n  - src: ../media/private.webm\n    title: Private video caption",
    )
    await buildContent(app)
    const db = database(app),
      item = db.albums[0]
    expect(item.items).toEqual([])
    expect(item.cover).toBe("/media/album2/media/cover.webp")
    const opened = parseUnlockedDocument((await decryptString(PASSWORD, item.bodies.vi))!)
    expect(opened.gallery?.[0].kind).toBe("video")
    expect(opened.gallery?.[0].title).toBe("Private video caption")
    expect(Buffer.from(opened.assets[0].data, "base64").toString()).toBe("PRIVATE_VIDEO_SENTINEL")
    expect(fs.existsSync(path.join(app, "public/media/album2/media/private.webm"))).toBe(false)
    const raw = fs.readFileSync(path.join(app, "generated/content.json"), "utf8")
    expect(raw).not.toContain("PRIVATE_VIDEO_SENTINEL")
    expect(raw).not.toContain("Private video caption")
    const rules = JSON.parse(fs.readFileSync(path.join(app, "generated/access.json"), "utf8"))
    expect(
      rules.filter((item: { href: string }) => item.href.includes("/my-album/private-album/")),
    ).toHaveLength(4)
  })
  it("encrypts private album photos and videos from their source repo, preserving only the public cover", async () => {
    const { app, content } = fixture(),
      album = moduleFolder(content, "private-album", "albums")
    fs.mkdirSync(path.join(album, "media"))
    fs.writeFileSync(path.join(album, "media/photo.png"), pixel)
    fs.writeFileSync(path.join(album, "media/clip.webm"), "synthetic-video-bytes")
    write(
      album,
      "vi/private.md",
      "lock: true\ncover: ../media/photo.png\nitems:\n  - src: ../media/photo.png\n    title: Private photo\n  - src: ../media/clip.webm\n    title: Private video",
    )
    await buildContent(app)
    const db = database(app),
      item = db.albums[0]
    expect(item.items).toEqual([])
    expect(item.cover).toMatch(/photo.webp$/)
    expect(fs.existsSync(path.join(app, "public/media/private-album/media/clip.webm"))).toBe(false)
    const opened = parseUnlockedDocument((await decryptString(PASSWORD, item.bodies.vi))!)
    expect(opened.gallery).toHaveLength(2)
    expect(opened.gallery![1].kind).toBe("video")
    expect(opened.assets[1].type).toBe("video/webm")
    expect(fs.readFileSync(path.join(app, "generated/content.json"), "utf8")).not.toMatch(
      /Private photo|Private video|synthetic-video-bytes/,
    )
    const rules = JSON.parse(fs.readFileSync(path.join(app, "generated/access.json"), "utf8"))
    expect(
      await decryptString(
        PASSWORD,
        rules.find((rule: { href: string }) => rule.href === "/vi/my-album/private/").probe,
      ),
    ).toBe("vuong-page-access-v1")
  })
  it("loads password groups without logging secret input on malformed JSON", () => {
    const { app } = fixture()
    fs.writeFileSync(
      path.join(app, "passwords.json"),
      JSON.stringify({ default: PASSWORD, personal: "another-fixture-password" }),
    )
    vi.stubEnv("CONTENT_PASSWORDS", JSON.stringify({ personal: "override-fixture-password" }))
    expect(
      contentPassword(loadContentPasswords(app), { lockKey: "personal" }, "notes", "one"),
    ).toBe("override-fixture-password")
    vi.stubEnv("CONTENT_PASSWORDS", "PRIVATE_CONFIGURATION_SENTINEL")
    try {
      loadContentPasswords(app)
      throw Error("Expected failure")
    } catch (error) {
      expect(String(error)).not.toContain("PRIVATE_CONFIGURATION_SENTINEL")
    }
  })
  it("keeps legacy text documents readable and rejects active media in a decoded bundle", () => {
    expect(parseUnlockedDocument("## Legacy text")).toEqual({ body: "## Legacy text", assets: [] })
    expect(() =>
      parseUnlockedDocument(
        JSON.stringify({
          format: "locked-markdown-v1",
          body: "Text",
          assets: [{ url: "image", type: "image/svg+xml", data: "" }],
        }),
      ),
    ).toThrow(/Invalid encrypted document/)
  })
  it("encrypts photo-journal images and captions while preserving the interactive gallery manifest", async () => {
    const { app } = fixture()
    fs.mkdirSync(path.join(app, "public"))
    fs.writeFileSync(path.join(app, "public/photo.png"), pixel)
    fs.writeFileSync(
      path.join(app, "site/profile.json"),
      JSON.stringify({
        photos: [
          {
            src: "/photo.png",
            title: { vi: "Chú thích", en: "Caption", ja: "写真", zh: "照片" },
            place: "Sample place",
          },
        ],
      }),
    )
    const configFile = path.join(app, "content.sources.json"),
      config = JSON.parse(fs.readFileSync(configFile, "utf8"))
    config.site.photoJournal = "site/photo-journal.md"
    fs.writeFileSync(configFile, JSON.stringify(config))
    write(path.join(app, "site"), "photo-journal.md", "lock: true", "")
    await buildContent(app)
    const raw = fs.readFileSync(path.join(app, "generated/site-pages.json"), "utf8"),
      page = JSON.parse(raw).photoJournal
    expect(page.encrypted).toBe(true)
    expect(raw).not.toContain("/photo.png")
    for (const locale of ["vi", "en", "ja", "zh"]) {
      const opened = parseUnlockedDocument((await decryptString(PASSWORD, page.bodies[locale]))!)
      expect(opened.gallery).toHaveLength(1)
      expect(opened.gallery![0].url).toBe(opened.assets[0].url)
      expect(Buffer.from(opened.assets[0].data, "base64")).toEqual(pixel)
      expect(opened.body).not.toContain("locked-photo-")
    }
    fs.writeFileSync(path.join(app, "passwords.json"), "{}")
    await expect(buildContent(app)).rejects.toThrow(/CONTENT_PASSWORDS/)
  })
  it("allows explicitly disabling the photo journal lock and rejects malformed gallery manifests", async () => {
    const { app } = fixture(),
      configFile = path.join(app, "content.sources.json"),
      config = JSON.parse(fs.readFileSync(configFile, "utf8"))
    config.site.photoJournal = "site/photo-journal.md"
    fs.writeFileSync(configFile, JSON.stringify(config))
    write(path.join(app, "site"), "photo-journal.md", "lock: false", "")
    await buildContent(app)
    expect(
      JSON.parse(fs.readFileSync(path.join(app, "generated/site-pages.json"), "utf8")).photoJournal,
    ).toEqual({ encrypted: false, bodies: {} })
    expect(() =>
      parseUnlockedDocument(
        JSON.stringify({
          format: "locked-markdown-v1",
          body: "",
          assets: [],
          gallery: [{ url: "missing", title: "Caption", place: "" }],
        }),
      ),
    ).toThrow()
  })
  it("initializes one private local password file without replacing or printing an existing password", () => {
    const { app, content } = fixture(),
      scripts = path.join(app, "scripts/content")
    const notes = moduleFolder(content, "notes")
    fs.mkdirSync(path.join(notes, "vi"))
    fs.writeFileSync(
      path.join(notes, "vi/new.md"),
      "---\ntitle: New\ndate: 2026-11-04\nlock: true\n---\nBody",
    )
    fs.mkdirSync(scripts, { recursive: true })
    for (const name of ["password", "locks", "config", "schema"])
      fs.copyFileSync(
        path.resolve(import.meta.dirname, `../../scripts/content/${name}.mjs`),
        path.join(scripts, `${name}.mjs`),
      )
    fs.mkdirSync(path.join(app, "lib"))
    fs.copyFileSync(
      path.resolve(import.meta.dirname, "../crypto.mjs"),
      path.join(app, "lib/crypto.mjs"),
    )
    fs.symlinkSync(
      path.resolve(import.meta.dirname, "../../node_modules"),
      path.join(app, "node_modules"),
      "dir",
    )
    const run = () =>
      execFileSync(process.execPath, [path.join(scripts, "password.mjs")], { encoding: "utf8" })
    run()
    const before = fs.readFileSync(path.join(app, "passwords.json"), "utf8")
    expect(JSON.parse(before).vault.length).toBeGreaterThanOrEqual(24)
    expect(JSON.parse(before)["notes/new"].length).toBeGreaterThanOrEqual(24)
    expect(JSON.parse(before)["notes/new"]).not.toBe(JSON.parse(before).vault)
    expect(JSON.parse(before).default).toBeUndefined()
    expect(fs.statSync(path.join(app, "passwords.json")).mode & 0o777).toBe(0o600)
    const modifiedAt = fs.statSync(path.join(app, "passwords.json")).mtimeMs
    const output = run()
    expect(fs.statSync(path.join(app, "passwords.json")).mtimeMs).toBe(modifiedAt)
    expect(fs.readFileSync(path.join(app, "passwords.json"), "utf8")).toBe(before)
    expect(output).not.toContain(JSON.parse(before).vault)
  })
})
