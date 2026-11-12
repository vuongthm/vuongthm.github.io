import { afterEach, describe, expect, it, vi } from "vitest"
import { parseIpLocation } from "./ip-location"

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe("approximate IP location", () => {
  it("retains only validated location fields and drops the visitor IP", () => {
    expect(
      parseIpLocation({
        success: true,
        latitude: 35.68,
        longitude: 139.69,
        city: "Tokyo",
        country_code: "JP",
        ip: "203.0.113.1",
        connection: { isp: "private" },
      }),
    ).toEqual({ latitude: 35.68, longitude: 139.69, city: "Tokyo", countryCode: "JP" })
  })
  it("rejects service failures, malformed coordinates and out-of-range data", () => {
    for (const value of [
      null,
      {},
      { success: false },
      { success: true, latitude: "35", longitude: 140 },
      { success: true, latitude: NaN, longitude: 140 },
      { success: true, latitude: 91, longitude: 0 },
      { success: true, latitude: 0, longitude: -181 },
    ])
      expect(parseIpLocation(value)).toBeNull()
  })
  it("accepts zero coordinates and discards unexpected country data", () => {
    expect(
      parseIpLocation({ success: true, latitude: 0, longitude: 0, country_code: "invalid" }),
    ).toEqual({ latitude: 0, longitude: 0, city: "", countryCode: "" })
  })

  it("accepts the free endpoint schema while discarding unrelated personal fields", () => {
    expect(
      parseIpLocation({
        latitude: 10,
        longitude: 105,
        cityName: "City",
        countryCode: "VN",
        ipAddress: "203.0.113.1",
      }),
    ).toEqual({ latitude: 10, longitude: 105, city: "City", countryCode: "VN" })
  })

  it("keeps the province for Vietnamese visitors without retaining the IP", () => {
    expect(
      parseIpLocation({
        latitude: 21.02,
        longitude: 105.83,
        cityName: "Hanoi",
        regionName: "Hà Nội",
        countryCode: "VN",
        ipAddress: "203.0.113.2",
      }),
    ).toEqual({
      latitude: 21.02,
      longitude: 105.83,
      city: "Hanoi",
      region: "Hà Nội",
      countryCode: "VN",
    })
  })

  it("falls back on rate limits, shares pending requests, and reuses a successful lookup", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 429 }))
      .mockResolvedValueOnce(
        Response.json({
          success: true,
          latitude: 35,
          longitude: 139,
          city: "Tokyo",
          country_code: "JP",
        }),
      )
    vi.stubGlobal("fetch", fetcher)
    const { getIpLocation } = await import("./ip-location")
    const first = getIpLocation(),
      second = getIpLocation()
    expect(first).toBe(second)
    expect(await first).toMatchObject({ latitude: 35, city: "Tokyo", source: "ipwhois" })
    expect(await getIpLocation()).toMatchObject({ city: "Tokyo" })
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it("does not cache failures so a visitor can retry", async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValueOnce(
        Response.json({ latitude: 0, longitude: 0, cityName: "City", countryCode: "GB" }),
      )
    vi.stubGlobal("fetch", fetcher)
    const { getIpLocation } = await import("./ip-location")
    await expect(getIpLocation()).rejects.toThrow("unavailable")
    expect(await getIpLocation()).toMatchObject({ latitude: 0, city: "City", source: "freeipapi" })
    expect(fetcher).toHaveBeenCalledTimes(3)
  })
})
