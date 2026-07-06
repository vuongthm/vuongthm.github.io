"use client"

import { use, useState, useMemo, useRef, useEffect } from "react"
import Image from "next/image"
import { Link } from "@/components/ui/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BackToTop } from "@/components/features/back-to-top"
import { getVisibleAlbums, formatDate, type Album, type AlbumMediaItem } from "@/lib/data"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Lock, Unlock, KeyRound, ArrowLeft, ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Film, Image as ImageIcon } from "lucide-react"
import CryptoJS from "crypto-js"

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
    lockedTitle: "Private Gallery",
    lockedDesc: "This entire memory hub is encrypted and private. Please enter the correct password to unlock and read its content.",
    placeholder: "Enter password...",
    unlockBtn: "Unlock Gallery",
    wrongPassword: "Incorrect password. Please try again."
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
    lockedTitle: "Bộ sưu tập riêng tư",
    lockedDesc: "Toàn bộ không gian lưu giữ này đã được mã hóa bảo mật. Vui lòng nhập đúng mật khẩu để mở khóa và đọc nội dung.",
    placeholder: "Nhập mật khẩu...",
    unlockBtn: "Mở khóa bộ sưu tập",
    wrongPassword: "Mật khẩu không chính xác. Vui lòng thử lại."
  }
}

