"use client"

import Image from "next/image"
import { Link } from "@/components/ui/link"
import { useState, useEffect, useCallback } from "react"
import { Mail, ChevronLeft, ChevronRight, Users, Compass, Code, PenTool, ExternalLink } from "lucide-react"
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
  { src: "/hometown/dai-lanh-coast.png", caption: "Dai Lanh Beach - Where the mountains meet the East Sea." },
  { src: "/hometown/dai-lanh-village.png", caption: "The quiet fishing village of Dai Lanh at sunrise." },
  { src: "/hometown/dai-lanh-mountain.png", caption: "Jungle slopes descending into the hidden cove." },
  { src: "/about/travel-1.png", caption: "Looking out from the rugged cliff edge." },
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
    <div className="relative w-full overflow-hidden rounded-2xl bg-muted select-none border border-border/50">
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
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/70 to-transparent">
          <p className="text-xs text-white/90 font-medium">{SLIDER_IMAGES[idx].caption}</p>
        </div>
        <button
          onClick={prev}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all backdrop-blur-sm cursor-pointer border border-white/10"
          aria-label="Previous photo"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={next}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all backdrop-blur-sm cursor-pointer border border-white/10"
          aria-label="Next photo"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="flex items-center justify-center gap-1.5 py-3 bg-surface" role="tablist" aria-label="Photo slides">
        {SLIDER_IMAGES.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === idx}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-200 cursor-pointer ${
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
  { year: "1998", title: "Roots", event: "Born in Dai Lanh, Phu Yen. A coastal village surrounded by wild mountains." },
  { year: "2016", title: "The Leap", event: "Left the village for the city with an 11kg bag. Became the first in my family to attend university." },
  { year: "2018", title: "The Craft", event: "Taught myself to code. Built and launched my first software product at 19." },
  { year: "2020", title: "The Word", event: "Began writing notes, reviews, and reflections regularly. Writing became my primary tool for clear thinking." },
  { year: "2024", title: "The Garden", event: "Launched this digital space to document memoirs, technical notes, and lessons learned." }
]

const TIMELINE_VI = [
  { year: "1998", title: "Nguồn cội", event: "Sinh ra ở làng chài Đại Lãnh, Phú Yên. Một làng quê nghèo có biển xanh bao bọc bởi núi rừng hoang sơ." },
  { year: "2016", title: "Bước chuyển", event: "Rời quê vào thành phố với ba lô 11kg. Trở thành người đầu tiên trong gia đình bước chân vào giảng đường đại học." },
  { year: "2018", title: "Khởi tạo", event: "Tự học lập trình. Tự tay thiết kế và ra mắt sản phẩm phần mềm đầu tiên năm 19 tuổi." },
  { year: "2020", title: "Tư duy", event: "Bắt đầu viết ghi chép và suy ngẫm một cách có hệ thống. Viết trở thành cách tôi làm sạch tư duy." },
  { year: "2024", title: "Mảnh vườn", event: "Mở không gian số này để lưu trữ những hồi ký cuộc đời, ghi chép kỹ thuật và bài học xương máu." }
]

const INTERESTS_EN = ["Writing", "Software Engineering", "Mental Models", "Stoicism", "Minimalism", "Long Walks", "Independent Films", "Coffee Crafting", "Product Design", "Vietnamese History", "System Architecture", "TypeScript", "Next.js", "Journaling", "Technical Architecture"]
const INTERESTS_VI = ["Viết lách", "Kỹ nghệ Phần mềm", "Mô hình Tư duy", "Khắc kỷ (Stoicism)", "Tối giản (Minimalism)", "Đi bộ dài", "Phim độc lập", "Pha cà phê", "Thiết kế sản phẩm", "Lịch sử Việt Nam", "Kiến trúc hệ thống", "TypeScript", "Next.js", "Viết nhật ký", "Kỹ thuật hệ thống"]

const PRINCIPLES_EN = [
  { icon: <Compass size={18} className="text-accent-brand" />, title: "Stoicism", desc: "Focusing strictly on what is within my control and letting go of what is not." },
  { icon: <Code size={18} className="text-accent-brand" />, title: "Craftsmanship", desc: "Treating code not just as business logic, but as an elegant, durable craft." },
  { icon: <PenTool size={18} className="text-accent-brand" />, title: "Clear Writing", desc: "Writing is the physical manifestation of clear thinking. If I can't write it, I don't understand it yet." }
]

