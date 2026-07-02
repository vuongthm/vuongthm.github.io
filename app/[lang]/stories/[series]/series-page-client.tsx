"use client"

import { notFound } from "next/navigation"
import Image from "next/image"
import { Link } from "@/components/ui/link"
import { ArrowLeft, BookOpen, Calendar, ChevronRight, ChevronLeft, Image as ImageIcon, X, ZoomIn, ZoomOut } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BackToTop } from "@/components/features/back-to-top"
import { getSeriesBySlug, getChaptersBySeriesSlug, formatDate, type Lang } from "@/lib/data"
import { cn } from "@/lib/utils"
import { useState, useRef } from "react"

interface SeriesPageClientProps {
  series: string
  lang: Lang
}

const STATUS_LABELS = {
  ongoing: { en: "Ongoing", vi: "Đang viết" },
  completed: { en: "Completed", vi: "Hoàn thành" },
}

// Bộ nhãn chú thích mở rộng thành 6 ảnh chuẩn hóa (đầy đủ bản dịch Việt - Anh)
const INTERNSHIP_ALBUM_LABELS = [
  { en: "Headquarters & Office Space", vi: "Trụ sở & Không gian văn phòng" },
  { en: "Technical Infrastructure & Lab Room", vi: "Hạ tầng kỹ thuật & Phòng máy LAB" },
  { en: "Mentors & Colleagues Memories", vi: "Đồng nghiệp & Góc kỷ niệm công sở" },
  { en: "My Personal Working Desk Corner", vi: "Góc bàn làm việc cá nhân hàng ngày" },
  { en: "Weekly Team Meeting & Review", vi: "Buổi họp & Thuyết trình báo cáo tuần" },
  { en: "Final Internship Certification Day", vi: "Cột mốc nhận chứng nhận cuối kỳ" }
]

