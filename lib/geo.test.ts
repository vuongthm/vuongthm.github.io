import { flightCoordinates } from "./geo"
import { describe, expect, it } from "vitest"
import { connectionPath, distanceKm, flightCurve, homeCoordinates, mapPoint } from "./geo"

describe("visitor connection map", () => {
  it("keeps the illustrated flight endpoints on their actual map positions", () => {
    const start = { latitude: 40.7128, longitude: -74.006 }
    const a = mapPoint(start),
      b = mapPoint(homeCoordinates)
    const curve = flightCurve(start, homeCoordinates)
    expect(curve).toMatch(new RegExp(`^M${a.x.toFixed(2)},${a.y.toFixed(2)} C`))
    expect(curve.endsWith(`${b.x.toFixed(2)},${b.y.toFixed(2)}`)).toBe(true)
    expect(flightCurve(homeCoordinates, homeCoordinates)).not.toMatch(/NaN|Infinity/)
    expect(
      flightCurve({ latitude: 0, longitude: 170 }, { latitude: 0, longitude: -170 }).match(/M/g),
    ).toHaveLength(2)
  })
  it("estimates known distances symmetrically and handles coincident or opposite points", () => {
    const london = { latitude: 51.5074, longitude: -0.1278 }
    const paris = { latitude: 48.8566, longitude: 2.3522 }
    expect(distanceKm(london, paris)).toBeCloseTo(343.56, 0)
    expect(distanceKm(paris, london)).toBe(distanceKm(london, paris))
    expect(distanceKm(homeCoordinates, homeCoordinates)).toBe(0)
    expect(distanceKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 180 })).toBeCloseTo(
      20015.11,
      0,
    )
  })

  it("places Đà Nẵng on Southeast Asia and keeps polar visitors inside the map", () => {
    expect(mapPoint(homeCoordinates).x).toBeCloseTo(480.34, 1)
    expect(mapPoint(homeCoordinates).y).toBeCloseTo(114.91, 1)
    for (const latitude of [-90, 0, 90]) {
      const point = mapPoint({ latitude, longitude: 0 })
      expect(point.y).toBeGreaterThan(0)
      expect(point.y).toBeLessThan(250)
    }
  })

  it("splits a connection crossing the date line and draws finite paths at edge cases", () => {
    const route = connectionPath(
      { latitude: 20, longitude: 170 },
      { latitude: 20, longitude: -170 },
    )
    expect(route.match(/M/g)).toHaveLength(2)
    for (const point of [
      homeCoordinates,
      { latitude: -16.0544, longitude: -71.7978 },
      { latitude: 90, longitude: 0 },
    ]) {
      const path = connectionPath(homeCoordinates, point)
      expect(path).toMatch(/^M/)
      expect(path).not.toMatch(/NaN|Infinity/)
      expect(path.match(/[ML]/g)).toHaveLength(65)
    }
  })
})

describe("geographic flight path", () => {
  it("starts at the reader and ends in Da Nang", () => {
    const route = flightCoordinates({ latitude: 21.0285, longitude: 105.8542 }, homeCoordinates)
    expect(route[0]).toEqual([105.8542, 21.0285])
    expect(route.at(-1)![0]).toBeCloseTo(homeCoordinates.longitude)
    expect(route.at(-1)![1]).toBeCloseTo(homeCoordinates.latitude)
  })
  it("takes the short route across the date line and keeps a visible local approach", () => {
    const route = flightCoordinates(
      { latitude: 10, longitude: 179 },
      { latitude: 20, longitude: -179 },
    )
    expect(
      Math.max(...route.map(([longitude]) => longitude)) -
        Math.min(...route.map(([longitude]) => longitude)),
    ).toBeLessThan(3)
    expect(flightCoordinates(homeCoordinates, homeCoordinates)[80][1]).toBeGreaterThan(
      homeCoordinates.latitude,
    )
  })
})
