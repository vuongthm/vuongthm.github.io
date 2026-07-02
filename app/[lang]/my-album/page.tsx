"use client"

import { use, useState, useMemo, useRef } from "react"
import Image from "next/image"
import { Link } from "@/components/ui/link"
import { ArrowLeft, Calendar, Tag, ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Film, Image as ImageIcon } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BackToTop } from "@/components/features/back-to-top"
import { getVisibleAlbums, formatDate, type Album, type AlbumMediaItem } from "@/lib/data"
import { cn } from "@/lib/utils"

const LABELS = {
  en: {
    heading: "Visual Memories Hub",
    desc: "A beautifully curated modern space containing family warmth, workspace footprints, and travel records.",
    back: "Back to About",
    overview: "Themes Overview",
    totalMedia: "captures",
    noMedia: "No photos or videos added to this album yet.",
    prev: "Prev item",
    next: "Next item",
    close: "Close viewer",
    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    photosHeading: "Album Media Stream",
    photosDesc: "Click on any file to open the cinematic split-screen detailing workspace.",
    showAll: "View All Captures",
    showLess: "Show Less",
  },
  vi: {
    heading: "Bộ sưu tập của tôi",
    desc: "Không gian lưu giữ những hồi ký chân thực nhất về mái ấm gia đình, góc bàn làm việc và muôn nẻo đường đi.",
    back: "Quay lại Về tôi",
    overview: "Bộ sưu tập chủ đề",
    totalMedia: "khoảnh khắc",
    noMedia: "Chưa có hình ảnh hay thước phim nào trong album này.",
    prev: "Ảnh trước",
    next: "Ảnh sau",
    close: "Đóng trình xem",
    zoomIn: "Phóng to",
    zoomOut: "Thu nhỏ",
    photosHeading: "Kho lưu trữ đa phương tiện",
    photosDesc: "Bấm vào bất kỳ hình ảnh hoặc video nào để mở trình xem chi tiết ký ức.",
    showAll: "Xem tất cả ảnh & video",
    showLess: "Thu gọn",
  }
}

