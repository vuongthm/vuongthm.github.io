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
export function friendPositions(count: number, width: number) {
  const height =
    count > 14
      ? Math.ceil(count / Math.max(3, Math.floor(width / 130))) * 118 + 30
      : count < 5
        ? 320
        : 430
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
