export interface Coordinates {
  latitude: number
  longitude: number
}
export const homeCoordinates: Coordinates = { latitude: 16.0544, longitude: 108.2022 }
const radians = (degrees: number) => (degrees * Math.PI) / 180

/** Great-circle distance on the mean-radius Earth, in kilometres. */
export function distanceKm(a: Coordinates, b: Coordinates) {
  const lat = radians(b.latitude - a.latitude)
  const lon = radians(b.longitude - a.longitude)
  const h =
    Math.sin(lat / 2) ** 2 +
    Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(lon / 2) ** 2
  return 6371.0088 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))))
}

/** Equirectangular projection shared by the fallback map and flight diagram. */
export function mapPoint({ latitude, longitude }: Coordinates) {
  return {
    x: ((longitude + 180) / 360) * 600,
    y: Math.max(8, Math.min(242, ((85 - latitude) / 150) * 250)),
  }
}

/** A stylized connection arc; endpoints remain geographic and date-line routes stay split. */
export function flightCurve(a: Coordinates, b: Coordinates) {
  const start = mapPoint(a),
    end = mapPoint(b)
  if (Math.abs(start.x - end.x) > 500) return connectionPath(a, b)
  const distance = Math.hypot(end.x - start.x, end.y - start.y)
  const lift = Math.min(62, Math.max(22, distance * 0.22))
  const bend = distance < 12 ? 22 : 0
  return `M${start.x.toFixed(2)},${start.y.toFixed(2)} C${(start.x + (end.x - start.x) * 0.28 - bend).toFixed(2)},${Math.max(9, start.y - lift).toFixed(2)} ${(end.x - (end.x - start.x) * 0.28 + bend).toFixed(2)},${Math.max(9, end.y - lift).toFixed(2)} ${end.x.toFixed(2)},${end.y.toFixed(2)}`
}

/** Interpolate a geodesic and split it at the map edge rather than crossing the world. */
export function connectionPath(a: Coordinates, b: Coordinates) {
  const vector = (point: Coordinates) => {
    const lat = radians(point.latitude),
      lon = radians(point.longitude)
    return [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)]
  }
  const start = vector(a),
    end = vector(b)
  const angle = Math.acos(
    Math.max(
      -1,
      Math.min(
        1,
        start.reduce((sum, value, index) => sum + value * end[index], 0),
      ),
    ),
  )
  const sine = Math.sin(angle)
  let path = "",
    previousX = 0
  for (let step = 0; step <= 64; step++) {
    const t = step / 64
    const weights =
      Math.abs(sine) < 0.000001
        ? [1 - t, t]
        : [Math.sin((1 - t) * angle) / sine, Math.sin(t * angle) / sine]
    const point = start.map((value, index) => value * weights[0] + end[index] * weights[1])
    const projected = mapPoint({
      latitude: (Math.atan2(point[2], Math.hypot(point[0], point[1])) * 180) / Math.PI,
      longitude: (Math.atan2(point[1], point[0]) * 180) / Math.PI,
    })
    const move = step === 0 || Math.abs(projected.x - previousX) > 300
    path += `${move ? "M" : "L"}${projected.x.toFixed(2)},${projected.y.toFixed(2)} `
    previousX = projected.x
  }
  return path.trim()
}

/** Sample a great-circle route, unwrapping longitude for a short dateline crossing. */
export function flightCoordinates(from: Coordinates, to: Coordinates): [number, number][] {
  const rad = Math.PI / 180
  const vector = (p: Coordinates) => [
    Math.cos(p.latitude * rad) * Math.cos(p.longitude * rad),
    Math.cos(p.latitude * rad) * Math.sin(p.longitude * rad),
    Math.sin(p.latitude * rad),
  ]
  const a = vector(from),
    b = vector(to)
  const omega = Math.acos(
    Math.max(
      -1,
      Math.min(
        1,
        a.reduce((sum, n, i) => sum + n * b[i], 0),
      ),
    ),
  )
  const route: [number, number][] = []
  let previous = from.longitude
  for (let i = 0; i <= 160; i++) {
    const t = i / 160
    let longitude: number, latitude: number
    if (Math.abs(Math.sin(omega)) < 0.00001) {
      let delta = to.longitude - from.longitude
      if (delta > 180) delta -= 360
      if (delta < -180) delta += 360
      longitude = from.longitude + delta * t
      latitude = from.latitude + (to.latitude - from.latitude) * t
      // A small, visible approach for readers in the same city.
      if (omega < 0.0001) latitude += Math.sin(t * Math.PI) * 0.025
    } else {
      const v = a.map(
        (n, index) =>
          (n * Math.sin((1 - t) * omega)) / Math.sin(omega) +
          (b[index] * Math.sin(t * omega)) / Math.sin(omega),
      )
      longitude = Math.atan2(v[1], v[0]) / rad
      latitude = Math.atan2(v[2], Math.hypot(v[0], v[1])) / rad
    }
    while (longitude - previous > 180) longitude -= 360
    while (longitude - previous < -180) longitude += 360
    route.push([longitude, Math.max(-85, Math.min(85, latitude))])
    previous = longitude
  }
  route[0] = [from.longitude, Math.max(-85, Math.min(85, from.latitude))]
  return route
}