export default function MyAlbumPage({ params }: { params: Promise<{ lang: "en" | "vi" }> }) {
  const { lang } = use(params)
  const L = LABELS[lang]

  // Retrieve dynamically synced albums from content data source
  const albums = useMemo(() => getVisibleAlbums(lang), [lang])

  // State management to track active selection, limit, and detail modal
  const [selectedAlbumSlug, setSelectedAlbumSlug] = useState<string | null>(null)
  const [visibleLimit, setVisibleLimit] = useState(6) // Displays 6 items by default
  const [modalOpen, setModalOpen] = useState(false)
  const [modalIdx, setModalIdx] = useState(0)
  const [zoomed, setZoomed] = useState(false)

  const carouselRef = useRef<HTMLDivElement>(null)

  // Resolve current active album details
  const activeAlbum = useMemo(() => {
    if (albums.length === 0) return null
    if (!selectedAlbumSlug) return albums[0]
    return albums.find((a) => a.slug === selectedAlbumSlug) || albums[0]
  }, [albums, selectedAlbumSlug])

  const mediaList = activeAlbum?.media || []

  // Horizontal scroll utility for the top themes carousel
  const scrollThemes = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = 240
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      })
    }
  }

  // FIXED: Declared the missing openPhotoDetail function
  const openPhotoDetail = (index: number) => {
    setModalIdx(index)
    setZoomed(false)
    setModalOpen(true)
  }

  // Handle previous item navigation in the modal
  const handlePrev = () => {
    setZoomed(false)
    setModalIdx((prev) => (prev - 1 + mediaList.length) % mediaList.length)
  }

  // Handle next item navigation in the modal
  const handleNext = () => {
    setZoomed(false)
    setModalIdx((prev) => (prev + 1) % mediaList.length)
  }

  return (
    <>
      <Header />
      <BackToTop />

      <main className="pt-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft size={13} />
            {L.back}
          </Link>

          {/* Heading intro block */}
          <div className="mb-10 text-center sm:text-left">
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-3 text-pretty">
              {L.heading}
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-xl text-balance">
              {L.desc}
            </p>
          </div>

          {/* === DẢI BĂNG CHUYỀN NGANG (HORIZONTAL CAROUSEL) CHỌN CHỦ ĐỀ ALBUM === */}
          <section className="mb-12 relative">
            <div className="flex items-center justify-between pb-3 border-b border-border/80 mb-5">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <ImageIcon size={12} className="text-accent-brand" />
                {L.overview}
              </h2>

              {/* Mũi tên trượt nhanh trên máy tính */}
              <div className="hidden sm:flex items-center gap-1">
                <button
                  onClick={() => scrollThemes("left")}
                  className="size-7 rounded-full border border-border bg-background hover:bg-muted text-muted-foreground flex items-center justify-center cursor-pointer transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => scrollThemes("right")}
                  className="size-7 rounded-full border border-border bg-background hover:bg-muted text-muted-foreground flex items-center justify-center cursor-pointer transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Vùng lướt ngang chứa các Card phong cảnh đại diện cho Album */}
            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto scrollbar-none py-1.5 select-none scroll-smooth"
            >
              {albums.map((album) => {
                const isSelected = activeAlbum?.slug === album.slug
                return (
                  <button
                    key={album.slug}
                    onClick={() => {
                      setSelectedAlbumSlug(album.slug)
                      setModalIdx(0)
                      setVisibleLimit(6) // Reset limit to default when switching themes
                    }}
                    className={cn(
                      "relative w-64 h-36 rounded-2xl overflow-hidden shrink-0 border text-left transition-all duration-200 cursor-pointer group/card",
                      isSelected
                        ? "border-accent-brand ring-4 ring-accent-brand/10 scale-[1.01]"
                        : "border-border/60 hover:border-muted-foreground/30"
                    )}
                  >
                    {/* Background cover image of the album with a dark modern tint */}
                    <div className="absolute inset-0 bg-muted">
                      <Image
                        src={album.coverImage}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-500 group-hover/card:scale-105"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
                    </div>

                    {/* Album details positioned inside the card bottom */}
                    <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col gap-1 z-10">
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span className="font-serif text-sm sm:text-base font-bold text-white line-clamp-1">
                          {album.title}
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-white/20 text-white backdrop-blur-xs">
                          {album.media.length}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/70 line-clamp-1 leading-normal font-sans">
                        {album.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* === KHO ẢNH & VIDEO CHỦ ĐỀ ĐANG CHỌN (100% CHIỀU RỘNG RỘNG RÃI) === */}
          {activeAlbum && (
            <section className="animate-fade-in flex flex-col gap-6">
              
              {/* Giới thiệu chi tiết Album đang chọn */}
              <div className="p-6 rounded-2xl border border-border bg-card shadow-xs">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-mono tracking-widest px-2.5 py-0.5 rounded-md bg-accent-brand/10 text-accent-brand">
                    {activeAlbum.slug}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatDate(activeAlbum.date, lang)}
                  </span>
                </div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground mb-2">
                  {activeAlbum.title}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-pretty max-w-3xl">
                  {activeAlbum.description}
                </p>
              </div>

              {/* Header của kho lưu trữ */}
              <div className="border-b border-border/60 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-foreground">
                    {L.photosHeading}
                  </h3>
                  <p className="text-xs text-muted-foreground hidden sm:block mt-0.5">
                    {L.photosDesc}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {mediaList.length} {L.totalMedia}
                </span>
              </div>

              {mediaList.length === 0 ? (
                <p className="text-muted-foreground text-center py-16 text-sm">{L.noMedia}</p>
              ) : (
                <>
                  {/* Grid lưới chứa danh sách tệp đa phương tiện (Đã giới hạn bằng visibleLimit) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {mediaList.slice(0, visibleLimit).map((item, index) => {
                      const isVideo = item.type === "video"
                      return (
                        <div
                          key={item.filename}
                          onClick={() => openPhotoDetail(index)}
                          className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-border bg-muted cursor-pointer hover:border-accent-brand/40 hover:shadow-md transition-all duration-200"
                        >
                          {isVideo ? (
                            <div className="relative w-full h-full">
                              <video 
                                src={item.src} 
                                className="w-full h-full object-cover pointer-events-none"
                                preload="metadata"
                              />
                              <div className="absolute top-2.5 right-2.5 size-6 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-xs">
                                <Film size={11} />
                              </div>
                            </div>
                          ) : (
                            <Image
                              src={item.src}
                              alt={item.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                              unoptimized
                            />
                          )}
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-colors" />
                          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <p className="text-[10px] text-white/95 leading-tight font-medium font-serif truncate">
                              {item.title}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* === NÚT ĐIỀU HƯỚNG XEM THÊM / THU GỌN === */}
                  {mediaList.length > 6 && (
                    <div className="flex justify-center mt-6 gap-2.5">
                      {visibleLimit < mediaList.length ? (
                        <button
                          onClick={() => setVisibleLimit(mediaList.length)}
                          className="px-5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm font-semibold hover:bg-muted transition-colors duration-150 cursor-pointer"
                        >
                          {L.showAll}
                        </button>
                      ) : (
                        <button
                          onClick={() => setVisibleLimit(6)}
                          className="px-5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm font-semibold hover:bg-muted transition-colors duration-150 cursor-pointer"
                        >
                          {L.showLess}
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </section>
          )}

        </div>
      </main>

      {/* === SPLIT SCREEN DYNAMIC MEDIA VIEWER MODAL === */}
      {modalOpen && mediaList.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-10 select-none animate-fade-in">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          
          <div className="relative w-full max-w-5xl h-[85vh] md:h-[75vh] bg-card border border-border rounded-2xl overflow-hidden shadow-2xl z-10">
            <div className="grid grid-cols-1 md:grid-cols-5 h-full w-full">
              
              {/* LEFT SIDE PANEL (Col-span 2): Text Details, category description, and controls */}
              <div className="md:col-span-2 flex flex-col justify-between p-6 sm:p-8 bg-surface border-b md:border-b-0 md:border-r border-border h-[40%] md:h-full overflow-y-auto">
                <div>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-accent-brand/10 text-accent-brand text-[10px] font-mono font-semibold uppercase tracking-wider">
                      <Tag size={10} />
                      {activeAlbum?.slug}
                    </span>
                    <time className="text-xs text-muted-foreground block font-mono">
                      {mediaList[modalIdx].date}
                    </time>
                  </div>

                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground leading-snug mb-3">
                    {mediaList[modalIdx].title}
                  </h2>
                  
                  <div className="w-12 h-[2px] bg-accent-brand/40 mb-5" />

                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-pretty">
                    {mediaList[modalIdx].note}
                  </p>
                </div>

                {/* Stepper Navigation and Zoom Controls inside Left Side panel */}
                <div className="flex items-center justify-between gap-4 pt-6 border-t border-border mt-6">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handlePrev}
                      className="size-10 rounded-full border border-border bg-background text-muted-foreground hover:text-foreground flex items-center justify-center hover:border-foreground/30 transition-all cursor-pointer"
                      aria-label={L.prev}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="text-xs text-muted-foreground font-mono px-1">
                      {modalIdx + 1} / {mediaList.length}
                    </span>
                    <button
                      onClick={handleNext}
                      className="size-10 rounded-full border border-border bg-background text-muted-foreground hover:text-foreground flex items-center justify-center hover:border-foreground/30 transition-all cursor-pointer"
                      aria-label={L.next}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {mediaList[modalIdx].type === "image" && (
                      <button
                        onClick={() => setZoomed((z) => !z)}
                        className="size-10 rounded-full border border-border bg-background text-muted-foreground hover:text-foreground flex items-center justify-center hover:border-foreground/30 transition-all cursor-pointer"
                        title={zoomed ? L.zoomOut : L.zoomIn}
                      >
                        {zoomed ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
                      </button>
                    )}
                    <button
                      onClick={() => setModalOpen(false)}
                      className="size-10 rounded-full border border-border bg-background text-muted-foreground hover:text-foreground flex items-center justify-center hover:border-foreground/30 transition-all cursor-pointer"
                      title={L.close}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE PANEL (Col-span 3): High-resolution Image or Video file */}
              <div className="md:col-span-3 h-[60%] md:h-full relative bg-black/95 overflow-hidden flex items-center justify-center">
                {mediaList[modalIdx].type === "video" ? (
                  <video
                    src={mediaList[modalIdx].src}
                    controls
                    className="w-full h-full object-contain rounded-r-2xl"
                    preload="auto"
                    autoPlay
                  />
                ) : (
                  <div 
                    onClick={() => setZoomed((z) => !z)}
                    className={cn(
                      "relative w-full h-full transition-transform duration-300 select-none",
                      zoomed ? "scale-140 cursor-zoom-out" : "scale-100 cursor-zoom-in"
                    )}
                  >
                    <Image
                      src={mediaList[modalIdx].src}
                      alt={mediaList[modalIdx].title}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      <Footer lang={lang} />
    </>
  )
}