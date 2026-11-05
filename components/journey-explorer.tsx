"use client"
import { useRef, useState, type CSSProperties, type KeyboardEvent } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Gallery } from "@/components/gallery"
import { useSite } from "@/components/providers/site-provider"
import { copy } from "@/lib/i18n/copy"
import { journeyLayout } from "@/lib/content/journey-layout"
import type { JourneyPreview } from "@/lib/content/types"

export function JourneyExplorer({ items }: { items: JourneyPreview[] }) {
  const { locale, dictionary: m } = useSite()
  const [selected, setSelected] = useState(0)
  const nodes = useRef<(HTMLAnchorElement | null)[]>([])
  const scroll = useRef<HTMLDivElement>(null)
  const index = Math.min(selected, items.length - 1)
  const active = items[index]
  const layout = journeyLayout(items.length)
  if (!active) return null

  function select(next: number, focus = false) {
    setSelected(next)
    if (focus) nodes.current[next]?.focus({ preventScroll: true })
    const viewport = scroll.current
    const node = nodes.current[next]
    if (viewport && node) {
      const frame = viewport.getBoundingClientRect()
      const target = node.getBoundingClientRect()
      viewport.scrollBy({
        left: target.left + target.width / 2 - frame.left - frame.width / 2,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      })
    }
  }
  function move(event: KeyboardEvent<HTMLAnchorElement>, current: number) {
    let next = current
    if (event.key === "ArrowRight") next = Math.min(items.length - 1, current + 1)
    else if (event.key === "ArrowLeft") next = Math.max(0, current - 1)
    else if (event.key === "Home") next = 0
    else if (event.key === "End") next = items.length - 1
    else return
    event.preventDefault()
    select(next, true)
  }
  return (
    <section className="journey-explorer" aria-labelledby="journey-title">
      <header className="journey-heading">
        <div>
          <span className="journey-kicker">
            vuongthm. / {copy(locale, "Dấu mốc", "Milestones")}
          </span>
          <h1 id="journey-title">{copy(locale, "Hành trình của Vuong.", "Vuong’s journey.")}</h1>
          <p>
            {copy(
              locale,
              "Những nơi đã đến, điều đã học và những thứ đang làm.",
              "Places, lessons, and things I’m building.",
            )}
          </p>
        </div>
      </header>
      <div className="journey-map">
        <div className="journey-scroll" ref={scroll}>
          <nav
            className="journey-plot"
            style={{ "--journey-count": items.length } as CSSProperties}
            aria-label={copy(locale, "Dấu mốc", "Milestones")}
          >
            <svg
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {layout.segments.map((path, segment) => (
                <path
                  key={items[segment + 1].id}
                  className={`journey-route ${segment < index ? "is-travelled" : ""} ${items[segment + 1].status === "planned" ? "journey-route-future" : ""}`}
                  d={path}
                />
              ))}
            </svg>
            {items.map((item, current) => (
              <Link
                key={item.id}
                id={`journey-node-${item.id}`}
                href={item.href}
                ref={(node) => {
                  nodes.current[current] = node
                }}
                className={`journey-node ${item.status} ${index === current ? "selected" : ""}`}
                style={{
                  left: `${(layout.points[current].x / layout.width) * 100}%`,
                  top: `${(layout.points[current].y / layout.height) * 100}%`,
                }}
                aria-current={index === current ? "step" : undefined}
                aria-controls="journey-detail"
                onMouseEnter={() => setSelected(current)}
                onFocus={() => setSelected(current)}
                onKeyDown={(event) => move(event, current)}
              >
                <span className="journey-node-dot">
                  <span />
                </span>
                <span className="journey-node-label">{item.label[locale]}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="journey-map-foot">
          <span>
            {copy(locale, "Mỗi chặng đường, một câu chuyện.", "Every chapter leaves a story.")}
          </span>
          <div className="journey-map-controls">
            <button
              onClick={() => select(index - 1)}
              disabled={index === 0}
              aria-label={m.previous}
            >
              <ArrowLeft size={15} />
            </button>
            <button
              onClick={() => select(index + 1)}
              disabled={index === items.length - 1}
              aria-label={m.next}
            >
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
      <div
        id="journey-detail"
        role="region"
        aria-labelledby={`journey-node-${active.id}`}
        className={`journey-detail ${active.photos.length ? "has-photos" : ""}`}
      >
        <div className="journey-detail-copy" key={active.id}>
          <div className="journey-detail-meta">
            <span>{active.label[locale]}</span>
            {active.sample && (
              <span className="journey-status">
                {copy(locale, "Nội dung mẫu", "Sample content")}
              </span>
            )}
            {active.status !== "completed" && (
              <span className={`journey-status ${active.status}`}>
                {active.status === "planned"
                  ? copy(locale, "Dự định", "Planned")
                  : copy(locale, "Hiện tại", "Current")}
              </span>
            )}
          </div>
          <h2>
            <Link href={active.href}>{active.title[locale]}</Link>
          </h2>
          <p>{active.description[locale]}</p>
          <Link className="journey-read-link" href={active.href}>
            {copy(locale, "Khám phá dấu mốc", "Explore this milestone")}
            <ArrowRight size={15} />
          </Link>
        </div>
        {active.photos.length > 0 && (
          <div className="journey-detail-photos">
            <Gallery key={active.id} photos={active.photos} variant="journey" />
          </div>
        )}
      </div>
    </section>
  )
}
