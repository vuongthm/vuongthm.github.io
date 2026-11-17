"use client"
import { useLayoutEffect, useRef, type RefObject } from "react"
import {
  connectionCurve,
  stepNetwork,
  type NetworkParticle,
  type NetworkPoint,
} from "@/lib/friends/network"

export function useFriendMotion(
  canvas: RefObject<HTMLDivElement | null>,
  ids: string[],
  targets: NetworkPoint[],
  width: number,
  height: number,
) {
  const positions = useRef(new Map<string, NetworkParticle>())
  const bounds = useRef<{ width: number; height: number } | null>(null)
  const suppressClick = useRef(false)
  useLayoutEffect(() => {
    const root = canvas.current
    if (!root || Math.abs(root.clientWidth - width) > 2) return
    const reduced = matchMedia("(prefers-reduced-motion: reduce)")
    const points = ids.map((id, i) => positions.current.get(id) ?? { ...targets[i], vx: 0, vy: 0 })
    if (bounds.current && bounds.current.width !== width) {
      const previous = bounds.current
      points.forEach((point, i) => {
        if (!positions.current.has(ids[i])) return
        point.x = Math.max(30, Math.min(width - 30, (point.x * width) / previous.width))
        point.y = Math.max(35, Math.min(height - 50, (point.y * height) / previous.height))
      })
    }
    bounds.current = { width, height }
    positions.current = new Map(ids.map((id, i) => [id, points[i]]))
    const nodes = [...root.querySelectorAll<HTMLElement>("[data-friend-id]")]
    const edges = [...root.querySelectorAll<SVGPathElement>("path[data-from]")]
    let frame = 0,
      previous = 0,
      held = -1,
      pointerId = -1
    let down = { x: 0, y: 0 },
      moved = false
    let returnTimer: ReturnType<typeof setTimeout> | undefined
    let captured: HTMLElement | null = null
    const paint = () => {
      nodes.forEach((node, i) => {
        node.style.left = `${points[i].x}px`
        node.style.top = `${points[i].y}px`
      })
      edges.forEach((edge) => {
        const from = positions.current.get(edge.dataset.from!),
          to = positions.current.get(edge.dataset.to!)
        if (from && to) edge.setAttribute("d", connectionCurve(from, to, width, height))
      })
    }
    const animate = (now: number) => {
      const delta = previous ? Math.min(2, (now - previous) / 16.67) : 1
      previous = now
      const energy = stepNetwork(points, targets, width, height, held, delta)
      paint()
      if (energy > 0.06 || held >= 0) frame = requestAnimationFrame(animate)
      else {
        frame = 0
        previous = 0
      }
    }
    const start = () => {
      if (!frame) {
        previous = 0
        frame = requestAnimationFrame(animate)
      }
    }
    const snap = () => {
      points.forEach((point, i) => Object.assign(point, targets[i], { vx: 0, vy: 0 }))
      paint()
    }
    paint()
    if (reduced.matches) snap()
    else start()
    const pointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      const node = (event.target as Element).closest<HTMLElement>("[data-friend-id]")
      if (!node) return
      clearTimeout(returnTimer)
      suppressClick.current = false
      held = ids.indexOf(node.dataset.friendId!)
      pointerId = event.pointerId
      down = { x: event.clientX, y: event.clientY }
      moved = false
      captured = node
      node.setPointerCapture(event.pointerId)
      start()
    }
    const pointerMove = (event: PointerEvent) => {
      if (held < 0 || event.pointerId !== pointerId) return
      const dx = event.clientX - down.x,
        dy = event.clientY - down.y
      if (!moved && Math.hypot(dx, dy) < 7) return
      moved = true
      root.dataset.dragging = "true"
      const rect = root.getBoundingClientRect()
      Object.assign(points[held], {
        x: Math.max(30, Math.min(width - 30, event.clientX - rect.left)),
        y: Math.max(35, Math.min(height - 50, event.clientY - rect.top)),
        vx: 0,
        vy: 0,
      })
      paint()
    }
    const release = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return
      suppressClick.current = moved
      if (captured?.hasPointerCapture(event.pointerId))
        captured.releasePointerCapture(event.pointerId)
      if (moved && !reduced.matches) {
        returnTimer = setTimeout(() => {
          held = -1
          start()
        }, 1200)
      } else held = -1
      pointerId = -1
      captured = null
      delete root.dataset.dragging
      if (reduced.matches) snap()
      else start()
    }
    const click = (event: MouseEvent) => {
      if (!suppressClick.current) return
      suppressClick.current = false
      event.preventDefault()
      event.stopPropagation()
    }
    const preference = () => {
      if (reduced.matches) {
        cancelAnimationFrame(frame)
        frame = 0
        snap()
      } else start()
    }
    root.addEventListener("pointerdown", pointerDown)
    root.addEventListener("pointermove", pointerMove)
    root.addEventListener("pointerup", release)
    root.addEventListener("pointercancel", release)
    root.addEventListener("click", click, true)
    reduced.addEventListener("change", preference)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(returnTimer)
      if (captured?.hasPointerCapture(pointerId)) captured.releasePointerCapture(pointerId)
      delete root.dataset.dragging
      root.removeEventListener("pointerdown", pointerDown)
      root.removeEventListener("pointermove", pointerMove)
      root.removeEventListener("pointerup", release)
      root.removeEventListener("pointercancel", release)
      root.removeEventListener("click", click, true)
      reduced.removeEventListener("change", preference)
    }
  }, [canvas, ids, targets, width, height])
}
