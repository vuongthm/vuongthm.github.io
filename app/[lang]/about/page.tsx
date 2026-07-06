"use client"

import Image from "next/image"
import { Link } from "@/components/ui/link"
import { useState, useEffect, useCallback, use } from "react"
import { Mail, ChevronLeft, ChevronRight, Users, Shield, Network, PenTool, Images } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BackToTop } from "@/components/features/back-to-top"
import { cn } from "@/lib/utils"

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
  {
    src: "/hometown/dai-lanh-coast.png",
    caption: {
      en: "Đại Lãnh Beach — where the mountains fall straight into the East Sea.",
      vi: "Bãi biển Đại Lãnh — nơi núi rừng gặp biển Đông.",
    },
  },
  {
    src: "/hometown/dai-lanh-village.png",
    caption: {
      en: "The fishing village of Đại Lãnh, quiet in the early morning light.",
      vi: "Làng chài Đại Lãnh yên bình trong buổi sớm bình minh.",
    },
  },
  {
    src: "/about/travel-1.png",
    caption: {
      en: "Looking out to sea from the rugged cliff — the spot I'd often sit alone.",
      vi: "Nhìn ra biển từ mỏm đá cheo leo — nơi tôi hay ngồi một mình.",
    },
  },
]

function PhotoSlider({ lang }: { lang: "en" | "vi" }) {
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
    <div className="relative w-full overflow-hidden rounded-2xl bg-muted select-none border border-border/50 animate-fade-in">
      <div
        className="relative w-full h-80 sm:h-[500px] lg:h-[580px]"
        style={{ transition: "opacity 280ms ease", opacity: transitioning ? 0 : 1 }}
      >
        <Image
          src={SLIDER_IMAGES[idx].src}
          alt={SLIDER_IMAGES[idx].caption[lang]}
          fill
          className="object-cover"
          priority={idx === 0}
        />
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/70 to-transparent">
          <p className="text-xs text-white/90 font-medium">{SLIDER_IMAGES[idx].caption[lang]}</p>
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
              // Fixed: swapped incorrect variable 'current' to state variable 'idx'
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
  {
    year: "2005",
    title: "Origins",
    event: "Born in Đại Lãnh — a small fishing village on the coast of Khánh Hòa, where the mountains slide straight into the sea and the horizon feels like the whole world."
  },
  {
    year: "2021",
    title: "The First Departure",
    event: "At sixteen, left the village for a small town 25 km away — the closest place with a high school. The first time I truly understood what it meant to leave something behind."
  },
  {
    year: "2023",
    title: "The Big Leap",
    event: "Packed a suitcase and headed to Đà Nẵng to begin university. Enrolled in Network Engineering & Information Security — a choice that felt equal parts terrifying and right."
  },
  {
    year: "2024",
    title: "The Uncertain Year",
    event: "Freshman year. Stood at a crossroads, questioning the path I'd chosen. Learned that uncertainty isn't a sign of being lost — it's often the beginning of direction."
  },
  {
    year: "2026",
    title: "The Garden",
    event: "Built this space to document what I'm learning and who I'm becoming — a living archive of technical notes, personal stories, and the quiet lessons that don't fit in textbooks."
  },
]

const TIMELINE_VI = [
  {
    year: "2005",
    title: "Nguồn cội",
    event: "Sinh ra ở Đại Lãnh — một làng chài nhỏ ven biển Khánh Hòa, nơi núi rừng đổ thẳng xuống biển Đông và chân trời như cả thế giới thu lại."
  },
  {
    year: "2021",
    title: "Lần đầu rời đi",
    event: "Năm 16 tuổi, rời làng vào thị trấn cách nhà 25km — nơi gần nhất có trường cấp 3. Lần đầu tiên tôi thực sự hiểu cảm giác bỏ lại điều gì đó phía sau."
  },
  {
    year: "2023",
    title: "Cú nhảy lớn",
    event: "Kéo chiếc vali lên đường vào Đà Nẵng theo đuổi con đường đại học. Chọn ngành Mạng và An toàn thông tin — quyết định vừa đáng sợ, vừa thấy đúng."
  },
  {
    year: "2024",
    title: "Năm chông chênh",
    event: "Năm nhất đại học. Đứng giữa ngưỡng cửa, không chắc chắn về con đường mình chọn. Rồi nhận ra: chông chênh không có nghĩa là lạc lối — đôi khi đó chính là lúc bắt đầu tìm được hướng."
  },
  {
    year: "2026",
    title: "Mảnh vườn",
    event: "Mở không gian số này để lưu trữ những hồi ký cuộc đời, ghi chép kỹ thuật và bài học xương máu."
  }
]

