"use client"

import Image from "next/image"
import { Link } from "@/components/ui/link"
import { useState, useEffect, useCallback } from "react"
import { Mail, ChevronLeft, ChevronRight, Users } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BackToTop } from "@/components/features/back-to-top"
import { useLang } from "@/components/providers/lang-provider"

function XIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}
function GithubIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

const SLIDER_IMAGES = [
  { src: "/hometown/dai-lanh-coast.png", caption: "Mũi Điện — where the mountains meet the East Sea" },
  { src: "/about/travel-1.png", caption: "Looking out from the cliff edge" },
  { src: "/hometown/dai-lanh-village.png", caption: "Đại Lãnh fishing village at dawn" },
  { src: "/about/travel-2.png", caption: "Where most ideas happen" },
  { src: "/hometown/dai-lanh-mountain.png", caption: "Jungle slopes to the hidden cove" },
  { src: "/about/travel-3.png", caption: "Evening walk through the old quarter" },
]

function PhotoSlider() {
  const [idx, setIdx] = useState(0)
  const [transitioning, setTransitioning] = useState(false)

  const goTo = useCallback((next: number) => {
    if (transitioning) return
    setTransitioning(true)
    setTimeout(() => {
      setIdx(next)
      setTransitioning(false)
    }, 280)
  }, [transitioning])

  const prev = () => goTo((idx - 1 + SLIDER_IMAGES.length) % SLIDER_IMAGES.length)
  const next = () => goTo((idx + 1) % SLIDER_IMAGES.length)

  useEffect(() => {
    const t = setInterval(() => {
      goTo((idx + 1) % SLIDER_IMAGES.length)
    }, 5000)
    return () => clearInterval(t)
  }, [idx, goTo])

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-muted select-none">
      <div
        className="relative w-full aspect-[16/9]"
        style={{ transition: "opacity 280ms ease", opacity: transitioning ? 0 : 1 }}
      >
        <Image
          src={SLIDER_IMAGES[idx].src}
          alt={SLIDER_IMAGES[idx].caption}
          fill
          className="object-cover"
          priority={idx === 0}
        />
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/60 to-transparent">
          <p className="text-xs text-white/85">{SLIDER_IMAGES[idx].caption}</p>
        </div>
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all backdrop-blur-sm"
          aria-label="Previous photo"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all backdrop-blur-sm"
          aria-label="Next photo"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="flex items-center justify-center gap-1.5 py-3" role="tablist" aria-label="Photo slides">
        {SLIDER_IMAGES.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === idx}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-200 ${
              i === idx
                ? "w-5 h-1.5 bg-accent-brand"
                : "w-1.5 h-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

const TIMELINE_EN = [
  { year: "1998", event: "Born in a small village in central Vietnam. No maps show where I grew up." },
  { year: "2010", event: "Won first district mathematics prize. My father folded the certificate and kept it in a tin box without a word." },
  { year: "2016", event: "Left the village for the city with one bag weighing eleven kilograms. First in my family to attend university." },
  { year: "2018", event: "Built and shipped my first product at 19. Seven users. Two deleted it after two days. Learned more than any class." },
  { year: "2020", event: "Started writing seriously — notes, reflections, technical pieces. Writing became how I think." },
  { year: "2024", event: "Launched this blog. A place to tell the stories I haven't told yet, and share what I've learned along the way." },
]

const TIMELINE_VI = [
  { year: "1998", event: "Sinh ra ở một làng quê nhỏ miền Trung Việt Nam. Không có tấm bản đồ nào ghi tên nơi tôi lớn lên." },
  { year: "2010", event: "Đoạt giải Nhất toán cấp huyện. Cha tôi gấp tờ giấy khen, cất vào hộp sắt rồi không nói gì thêm." },
  { year: "2016", event: "Rời quê lên thành phố với một chiếc ba lô nặng mười một ký. Người đầu tiên trong gia đình đặt chân vào đại học." },
  { year: "2018", event: "Tự mình làm và ra mắt sản phẩm đầu tiên năm 19 tuổi. Bảy người dùng. Hai người xóa sau hai ngày. Học được nhiều hơn bất kỳ môn học nào." },
  { year: "2020", event: "Bắt đầu viết nghiêm túc — ghi chú, suy nghĩ, bài kỹ thuật. Viết trở thành cách tôi tư duy." },
  { year: "2024", event: "Mở blog này. Nơi để kể những câu chuyện chưa kịp nói và chia sẻ những gì đã học được." },
]

const INTERESTS = ["Writing", "Programming", "Learning systems", "Mental models", "Stoicism", "Long walks", "Vietnamese history", "Independent films", "Coffee", "Minimalism", "TypeScript", "Next.js", "Reading", "Journaling", "Product design"]
const INTERESTS_VI = ["Viết lách", "Lập trình", "Hệ thống học tập", "Mô hình tư duy", "Chủ nghĩa khắc kỷ", "Đi bộ dài", "Lịch sử Việt Nam", "Phim độc lập", "Cà phê", "Chủ nghĩa tối giản", "TypeScript", "Next.js", "Đọc sách", "Nhật ký", "Thiết kế sản phẩm"]

const COPY = {
  en: {
    heading: "About",
    intro1: "I'm Vuong — I grew up barefoot on a dirt road in a village so small it didn't appear on any map. My earliest memories are of walking three kilometers to school before sunrise, of a library with four hundred books that felt infinite, and of a father who kept my school prizes in a tin box and never had to say he was proud.",
    intro2: "I left for the city at eighteen with one bag and a scholarship I hadn't told anyone about until the morning I left. I've spent the years since building things, breaking things, writing about both. I taught myself to code, shipped products that mostly failed, and eventually understood that failure is just the first draft of understanding.",
    intro3: "I write this blog because writing is how I think — it finds the gaps in my understanding and forces me to fill them. I write about the life I came from and the skills I've picked up along the way, because both of those things feel true and worth sharing.",
    timelineHeading: "Timeline",
    interestsHeading: "Interests & Tools",
    photosHeading: "Through the lens",
    photosDesc: "Places I've been, moments I've kept.",
    peopleLink: "Meet the people in my life",
    contactHeading: "Get in touch",
    contactNote: "I'm always happy to hear from readers. The best way to reach me is by email.",
  },
  vi: {
    heading: "Về tôi",
    intro1: "Tôi là Vuong — lớn lên chân trần trên con đường đất ở một ngôi làng nhỏ đến mức không có tấm bản đồ nào ghi tên. Ký ức sớm nhất của tôi là những buổi đi bộ ba cây số đến trường trước khi mặt trời mọc, thư viện nhỏ với bốn trăm cuốn sách nhưng với tôi thì vô tận.",
    intro2: "Tôi rời quê năm mười tám tuổi với một chiếc ba lô và một suất học bổng chưa kịp kể với ai. Những năm sau đó, tôi tự học lập trình, làm ra những sản phẩm thất bại nhiều hơn thành công, và dần hiểu ra rằng thất bại chỉ là bản nháp đầu tiên của sự hiểu biết.",
    intro3: "Tôi viết blog này vì viết là cách tôi suy nghĩ — nó tìm ra những chỗ hổng trong hiểu biết của mình và buộc tôi phải lấp đầy.",
    timelineHeading: "Các mốc quan trọng",
    interestsHeading: "Quan tâm & Công cụ",
    photosHeading: "Qua ống kính",
    photosDesc: "Những nơi đã đến, những khoảnh khắc đã giữ lại.",
    peopleLink: "Những người trong cuộc đời tôi",
    contactHeading: "Liên hệ",
    contactNote: "Tôi luôn vui khi nghe tin từ độc giả. Cách tốt nhất để liên lạc là qua email.",
  },
}

export default function AboutPage() {
  const { lang } = useLang()
  const c = COPY[lang]
  const timeline = lang === "en" ? TIMELINE_EN : TIMELINE_VI
  const interests = lang === "en" ? INTERESTS : INTERESTS_VI

  return (
    <>
      <Header />
      <BackToTop />

      <main className="pt-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-16">

          <section className="mb-14">
            <div className="flex flex-col sm:flex-row items-start gap-6 sm:gap-8 mb-8">
              <div className="shrink-0">
                <div className="relative size-24 sm:size-28 rounded-2xl overflow-hidden bg-muted border border-border">
                  <Image
                    src="/avatar.png"
                    alt="Vuong"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-2">
                  {c.heading}
                </h1>
                <p className="text-muted-foreground text-sm">
                  vuongthm ·{" "}
                  <span className="text-accent-brand">vuongthm.it@gmail.com</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 text-base text-foreground leading-[1.85]">
              <p>{c.intro1}</p>
              <p>{c.intro2}</p>
              <p>{c.intro3}</p>
            </div>
          </section>

          <section className="mb-14">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-semibold text-foreground">
                  {c.photosHeading}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">{c.photosDesc}</p>
              </div>
              <Link
                href="/about/people"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-accent-brand/40 hover:bg-accent-brand/5 transition-all duration-150 shrink-0"
              >
                <Users size={14} />
                <span className="hidden sm:inline">{c.peopleLink}</span>
                <span className="sm:hidden">People</span>
              </Link>
            </div>
            <PhotoSlider />
          </section>

          <section id="timeline" className="mb-14">
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-foreground mb-8">
              {c.timelineHeading}
            </h2>
            <ol className="relative border-l border-border pl-6 flex flex-col gap-6">
              {timeline.map((item, i) => (
                <li key={i} className="relative">
                  <div className="absolute -left-[25px] top-1 size-3 rounded-full border-2 border-accent-brand bg-background" />
                  <time className="text-xs font-mono text-accent-brand font-medium block mb-1">
                    {item.year}
                  </time>
                  <p className="text-base text-foreground leading-relaxed">
                    {item.event}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mb-14">
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-foreground mb-6">
              {c.interestsHeading}
            </h2>
            <div className="flex flex-wrap gap-2">
              {interests.map((item) => (
                <span
                  key={item}
                  className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-sm hover:bg-accent-brand hover:text-accent-brand-foreground transition-colors duration-150 cursor-default"
                >
                  {item}
                </span>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-foreground mb-4">
              {c.contactHeading}
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed mb-6">
              {c.contactNote}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="mailto:vuongthm.it@gmail.com"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors duration-150"
              >
                <Mail size={15} />
                vuongthm.it@gmail.com
              </a>
              <a
                href="https://twitter.com/vuongthm"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors duration-150"
              >
                <XIcon size={15} />
                @vuongthm
              </a>
              <a
                href="https://github.com/vuongthm"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors duration-150"
              >
                <GithubIcon size={15} />
                vuongthm
              </a>
            </div>
          </section>
        </div>
      </main>

      <Footer lang={lang} />
    </>
  )
}