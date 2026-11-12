import { describe, expect, it } from "vitest"
import { newestProjects } from "./project-order"
describe("project chronology", () => {
  it("orders new projects by publication date, falls back to year, and preserves ties without changing input", () => {
    const projects = [
      { slug: "old", year: "2024" },
      { slug: "april", year: "2026", publishedAt: "2026-04-20" },
      { slug: "latest", year: "2026", publishedAt: "2026-11-11" },
      { slug: "year-only", year: "2025" },
      { slug: "same-year", year: "2025" },
      { slug: "undated", year: "" },
    ]
    expect(newestProjects(projects).map((project) => project.slug)).toEqual([
      "latest",
      "april",
      "year-only",
      "same-year",
      "old",
      "undated",
    ])
    expect(projects[0].slug).toBe("old")
  })
})