const INTERESTS_EN = [
  "Network Engineering", "Cybersecurity", "Information Security", "Routing & Switching",
  "Firewall & VPN", "Packet Analysis", "Linux", "CTF Challenges",
  "Long Walks", "Stoicism", "Minimalism", "Writing", "Independent Films",
  "Coffee Crafting", "Vietnamese History", "Journaling"
]

const INTERESTS_VI = [
  "Kỹ nghệ Mạng", "An ninh mạng", "An toàn thông tin", "Định tuyến & Chuyển mạch",
  "Tường lửa & VPN", "Phân tích gói tin", "Linux", "CTF Challenges",
  "Đi bộ dài", "Khắc kỷ (Stoicism)", "Tối giản", "Viết lách", "Phim độc lập",
  "Pha cà phê", "Lịch sử Việt Nam", "Viết nhật ký"
]

const PRINCIPLES_EN = [
  {
    icon: <Network size={18} className="text-accent-brand" />,
    title: "Think in Systems",
    desc: "A network is never just cables and protocols — it's a living system with logic, behavior, and failure modes. I approach every problem by understanding the whole before fixing the part."
  },
  {
    icon: <Shield size={18} className="text-accent-brand" />,
    title: "Security as Mindset",
    desc: "Security isn't a feature you bolt on at the end. It's a way of thinking — asking 'what could go wrong?' before anything is built, not after something breaks."
  },
  {
    icon: <PenTool size={18} className="text-accent-brand" />,
    title: "Writing to Understand",
    desc: "If I can't explain something clearly in writing, I don't truly understand it yet. Writing is how I pressure-test my own knowledge and share what I've learned."
  }
]

const PRINCIPLES_VI = [
  {
    icon: <Network size={18} className="text-accent-brand" />,
    title: "Tư duy theo hệ thống",
    desc: "Một hệ thống mạng không chỉ là dây cáp và giao thức — đó là một cơ thể sống với logic, hành vi và điểm sự cố riêng. Tôi tiếp cận mọi vấn đề bằng cách hiểu toàn bộ trước khi sửa từng phần."
  },
  {
    icon: <Shield size={18} className="text-accent-brand" />,
    title: "Bảo mật là tư duy",
    desc: "An ninh mạng không phải thứ gắn thêm vào cuối. Đó là cách tư duy — luôn hỏi 'điều gì có thể sai?' trước khi xây dựng, thay vì đợi đến lúc mọi thứ đã vỡ."
  },
  {
    icon: <PenTool size={18} className="text-accent-brand" />,
    title: "Viết để thực sự hiểu",
    desc: "Nếu tôi chưa giải thích rõ ràng được bằng văn viết, tức là tôi chưa thực sự hiểu. Viết là cách tôi kiểm tra lại kiến thức của mình và chia sẻ những gì đã học được."
  }
]