export default function SeriesPageClient({ series: seriesSlug, lang }: SeriesPageClientProps) {
  const series = getSeriesBySlug(seriesSlug, lang)
  if (!series) notFound()

  const chapters = getChaptersBySeriesSlug(seriesSlug, lang)

  // --- TRẠNG THÁI GIAO DIỆN ALBUM ---
  const [activePhotoIdx, setActivePhotoIdx] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false) // Trạng thái phóng to của ảnh chính

  const thumbContainerRef = useRef<HTMLDivElement>(null)

  // Tự động nhận diện Series thực tập chuyên nghiệp
  const isInternshipSeries = 
    seriesSlug.startsWith("internship-") || 
    series.tags.includes("internship") || 
    series.tags.includes("thực tập") ||
    series.tags.includes("workplace")

  // Tự động ánh xạ 6 ảnh album chuẩn hóa tương ứng theo slug của từng doanh nghiệp
  const albumImages = [1, 2, 3, 4, 5, 6].map((num, idx) => ({
    src: `/media/stories/${seriesSlug}/album-${num}.png`,
    label: INTERNSHIP_ALBUM_LABELS[idx][lang]
  }))

  // Hàm trượt thanh thumbnail sang trái hoặc phải
  const scrollThumbnails = (direction: "left" | "right") => {
    if (thumbContainerRef.current) {
      const scrollAmount = 140
      thumbContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      })
    }
  }

  // Mở trình xem ảnh toàn màn hình (Lightbox)
  const openLightbox = (index: number) => {
    setLightboxIdx(index)
    setIsZoomed(false)
    setLightboxOpen(true)
  }

  const prevLightboxImg = () => {
    setIsZoomed(false)
    setLightboxIdx((prev) => (prev - 1 + albumImages.length) % albumImages.length)
  }

  const nextLightboxImg = () => {
    setIsZoomed(false)
    setLightboxIdx((prev) => (prev + 1) % albumImages.length)
  }

  return (
    <>
      <Header />
      <BackToTop />
      <main className="pt-14">
        {/* Banner Cover ảnh bìa chính */}
        <div className="relative h-[45vh] min-h-[280px] max-h-[420px] overflow-hidden bg-muted">
          <Image src={series.coverImage} alt={series.title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
          <div className="absolute top-6 left-0 right-0 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <Link href="/stories" className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors">
              <ArrowLeft size={14} /> {lang === "en" ? "All Stories" : "Tất cả chuyện kể"}
            </Link>
          </div>
          <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-8">
            <Badge className={cn("mb-3 border-0 text-xs", series.status === "ongoing" ? "bg-accent-brand/90 text-accent-brand-foreground" : "bg-white/20 text-white")}>
              {STATUS_LABELS[series.status][lang]}
            </Badge>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-tight">{series.title}</h1>
          </div>
        </div>

        {/* Tóm tắt Series */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mb-6">{series.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1.5"><BookOpen size={14} /> {series.chapterCount} {lang === "en" ? "chapters" : "chương"}</span>
            <span className="flex items-center gap-1.5"><Calendar size={14} /> {lang === "en" ? "Started" : "Bắt đầu"} {formatDate(series.startDate, lang)}</span>
          </div>

          {/* === NÚT BANNER TRÊN DI ĐỘNG: Bấm vào mở trình xem ảnh Album tương tác === */}
          {isInternshipSeries && (
            <div className="lg:hidden mt-2">
              <button
                onClick={() => openLightbox(0)}
                className="w-full flex items-center justify-between gap-3 p-4 rounded-xl border border-accent-brand/20 bg-accent-brand/5 hover:bg-accent-brand/10 text-foreground transition-all duration-150 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-lg bg-accent-brand/10 flex items-center justify-center text-accent-brand">
                    <ImageIcon size={18} className="animate-pulse" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold">{lang === "en" ? "Interactive Photos Album" : "Bộ sưu tập ảnh thực tế"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{lang === "en" ? "Click to view full screen photos & swipe" : "Bấm để phóng to và lướt xem ảnh thực tế"}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-accent-brand" />
              </button>
            </div>
          )}
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8"><div className="border-t border-border" /></div>

        {/* Bố cục lưới 2 cột */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-9 gap-10 lg:gap-14 items-start">
            
            {/* Cột trái (6/9): Danh sách các chương */}
            <div className="lg:col-span-6 min-w-0">
              <h2 className="font-serif text-xl font-semibold text-foreground mb-6">
                {lang === "en" ? "Chapters" : "Danh sách chương"}
              </h2>
              <div className="flex flex-col">
                {chapters.map((chapter) => (
                  <Link 
                    key={chapter.slug} 
                    href={`/stories/${seriesSlug}/${chapter.slug}`} 
                    className="group flex items-start gap-4 py-4 border-b border-border last:border-0 hover:bg-muted/30 -mx-3 px-3 rounded-lg transition-colors"
                  >
                    <span className="shrink-0 w-7 h-7 mt-0.5 rounded-full bg-muted flex items-center justify-center text-xs font-mono text-muted-foreground group-hover:bg-accent-brand group-hover:text-accent-brand-foreground transition-colors">
                      {chapter.part}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-medium text-foreground group-hover:text-accent-brand transition-colors mb-1">{chapter.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{chapter.preview}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(chapter.date, lang)}</p>
                    </div>
                    <ChevronRight size={16} className="shrink-0 mt-1 text-muted-foreground group-hover:text-accent-brand transition-colors" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Cột phải (3/9): Sticky Sidebar động (Tự đổi dạng dựa trên loại Series) */}
            <div className="hidden lg:flex lg:col-span-3 lg:sticky lg:top-24 flex-col items-center">
              
              {isInternshipSeries ? (
                /* === GIAO DIỆN ALBUM ẢNH TƯƠNG TÁC CHO CÁC KỲ THỰC TẬP === */
                <div className="w-full flex flex-col gap-4">
                  <div className="w-full text-left pb-1 border-b border-border flex items-center gap-2">
                    <ImageIcon size={13} className="text-accent-brand" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-accent-brand font-mono">
                      {lang === "en" ? "INTERNSHIP ALBUM" : "BỘ SƯU TẬP THỰC TẾ"}
                    </p>
                  </div>

                  {/* Ảnh chính lớn (Bấm vào để mở Lightbox phóng to ảnh) */}
                  <div 
                    onClick={() => openLightbox(activePhotoIdx)}
                    className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-muted border border-border/60 shadow-sm transition-all duration-300 group cursor-zoom-in"
                  >
                    <Image
                      src={albumImages[activePhotoIdx].src}
                      alt={albumImages[activePhotoIdx].label}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
                      <p className="text-xs text-white/95 leading-tight font-medium">
                        {albumImages[activePhotoIdx].label}
                      </p>
                    </div>
                  </div>

                  {/* Vùng chọn ảnh Thumbnail ngang với nút điều hướng trượt sang hai bên */}
                  <div className="relative w-full flex items-center group/thumbs">
                    <button 
                      onClick={() => scrollThumbnails("left")}
                      className="absolute -left-2 z-10 size-6 rounded-full border border-border bg-background shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground opacity-0 group-hover/thumbs:opacity-100 transition-opacity duration-200 cursor-pointer"
                    >
                      <ChevronLeft size={12} />
                    </button>

                    <div 
                      ref={thumbContainerRef}
                      className="w-full flex gap-2 overflow-x-auto scrollbar-none py-1"
                    >
                      {albumImages.map((img, idx) => (
                        <button
                          key={img.src}
                          onClick={() => setActivePhotoIdx(idx)}
                          className={cn(
                            "relative size-12 rounded-lg overflow-hidden border shrink-0 transition-all duration-150 cursor-pointer",
                            idx === activePhotoIdx 
                              ? "border-accent-brand ring-2 ring-accent-brand/20 scale-[1.03]" 
                              : "border-border hover:border-muted-foreground/40 opacity-70 hover:opacity-100"
                          )}
                          aria-label={`View photo ${idx + 1}`}
                        >
                          <Image
                            src={img.src}
                            alt=""
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={() => scrollThumbnails("right")}
                      className="absolute -right-2 z-10 size-6 rounded-full border border-border bg-background shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground opacity-0 group-hover/thumbs:opacity-100 transition-opacity duration-200 cursor-pointer"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>
                  
                  {/* Trích dẫn tâm đắc dưới Album */}
                  <div className="mt-2 text-center w-full max-w-xs pt-4 border-t border-border/40">
                    <p className="text-xs text-muted-foreground leading-relaxed italic">
                      {lang === "en" 
                        ? "“Every day at work is another step toward a professional engineer.”" 
                        : "“Mỗi ngày đi làm là một viên gạch đắp xây hành trình kỹ sư chuyên nghiệp.”"}
                    </p>
                  </div>
                </div>
              ) : (
                /* === GIAO DIỆN BÌA SÁCH MẶC ĐỊNH CHO HỒI KÝ/TRUYỆN CHỮ KHÁC === */
                <>
                  <div className="relative w-48 h-64 rounded-r-lg bg-surface border-y border-r border-border shadow-md flex flex-col justify-between p-5 overflow-hidden transition-all duration-300 hover:shadow-lg border-l-[6px] border-l-accent-brand select-none">
                    <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-black/10 shadow-[1px_0_3px_rgba(0,0,0,0.1)]" />
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 font-mono">
                      {lang === "en" ? "Memoir" : "Hồi ký"}
                    </div>
                    <div className="my-auto">
                      <h3 className="font-heading text-base font-bold text-foreground leading-tight line-clamp-3">
                        {series.title}
                      </h3>
                      <div className="w-8 h-[2px] bg-accent-brand/40 mt-3" />
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-foreground font-serif">Vuong</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{formatDate(series.startDate, lang)}</p>
                    </div>
                  </div>

                  <div className="mt-6 text-center w-full max-w-xs border-t border-border/60 pt-5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80 mb-3">
                      {lang === "en" ? "EXCERPT" : "ĐỀ TỪ"}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed italic px-3">
                      &ldquo;{series.description}&rdquo;
                    </p>
                  </div>
                </>
              )}

            </div>

          </div>
        </div>
      </main>

      {/* === HỘP THOẠI TRÌNH DUYỆT ẢNH TOÀN MÀN HÌNH (LIGHTBOX MODAL) === */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 text-white select-none animate-fade-in p-4">
          {/* Nút Đóng */}
          <button 
            onClick={() => setLightboxOpen(false)} 
            className="absolute top-4 right-4 size-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors z-[110]"
            aria-label="Close image viewer"
          >
            <X size={20} />
          </button>
          
          {/* Vùng hiển thị ảnh lớn toàn màn hình */}
          <div className="relative w-full max-w-4xl flex-1 flex items-center justify-center">
            
            {/* Nút lùi ảnh */}
            <button 
              onClick={prevLightboxImg} 
              className="absolute left-2 sm:left-4 z-10 size-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Vùng hiển thị và thu phóng ảnh */}
            <div 
              onClick={() => setIsZoomed((v) => !v)}
              className={cn(
                "relative w-full h-full max-h-[75vh] flex items-center justify-center transition-all duration-300 select-none overflow-hidden",
                isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"
              )}
            >
              <div className={cn(
                "relative w-full h-full transition-transform duration-300",
                isZoomed ? "scale-130" : "scale-100"
              )}>
                <Image
                  src={albumImages[lightboxIdx].src}
                  alt={albumImages[lightboxIdx].label}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>

            {/* Nút tiến ảnh */}
            <button 
              onClick={nextLightboxImg} 
              className="absolute right-2 sm:right-4 z-10 size-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
              aria-label="Next image"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Chú thích ảnh & Nút thao tác nhanh dưới đáy Lightbox */}
          <div className="text-center px-4 mt-4 pb-2 z-10">
            <p className="text-sm font-medium text-white/95">{albumImages[lightboxIdx].label}</p>
            <p className="text-xs text-muted-foreground mt-1 font-mono">{lightboxIdx + 1} / {albumImages.length}</p>
            
            {/* Nút hướng dẫn thu phóng */}
            <button 
              onClick={() => setIsZoomed((v) => !v)}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-muted-foreground hover:text-white transition-all cursor-pointer"
            >
              {isZoomed ? (
                <>
                  <ZoomOut size={12} />
                  <span>{lang === "en" ? "Click to Zoom Out" : "Bấm để thu nhỏ"}</span>
                </>
              ) : (
                <>
                  <ZoomIn size={12} />
                  <span>{lang === "en" ? "Click to Zoom In" : "Bấm để phóng to"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <Footer lang={lang} />
    </>
  )
}