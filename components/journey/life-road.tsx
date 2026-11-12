"use client"
import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, BookOpen, Compass, Flag, Network, Send } from "lucide-react"
import type { JourneyPreview } from "@/lib/content/types"
import type { Locale } from "@/lib/i18n/config"
import { localeName } from "@/lib/i18n/english-names.mjs"
import { personalSpaces } from "@/lib/i18n/personal-spaces"

function RoadLandmark({ id }: { id: string }) {
  if (["roots", "university", "internship"].includes(id))
    return (
      <svg viewBox="0 0 90 76" fill="none" aria-hidden="true" className="road-landmark">
        <path d="M7 67h76" className="landmark-ground" />
        {id === "roots" ? (
          <>
            <path d="m17 37 27-23 28 23" className="landmark-roof" />
            <path d="M23 34v32h43V34" className="landmark-building" />
            <path d="M39 66V48h12v18M29 42h8v9h-8M56 42h5v9h-5" className="landmark-details" />
            <path d="M17 17c4-4 8-4 12 0m-18 4c3-3 6-3 9 0" className="landmark-ground" />
          </>
        ) : id === "university" ? (
          <>
            <path d="M14 39h62v28H14zM32 26h26v41H32z" className="landmark-building" />
            <path d="m27 26 18-14 18 14M45 13V5h12l-5 5H45" className="landmark-roof" />
            <path d="M40 67V51h10v16M21 46v7m7-7v7m35-7v7m7-7v7" className="landmark-details" />
            <circle cx="45" cy="36" r="5" className="landmark-details" />
          </>
        ) : (
          <>
            <path d="M26 12h39v55H26zM14 42h12v25H14" className="landmark-building" />
            <path
              d="M34 22h6v7h-6zm16 0h6v7h-6zM34 38h6v7h-6zm16 0h6v7h-6zM40 67V54h12v13"
              className="landmark-details"
            />
            <path d="M72 45v22m-4-14 4 4 5-6" className="landmark-roof" />
          </>
        )}
      </svg>
    )
  const Icon =
    {
      "leaving-home": Send,
      learning: Network,
      "finding-direction": Compass,
      building: BookOpen,
      graduation: Flag,
    }[id] ?? Compass
  return <Icon size={30} strokeWidth={1.25} aria-hidden="true" />
}

/** A measured SVG route keeps every turn attached to its milestone at every screen size. */
export function LifeRoad({ items, locale }: { items: JourneyPreview[]; locale: Locale }) {
  const list = useRef<HTMLOListElement>(null)
  const path = useRef<SVGPathElement>(null)
  const base = useRef<SVGPathElement>(null)
  const traveller = useRef<SVGGElement>(null)
  const t = personalSpaces[locale]
  useEffect(() => {
    const root = list.current,
      route = path.current,
      track = base.current
    if (!root || !route || !track) return
    const reduced = matchMedia("(prefers-reduced-motion: reduce)")
    let frame = 0,
      length = 0,
      first = 0,
      last = 1
    const stations = [...root.querySelectorAll<HTMLElement>(".road-station")]
    const rows = [...root.querySelectorAll<HTMLElement>(".road-milestone")]
    function paint() {
      frame = 0
      if (!root || !route || !length) return
      const rect = root.getBoundingClientRect()
      const travelled = Math.max(
        0,
        Math.min(1, (innerHeight * 0.6 - rect.top - first) / Math.max(1, last - first)),
      )
      route.style.strokeDashoffset = String(1 - (reduced.matches ? 1 : travelled))
      if (traveller.current) {
        const point = route.getPointAtLength(length * travelled)
        traveller.current.setAttribute("transform", `translate(${point.x} ${point.y})`)
        traveller.current.style.visibility = reduced.matches ? "hidden" : "visible"
      }
      rows.forEach(
        (row) =>
          (row.dataset.reached = String(row.getBoundingClientRect().top < innerHeight * 0.7)),
      )
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(paint)
    }
    function measure() {
      if (!root || !route || !track || !stations.length) return
      const rect = root.getBoundingClientRect()
      const points = stations.map((station) => {
        const r = station.getBoundingClientRect()
        return { x: r.left + r.width / 2 - rect.left, y: r.top + r.height / 2 - rect.top }
      })
      first = points[0].y
      last = points.at(-1)!.y
      const bend = rect.width < 600 ? 18 : 100
      const d = points.reduce((route, point, index) => {
        if (!index) return `M ${point.x} ${point.y}`
        const prev = points[index - 1],
          middle = (prev.y + point.y) / 2,
          side = index % 2 ? 1 : -1
        return `${route} C ${prev.x + bend * side} ${middle}, ${point.x - bend * side} ${middle}, ${point.x} ${point.y}`
      }, "")
      track.setAttribute("d", d)
      route.setAttribute("d", d)
      length = route.getTotalLength()
      root.dataset.ready = "true"
      schedule()
    }
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    stations.forEach((station) => observer.observe(station))
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", measure)
    reduced.addEventListener("change", schedule)
    measure()
    return () => {
      observer.disconnect()
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", measure)
      reduced.removeEventListener("change", schedule)
      cancelAnimationFrame(frame)
    }
  }, [items])
  return (
    <ol className="life-road" ref={list}>
      <li className="road-canvas" aria-hidden="true">
        <svg className="road-svg" width="100%" height="100%">
          <path className="road-track" ref={base} fill="none" />
          <path className="road-ink" ref={path} pathLength="1" fill="none" />
          <g className="road-traveller" ref={traveller}>
            <ellipse cy="8" rx="10" ry="3" fill="var(--ink)" opacity=".1" />
            <path
              d="m-3 3-3 6m8-6 4 6M-5-7l-6 7m16-7 6 4"
              stroke="var(--ink)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M-6-10q6-5 12 0L5 4H-5Z"
              fill="var(--accent)"
              stroke="var(--paper)"
              strokeWidth="1.5"
            />
            <circle
              cy="-17"
              r="5"
              fill="var(--studio-warm)"
              stroke="var(--ink)"
              strokeWidth="1.4"
            />
            <path d="M-5-18q1-8 10-3" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
          </g>
        </svg>
      </li>
      {items.map((item, index) => (
        <li className={`road-milestone is-${item.status}`} key={item.id}>
          <div className="road-station" aria-hidden="true">
            <RoadLandmark id={item.id} />
          </div>
          <div className="road-chapter">
            <div className="road-chapter-meta">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <span>{item.year ?? item.period?.[locale]}</span>
              {item.status === "planned" && <span className="road-ahead">{t.ahead}</span>}
            </div>
            <span className="eyebrow">{item.label[locale]}</span>
            <h2>
              <Link href={item.href}>{item.title[locale]}</Link>
            </h2>
            <p>{item.description[locale]}</p>
            <Link className="text-link" href={item.href}>
              {t.visitStop}
              <ArrowUpRight size={14} />
            </Link>
          </div>
          {item.photos[0] ? (
            <Link href={item.href} className="road-postcard" aria-label={item.title[locale]}>
              <Image
                src={item.photos[0].src}
                alt={item.photos[0].title[locale]}
                fill
                sizes="(max-width:600px) 75vw, 28vw"
                unoptimized
              />
              <span>{localeName(item.photos[0].place || item.label[locale], locale)}</span>
            </Link>
          ) : (
            <div className="road-fieldmark" aria-hidden="true">
              <RoadLandmark id={item.id} />
              <span>{item.label[locale]}</span>
            </div>
          )}
        </li>
      ))}
    </ol>
  )
}
