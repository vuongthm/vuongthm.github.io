"use client"
import { localeName } from "@/lib/i18n/english-names.mjs"
import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { ArrowRight, MapPin, Plane, RotateCcw } from "lucide-react"
import { useSite } from "@/components/providers/site-provider"
import { editorial } from "@/lib/i18n/editorial"
import { locales } from "@/lib/i18n/config"
import { copy } from "@/lib/i18n/copy"
import { distanceKm, homeCoordinates, mapPoint, flightCurve } from "@/lib/geo"
import { studio } from "@/lib/i18n/studio"
import { getIpLocation, type ApproximateLocation } from "@/lib/ip-location"
import type { MapPhase } from "./real-map"
import { FlightRoute } from "./flight-route"
const RealMap = dynamic(() => import("./real-map").then((module) => module.RealMap), { ssr: false })

export function DistanceMap() {
  const { locale } = useSite(),
    t = editorial[locale],
    art = studio[locale]
  const [visitor, setVisitor] = useState<ApproximateLocation | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading")
  const [phase, setPhase] = useState<MapPhase>("loading")
  const [attempt, setAttempt] = useState(0),
    [visible, setVisible] = useState(false),
    [replay, setReplay] = useState(0)
  const canvas = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    if (canvas.current) observer.observe(canvas.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (!visible) return
    let current = true
    getIpLocation()
      .then((location) => {
        if (current) {
          setVisitor(location)
          setStatus("ready")
        }
      })
      .catch(() => {
        if (current) setStatus("unavailable")
      })
    return () => {
      current = false
    }
  }, [attempt, visible])
  const city = visitor
    ? localeName([...new Set([visitor.city, visitor.region].filter(Boolean))].join(", "), locale) ||
      (visitor.countryCode
        ? new Intl.DisplayNames([locales[locale].intl], { type: "region" }).of(visitor.countryCode)
        : t.mapYou) ||
      t.mapYou
    : t.mapYou
  const phases: Record<MapPhase, string> = {
    loading: copy(locale, "Đang mở bản đồ…", "Opening the map…"),
    origin: copy(locale, "Bắt đầu từ nơi bạn đang ở", "Starting from where you are"),
    zooming: copy(locale, "Thu nhỏ để thấy khoảng cách", "Zooming out to see the distance"),
    flying: copy(locale, "Đang trên đường đến Đà Nẵng", "On the way to Đà Nẵng"),
    arrived: copy(locale, "Chào bạn, từ Đà Nẵng!", "Hello from Đà Nẵng!"),
    unavailable: copy(
      locale,
      "Bản đồ tương tác chưa tải được · sơ đồ đường bay",
      "Interactive map unavailable · flight diagram",
    ),
  }
  const home = mapPoint(homeCoordinates),
    point = visitor ? mapPoint(visitor) : null
  return (
    <section className="about-connection wrap" id="connection" aria-labelledby="connection-title">
      <div className="connection-heading">
        <div>
          <span className="eyebrow">{t.connection}</span>
          <h2 id="connection-title">{art.flight}</h2>
          <p>{t.mapDescription}</p>
        </div>
        <div className="connection-distance" aria-live="polite" aria-atomic="true">
          {visitor ? (
            <>
              <strong>
                ≈{" "}
                {new Intl.NumberFormat(locales[locale].intl).format(
                  Math.round(distanceKm(homeCoordinates, visitor)),
                )}{" "}
                <small>km</small>
              </strong>
              <span>{t.mapDistance}</span>
            </>
          ) : (
            <span>{status === "loading" ? t.mapLoading : t.mapUnavailable}</span>
          )}
        </div>
      </div>
      <div
        ref={canvas}
        className="connection-map real-map-shell"
        role="region"
        aria-label={copy(locale, "Bản đồ kết nối đến Đà Nẵng", "Map connecting to Đà Nẵng")}
      >
        {visible && visitor && phase !== "unavailable" && (
          <RealMap
            destinationLabel={t.mapFrom}
            visitor={visitor}
            label={city}
            replay={replay}
            onPhase={setPhase}
          />
        )}
        {visitor && phase === "unavailable" && (
          <div className="flight-fallback" role="img" aria-label={`${city} → ${t.mapFrom}`}>
            <div className="connection-land" />
            <svg viewBox="0 0 600 250" aria-hidden="true">
              <FlightRoute path={flightCurve(visitor, homeCoordinates)} replay={replay} />
              <circle className="map-home" cx={home.x} cy={home.y} r="3.2" />
              <text className="map-label" x={home.x - 8} y={home.y + 17} textAnchor="end">
                {t.mapFrom}
              </text>
              {point && <circle className="map-home" cx={point.x} cy={point.y} r="3.2" />}
            </svg>
          </div>
        )}
        {!visitor && (
          <div className="map-waiting">
            <MapPin size={24} strokeWidth={1.2} />
            <span>{status === "unavailable" ? t.mapUnavailable : t.mapLoading}</span>
          </div>
        )}
        {visitor && (
          <div className="map-flight-status" role="status">
            <span className={`flight-status-dot phase-${phase}`} />
            {phases[phase]}
          </div>
        )}
      </div>
      <div className="flight-map-bottom">
        <div className="connection-caption">
          <span>
            {visitor && (
              <>
                {city}
                <ArrowRight size={13} />
              </>
            )}
            {t.mapFrom}
          </span>
          <p>
            {copy(
              locale,
              "Vị trí gần đúng theo IP, có thể khác nơi bạn đang ở khi dùng VPN hoặc mạng di động.",
              "Approximate IP location; VPNs and mobile networks may show a different place.",
            )}{" "}
            <a
              href={
                visitor?.source === "ipwhois" ? "https://ipwhois.io/" : "https://freeipapi.com/"
              }
              target="_blank"
              rel="noreferrer"
            >
              {t.mapSource}
            </a>
          </p>
        </div>
        {visitor && (
          <button
            className="flight-replay"
            onClick={() => {
              setPhase("loading")
              setReplay((value) => value + 1)
            }}
          >
            <Plane size={14} />
            {art.replay}
            <RotateCcw size={12} />
          </button>
        )}
        {status === "unavailable" && (
          <button
            className="connection-retry"
            onClick={() => {
              setStatus("loading")
              setAttempt((value) => value + 1)
            }}
          >
            <RotateCcw size={13} />
            {t.mapRetry}
          </button>
        )}
      </div>
    </section>
  )
}
