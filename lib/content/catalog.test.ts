import { describe, expect, it } from "vitest"
import { catalogEntries } from "./catalog"
import type { Entry } from "./types"
const sample = (locale: Entry["locale"], slug: string): Entry =>
  ({
    locale,
    slug,
    translationKey: slug,
    href: `/${locale}/notes/${slug}/`,
    seriesSlug: undefined,
    title: slug,
    summary: "",
    body: "Original body",
  }) as Entry
describe("partial language catalog", () => {
  it("prefers the real Japanese article and retains English source URLs for untranslated content", () => {
    const entries = catalogEntries(
      [sample("en", "osi-model"), sample("ja", "osi-model"), sample("en", "mac-and-arp")],
      "ja",
    )
    expect(entries).toHaveLength(2)
    expect(entries.find((e) => e.slug === "osi-model")?.locale).toBe("ja")
    expect(entries.find((e) => e.slug === "mac-and-arp")?.href).toBe("/en/notes/mac-and-arp/")
    expect(entries.find((e) => e.slug === "mac-and-arp")?.locale).toBe("en")
  })
  it("uses original English articles when the Chinese interface has no translated Markdown", () => {
    const [article] = catalogEntries([sample("en", "osi-model"), sample("ja", "osi-model")], "zh")
    expect(article.title).toContain("OSI")
    expect(article.locale).toBe("en")
    expect(article.href).toBe("/en/notes/osi-model/")
  })
  it("keeps a new Vietnamese-only module visible in other interfaces without inventing translated URLs", () => {
    const item = sample("vi", "new-module-note")
    expect(catalogEntries([item], "en")[0].href).toBe("/vi/notes/new-module-note/")
    expect(catalogEntries([item], "ja")[0].locale).toBe("vi")
  })
  it("does not change the source English catalog", () => {
    expect(
      catalogEntries([sample("en", "osi-model"), sample("ja", "osi-model")], "en")[0].title,
    ).toBe("osi-model")
  })
})