const COPY = {
  en: {
    heading: "About",
    introTitle: "Grown up by the sea, drawn toward the invisible architecture of the internet.",
    intro1: "I am Vuong (vuongthm) — a student of Network Engineering & Security in Da Nang, raised barefoot along the coast of Dai Lanh, Khanh Hoa. It is a quiet place that doesn't appear on most maps, yet its seascape was engraved on Tuyên Đỉnh (one of Hue's Cửu Đỉnh) in 1836. My childhood was shaped by the East Sea, a library of four hundred old books, and the quiet shadow of a father mending fishing nets.",
    intro2: "At sixteen, I left the village to attend high school 25 km away — my first departure. At eighteen, I moved to Đà Nẵng with an eleven-kilogram suitcase to study the invisible architecture of the internet. Navigating the uncertainties of my early university years taught me that being unsettled is simply the necessary threshold where real work and self-discovery begin.",
    intro3: "This blog is my digital garden, where I archive my technical notes from server racks, honest reflections on self-learning, and memoirs of the coast. I hope something here resonates with your own journey.",
    timelineHeading: "Milestones",
    principlesHeading: "Core Beliefs",
    interestsHeading: "Interests & Tools",
    photosHeading: "Through the Lens",
    photosDesc: "Glimpses of Đại Lãnh and the coast I still call home.",
    peopleLink: "Friends Circle",
    contactHeading: "Get in touch",
    contactNote: "I'm always glad to hear from readers — whether you have a question, want to share a thought, or just want to say hello. Email is the best way to reach me.",
    albumBtn: "Explore My Memory Album",
  },
  vi: {
    heading: "Về tôi",
    introTitle: "Lớn lên bên biển, bị cuốn vào kiến trúc vô hình của internet.",
    intro1: "Tôi là Vương (vuongthm) — sinh viên chuyên ngành Mạng & An toàn thông tin tại Đà Nẵng, lớn lên chân trần bên bãi cát Đại Lãnh, một làng chài nhỏ ven biển Khánh Hòa. Nơi đây hoang sơ đến mức không có tên trên hầu hết bản đồ thông thường, nhưng đã được vua Minh Mạng khắc họa nét phong cảnh sơn thủy lên Tuyên Đỉnh của Hoàng cung Huế năm 1836. Tuổi thơ tôi được nuôi dưỡng bởi biển Đông rộng lớn, một thư viện nhỏ bốn trăm cuốn sách cũ, và bóng dáng im lặng của người cha vá lưới khâu thuyền.",
    intro2: "Năm mười sáu tuổi, tôi bắt đầu cuộc hành trình rời làng dã ngoại vào thị trấn cách nhà 25km để trọ học cấp ba. Năm mười tám tuổi, tôi kéo chiếc vali mười một ký đến Đà Nẵng, bước vào kiến trúc vô hình của mạng internet. Trải qua những hoài nghi chông chênh thuở ban đầu, tôi hiểu rằng sự mơ hồ không phải là lạc lối, mà là lúc công việc thực tế và quá trình trưởng thành thực sự bắt đầu.",
    intro3: "Không gian này là mảnh vườn số nơi tôi ghi lại hành trình đó: những ghi chép kỹ thuật từ phòng máy chủ cho đến những hồi ký vụn vặt bên bờ biển. Hy vọng góc nhỏ này mang lại chút đồng điệu cho con đường bạn đang đi.",
    timelineHeading: "Hành trình",
    principlesHeading: "Hệ giá trị cốt lõi",
    interestsHeading: "Quan tâm & Công cụ",
    photosHeading: "Qua ống kính",
    photosDesc: "Một vài lát cắt Đại Lãnh và dải bờ biển tôi vẫn gọi là nhà.",
    peopleLink: "Vòng tròn bạn bè",
    contactHeading: "Liên hệ",
    contactNote: "Tôi luôn vui khi nhận được tin từ độc giả — dù là một câu hỏi, một chia sẻ, hay chỉ đơn giản là lời chào. Email là cách tốt nhất để kết nối với tôi.",
    albumBtn: "Khám phá Bộ sưu tập ký ức",
  },
}

