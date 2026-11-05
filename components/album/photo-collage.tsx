"use client"
/* eslint-disable @next/next/no-img-element -- Shared author media can also use Blob URLs. */
import { useState } from "react"
import { useSite } from "@/components/providers/site-provider"
import type { GalleryPhoto } from "@/lib/content/types"
import { PhotoViewer } from "./photo-viewer"
export function PhotoCollage({ photos }: { photos: GalleryPhoto[] }) {
  const { locale } = useSite(),
    [selected, setSelected] = useState<number | null>(null)
  return (
    <>
      <div className="photo-collage">
        {photos.slice(0, 3).map((photo, index) => (
          <button
            key={`${photo.src}:${index}`}
            onClick={() => setSelected(index)}
            aria-label={photo.title[locale]}
          >
            <img src={photo.src} alt={photo.title[locale]} loading="lazy" decoding="async" />
            <span className="photo-collage-shade" />
            <span className="photo-collage-copy">
              <small>{photo.place}</small>
              <strong>{photo.title[locale]}</strong>
            </span>
            {index === 2 && photos.length > 3 && (
              <span className="photo-collage-more">+{photos.length - 3}</span>
            )}
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
