import { describe, expect, it } from "vitest"
import { journeyLayout } from "./journey-layout"

describe("growing milestone route", () => {
  it("keeps an empty or single-milestone route finite", () => {
    expect(journeyLayout(0).points).toEqual([])
    expect(journeyLayout(0).width).toBeGreaterThan(0)
    expect(journeyLayout(1).segments).toEqual([])
    expect(journeyLayout(1).points[0].x).toBe(journeyLayout(1).width / 2)
  })
  it("preserves spacing and keeps every point within the drawing as milestones are added", () => {
    for (const count of [2, 5, 12, 30, 100]) {
      const route = journeyLayout(count)
      expect(route.points).toHaveLength(count)
      expect(route.segments).toHaveLength(count - 1)
      const gaps = route.points.slice(1).map((point, i) => point.x - route.points[i].x)
      expect(new Set(gaps).size).toBe(1)
      for (const point of route.points) {
        expect(point.x).toBeGreaterThan(0)
        expect(point.x).toBeLessThan(route.width)
        expect(point.y).toBeGreaterThan(0)
        expect(point.y).toBeLessThan(route.height)
      }
      expect(route.segments.every((segment) => !/NaN|Infinity/.test(segment))).toBe(true)
    }
  })
})
