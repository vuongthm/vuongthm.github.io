import type { Coordinates } from "./geo"

export interface ApproximateLocation extends Coordinates {
  city: string
  region?: string
  countryCode: string
  source?: "freeipapi" | "ipwhois"
}
export const ipLocationEndpoint = "https://free.freeipapi.com/api/v1/json"
const providers = [
  { url: ipLocationEndpoint, source: "freeipapi" },
  {
    url: "https://ipwho.is/?fields=success,latitude,longitude,city,region,country_code,message",
    source: "ipwhois",
  },
] as const

/** Keep only city-level location. The service's IP and network fields are never retained. */
export function parseIpLocation(value: unknown): ApproximateLocation | null {
  if (!value || typeof value !== "object") return null
  const data = value as Record<string, unknown>
  if (
    data.success === false ||
    data.error === true ||
    typeof data.latitude !== "number" ||
    typeof data.longitude !== "number" ||
    !Number.isFinite(data.latitude) ||
    !Number.isFinite(data.longitude) ||
    Math.abs(data.latitude) > 90 ||
    Math.abs(data.longitude) > 180
  )
    return null
  const region = data.regionName ?? data.region
  const city = data.cityName ?? data.city,
    country = data.countryCode ?? data.country_code
  return {
    latitude: data.latitude,
    longitude: data.longitude,
    city: typeof city === "string" ? city.slice(0, 100) : "",
    ...(typeof region === "string" && region.trim() ? { region: region.slice(0, 100) } : {}),
    countryCode: typeof country === "string" && /^[A-Z]{2}$/.test(country) ? country : "",
  }
}

let cached: ApproximateLocation | undefined
let pending: Promise<ApproximateLocation> | undefined
export function getIpLocation(): Promise<ApproximateLocation> {
  if (cached) return Promise.resolve(cached)
  if (pending) return pending
  pending = (async () => {
    try {
      for (const provider of providers) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 4000)
        try {
          const response = await fetch(provider.url, {
            signal: controller.signal,
            credentials: "omit",
            referrerPolicy: "no-referrer",
          })
          if (!response.ok) continue
          const location = parseIpLocation(await response.json())
          if (!location) continue
          cached = { ...location, source: provider.source }
          return cached
        } catch {
          /* Try the alternate source on timeout or a network failure. */
        } finally {
          clearTimeout(timeout)
        }
      }
      throw new Error("Approximate location unavailable")
    } finally {
      pending = undefined
    }
  })()
  return pending
}
