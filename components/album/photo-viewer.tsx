"use client"
/* eslint-disable @next/next/no-img-element -- Also supports decrypted Blob URLs. */
import { useEffect, useRef } from "react"
import { ArrowLeft, ArrowRight, Play, X } from "lucide-react"
import { Dialog } from "@/components/search/dialog"
import { useSite } from "@/components/providers/site-provider"
import { albumMessages } from "@/lib/i18n/album"
import type { GalleryPhoto } from "@/lib/content/types"
export function PhotoViewer({
  photos,
  selected,
  onSelect,
  onClose,
}: {
  photos: GalleryPhoto[]
  selected: number
  onSelect: (index: number) => void
  onClose: () => void
}) {
  const { locale, dictionary } = useSite(),
    text = albumMessages(locale),
    photo = photos[selected]
  const touch = useRef<{ x: number; y: number } | null>(null),
    thumbs = useRef<HTMLDivElement>(null)
  const move = (direction: number) =>
    onSelect((selected + direction + photos.length) % photos.length)
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (
        ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") ||
        event.key === "/"
      ) {
        event.preventDefault()
        event.stopPropagation()
        return
      }
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        if ((event.target as Element).closest("video")) return
        event.preventDefault()
        onSelect((selected + (event.key === "ArrowRight" ? 1 : -1) + photos.length) % photos.length)
      }
    }
    document.addEventListener("keydown", key, true)
    const active = thumbs.current?.querySelector<HTMLElement>('[aria-current="true"]')
    if (active && thumbs.current)
      thumbs.current.scrollTo({
        left: active.offsetLeft - thumbs.current.clientWidth / 2 + active.clientWidth / 2,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      })
    return () => document.removeEventListener("keydown", key, true)
  }, [selected, photos.length, onSelect])
  return (
    <Dialog label={photo.title[locale]} onClose={onClose} className="photo-viewer">
      <div className="photo-viewer-toolbar">
        <span>
          {text.frame} <b>{String(selected + 1).padStart(2, "0")}</b>
          <span className="photo-viewer-total">/ {String(photos.length).padStart(2, "0")}</span>
        </span>
        <button className="photo-viewer-close" onClick={onClose} aria-label={dictionary.close}>
          <X size={20} />
        </button>
      </div>
      <div
        className="photo-viewer-stage"
        onTouchStart={(event) => {
          if (!(event.target as Element).closest("video"))
            touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }
        }}
        onTouchCancel={() => {
          touch.current = null
        }}
        onTouchEnd={(event) => {
          const start = touch.current
          touch.current = null
          if (!start) return
          const dx = event.changedTouches[0].clientX - start.x,
            dy = event.changedTouches[0].clientY - start.y
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx < 0 ? 1 : -1)
        }}
      >
        {photo.kind === "video" ? (
          <video key={photo.src} src={photo.src} controls autoPlay playsInline />
        ) : (
          <img key={photo.src} src={photo.src} alt={photo.title[locale]} decoding="async" />
        )}
        {photos.length > 1 && (
          <>
            <button
              className="photo-viewer-arrow previous"
              onClick={() => move(-1)}
              aria-label={text.previous}
            >
              <ArrowLeft size={20} />
            </button>
            <button
              className="photo-viewer-arrow next"
              onClick={() => move(1)}
              aria-label={text.next}
            >
              <ArrowRight size={20} />
            </button>
          </>
        )}
      </div>
      <div className="photo-viewer-caption" aria-live="polite">
        <h2>{photo.title[locale]}</h2>
        {photo.place && <p>{photo.place}</p>}
      </div>
      {photos.length > 1 && (
        <div
          className="photo-viewer-thumbnails"
          ref={thumbs}
          role="group"
          aria-label={text.thumbnails}
        >
          {photos.map((item, index) => (
            <button
              key={`${item.src}:${index}`}
              aria-label={`${text.frame} ${index + 1}: ${item.title[locale]}`}
              aria-current={selected === index ? "true" : undefined}
              onClick={() => onSelect(index)}
            >
              {item.kind === "video" ? (
                <Play size={17} />
              ) : (
                <img src={item.src} alt="" loading="lazy" />
              )}
            </button>
          ))}
        </div>
      )}
    </Dialog>
  )
}