const PRINCIPLES_VI = [
  { icon: <Compass size={18} className="text-accent-brand" />, title: "Chủ nghĩa Khắc kỷ", desc: "Tập trung năng lượng vào những điều có thể kiểm soát, và bình thản chấp nhận những điều còn lại." },
  { icon: <Code size={18} className="text-accent-brand" />, title: "Sự tinh tế của Kỹ nghệ", desc: "Xem mã nguồn không chỉ là logic kinh doanh, mà là một tác phẩm thủ công tinh tế và bền bỉ." },
  { icon: <PenTool size={18} className="text-accent-brand" />, title: "Viết lách mạch lạc", desc: "Viết là sự hiển thị vật lý của tư duy mạch lạc. Nếu chưa viết ra rõ ràng được, nghĩa là tôi chưa thực sự hiểu." }
]

const COPY = {
  en: {
    heading: "About",
    introTitle: "Raised by the waves, shaped by failures.",
    intro1: "I am Vương (vuongthm) — a self-taught software engineer and a quiet writer. I spent my childhood walking barefoot along a three-kilometer dirt road to school in a coastal village in Phú Yên, Vietnam — a place so small that no maps recorded its name. In those years, my world was shaped by a village library of four hundred books and a quiet father who spent his days repairing nets on fishing boats, silently keeping my school awards in a tin box without a word of praise.",
    intro2: "At eighteen, I boarded the earliest bus to the city with a single backpack weighing exactly eleven kilograms and a scholarship I hadn't told anyone about. Since then, I've spent my years building software, writing reviews, and learning from failure. I taught myself to program, shipped applications that mostly failed, and eventually understood that failure is just the necessary first draft of understanding.",
    intro3: "This blog serves as my digital garden. I write because writing forces me to find the gaps in my thinking. Here, I share the memoirs of the life I came from and the engineering notes I gather along the way — because both feel worth preserving.",
    timelineHeading: "Milestones",
    principlesHeading: "Core Beliefs",
    interestsHeading: "Interests & Craft",
    photosHeading: "Through the Lens",
    photosDesc: "Glimpses of Phu Yen and the quiet corners I've kept.",
    peopleLink: "Vòng tròn bạn bè",
    contactHeading: "Get in touch",
    contactNote: "I'm always happy to hear from readers. The best way to reach me is by email.",
  },
  vi: {
    heading: "Về tôi",
    introTitle: "Nuôi dưỡng bởi những con sóng, rèn giũa qua những thất bại.",
    intro1: "Tôi là Vương (vuongthm) — một kỹ sư phần mềm tự học và là một người viết lặng lẽ. Tôi lớn lên chân trần trên con đường đất dài ba cây số dẫn đến trường tại một làng chài ven biển Phú Yên — một ngôi làng nhỏ bé đến mức không có bản đồ nào ghi tên. Tuổi thơ tôi được định hình bởi một thư viện xã vỏn vẹn bốn trăm cuốn sách cũ và một người cha im lặng khâu lưới bên mạn thuyền, âm thầm cất những tờ giấy khen của con vào hộp sắt rỉ sét mà không cần một lời tự hào.",
    intro2: "Năm mười tám tuổi, tôi bước lên chuyến xe sớm nhất để vào thành phố với chiếc ba lô nặng đúng mười một ký và một suất học bổng chưa từng kể với ai. Những năm sau đó, tôi tự học lập trình, tạo ra những sản phẩm phần lớn là thất bại, và dần hiểu ra rằng thất bại chỉ là bản nháp đầu tiên không thể thiếu của sự thấu suốt.",
    intro3: "Blog này là mảnh vườn kỹ thuật số của tôi. Tôi viết vì viết buộc tôi phải đối mặt với những chỗ hổng trong tư duy của mình. Ở đây, tôi chia sẻ những mảnh ký ức về nơi mình đã lớn lên và những ghi chép kỹ nghệ mà tôi tích lũy được trên con đường trưởng thành.",
    timelineHeading: "Hành trình",
    principlesHeading: "Hệ giá trị cốt lõi",
    interestsHeading: "Quan tâm & Công cụ",
    photosHeading: "Qua ống kính",
    photosDesc: "Một vài lát cắt Phú Yên và những góc nhỏ tôi đi qua.",
    peopleLink: "Vòng tròn bạn bè",
    contactHeading: "Liên hệ",
    contactNote: "Tôi luôn vui khi nhận được thư từ độc giả. Cách tốt nhất để kết nối với tôi là qua email.",
  },
}

