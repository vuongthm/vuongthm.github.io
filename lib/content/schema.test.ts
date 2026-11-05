import { describe, expect, it } from "vitest"
import {
  frontmatter,
  normalizeDate,
  assertUnique,
  publishPolicy,
} from "../../scripts/content/schema.mjs"
import { headingsFor } from "./markdown"
describe("publication boundaries", () => {
  it("excludes private content before compilation by default", () => {
    expect(publishPolicy({ title: "private", locked: true }, "exclude", undefined, "fixture")).toBe(
      "exclude",
    )
    expect(
      publishPolicy({ title: "draft", status: "draft" }, "encrypt", "password", "fixture"),
    ).toBe("exclude")
  })
  it("fails closed when encrypted publication has no key", () => {
    expect(() =>
      publishPolicy({ title: "private", locked: true }, "encrypt", undefined, "fixture"),
    ).toThrow(/password/)
  })
  it("rejects plaintext labeled as ciphertext", () => {
    expect(() =>
      assertUnique([
        {
          locale: "vi",
          id: "secret",
          href: "/vi/secret/",
          encrypted: true,
          body: "SYNTHETIC_PRIVATE_SENTINEL",
        },
      ]),
    ).toThrow(/Unencrypted/)
  })
  it("rejects duplicate identities and routes across sources", () => {
    const one = { locale: "vi", id: "a", href: "/vi/notes/intro/", body: "public" }
    expect(() => assertUnique([one, { ...one, id: "b" }])).toThrow(/Duplicate/)
    expect(() => assertUnique([one, { ...one, href: "/vi/notes/other/" }])).toThrow(/Duplicate/)
  })
  it("rejects invalid frontmatter rather than assuming public visibility", () => {
    expect(() =>
      frontmatter("---\ntitle: [broken\nlocked: true\n---\nSYNTHETIC_PRIVATE_SENTINEL", "fixture"),
    ).toThrow()
    expect(() => frontmatter("No metadata", "fixture")).toThrow()
  })
  it("normalizes legacy dates and rejects impossible calendar dates", () => {
    expect(normalizeDate("2025-7-1", "fixture")).toBe("2025-07-01")
    expect(() => normalizeDate("2025-02-30", "fixture")).toThrow()
  })
})
describe("one heading model", () => {
  it("keeps Vietnamese anchors unique and ignores headings inside fenced code", () => {
    const headings = headingsFor("## Kết nối\n\n```sh\n## Not a heading\n```\n\n## Kết nối\n")
    expect(headings.map((item) => item.id)).toEqual(["kết-nối", "kết-nối-1"])
    expect(headings).toHaveLength(2)
  })
})
