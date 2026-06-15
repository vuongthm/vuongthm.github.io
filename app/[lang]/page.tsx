"use client"

import Image from "next/image"
import { Link } from "@/components/ui/link"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useLang } from "@/components/providers/lang-provider"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { SeriesCard } from "@/components/content/series-card"
import { NoteCard } from "@/components/content/note-card"
import { getVisibleSeries, getVisibleNotes } from "@/lib/data"

const COPY = {
  en: {
    tagline: "Telling life stories. Sharing what I've learned.",
    ctaStories: "Read Stories",
    ctaNotes: "Browse Notes",
    storiesHeading: "Stories in progress",
    notesHeading: "Recent Notes",
    aboutHeading: "About the author",
    aboutExcerpt:
      "I'm Vuong (vuongthm) — grew up in a small rural village, taught myself everything I know, and write to understand myself better. This blog is where I tell the stories I haven't had a chance to share, and pass along what I've learned along the way.",
    aboutLink: "Read more about me",
    viewAllStories: "View all stories",
    viewAllNotes: "View all notes",
  },
  vi: {
    tagline: "Kể chuyện cuộc đời. Chia sẻ những gì học được.",
    ctaStories: "Đọc chuyện kể",
    ctaNotes: "Xem ghi chú",
    storiesHeading: "Chuyện đang viết",
    notesHeading: "Ghi chú gần đây",
    aboutHeading: "Về tác giả",
    aboutExcerpt:
      "Tôi là Vuong (vuongthm) — lớn lên ở một làng quê nhỏ, tự mày mò học mọi thứ, và viết để hiểu bản thân hơn. Blog này là nơi tôi kể những câu chuyện chưa kịp nói và chia sẻ những điều đã học được trên con đường trưởng thành.",
    aboutLink: "Đọc thêm về tôi",
    viewAllStories: "Xem tất cả chuyện kể",
    viewAllNotes: "Xem tất cả ghi chú",
  },
}

const ABOUT_CAROUSEL_IMAGES = [
  { src: "/hometown/dai-lanh-coast.png", alt: "Đại Lãnh coast at dawn" },
  { src: "/hometown/dai-lanh-village.png", alt: "Đại Lãnh fishing village" },
  { src: "/hometown/dai-lanh-mountain.png", alt: "Đại Lãnh mountain cove" },
  { src: "/avatar.png", alt: "Vuong — the author" },
]

