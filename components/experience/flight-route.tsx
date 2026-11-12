"use client"

import { useEffect, useRef } from "react"

/** Animate native SVG geometry without re-rendering the map on every frame. */
export function FlightRoute({ path, replay }: { path: string; replay: number }) {
  const route = useRef<SVGPathElement>(null),
    plane = useRef<SVGGElement>(null)
  useEffect(() => {
    const line = route.current,
      icon = plane.current
    if (!line || !icon) return
    const length = line.getTotalLength()
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
    line.style.strokeDasharray = String(length)
    line.style.strokeDashoffset = String(reduced ? 0 : length)
    let frame = 0
    const started = performance.now()
    const draw = (now: number) => {
      const progress = reduced ? 1 : Math.min(1, (now - started) / 3400)
      const distance = progress * length
      const point = line.getPointAtLength(distance)
      const before = line.getPointAtLength(Math.max(0, distance - 0.3))
      const after = line.getPointAtLength(Math.min(length, distance + 0.3))
      const angle = (Math.atan2(after.y - before.y, after.x - before.x) * 180) / Math.PI
      line.style.strokeDashoffset = String(length * (1 - progress))
      icon.setAttribute("transform", `translate(${point.x} ${point.y}) rotate(${angle})`)
      icon.style.opacity = "1"
      if (progress < 1) frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [path, replay])
  return (
    <g className="flight-route-group">
      <path className="flight-guide" d={path} />
      <path ref={route} className="flight-trail" d={path} />
      <g ref={plane} className="flight-plane" style={{ opacity: 0 }}>
        <path d="m9 0-7-2-4-7h-2l2 7-6-1-2 2 7 2-1 4h2l4-4z" />
      </g>
    </g>
  )
}
