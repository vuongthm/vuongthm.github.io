import { describe, expect, it, vi, afterEach } from "vitest"
import { notificationBranch, notifyWebsite } from "../../scripts/content/notify-website.mjs"

afterEach(() => vi.unstubAllGlobals())

describe("cross-repository content notifications", () => {
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