export default function AboutPage() {
  const { lang } = useLang()
  const c = COPY[lang]
  const timeline = lang === "en" ? TIMELINE_EN : TIMELINE_VI
  const interests = lang === "en" ? INTERESTS_EN : INTERESTS_VI
  const principles = lang === "en" ? PRINCIPLES_EN : PRINCIPLES_VI

  return (
    <>
      <Header />
      <BackToTop />

      <main className="pt-14">
        {/* Synchronized container width max-w-6xl */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-16">

          {/* Hero Profile Section */}
          <section className="mb-14">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 mb-8 text-center sm:text-left">
              <div className="shrink-0">
                <div className="relative size-24 sm:size-28 rounded-2xl overflow-hidden bg-muted border border-border shadow-sm">
                  <Image
                    src="/avatar.png"
                    alt="Tran Hoang Minh Vuong"
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
                <p className="text-muted-foreground text-sm font-medium">
                  vuongthm ·{" "}
                  <span className="text-accent-brand font-mono">vuongthm.it@gmail.com</span>
                </p>
                <p className="text-base text-accent-brand font-serif italic mt-3">
                  &ldquo;{c.introTitle}&rdquo;
                </p>
              </div>
            </div>

            {/* Poetic Narrative Copy */}
            <div className="flex flex-col gap-5 text-base text-foreground leading-[1.85] text-pretty">
              <p>{c.intro1}</p>
              <p>{c.intro2}</p>
              <p>{c.intro3}</p>
            </div>
          </section>

          {/* Interactive Hometown/Phu Yen Photo Slider */}
          <section className="mb-14">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-semibold text-foreground">
                  {c.photosHeading}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">{c.photosDesc}</p>
              </div>
              <Link
                href="/about/people"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-accent-brand/40 hover:bg-accent-brand/5 transition-all duration-150 shrink-0"
              >
                <Users size={13} />
                <span>{c.peopleLink}</span>
              </Link>
            </div>
            <PhotoSlider />
          </section>

          {/* Core Values/Principles Layout */}
          <section className="mb-14">
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-foreground mb-6">
              {c.principlesHeading}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {principles.map((p, i) => (
                <div key={i} className="p-5 rounded-xl border border-border bg-card flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    {p.icon}
                    <h3 className="font-serif font-semibold text-base text-foreground">{p.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Stepper Timeline Section */}
          <section id="timeline" className="mb-14">
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-foreground mb-8">
              {c.timelineHeading}
            </h2>
            <ol className="relative border-l border-border pl-6 flex flex-col gap-6">
              {timeline.map((item, i) => (
                <li key={i} className="relative group">
                  {/* Rotating timeline node on hover */}
                  <div className="absolute -left-[29px] top-1 size-3.5 rounded-full border-2 border-accent-brand bg-background transition-transform duration-300 group-hover:scale-125" />
                  <time className="text-xs font-mono text-accent-brand font-semibold block mb-1">
                    {item.year}
                  </time>
                  <h3 className="font-serif font-bold text-sm text-foreground mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.event}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          {/* Skills Badges */}
          <section className="mb-14">
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-foreground mb-5">
              {c.interestsHeading}
            </h2>
            <div className="flex flex-wrap gap-2">
              {interests.map((item) => (
                <span
                  key={item}
                  className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs hover:bg-accent-brand hover:text-accent-brand-foreground transition-all duration-150 cursor-default"
                >
                  {item}
                </span>
              ))}
            </div>
          </section>

          {/* Contact Section */}
          <section className="border-t border-border/60 pt-10">
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-foreground mb-3">
              {c.contactHeading}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-xl">
              {c.contactNote}
            </p>
            <div className="flex flex-wrap gap-2.5">
              <a
                href="mailto:vuongthm.it@gmail.com"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors duration-150 cursor-pointer"
              >
                <Mail size={14} className="text-muted-foreground" />
                vuongthm.it@gmail.com
              </a>
              <a
                href="https://twitter.com/vuongthm"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors duration-150 cursor-pointer"
              >
                <XIcon size={14} />
                @vuongthm
              </a>
              <a
                href="https://github.com/vuongthm"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors duration-150 cursor-pointer"
              >
                <GithubIcon size={14} />
                vuongthm <ExternalLink size={11} className="text-muted-foreground/60" />
              </a>
            </div>
          </section>
        </div>
      </main>

      <Footer lang={lang} />
    </>
  )
}