function AboutCarousel() {
  const [current, setCurrent] = useState(0)
  const [hovered, setHovered] = useState(false)
  const total = ABOUT_CAROUSEL_IMAGES.length

  const prev = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault()
      setCurrent((c) => (c - 1 + total) % total)
    },
    [total]
  )

  const next = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault()
      setCurrent((c) => (c + 1) % total)
    },
    [total]
  )

  useEffect(() => {
    if (hovered) return
    const id = setInterval(() => setCurrent((c) => (c + 1) % total), 3500)
    return () => clearInterval(id)
  }, [hovered, total])

  return (
    <div
      className="relative w-full h-full group/inner"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {ABOUT_CAROUSEL_IMAGES.map((img, i) => (
        <div
          key={img.src}
          className={`absolute inset-0 transition-opacity duration-500 ${
            i === current ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          aria-hidden={i !== current}
        >
          <Image
            src={img.src}
            alt={img.alt}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 500px"
          />
        </div>
      ))}

      <button
        onClick={prev}
        aria-label="Previous photo"
        className="absolute left-2 top-1/2 -translate-y-1/2 size-8 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover/inner:opacity-100 hover:bg-black/60 transition-all duration-200 z-10"
      >
        <ChevronLeft size={16} />
      </button>

      <button
        onClick={next}
        aria-label="Next photo"
        className="absolute right-2 top-1/2 -translate-y-1/2 size-8 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover/inner:opacity-100 hover:bg-black/60 transition-all duration-200 z-10"
      >
        <ChevronRight size={16} />
      </button>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
        {ABOUT_CAROUSEL_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.preventDefault()
              setCurrent(i)
            }}
            aria-label={`Go to photo ${i + 1}`}
            className={`rounded-full transition-all duration-200 ${
              i === current ? "w-4 h-1.5 bg-white" : "size-1.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export default function HomePage() {
  const { lang } = useLang()
  const c = COPY[lang]
  const featuredSeries = getVisibleSeries(lang).slice(0, 3)
  const recentNotes = getVisibleNotes(lang).slice(0, 8)

  return (
    <>
      <Header />

      <main className="pt-14" id="main-content">
        <section className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 pt-16 pb-12 sm:pt-24 sm:pb-16">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left gap-6 sm:gap-10">
            <div className="shrink-0">
              <div className="relative size-20 sm:size-24 rounded-full overflow-hidden border-2 border-border bg-muted">
                <Image
                  src="/avatar.png"
                  alt="Vuong — author"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            <div className="flex-1">
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground leading-tight text-balance mb-3">
                Vuong<span className="text-accent-brand">.</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg text-pretty mb-6 mx-auto sm:mx-0">
                {c.tagline}
              </p>
              <div className="flex flex-nowrap gap-2.5 justify-center sm:justify-start">
                <Link
                  href="/stories"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-accent-brand text-accent-brand-foreground text-[11px] sm:text-sm font-medium hover:opacity-90 transition-opacity duration-150 whitespace-nowrap"
                >
                  {c.ctaStories}
                  <ArrowRight size={13} />
                </Link>
                <Link
                  href="/notes"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-border text-foreground text-[11px] sm:text-sm font-medium hover:bg-muted transition-colors duration-150 whitespace-nowrap"
                >
                  {c.ctaNotes}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="border-t border-border" />
        </div>

        <section className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 py-10 sm:py-14">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-foreground w-full text-center sm:text-left sm:w-auto">
              {c.storiesHeading}
            </h2>
            <Link
              href="/stories"
              className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground hover:text-accent-brand transition-colors duration-150 shrink-0"
            >
              {c.viewAllStories}
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {featuredSeries.map((series) => (
              <SeriesCard key={series.slug} series={series} lang={lang} />
            ))}
          </div>

          <div className="flex justify-center mt-5 sm:hidden">
            <Link
              href="/stories"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-accent-brand transition-colors duration-150"
            >
              {c.viewAllStories}
              <ArrowRight size={13} />
            </Link>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="border-t border-border" />
        </div>

        <section className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 py-10 sm:py-14">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-foreground">
              {c.notesHeading}
            </h2>
            <Link
              href="/notes"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-accent-brand transition-colors duration-150"
            >
              {c.viewAllNotes}
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="sm:hidden">
            {recentNotes.slice(0, 4).map((note) => (
              <NoteCard key={note.slug} note={note} lang={lang} variant="compact" />
            ))}
          </div>

          <div className="hidden sm:grid grid-cols-2 gap-x-10">
            <div className="divide-y divide-border">
              {recentNotes.slice(0, 4).map((note) => (
                <NoteCard key={note.slug} note={note} lang={lang} variant="compact" />
              ))}
            </div>
            <div className="divide-y divide-border">
              {recentNotes.slice(4, 8).map((note) => (
                <NoteCard key={note.slug} note={note} lang={lang} variant="compact" />
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="border-t border-border" />
        </div>

        <section className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 py-10 sm:py-14">
          <Link
            href="/about"
            className="group/carousel block rounded-xl border border-border bg-card hover:border-accent-brand/30 hover:shadow-md transition-all duration-200 overflow-hidden"
          >
            <div className="flex flex-col sm:grid sm:grid-cols-9">
              <div className="sm:col-span-3 flex flex-col justify-center gap-4 p-5 sm:p-6 lg:p-8">
                <div className="flex items-center gap-3">
                  <div className="relative size-12 rounded-xl overflow-hidden bg-muted border border-border shrink-0">
                    <Image
                      src="/avatar.png"
                      alt="Vuong"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-serif text-base font-semibold text-foreground group-hover/carousel:text-accent-brand transition-colors">
                      Vuong
                    </p>
                    <p className="text-xs text-muted-foreground">vuongthm</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4 text-pretty">
                  {c.aboutExcerpt}
                </p>

                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-brand">
                  {c.aboutLink}
                  <ArrowRight size={13} />
                </span>
              </div>

              <div className="sm:col-span-6 h-52 sm:h-56 lg:h-72 relative bg-muted">
                <AboutCarousel />
              </div>
            </div>
          </Link>
        </section>
      </main>

      <Footer lang={lang} />
    </>
  )
}