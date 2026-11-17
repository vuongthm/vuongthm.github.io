import type { Friend } from "./directory"
import { searchText } from "@/lib/collections/search"

/** Shared published topics, never an inferred personal relationship. */
export function friendConnections(friends: Pick<Friend, "id" | "topics">[]) {
  return friends.flatMap((friend, index) =>
    friends.slice(index + 1).flatMap((other) => {
      const topics = [...new Set(friend.topics)].filter((topic) =>
        other.topics.some((value) => searchText(value) === searchText(topic)),
      )
      return topics.length ? [{ from: friend.id, to: other.id, topics }] : []
    }),
  )
}
export function friendPositions(
  count: number,
  width: number,
  selected = -1,
  related: number[] = [],
) {
  const height =
    count > 14
      ? Math.ceil(count / Math.max(3, Math.floor(width / 130))) * 118 + (selected >= 0 ? 266 : 30)
      : selected >= 0 && width < 500
        ? Math.max(430, Math.ceil(count / 6) * 230)
        : count < 5
          ? 320
          : 430
  if (selected >= 0 && selected < count) {
    const center = { x: width / 2, y: height * 0.46 }
    const order = Array.from({ length: count }, (_, i) => i)
      .filter((i) => i !== selected)
      .sort((a, b) => Number(related.includes(b)) - Number(related.includes(a)) || a - b)
    const points = Array.from({ length: count }, () => ({ ...center }))
    if (count <= 14) {
      order.forEach((index, i) => {
        const angle = -Math.PI / 2 + (i / order.length) * Math.PI * 2
        points[index] = {
          x: center.x + Math.cos(angle) * width * 0.38,
          y: center.y + Math.sin(angle) * height * 0.34,
        }
      })
    } else {
      const columns = Math.max(3, Math.floor(width / 130))
      const candidates = Array.from(
        { length: (Math.ceil(count / columns) + 3) * columns },
        (_, i) => ({
          x: (((i % columns) + 0.5) / columns) * width,
          y: Math.floor(i / columns) * 118 + 55,
        }),
      ).filter(
        (point) => point.y < height - 35 && Math.hypot(point.x - center.x, point.y - center.y) > 90,
      )
      order.forEach((index, i) => {
        points[index] = candidates[i] ?? { x: width / 2, y: height - 45 }
      })
    }
    return { height, points }
  }
  if (count > 14) {
    const columns = Math.max(3, Math.floor(width / 130))
    return {
      height,
      points: Array.from({ length: count }, (_, i) => ({
        x: (((i % columns) + 0.5) / columns) * width,
        y: Math.floor(i / columns) * 118 + 55,
      })),
    }
  }
  return {
    height,
    points: Array.from({ length: count }, (_, i) => {
      const angle = -Math.PI / 2 + (i / count) * Math.PI * 2
      return {
        x: width / 2 + (count === 1 ? 0 : Math.cos(angle) * width * 0.39),
        y: height * 0.46 + (count === 1 ? 0 : Math.sin(angle) * height * 0.32),
      }
    }),
  }
}

export type NetworkPoint = { x: number; y: number }
export type NetworkParticle = NetworkPoint & { vx: number; vy: number }

/** Plan safe waypoints, then ease towards them without accumulating collision forces. */
export function stepNetwork(
  points: NetworkParticle[],
  targets: NetworkPoint[],
  width: number,
  height: number,
  held = -1,
  delta = 1,
) {
  const spacing = width < 500 ? 78 : 100
  const influence = spacing * 1.8
  const goals = targets.map((target) => ({ ...target }))
  if (held >= 0) {
    const obstacle = points[held]
    goals[held] = { x: obstacle.x, y: obstacle.y }
    goals.forEach((goal, i) => {
      if (i === held) return
      const distance = Math.hypot(goal.x - obstacle.x, goal.y - obstacle.y)
      const proximity = Math.max(0, Math.min(1, (influence - distance) / influence))
      const weight = proximity * proximity * (3 - 2 * proximity)
      if (!weight) return
      // Use the current side of the obstacle to keep a continuous avoidance lane.
      let dx = points[i].x - obstacle.x,
        dy = points[i].y - obstacle.y
      if (Math.hypot(dx, dy) < 1) {
        dx = Math.cos(i * 2.4)
        dy = Math.sin(i * 2.4)
      }
      const length = Math.max(1, Math.hypot(dx, dy)),
        side = i % 2 ? 1 : -1
      const homeX = targets[i].x - targets[held].x,
        homeY = targets[i].y - targets[held].y,
        homeLength = Math.max(1, Math.hypot(homeX, homeY))
      const radial = spacing * weight
      // A fixed sideways preference lets a stationary obstacle settle instead of orbiting it.
      goal.x += (dx / length) * radial - (homeY / homeLength) * radial * 0.45 * side
      goal.y += (dy / length) * radial + (homeX / homeLength) * radial * 0.45 * side
    })
  }
  // Resolve future positions rather than kicking the visible avatars apart.
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < goals.length; i++)
      for (let j = i + 1; j < goals.length; j++) {
        const a = goals[i],
          b = goals[j]
        let dx = b.x - a.x,
          dy = b.y - a.y
        let length = Math.hypot(dx, dy)
        if (length >= spacing) continue
        if (length < 0.1) {
          dx = Math.cos((j - i) * 2.4)
          dy = Math.sin((j - i) * 2.4)
          length = 1
        }
        const offset = (spacing - length) / length
        const share = i === held || j === held ? 1 : 0.5
        if (i !== held) {
          a.x -= dx * offset * share
          a.y -= dy * offset * share
        }
        if (j !== held) {
          b.x += dx * offset * share
          b.y += dy * offset * share
        }
      }
  }
  const blend = 1 - Math.exp(-(held >= 0 ? 0.075 : 0.1) * delta)
  let movement = 0
  points.forEach((point, i) => {
    if (i === held) return
    const goal = goals[i]
    const dx = Math.max(30, Math.min(width - 30, goal.x)) - point.x
    const dy = Math.max(35, Math.min(height - 50, goal.y)) - point.y
    const distance = Math.hypot(dx, dy)
    const scale = distance ? Math.min(blend, ((held >= 0 ? 4.2 : 6.5) * delta) / distance) : 0
    point.vx = dx * scale
    point.vy = dy * scale
    point.x += point.vx
    point.y += point.vy
    movement += Math.abs(point.vx) + Math.abs(point.vy)
  })
  return movement
}
export function connectionCurve(
  from: { x: number; y: number },
  to: { x: number; y: number },
  width: number,
  height: number,
) {
  const x = (from.x + to.x) / 2,
    y = (from.y + to.y) / 2
  return `M ${from.x} ${from.y} Q ${x + (width / 2 - x) * 0.2} ${y + (height / 2 - y) * 0.2}, ${to.x} ${to.y}`
}
