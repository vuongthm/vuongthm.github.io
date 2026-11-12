import { afterEach, describe, expect, it, vi } from "vitest"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { parse } from "yaml"
import { loadContentConfig } from "../../scripts/content/config.mjs"
import { fetchSources } from "../../scripts/content/fetch-sources.mjs"
import { buildContent } from "../../scripts/content/build.mjs"

const folders: string[] = []
afterEach(() => {
  vi.unstubAllEnvs()
  for (const folder of folders.splice(0)) fs.rmSync(folder, { recursive: true, force: true })
})
function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "vuong-repos-"))
  folders.push(root)
  const upstream = path.join(root, "upstream"),
    app = path.join(root, "website")
  fs.mkdirSync(upstream)
  fs.mkdirSync(path.join(app, "site"), { recursive: true })
  fs.writeFileSync(path.join(app, "site/profile.json"), "{}")
  fs.writeFileSync(path.join(app, "site/paths.json"), "[]")
  // Real Git clones are redirected to isolated local repositories, without network or credentials.
  vi.stubEnv("GIT_CONFIG_COUNT", "1")
  vi.stubEnv("GIT_CONFIG_KEY_0", `url.file://${upstream}/.insteadOf`)
  vi.stubEnv("GIT_CONFIG_VALUE_0", "https://github.com/")
  vi.stubEnv("CONTENT_SOURCE_TOKEN", "")
  return { root, upstream, app }
}
function config(app: string, ids = ["ai-notes"], ref = "main") {
  fs.writeFileSync(
    path.join(app, "content.sources.json"),
    JSON.stringify({
      locales: ["vi", "en", "ja", "zh"],
      privateContent: "exclude",
      moduleRoots: ["../content"],
      site: { profile: "site/profile.json", paths: "site/paths.json" },
      repositories: ids.map((id) => ({ id, repository: `owner/${id}`, ref })),
      sources: [],
    }),
  )
}
function git(folder: string, ...args: string[]) {
  return execFileSync(
    "git",
    ["-c", "user.name=Content QA", "-c", "user.email=qa@example.invalid", ...args],
    { cwd: folder, stdio: "pipe", encoding: "utf8" },
  )
}
function moduleFiles(folder: string, id = "ai-notes", body = "Original content") {
  fs.mkdirSync(path.join(folder, "vi"), { recursive: true })
  fs.writeFileSync(path.join(folder, "module.json"), JSON.stringify({ id, adapter: "articles" }))
  fs.writeFileSync(
    path.join(folder, "vi/example.md"),
    `---\ntitle: Example\ndate: 2026-11-04\n---\n\n## Content\n\n${body}`,
  )
}
function repository(upstream: string) {
  const folder = path.join(upstream, "owner/ai-notes.git")
  moduleFiles(folder)
  git(folder, "init", "-b", "main")
  git(folder, "add", ".")
  git(folder, "commit", "-m", "Initial content")
  return folder
}
describe("independent content repositories", () => {
  it("uses local content checkouts without fetching over local edits", () => {
    const { root, app } = fixture()
    config(app)
    const local = path.join(root, "content/ai-notes")
    moduleFiles(local, "ai-notes", "Uncommitted local work")
    fetchSources(app)
    expect(loadContentConfig(app).repositories[0].local).toBe(true)
    expect(loadContentConfig(app).sources[0].path).toBe(local)
    expect(fs.existsSync(path.join(app, ".content-sources"))).toBe(false)
  })
  it("fetches and compiles a standalone website, and a fresh deployment picks up the next source push", async () => {
    const { upstream, app, root } = fixture()
    const remote = repository(upstream)
    config(app)
    expect(() => loadContentConfig(app)).toThrow(/Missing repository module/)
    fetchSources(app)
    await buildContent(app)
    const first = JSON.parse(fs.readFileSync(path.join(app, "generated/content.json"), "utf8"))
    expect(first.entries[0].body).toContain("Original content")
    expect(first.entries[0].href).toBe("/vi/modules/ai-notes/example/")
    moduleFiles(remote, "ai-notes", "New source commit")
    git(remote, "add", ".")
    git(remote, "commit", "-m", "Next push")
    // The deployment job checks out only the website; it never caches source checkouts.
    const next = path.join(root, "fresh-website")
    fs.cpSync(path.join(app, "site"), path.join(next, "site"), { recursive: true })
    config(next)
    fetchSources(next)
    await buildContent(next)
    expect(fs.readFileSync(path.join(next, "generated/content.json"), "utf8")).toContain(
      "New source commit",
    )
  })
  it("fetches the configured branch rather than an unrelated branch tip", () => {
    const { upstream, app } = fixture()
    const remote = repository(upstream)
    git(remote, "branch", "published")
    moduleFiles(remote, "ai-notes", "Main-only change")
    git(remote, "add", ".")
    git(remote, "commit", "-m", "Draft on main")
    config(app, ["ai-notes"], "published")
    fetchSources(app)
    expect(
      fs.readFileSync(path.join(app, ".content-sources/ai-notes/vi/example.md"), "utf8"),
    ).not.toContain("Main-only change")
  })
  it("fails closed on missing required repositories and removes partial clone staging", () => {
    const { app } = fixture()
    config(app, ["missing-notes"])
    expect(() => fetchSources(app)).toThrow(/Unable to fetch required source/)
    expect(fs.readdirSync(path.join(app, ".content-sources"))).toEqual([])
  })
  it("rejects invalid registration and a remote manifest with an unexpected module ID", () => {
    const { app, upstream } = fixture()
    const remote = repository(upstream)
    moduleFiles(remote, "different-id")
    git(remote, "add", ".")
    git(remote, "commit", "-m", "Mismatched manifest")
    config(app)
    fetchSources(app)
    expect(() => loadContentConfig(app)).toThrow(/module ID mismatch/)
    config(app, ["../escape"])
    expect(() => fetchSources(app)).toThrow(/repository ID/)
  })
  it("scaffolds a registered repo and working Markdown drafts using only website-owned files", async () => {
    const { root, app } = fixture()
    config(app, [])
    const scripts = path.resolve(import.meta.dirname, "../../scripts/content")
    fs.mkdirSync(path.join(app, "scripts/content/templates"), { recursive: true })
    for (const name of [
      "new",
      "schema",
      "authoring",
      "files",
      "structure",
      "localized",
      "learning-files",
    ])
      fs.copyFileSync(
        path.join(scripts, `${name}.mjs`),
        path.join(app, "scripts/content", `${name}.mjs`),
      )
    fs.symlinkSync(
      path.resolve(import.meta.dirname, "../../node_modules"),
      path.join(app, "node_modules"),
      "dir",
    )
    fs.copyFileSync(
      path.join(scripts, "templates/notify-site.yml"),
      path.join(app, "scripts/content/templates/notify-site.yml"),
    )
    const cli = (...args: string[]) =>
      execFileSync(process.execPath, [path.join(app, "scripts/content/new.mjs"), ...args], {
        cwd: app,
        stdio: "pipe",
      })
    cli("module", "new-notes", "--repository", "owner/new-notes")
    fs.writeFileSync(
      path.join(app, "site/paths.json"),
      JSON.stringify([
        {
          slug: "fixture-course",
          topic: "new",
          sections: [{ id: "foundations", steps: [{ id: "planned" }, { id: "first-note" }] }],
        },
      ]),
    )
    cli(
      "article",
      "new-notes",
      "first-note",
      "--module",
      "foundations",
      "--path",
      "fixture-course",
      "--section",
      "foundations",
      "--step",
      "first-note",
    )
    const source = path.join(root, "content/new-notes"),
      file = path.join(source, "foundations/vi/first-note.md")
    expect(parse(fs.readFileSync(file, "utf8").split("---")[1]).id).toBe("new-notes:first-note")
    cli("article", "new-notes", "first-note", "--module", "foundations", "--lang", "en")
    const en = parse(
      fs.readFileSync(path.join(source, "foundations/en/first-note.md"), "utf8").split("---")[1],
    )
    expect(en.order).toBe(1)
    expect(en.module).toBe("foundations")
    expect(en.translationKey).toBe("new-notes:first-note")
    expect(en.learning.order).toBe(2)
    const viDate = parse(fs.readFileSync(file, "utf8").split("---")[1]).date
    expect(en.date).toBe(viDate)
    cli("section", "new-notes", "practice", "--group", "soc-l2", "--title", "Practice")
    expect(fs.existsSync(path.join(source, "soc-l2/practice/media/.gitkeep"))).toBe(true)
    expect(() => cli("article", "new-notes", "unassigned")).toThrow()
    expect(fs.existsSync(path.join(source, "inbox"))).toBe(false)
    cli("article", "new-notes", "second-note", "--module", "practice")
    const secondDate = parse(
      fs
        .readFileSync(path.join(source, "soc-l2/practice/vi/second-note.md"), "utf8")
        .split("---")[1],
    ).date
    expect(secondDate).toBe(viDate)
    cli(
      "path",
      "composed-course",
      "--topic",
      "new",
      "--modules",
      "new-notes/foundations,new-notes/practice",
    )
    const composed = JSON.parse(fs.readFileSync(path.join(app, "site/paths.json"), "utf8")).find(
      (item: { slug: string }) => item.slug === "composed-course",
    )
    expect(composed.status).toBe("draft")
    expect(composed.sections.map((item: { module: string }) => item.module)).toEqual([
      "new-notes/foundations",
      "new-notes/practice",
    ])
    cli(
      "path",
      "grouped-course",
      "--repo",
      "new-notes",
      "--group",
      "soc-l2",
      "--topic",
      "new",
      "--modules",
      "new-notes/practice",
    )
    const grouped = JSON.parse(
      fs.readFileSync(path.join(source, "soc-l2/learning-path.json"), "utf8"),
    )
    expect(grouped.slug).toBe("grouped-course")
    expect(grouped.status).toBe("draft")
    expect(
      JSON.parse(fs.readFileSync(path.join(source, "module.json"), "utf8")).learningPaths,
    ).toContain("soc-l2/learning-path.json")
    expect(loadContentConfig(app).repositories[0].repository).toBe("owner/new-notes")
    expect(fs.existsSync(path.join(source, ".github/workflows/notify-root.yml"))).toBe(true)
    await buildContent(app)
    expect(
      JSON.parse(fs.readFileSync(path.join(app, "generated/content.json"), "utf8")).entries,
    ).toHaveLength(0)
    fs.writeFileSync(
      file,
      fs.readFileSync(file, "utf8").replace("status: draft", "status: published"),
    )
    await buildContent(app)
    expect(
      JSON.parse(fs.readFileSync(path.join(app, "generated/content.json"), "utf8")).entries[0].href,
    ).toBe("/vi/modules/new-notes/first-note/")
    expect(() => cli("article", "new-notes", "first-note", "--module", "foundations")).toThrow()
  })
  it("keeps standalone dependencies and every registered notification workflow portable", () => {
    const app = path.resolve(import.meta.dirname, "../.."),
      manifest = JSON.parse(fs.readFileSync(path.join(app, "package.json"), "utf8")),
      lock = parse(fs.readFileSync(path.join(app, "pnpm-lock.yaml"), "utf8")),
      registry = JSON.parse(fs.readFileSync(path.join(app, "content.sources.json"), "utf8"))
    for (const group of ["dependencies", "devDependencies"])
      for (const [name, version] of Object.entries(manifest[group]))
        expect(lock.importers["."][group][name].specifier).toBe(version)
    const deployment = parse(
      fs.readFileSync(path.join(app, ".github/workflows/quality-and-pages.yml"), "utf8"),
    )
    expect(deployment.on.repository_dispatch.types).toContain("content-updated")
    expect(
      deployment.jobs["verify-and-build"].steps.find((step: { uses?: string }) =>
        step.uses?.startsWith("actions/upload-pages-artifact"),
      ).with.path,
    ).toBe("out")
    expect(fs.existsSync(path.resolve(app, registry.site.profile))).toBe(true)
    expect(fs.existsSync(path.resolve(app, registry.site.paths))).toBe(true)
    const template = fs.readFileSync(
      path.join(app, "scripts/content/templates/notify-site.yml"),
      "utf8",
    )
    expect(parse(template).jobs.notify.uses).toBe(
      "vuongthm/vuongthm.github.io/.github/workflows/content-notification.yml@main",
    )
    expect(parse(template).on.push.branches).toEqual(["main"])
    // Only the local aggregate workspace contains the sibling clones.
    for (const repo of registry.repositories) {
      const local = path.resolve(app, "../content", repo.id)
      if (fs.existsSync(local))
        expect(fs.readFileSync(path.join(local, ".github/workflows/notify-root.yml"), "utf8")).toBe(
          template,
        )
    }
  })
})
