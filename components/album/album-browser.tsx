"use client"
import { localeName } from "@/lib/i18n/english-names.mjs"
/* eslint-disable @next/next/no-img-element -- Supports local images and decrypted Blob URLs. */
import { useRef, useState, type ReactNode } from "react"
import { Play } from "lucide-react"
import { useSite } from "@/components/providers/site-provider"
import { albumMessages } from "@/lib/i18n/album"
import type { GalleryPhoto } from "@/lib/content/types"
import { Pagination } from "@/components/collections/pagination"
import { PhotoViewer } from "./photo-viewer"

export function AlbumBrowser({
  photos,
  resetKey = "",
  action,
}: {
  photos: GalleryPhoto[]
  resetKey?: string
  action?: ReactNode
}) {
  const { locale } = useSite(),
    text = albumMessages(locale)
  const [selection, setSelection] = useState({ key: resetKey, page: 1 })
  const pages = Math.max(1, Math.ceil(photos.length / 24)),
    page = Math.min(selection.key === resetKey ? selection.page : 1, pages),
    ref = useRef<HTMLDivElement>(null)
  return (
    <div className="album-browser" ref={ref} tabIndex={-1}>
      <div className="album-display-bar">
        <p aria-live="polite">
          <b>{photos.length}</b> {text.count}
        </p>
        {action && <span className="album-collection-action">{action}</span>}
      </div>
      {photos.length ? (
        <PhotoGrid key={`${resetKey}:${page}`} photos={photos} start={(page - 1) * 24} />
      ) : (
        <p className="journal-empty">{text.empty}</p>
      )}
      <Pagination
        page={page}
        pages={pages}
        onChange={(value) => {
          setSelection({ key: resetKey, page: value })
          ref.current?.focus({ preventScroll: true })
          ref.current?.scrollIntoView({
            block: "start",
            behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          })
        }}
      />
    </div>
  )
}
function PhotoGrid({ photos, start }: { photos: GalleryPhoto[]; start: number }) {
  const { locale } = useSite(),
    text = albumMessages(locale),
    [selected, setSelected] = useState<number | null>(null)
  return (
    <>
      <div className="album-photo-grid">
        {photos.slice(start, start + 24).map((photo, index) => (
          <button
            className="album-photo"
            key={`${photo.src}:${index}`}
            onClick={() => setSelected(start + index)}
            aria-label={`${photo.kind === "video" ? text.videos : text.view}: ${photo.title[locale]}`}
          >
            {photo.kind === "video" ? (
              <>
                <video src={photo.src} preload="metadata" muted playsInline aria-hidden="true" />
                <span className="album-video-mark" aria-hidden="true">
                  <Play size={13} fill="currentColor" />
                  {text.videos}
                </span>
              </>
            ) : (
              <img
                src={photo.src}
                alt={photo.title[locale]}
                width={photo.width}
                height={photo.height}
                loading={index < 4 ? "eager" : "lazy"}
                decoding="async"
              />
            )}
            <span className="album-photo-caption">
              <strong>{photo.title[locale]}</strong>
              {photo.place && <small>{localeName(photo.place, locale)}</small>}
            </span>
          </button>
        ))}
      </div>
      {selected !== null && photos[selected] && (
        <PhotoViewer
          photos={photos}
          selected={selected}
          onSelect={setSelected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
