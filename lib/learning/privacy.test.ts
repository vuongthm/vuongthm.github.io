import { afterEach, expect, it, vi } from "vitest"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { buildContent } from "../../scripts/content/build.mjs"
import { decryptString } from "../crypto.mjs"
import { parseUnlockedDocument } from "../content/unlock"
const folders: string[] = []
afterEach(() => {
  vi.unstubAllEnvs()
  for (const dir of folders.splice(0)) fs.rmSync(dir, { recursive: true, force: true })
})
it("keeps locked quiz text and explanations inside ciphertext, never public metadata or search", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "vuong-quiz-private-"))
  folders.push(root)
  const app = path.join(root, "app"),
    moduleDir = path.join(root, "content", "notes")
  fs.mkdirSync(path.join(app, "site"), { recursive: true })
  fs.mkdirSync(path.join(moduleDir, "vi"), { recursive: true })
  fs.writeFileSync(
    path.join(app, "content.sources.json"),
    JSON.stringify({
      locales: ["vi", "en", "ja", "zh"],
      privateContent: "exclude",
      moduleRoots: ["../content"],
      site: { profile: "site/profile.json", paths: "site/paths.json" },
    }),
  )
  fs.writeFileSync(path.join(app, "site/profile.json"), "{}")
  fs.writeFileSync(path.join(app, "site/paths.json"), "[]")
  fs.writeFileSync(
    path.join(moduleDir, "module.json"),
    JSON.stringify({ id: "notes", adapter: "articles" }),
  )
  const quiz = {
    questions: [
      {
        id: "one",
        question: "SYNTHETIC_QUIZ_PRIVATE_QUESTION",
        options: ["First", "Second"],
        answer: 0,
        explanation: "SYNTHETIC_QUIZ_PRIVATE_EXPLANATION",
      },
    ],
  }
  fs.writeFileSync(
    path.join(moduleDir, "vi", "private.md"),
    "---\ntitle: Private example\ndate: 2026-11-05\nlock: true\n---\n\n## Intro\n\n```quiz\n" +
      JSON.stringify(quiz) +
      "\n```\n",
  )
  vi.stubEnv("CONTENT_PASSWORDS", JSON.stringify({ "notes/private": "fixture-quiz-password" }))
  vi.stubEnv("CONTENT_PASSWORD", "")
  await buildContent(app)
  const catalog = fs.readFileSync(path.join(app, "generated/content.json"), "utf8"),
    search = fs.readFileSync(path.join(app, "generated/search.json"), "utf8")
  expect(catalog).not.toContain("SYNTHETIC_QUIZ_PRIVATE")
  expect(search).not.toContain("SYNTHETIC_QUIZ_PRIVATE")
  const body = JSON.parse(catalog).entries[0].body,
    unlocked = parseUnlockedDocument((await decryptString("fixture-quiz-password", body))!)
  expect(unlocked.body).toContain("SYNTHETIC_QUIZ_PRIVATE_QUESTION")
  expect(unlocked.body).toContain("SYNTHETIC_QUIZ_PRIVATE_EXPLANATION")
})
