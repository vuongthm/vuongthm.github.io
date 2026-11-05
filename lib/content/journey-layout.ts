/** An open route: each new milestone gets equal space instead of squeezing its neighbours. */
export function journeyLayout(count: number) {
  const width = Math.max(count, 1) * 160
  const height = 180
  const points = Array.from({ length: count }, (_, index) => ({
    x: index * 160 + 80,
    y: 94 - Math.sin(index * 0.95) * 9,
  }))
  const segments = points.slice(1).map((point, index) => {
    const previous = points[index]
    const middle = (previous.x + point.x) / 2
    return `M ${previous.x} ${previous.y} C ${middle} ${previous.y}, ${middle} ${point.y}, ${point.x} ${point.y}`
  })
  return { width, height, points, segments }
}