export default function AboutPage({ params }: { params: Promise<{ lang: "en" | "vi" }> }) {
  const { lang } = use(params)
  const c = COPY[lang]
  const timeline = lang === "en" ? TIMELINE_EN : TIMELINE_VI
  const interests = lang === "en" ? INTERESTS_EN : INTERESTS_VI
  const principles = lang === "en" ? PRINCIPLES_EN : PRINCIPLES_VI

  return (
    <>
      <Header />
      <BackToTop />

      <main className="pt-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-0">
          <div className="grid grid-cols-1 lg:grid-cols-9 gap-10 lg:gap-14 items-start">
            
            {/* LEFT COLUMN: Main biographical narrative, beliefs, timeline, interests, and contact */}
            <div className="lg:col-span-6 flex flex-col gap-14 order-last lg:order-first">
              
              {/* Biographical Narrative Block */}
              <div className="text-center sm:text-left flex flex-col justify-between py-1 h-full min-h-[360px] md:min-h-[440px]">
                <div>
                  <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-2">
                    {c.heading}
                  </h1>
                  <p className="text-muted-foreground text-sm font-medium">
                    vuongthm
                  </p>
                </div>

                <div className="flex flex-col gap-4 text-sm sm:text-base text-foreground leading-[1.8] text-pretty mt-6">
                  <p>{c.intro1}</p>
                  <p>{c.intro2}</p>
                  <p>{c.intro3}</p>

                  {/* 
                    VỊ TRÍ 1 (Cực kỳ nổi bật - CTA chính):
                    - Đặt nút bấm lớn sang trọng ngay dưới dòng tự sự giới thiệu bản thân
                    - Có hiệu ứng trượt nhẹ mũi tên khi người dùng di chuột
                  */}
                  <div className="mt-4 flex justify-center sm:justify-start">
                    <Link
                      href="/my-album"
                      className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl border border-accent-brand/20 bg-accent-brand/5 hover:bg-accent-brand hover:text-accent-brand-foreground text-accent-brand text-xs sm:text-sm font-semibold transition-all duration-200 group/btn shadow-xs hover:scale-[1.02]"
                    >
                      <Images size={15} className="animate-pulse" />
                      <span>{c.albumBtn}</span>
                      <ChevronRight size={13} className="group-hover/btn:translate-x-1.5 transition-transform duration-200" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Core Beliefs Section */}
              <section>
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

              {/* Milestones Stepper Timeline Section */}
              <section id="timeline">
                <h2 className="font-serif text-xl sm:text-2xl font-semibold text-foreground mb-8">
                  {c.timelineHeading}
                </h2>
                <ol className="relative border-l border-border pl-6 flex flex-col gap-6">
                  {timeline.map((item, i) => (
                    <li key={i} className="relative group">
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

              {/* Interests & Tools Badges Section */}
              <section>
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
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xl text-pretty">
                  {c.contactNote}
                </p>
              </section>

            </div>

            {/* RIGHT COLUMN: Sticky Portrait Card (Spans 3/9 width) */}
            <div className="lg:col-span-3 lg:sticky lg:top-24 flex flex-col items-center order-first lg:order-last">
              
              <div className="shrink-0 w-full max-w-[240px] sm:w-56 md:w-64 lg:w-64 aspect-[4/5] relative rounded-2xl overflow-hidden bg-muted border-y border-l border-border border-r-[6px] border-r-accent-brand shadow-sm select-none">
                <Image
                  src="/avatar.png"
                  alt="Avatar Portrait"
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Right Column: Mini description under the Portrait Avatar Card */}
              <div className="mt-6 text-center w-full max-w-xs border-t border-border/60 pt-5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80 mb-3">
                  {lang === "en" ? "QUOTE" : "ĐỀ TỪ"}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed italic px-3">
                  &ldquo;{c.introTitle}&rdquo;
                </p>
              </div>

              {/* 
                VỊ TRÍ 2 (Đồng bộ - Hàng icon liên kết dưới Avatar):
                - Icon Album thiết kế hiện đại có vòng sóng nhấp nháy animate-ping nổi bật lôi cuốn người dùng bấm vào
              */}
              <div className="flex items-center justify-center gap-2.5 w-full max-w-[240px] border-t border-border/60 pt-4">
                <Link
                  href="/my-album"
                  aria-label="My Album"
                  className="size-9 flex items-center justify-center rounded-lg border border-accent-brand/40 bg-accent-brand/10 text-accent-brand hover:bg-accent-brand hover:text-accent-brand-foreground hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer relative group/album"
                >
                  <Images size={15} />
                  <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-accent-brand animate-ping" />
                  <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-accent-brand" />
                </Link>

                <Link
                  href="/about/people"
                  aria-label="Friends Circle"
                  className="size-9 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-accent-brand/40 hover:bg-accent-brand/5 transition-all duration-150 cursor-pointer"
                >
                  <Users size={15} />
                </Link>
                <a
                  href="mailto:vuongthm.it@gmail.com"
                  aria-label="Email"
                  className="size-9 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-accent-brand/40 hover:bg-accent-brand/5 transition-all duration-150 cursor-pointer"
                >
                  <Mail size={15} />
                </a>
                <a
                  href="https://twitter.com/vuongthm"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter / X"
                  className="size-9 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-accent-brand/40 hover:bg-accent-brand/5 transition-all duration-150 cursor-pointer"
                >
                  <XIcon size={14} />
                </a>
                <a
                  href="https://github.com/vuongthm"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="size-9 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-accent-brand/40 hover:bg-accent-brand/5 transition-all duration-150 cursor-pointer"
                >
                  <GithubIcon size={14} />
                </a>
              </div>

            </div>

          </div>

          <div className="border-t border-border/60 my-14" />

          {/* Full-width Photo Slider */}
          <section className="mb-0">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-semibold text-foreground">
                  {c.photosHeading}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">{c.photosDesc}</p>
              </div>
            </div>
            <PhotoSlider lang={lang} />
          </section>

        </div>
      </main>

      <Footer lang={lang} />
    </>
  )
}