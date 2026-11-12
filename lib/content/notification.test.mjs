import { describe, expect, it, vi, afterEach } from "vitest"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { execFileSync } from "node:child_process"
import {
  notificationBranch,
  notifyWebsite,
  createNotificationCommit,
} from "../../scripts/content/notify-website.mjs"

afterEach(() => vi.unstubAllGlobals())

describe("cross-repository content notifications", () => {
  it("keeps current main and the previous notification as ancestors without changing website files", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "notification-history-"))
    const git = (...args) =>
      execFileSync("git", args, {
        cwd: directory,
        encoding: "utf8",
        env: {
          ...process.env,
          GIT_AUTHOR_NAME: "Notification test",
          GIT_AUTHOR_EMAIL: "test@example.invalid",
          GIT_COMMITTER_NAME: "Notification test",
          GIT_COMMITTER_EMAIL: "test@example.invalid",
        },
      }).trim()
    try {
      git("init", "--quiet")
      fs.writeFileSync(path.join(directory, "website.txt"), "initial")
      git("add", ".")
      git("commit", "--quiet", "-m", "Initial website")
      const firstMain = git("rev-parse", "HEAD")
      let previous = createNotificationCommit(git, firstMain, undefined, "First notification")
      expect(git("diff", `${firstMain}...${previous}`)).toBe("")
      for (const version of ["redesigned", "cleaned"]) {
        fs.writeFileSync(path.join(directory, "website.txt"), version)
        git("add", ".")
        git("commit", "--quiet", "-m", version)
        const main = git("rev-parse", "HEAD")
        const next = createNotificationCommit(git, main, previous, "Content changed")
        expect(git("merge-base", main, next)).toBe(main)
        expect(git("merge-base", "--is-ancestor", previous, next)).toBe("")
        expect(git("diff", `${main}...${next}`)).toBe("")
        expect(git("show", `${next}:website.txt`)).toBe(version)
        previous = next
      }
    } finally {
      fs.rmSync(directory, { recursive: true, force: true })
    }
  })

  it("isolates each source in its own branch and rejects foreign or unsafe names", () => {
    expect(notificationBranch("vuongthm/soc-notes")).toBe("content-updates/soc-notes")
    expect(notificationBranch("vuongthm/my-corner")).not.toBe(
      notificationBranch("vuongthm/stories"),
    )
    for (const source of ["other/stories", "vuongthm/../main", "vuongthm/-x", "a/b/c", ""])
      expect(() => notificationBranch(source)).toThrow()
  })

  it("fails before network access when source identity or credential is missing", async () => {
    const fetch = vi.fn()
    vi.stubGlobal("fetch", fetch)
    await expect(notifyWebsite({ GITHUB_REPOSITORY: "vuongthm/stories" })).rejects.toThrow(
      "Invalid source commit",
    )
    await expect(
      notifyWebsite({ GITHUB_REPOSITORY: "vuongthm/stories", GITHUB_SHA: "a".repeat(40) }),
    ).rejects.toThrow("Missing WEBSITE_NOTIFY_KEY")
    expect(fetch).not.toHaveBeenCalled()
  })

  it("refuses SSH access if GitHub host identity cannot be obtained", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }))
    await expect(
      notifyWebsite({
        GITHUB_REPOSITORY: "vuongthm/stories",
        GITHUB_SHA: "a".repeat(40),
        WEBSITE_NOTIFY_KEY: "unused-test-key",
      }),
    ).rejects.toThrow("Unable to verify GitHub SSH host keys")
  })
})
