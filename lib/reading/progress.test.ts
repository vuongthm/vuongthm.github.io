import { describe, expect, it } from "vitest"
import { readingProgress } from "./progress"

describe("article body reading progress", () => {
  it("measures the body between the reading edge and its final visible line", () => {
    expect(readingProgress(450, 2000, 900, 100)).toBe(0)
    expect(readingProgress(100, 2000, 900, 100)).toBe(0)
    expect(readingProgress(-500, 2000, 900, 100)).toBe(0.5)
    expect(readingProgress(-1100, 2000, 900, 100)).toBe(1)
    expect(readingProgress(-1800, 2000, 900, 100)).toBe(1)
  })
  it("accounts for the mobile header and handles short or empty bodies", () => {
    expect(readingProgress(-430, 1600, 820, 80)).toBeCloseTo(510 / 860)
    expect(readingProgress(81, 600, 820, 80)).toBe(0)
    expect(readingProgress(80, 600, 820, 80)).toBe(1)
    expect(readingProgress(0, 0, 820, 80)).toBe(1)
  })
})
