import { describe, expect, it } from "vitest"
import { articlePreview } from "./preview"
describe("public article previews", () => {
  it("never extends a locked article with its body", () => {
    expect(
      articlePreview(
        { title: "Locked", summary: "Public introduction.", encrypted: true },
        "Private text ".repeat(30),
      ),
    ).toBe("Public introduction.")
  })
  it("extends a short introduction with prose and removes markdown links", () => {
    const result = articlePreview(
      { title: "Networks", summary: "An introduction." },
      "A useful paragraph about [networking](https://example.com) and the ways computers can communicate with each other across a network.",
    )
    expect(result).toContain("An introduction. A useful paragraph")
    expect(result).not.toContain("https://")
  })
})
