import { describe, expect, it, vi } from "vitest"
import { askGemini, extractSummary } from "./client"
describe("public AI adapter", () => {
  it("extracts readable paragraphs without code or image URLs", () => {
    const summary = extractSummary(
      "## Topic\n\nThis is a long enough public paragraph explaining network boundaries and packet flow.\n\n```sh\nsecret-looking-example\n```\n\n![photo](/media/a.png)",
    )
    expect(summary).toHaveLength(1)
    expect(summary.join("")).not.toContain("secret-looking")
  })
  it("keeps keys in headers and handles quota errors", async () => {
    const fetcher = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: { message: "quota" } }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      }),
    )
    await expect(
      askGemini({
        key: "fixture-key",
        model: "gemini-test",
        question: "DNS?",
        context: "Public only",
        locale: "en",
        signal: new AbortController().signal,
      }),
    ).rejects.toThrow(/quota/)
    const [url, options] = fetcher.mock.calls[0]
    expect(String(url)).not.toContain("fixture-key")
    expect((options?.headers as Record<string, string>)["x-goog-api-key"]).toBe("fixture-key")
    fetcher.mockRestore()
  })
})
