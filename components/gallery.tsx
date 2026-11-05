"use client"
import { PhotoCollage } from "./album/photo-collage"
import { AlbumBrowser } from "./album/album-browser"
import Image from "next/image"
import { useEffect, useState } from "react"
import { ArrowLeft, ArrowRight, X } from "lucide-react"
import { useSite } from "./providers/site-provider"
import { Dialog } from "./search/dialog"
import type { GalleryPhoto } from "@/lib/content/types"
export function Gallery({
  photos,
  variant = "default",
}: {
  photos: GalleryPhoto[]
  variant?: "default" | "portfolio" | "journey" | "journal"
}) {
  const { locale, dictionary: m } = useSite(),
    [selected, setSelected] = useState<number | null>(null)
  const [featured, setFeatured] = useState(0)
  const current = photos[featured] ?? photos[0]
  useEffect(() => {
    if (selected === null) return
    const key = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault()
        setSelected((index) => (index === null ? null : (index + 1) % photos.length))
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        setSelected((index) =>
          index === null ? null : (index + photos.length - 1) % photos.length,
        )
      }
    }
    document.addEventListener("keydown", key)
    return () => document.removeEventListener("keydown", key)
  }, [selected, photos.length])
  if (variant === "journal") return <AlbumBrowser photos={photos} />
  if (variant === "portfolio") return <PhotoCollage photos={photos} />
  return (
    <>
      {variant === "journey" && current ? (
        <div className="journey-gallery">
          <button
            className="journey-photo-main"
            onClick={() => setSelected(featured)}
            aria-label={current.title[locale]}
          >
            <span className="journey-photo-surface" key={current.src}>
              {/* Native intrinsic sizing keeps every corner without letterboxing. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={current.src} alt={current.title[locale]} loading="eager" decoding="async" />
            </span>
          </button>
          <div className="journey-photo-caption">
            <span>{current.title[locale]}</span>
            <small>
              {featured + 1} / {photos.length}
            </small>
          </div>
          {photos.length > 1 && (
            <div className="journey-photo-thumbs">
              {photos.map((photo, i) => (
                <button
                  key={photo.src}
                  onClick={() => setFeatured(i)}
                  aria-label={photo.title[locale]}
                  aria-pressed={featured === i}
                >
                  <Image
                    src={photo.src}
                    alt=""
                    width={64}
                    height={44}
                    unoptimized
                    style={{ objectFit: "contain" }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="gallery-grid">
          {photos.map((photo, i) => (
            <button
              key={`${photo.src}:${i}`}
              onClick={() => setSelected(i)}
              aria-label={photo.title[locale]}
            >
              <div>
                {photo.kind === "video" ? (
                  <video src={photo.src} preload="metadata" muted playsInline aria-hidden="true" />
                ) : (
                  <Image
                    src={photo.src}
                    alt={photo.title[locale]}
                    fill
                    sizes="(max-width:760px) 50vw, 33vw"
                    unoptimized
                  />
                )}
              </div>
              <span>
                <small>{photo.place}</small>
                <strong>{photo.title[locale]}</strong>
              </span>
            </button>
          ))}
        </div>
      )}
      {selected !== null && (
        <Dialog
          label={photos[selected].title[locale]}
          onClose={() => setSelected(null)}
          className="gallery-dialog"
        >
          <div className="gallery-view-toolbar">
            <span>
              {selected + 1} / {photos.length}
            </span>
            <button className="icon-button" onClick={() => setSelected(null)} aria-label={m.close}>
              <X size={19} />
            </button>
          </div>
          <div className="gallery-view-image">
            {photos[selected].kind === "video" ? (
              <video
                key={photos[selected].src}
                src={photos[selected].src}
                controls
                autoPlay
                playsInline
              />
            ) : (
              <Image
                src={photos[selected].src}
                alt={photos[selected].title[locale]}
                fill
                sizes="90vw"
                unoptimized
                style={{ objectFit: "contain" }}
              />
            )}
          </div>
          <div className="gallery-view-footer">
            <button
              className="icon-button"
              onClick={() => setSelected((selected + photos.length - 1) % photos.length)}
              aria-label={m.previous}
            >
              <ArrowLeft size={19} />
            </button>
            <span>{photos[selected].title[locale]}</span>
            <button
              className="icon-button"
              onClick={() => setSelected((selected + 1) % photos.length)}
              aria-label={m.next}
            >
              <ArrowRight size={19} />
            </button>
          </div>
        </Dialog>
      )}
    </>
  )
}
