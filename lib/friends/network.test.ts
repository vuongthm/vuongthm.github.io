import { describe, expect, it } from "vitest"
import { friendConnections, friendPositions, stepNetwork } from "./network"
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
  it("places any selected person in the center without overlapping other circles", () => {
    for (const width of [280, 350, 1100])
      for (const count of [1, 6, 14, 40]) {
        const { points, height } = friendPositions(count, width, count - 1, [0, 1])
        expect(points[count - 1]).toEqual({ x: width / 2, y: height * 0.46 })
        points.forEach((a, i) =>
          points
            .slice(i + 1)
            .forEach((b) => expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(48)),
        )
      }
  })
  it("steers around a dragged circle, stays inside the canvas and settles after release", () => {
    const { points: targets, height } = friendPositions(6, 350, 0)
    const points = targets.map((point) => ({ ...point, vx: 0, vy: 0 }))
    Object.assign(points[0], targets[1])
    for (let i = 0; i < 50; i++) stepNetwork(points, targets, 350, height, 0)
    expect(Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y)).toBeGreaterThan(48)
    for (let i = 0; i < 500; i++) stepNetwork(points, targets, 350, height)
    expect(Math.hypot(points[0].x - targets[0].x, points[0].y - targets[0].y)).toBeLessThan(1)
    points.forEach((point) => {
      expect(Number.isFinite(point.x + point.y)).toBe(true)
      expect(point.x).toBeGreaterThanOrEqual(30)
      expect(point.x).toBeLessThanOrEqual(320)
    })
  })
  it("starts moving sideways before circles touch", () => {
    const targets = [
      { x: 150, y: 100 },
      { x: 240, y: 100 },
    ]
    const points = targets.map((point) => ({ ...point, vx: 0, vy: 0 }))
    for (let i = 0; i < 10; i++) stepNetwork(points, targets, 350, 430, 0)
    expect(Math.abs(points[1].y - 100)).toBeGreaterThan(1)
    expect(points[0]).toMatchObject({ x: 150, y: 100 })
    expect(Math.hypot(points[1].x - 150, points[1].y - 100)).toBeGreaterThan(90)
  })
  it("returns without overshooting, bouncing or jumping between frames", () => {
    const targets = [{ x: 100, y: 100 }]
    const points = [{ x: 450, y: 400, vx: 0, vy: 0 }]
    let previous = Math.hypot(350, 300)
    for (let i = 0; i < 250; i++) {
      stepNetwork(points, targets, 600, 600)
      const distance = Math.hypot(points[0].x - 100, points[0].y - 100)
      expect(distance).toBeLessThanOrEqual(previous)
      expect(Math.hypot(points[0].vx, points[0].vy)).toBeLessThanOrEqual(6.51)
      expect(points[0].x).toBeGreaterThanOrEqual(100)
      expect(points[0].y).toBeGreaterThanOrEqual(100)
      previous = distance
    }
    expect(previous).toBeLessThan(0.01)
  })
  it("settles beside a stationary dragged avatar rather than orbiting it", () => {
    const targets = [
      { x: 100, y: 200 },
      { x: 250, y: 200 },
    ]
    const points = targets.map((point) => ({ ...point, vx: 0, vy: 0 }))
    points[0].x = 250
    for (let i = 0; i < 500; i++) stepNetwork(points, targets, 600, 430, 0)
    const previous = { ...points[1] }
    for (let i = 0; i < 30; i++) stepNetwork(points, targets, 600, 430, 0)
    expect(Math.hypot(points[1].x - previous.x, points[1].y - previous.y)).toBeLessThan(0.1)
    expect(Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y)).toBeGreaterThan(60)
  })
})
