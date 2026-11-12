"use client"
import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import type { GeoJSONSource } from "maplibre-gl"
import { distanceKm, flightCoordinates, homeCoordinates } from "@/lib/geo"
import type { ApproximateLocation } from "@/lib/ip-location"

export type MapPhase = "loading" | "origin" | "zooming" | "flying" | "arrived" | "unavailable"
export function RealMap({
  visitor,
  destinationLabel,
  label,
  replay,
  onPhase,
}: {
  visitor: ApproximateLocation
  destinationLabel: string
  label: string
  replay: number
  onPhase: (phase: MapPhase) => void
}) {
  const container = useRef<HTMLDivElement>(null),
    { resolvedTheme } = useTheme()
  useEffect(() => {
    if (!container.current) return
    let disposed = false,
      frame = 0,
      map: import("maplibre-gl").Map | undefined
    const timers: ReturnType<typeof setTimeout>[] = []
    const later = (fn: () => void, delay: number) => {
      timers.push(
        setTimeout(() => {
          if (!disposed) fn()
        }, delay),
      )
    }
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
    const route = flightCoordinates(visitor, homeCoordinates)
    const nearby = distanceKm(visitor, homeCoordinates) < 80
    const line = (coordinates: [number, number][]) => ({
      type: "Feature" as const,
      properties: {},
      geometry: { type: "LineString" as const, coordinates },
    })
    const dark = resolvedTheme === "dark"
    let automatic = true
    void import("maplibre-gl")
      .then((lib) => {
        if (disposed || !container.current) return
        lib.setWorkerCount(2)
        try {
          map = new lib.Map({
            container: container.current,
            style: `https://tiles.openfreemap.org/styles/${dark ? "dark" : "positron"}`,
            center: [visitor.longitude, visitor.latitude],
            zoom: reduced ? 3 : nearby ? 13.5 : 9,
            maxZoom: 16,
            minZoom: 1,
            renderWorldCopies: true,
            attributionControl: { compact: true },
            cooperativeGestures: true,
            dragRotate: false,
            pitchWithRotate: false,
          })
        } catch {
          onPhase("unavailable")
          return
        }
        const current = map
        current.on("styleimagemissing", ({ id }) => {
          if (id === "wood-pattern" && !current.hasImage(id)) {
            const rgb = dark ? [45, 46, 43] : [222, 228, 215]
            current.addImage(id, { width: 1, height: 1, data: new Uint8Array([...rgb, 255]) })
          }
        })
        current.getCanvas().setAttribute("aria-label", `${label} → ${destinationLabel}`)
        current.addControl(new lib.NavigationControl({ showCompass: false }), "top-right")
        const place = (name: string, kind: string) => {
          const element = document.createElement("div")
          element.className = `flight-place ${kind}${nearby ? " is-nearby" : ""}`
          const dot = document.createElement("span"),
            text = document.createElement("span")
          dot.className = "flight-place-dot"
          text.className = "flight-place-label"
          text.textContent = name
          element.append(dot, text)
          return element
        }
        const origin = new lib.Marker({ element: place(label, "is-origin"), anchor: "center" })
          .setLngLat(route[0])
          .addTo(current)
        const destination = new lib.Marker({
          element: place(`Vuong · ${destinationLabel}`, "is-destination"),
          anchor: "center",
        })
          .setLngLat(route[route.length - 1])
          .addTo(current)
        destination.getElement().style.opacity = "0"
        const planeElement = document.createElement("div")
        planeElement.className = "map-aircraft"
        planeElement.setAttribute("aria-hidden", "true")
        planeElement.innerHTML =
          '<svg viewBox="0 0 32 32"><path d="M16 2c-1 0-2 2-2 4v7L3 20v3l11-4v7l-4 3v1l6-2 6 2v-1l-4-3v-7l11 4v-3l-11-7V6c0-2-1-4-2-4Z"/></svg>'
        const plane = new lib.Marker({ element: planeElement, anchor: "center", offset: [0, -17] })
          .setLngLat(route[0])
          .addTo(current)
        planeElement.style.opacity = "0"
        const aircraft = planeElement.querySelector("svg")!
        const fit = (duration: number) => {
          const bounds = route.reduce(
            (box, point) => box.extend(point),
            new lib.LngLatBounds(route[0], route[0]),
          )
          current.fitBounds(bounds, {
            padding: {
              top: 110,
              bottom: 100,
              left: innerWidth < 600 ? 50 : 120,
              right: innerWidth < 600 ? 50 : 120,
            },
            maxZoom: nearby ? 12.5 : 10,
            duration,
            essential: false,
          })
        }
        function updateRoute(progress: number) {
          const index = Math.min(route.length - 1, Math.floor(progress * (route.length - 1)))
          const next = route[Math.min(index + 1, route.length - 1)],
            previous = route[Math.max(0, index - 1)]
          const start = current.project(previous),
            end = current.project(next)
          aircraft.style.transform = `rotate(${(Math.atan2(end.x - start.x, start.y - end.y) * 180) / Math.PI}deg)`
          plane.setLngLat(route[index])
          ;(current.getSource("flight-trail") as GeoJSONSource | undefined)?.setData(
            line(route.slice(0, Math.max(2, index + 1))),
          )
        }
        function finish() {
          updateRoute(1)
          planeElement.style.opacity = "1"
          destination.getElement().style.opacity = "1"
          onPhase("arrived")
        }
        // An intentional pan/zoom hands control to the reader immediately.
        current.on("movestart", (event) => {
          if (event.originalEvent) {
            automatic = false
            cancelAnimationFrame(frame)
            timers.forEach(clearTimeout)
            if (current.getSource("flight-trail")) finish()
          }
        })
        current.once("load", () => {
          if (disposed) return
          current.addSource("flight-trail", { type: "geojson", data: line([route[0], route[0]]) })
          current.addLayer({
            id: "flight-trail",
            type: "line",
            source: "flight-trail",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: {
              "line-color": dark ? "#e6b78f" : "#a25d40",
              "line-width": 2.5,
              "line-opacity": 0.95,
            },
          })
          onPhase("origin")
          if (reduced || !automatic) {
            fit(0)
            finish()
            return
          }
          later(() => {
            onPhase("zooming")
            destination.getElement().style.opacity = "1"
            fit(2200)
            later(() => {
              onPhase("flying")
              planeElement.style.opacity = "1"
              const started = performance.now()
              const fly = (now: number) => {
                if (disposed || !automatic) return
                const progress = Math.max(0, Math.min(1, (now - started) / 3800))
                updateRoute(progress)
                if (progress < 1) frame = requestAnimationFrame(fly)
                else finish()
              }
              frame = requestAnimationFrame(fly)
            }, 2300)
          }, 1400)
        })
        later(() => {
          if (!current.isStyleLoaded() && !current.getSource("flight-trail")) {
            current.remove()
            map = undefined
            onPhase("unavailable")
          }
        }, 16000)
        void origin
      })
      .catch(() => {
        if (!disposed) onPhase("unavailable")
      })
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      timers.forEach(clearTimeout)
      map?.remove()
    }
  }, [visitor, label, destinationLabel, replay, resolvedTheme, onPhase])
  return <div ref={container} className="real-flight-map" />
}
