"use client"
/* eslint-disable @next/next/no-img-element -- Album sources support remote and decrypted media. */
import Link from "next/link"
import { ArrowUpRight, Camera } from "lucide-react"
import { useSite } from "@/components/providers/site-provider"
import { copy } from "@/lib/i18n/copy"
import { LockBadge } from "@/components/reading/lock-badge"
import { PaginatedList } from "@/components/collections/paginated-list"
import { AlbumBrowser } from "./album-browser"
import type { GalleryPhoto } from "@/lib/content/types"
type AlbumPreview = {
  id: string
  title: string
  description?: string
  cover?: string
  href: string
  encrypted?: boolean
  story?: boolean
  items: GalleryPhoto[]
  count: number
}
export function PhotoJournal({ albums }: { albums: AlbumPreview[] }) {
  const { locale } = useSite()
  if (albums.length === 1 && albums[0].id === "personal")
    return (
      <section className="wrap photo-exhibition">
        <AlbumBrowser photos={albums[0].items} />
      </section>
    )
  return (
    <section
      className="wrap photo-exhibition"
      aria-label={copy(locale, "Các bộ ảnh", "Photo collections")}
    >
      <div className="exhibition-rule">
        <span>{copy(locale, "Những khung hình muốn giữ lại", "Frames worth keeping")}</span>
        <span>
          {String(albums.length).padStart(2, "0")} {copy(locale, "bộ ảnh", "collections")}
        </span>
      </div>
      <PaginatedList className="album-exhibition" pageSize={8}>
        {albums.map((album, index) => {
          const cover = album.cover || album.items.find((item) => item.kind !== "video")?.src
          const frames = album.encrypted
            ? []
            : album.items.filter((item) => item.kind !== "video" && item.src !== cover).slice(0, 2)
          return (
            <article
              className={`album-exhibit${album.encrypted ? " is-locked" : ""}`}
              key={album.id}
            >
              <Link
                className="album-exhibit-art"
                href={album.href}
                prefetch={album.encrypted ? false : undefined}
                aria-label={album.title}
              >
                <span className="album-exhibit-frame">
                  {cover ? (
                    <img src={cover} alt="" loading={index === 0 ? "eager" : "lazy"} />
                  ) : (
                    <Camera size={32} strokeWidth={1} />
                  )}
                </span>
                {frames.map((photo, frame) => (
                  <span className={`album-exhibit-detail detail-${frame}`} key={photo.src}>
                    <img src={photo.src} alt="" loading="lazy" />
                  </span>
                ))}
                <span className="exhibit-corner" aria-hidden="true">
                  +
                </span>
              </Link>
              <div className="album-exhibit-copy">
                <span className="exhibit-index">
                  {String(index + 1).padStart(2, "0")}{" "}
                  <span>/ {copy(locale, "Bộ sưu tập", "Collection")}</span>
                </span>
                <h2>
                  <Link href={album.href} prefetch={album.encrypted ? false : undefined}>
                    {album.title}
                    {album.encrypted && <LockBadge locale={locale} />}
                  </Link>
                </h2>
                {album.description && <p>{album.description}</p>}
                <Link
                  className="text-link"
                  href={album.href}
                  prefetch={album.encrypted ? false : undefined}
                >
                  {copy(locale, "Bước vào bộ ảnh", "Enter the collection")}
                  <ArrowUpRight size={16} />
                </Link>
                <span className="exhibit-photo-count">
                  {album.count} {copy(locale, "khung hình", "frames")}
                </span>
              </div>
            </article>
          )
        })}
      </PaginatedList>
    </section>
  )
}
