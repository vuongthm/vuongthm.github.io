import { describe, expect, it } from "vitest"
import { friendConnections, friendPositions } from "./network"
describe("friend network", () => {
  it("connects shared topics once and does not infer relationships from similar names", () => {
    expect(
      friendConnections([
        { id: "a", topics: ["Security", "DFIR", "Security"] },
        { id: "b", topics: ["security", "DFIR"] },
        { id: "c", topics: ["Web Security"] },
        { id: "d", topics: ["Developer"] },
      ]),
    ).toEqual([{ from: "a", to: "b", topics: ["Security", "DFIR"] }])
  })
  it("keeps all circles separated and inside the canvas as the directory grows", () => {
    for (const width of [280, 350, 700, 1100])
      for (const count of [0, 1, 2, 11, 14, 40]) {
        const { points, height } = friendPositions(count, width)
        expect(points).toHaveLength(count)
        for (const point of points) {
          expect(point.x).toBeGreaterThan(23)
          expect(point.x).toBeLessThan(width - 23)
          expect(point.y).toBeGreaterThan(23)
          expect(point.y).toBeLessThan(height - 23)
        }
        points.forEach((a, i) =>
          points
            .slice(i + 1)
            .forEach((b) => expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(48)),
        )
      }
  })
})