export default function MyAlbumPage({ params }: { params: Promise<{ lang: "en" | "vi" }> }) {
  const { lang } = use(params)
  const L = LABELS[lang]

  // Retrieve raw (possibly encrypted) albums from content data source
  const rawAlbums = useMemo(() => getVisibleAlbums(lang), [lang])
  const isLocked = rawAlbums.some((a) => a.isLocked)

  // Local state for decryption password and unlocked content
  const [password, setPassword] = useState("")
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [error, setError] = useState(false)
  const [decryptedAlbums, setDecryptedAlbums] = useState<Album[]>([])

  const [selectedAlbumSlug, setSelectedAlbumSlug] = useState<string | null>(null)
  const [visibleLimit, setVisibleLimit] = useState(6)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalIdx, setModalIdx] = useState(0)
  const [zoomed, setZoomed] = useState(false)

  const carouselRef = useRef<HTMLDivElement>(null)

  // Auto-decrypt using session cache on component mount
  useEffect(() => {
    if (isLocked) {
      const cachedPassword = sessionStorage.getItem("unlock-my-album")
      if (cachedPassword) {
        try {
          const success = attemptDecryption(cachedPassword)
          if (success) {
            setIsUnlocked(true)
          }
        } catch (_) {
          sessionStorage.removeItem("unlock-my-album")
        }
      }
    } else {
      setDecryptedAlbums(rawAlbums)
    }
  }, [isLocked, rawAlbums])

  // Core decryption method supporting deep media list JSON string parsing
  const attemptDecryption = (passKey: string): boolean => {
    const tempAlbums: Album[] = []
    for (const album of rawAlbums) {
      try {
        const descBytes = CryptoJS.AES.decrypt(album.description, passKey.trim())
        const decryptedDesc = descBytes.toString(CryptoJS.enc.Utf8)

        const contentBytes = CryptoJS.AES.decrypt(album.content, passKey.trim())
        const decryptedContent = contentBytes.toString(CryptoJS.enc.Utf8)

        // Decrypt and parse the serialized dynamic AlbumMediaItem[] JSON string
        const mediaBytes = CryptoJS.AES.decrypt(album.media as string, passKey.trim())
        const decryptedMediaStr = mediaBytes.toString(CryptoJS.enc.Utf8)

        if (!decryptedDesc || !decryptedContent || !decryptedMediaStr) {
          return false
        }

        const parsedMedia: AlbumMediaItem[] = JSON.parse(decryptedMediaStr)
        tempAlbums.push({
          ...album,
          description: decryptedDesc,
          content: decryptedContent,
          media: parsedMedia
        })
      } catch (_) {
        return false
      }
    }

    setDecryptedAlbums(tempAlbums)
    return true
  }

  // Handle manual submission of decryption password
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return

    const success = attemptDecryption(password.trim())
    if (!success) {
      setError(true)
      toast.error(L.wrongPassword)
      return
    }

    setIsUnlocked(true)
    setError(false)
    sessionStorage.setItem("unlock-my-album", password.trim())
    toast.success(lang === "en" ? "Gallery unlocked" : "Đã mở khóa bộ sưu tập")
  }

  // Resolve current active album from decrypted list
  const activeAlbum = useMemo(() => {
    const targetAlbums = isLocked ? decryptedAlbums : rawAlbums
    if (targetAlbums.length === 0) return null
    if (!selectedAlbumSlug) return targetAlbums[0]
    return targetAlbums.find((a) => a.slug === selectedAlbumSlug) || targetAlbums[0]
  }, [rawAlbums, decryptedAlbums, isLocked, selectedAlbumSlug])

  const mediaList = (activeAlbum?.media as AlbumMediaItem[]) || []

  // Horizontal scroll utility for top carousel
  const scrollThemes = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = 240
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      })
    }
  }

  // Open photo/video details modal at selected index
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

  const renderedAlbums = isLocked ? decryptedAlbums : rawAlbums

  return (
    <>
      <Header />
      <BackToTop />

      <main className="pt-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          
          {isLocked && !isUnlocked ? (
            /* === LOCKED PAGE WALL SCREEN WITH STANDARD NOTE-PAGE-CLIENT STYLE === */
            <div className="flex flex-col items-center justify-center min-h-[70vh] max-w-md mx-auto py-12 px-4">
              <div className="size-16 rounded-2xl bg-muted border border-border flex items-center justify-center text-accent-brand mb-6 shadow-xs animate-bounce">
                <Lock size={28} />
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground text-center mb-3">
                {L.lockedTitle}
              </h1>
              <p className="text-sm text-muted-foreground text-center leading-relaxed mb-8">
                {L.lockedDesc}
              </p>
              
              <form onSubmit={handleUnlock} className="w-full flex flex-col gap-3">
                <div className="relative w-full">
                  <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={L.placeholder}
                    className={cn(
                      "w-full h-11 pl-10 pr-4 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 transition-all",
                      error 
                        ? "border-destructive focus:ring-destructive/20" 
                        : "border-border focus:ring-accent-brand/30 focus:border-accent-brand/60"
                    )}
                    required
                  />
                </div>
                <Button type="submit" variant="default" className="h-11 rounded-xl text-sm font-medium w-full flex items-center justify-center gap-2 cursor-pointer bg-accent-brand hover:opacity-95 border-0 text-white">
                  <Unlock size={14} />
                  {L.unlockBtn}
                </Button>
              </form>
              
              <Link href="/about" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-8">
                <ArrowLeft size={13} /> {L.back}
              </Link>
            </div>
          ) : (
            /* === UNLOCKED/PUBLIC ACTIVE VIEW === */
            <>
              <Link
                href="/about"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
              >
                <ArrowLeft size={13} /> {L.back}
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

              {/* Horizontal sliding themes selection carousel */}
              <section className="mb-12 relative">
                <div className="flex items-center justify-between pb-3 border-b border-border/80 mb-5">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <ImageIcon size={12} className="text-accent-brand" />
                    {L.overview}
                  </h2>

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

                <div
                  ref={carouselRef}
                  className="flex gap-4 overflow-x-auto scrollbar-none py-1.5 select-none scroll-smooth"
                >
                  {renderedAlbums.map((album) => {
                    const isSelected = activeAlbum?.slug === album.slug
                    return (
                      <button
                        key={album.slug}
                        onClick={() => {
                          setSelectedAlbumSlug(album.slug)
                          setModalIdx(0)
                          setVisibleLimit(6)
                        }}
                        className={cn(
                          "relative w-64 h-36 rounded-2xl overflow-hidden shrink-0 border text-left transition-all duration-200 cursor-pointer group/card",
                          isSelected
                            ? "border-accent-brand ring-4 ring-accent-brand/10 scale-[1.01]"
                            : "border-border/60 hover:border-muted-foreground/30"
                        )}
                      >
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

                        <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col gap-1 z-10">
                          <div className="flex items-center justify-between gap-2 w-full">
                            <span className="font-serif text-sm sm:text-base font-bold text-white line-clamp-1">
                              {album.title}
                            </span>
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-white/20 text-white backdrop-blur-xs">
                              {Array.isArray(album.media) ? album.media.length : 0}
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

              {/* Active selected album details & media grid */}
              {activeAlbum && (
                <section className="animate-fade-in flex flex-col gap-6">
                  
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
                    <p className="text-sm text-muted-foreground leading-relaxed text-pretty max-w-3xl">
                      {activeAlbum.description}
                    </p>
                  </div>

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
                              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/85 via-black/45 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <p className="text-[10px] text-white/95 leading-tight font-medium font-serif truncate">
                                  {item.title}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>

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
            </>
          )}

        </div>
      </main>

      {/* === SPLIT SCREEN CINEMATIC LIGHTBOX MODAL === */}
      {modalOpen && mediaList.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-10 select-none animate-fade-in">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          
          <div className="relative w-full max-w-5xl h-[85vh] md:h-[75vh] bg-card border border-border rounded-2xl overflow-hidden shadow-2xl z-10">
            <div className="grid grid-cols-1 md:grid-cols-5 h-full w-full">
              
              {/* LEFT SIDE PANEL: Text memory details and typographic controls */}
              <div className="md:col-span-2 flex flex-col justify-between p-6 sm:p-8 bg-surface border-b md:border-b-0 md:border-r border-border h-[40%] md:h-full overflow-y-auto">
                <div>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-accent-brand/10 text-accent-brand text-[10px] font-mono font-semibold uppercase tracking-wider">
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
                      className="size-10 rounded-full border border-border bg-background text-muted-foreground hover:text-foreground flex items-center justify-center hover:border-foreground/30 transition-all cursor-pointer font-mono font-bold"
                      title={L.close}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE PANEL: Full size viewport image/video */}
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