import { copy } from "@/lib/i18n/copy"
import { Github } from "@/components/brand/github"
import Link from "next/link"
import Image from "next/image"
import { ArrowUpRight, ArrowRight, Mail, UsersRound } from "lucide-react"
import { notFound } from "next/navigation"
import { isLocale, localized } from "@/lib/i18n/config"
import { metadataFor, jsonLd } from "@/lib/seo"
import { siteConfig } from "@/lib/site.config"
import { authorProfile as profile } from "@/lib/content/profile"
import { friendsMessages } from "@/lib/i18n/friends"
import { Gallery } from "@/components/gallery"
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  return isLocale(lang)
    ? metadataFor(
        copy(lang, "Về Vuong", "About Vuong"),
        copy(
          lang,
          "Sinh viên Mạng & An toàn thông tin, lớn lên ở Đại Lãnh và luôn tò mò về cách mọi thứ kết nối.",
          "A networking and information security student from Đại Lãnh, curious about how things connect.",
        ),
        "/about",
        lang,
      )
    : {}
}
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  return (
    <main id="main-content" className="about-folio">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "Person",
            name: "Vuong",
            alternateName: "vuongthm",
            url: siteConfig.url,
            knowsAbout: ["Networking", "Information Security"],
            sameAs: [siteConfig.github],
          }),
        }}
      />
      <section className="wrap folio-hero" aria-labelledby="about-title">
        <div className="folio-introduction">
          <span className="folio-kicker">
            {copy(lang, "Về người viết", "The person behind the notes")}
          </span>
          <h1 id="about-title">
            {copy(lang, "Mình là ", "I’m ")}
            <span>{lang === "ja" ? "Vuongです。" : "Vuong."}</span>
          </h1>
          <p className="folio-lede">
            {copy(
              lang,
              "Một người đang học về công nghệ, và học cách hiểu thế giới quanh mình.",
              "Learning about technology, and learning to make sense of the world around me.",
            )}
          </p>
          <div className="folio-bio">
            {profile.bio.map((paragraph, i) => (
              <p key={i}>{paragraph[lang]}</p>
            ))}
          </div>
          <div className="folio-contact-links">
            <a href={siteConfig.github} target="_blank" rel="noreferrer">
              <Github size={16} /> GitHub <ArrowUpRight size={13} />
            </a>
            <a href={`mailto:${siteConfig.email}`}>
              <Mail size={16} /> {copy(lang, "Viết cho mình", "Say hello")}
              <ArrowUpRight size={13} />
            </a>
            <Link href={localized("/friends/", lang)} className="folio-friends-link">
              <span className="folio-friends-icon" aria-hidden="true">
                <UsersRound size={19} strokeWidth={1.6} />
              </span>
              {friendsMessages[lang].title}
            </Link>
          </div>
        </div>
        <figure className="folio-portrait">
          <div className="folio-portrait-image">
            <Image
              src={profile.portrait}
              alt="Vuong — vuongthm"
              fill
              sizes="(max-width:700px) 80vw, 35vw"
              unoptimized
              priority
            />
          </div>
          <figcaption>
            <span>vuong.</span>
            <span>
              Đại Lãnh <ArrowRight size={12} /> Đà Nẵng
            </span>
          </figcaption>
        </figure>
      </section>
      <div className="wrap folio-index">
        <div className="folio-interests">
          {profile.interests.map((interest) => (
            <span key={interest}>{interest}</span>
          ))}
        </div>
        <nav aria-label={copy(lang, "Nội dung giới thiệu", "About sections")}>
          <a href="#journey">{copy(lang, "Hành trình", "Journey")}</a>
          <a href="#achievements">{copy(lang, "Dấu mốc", "Milestones")}</a>
          <a href="#photographs">{copy(lang, "Góc ảnh", "Photographs")}</a>
        </nav>
      </div>
      <section className="folio-journey-band" id="journey" aria-labelledby="journey-title">
        <div className="wrap folio-section-layout">
          <div className="folio-section-heading">
            <span className="folio-kicker">{copy(lang, "Từ đâu đến đây", "How I got here")}</span>
            <h2 id="journey-title">{copy(lang, "Hành trình", "Journey")}</h2>
            <p>
              {copy(
                lang,
                "Từ một làng chài ở Khánh Hòa đến những trải nghiệm đầu tiên với công nghệ.",
                "From a fishing village in Khánh Hòa to my first experiences with technology.",
              )}
            </p>
          </div>
          <div className="folio-timeline">
            {profile.timeline.map((item) => (
              <article key={item.label}>
                <span className="folio-year">{item.label}</span>
                <div>
                  <h3>{item.title[lang]}</h3>
                  <p>{item.description[lang]}</p>
                  {item.href && (
                    <Link href={localized(item.href, lang)}>
                      {copy(lang, "Đọc câu chuyện", "Read the story")}
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section
        className="wrap folio-achievements"
        id="achievements"
        aria-labelledby="achievements-title"
      >
        <div className="folio-section-heading">
          <span className="folio-kicker">
            {copy(lang, "Những điều đã làm", "Work and experiences")}
          </span>
          <h2 id="achievements-title">
            {copy(lang, "Dấu mốc & thành tích.", "Milestones & achievements.")}
          </h2>
        </div>
        <div className="folio-achievement-grid">
          {profile.achievements.map((item) => (
            <article key={item.title.en}>
              <span className="folio-kicker">{item.category[lang]}</span>
              <h3>{item.title[lang]}</h3>
              <p>{item.description[lang]}</p>
              {item.href && (
                <Link href={localized(item.href, lang)}>
                  {copy(lang, "Xem thêm", "Find out more")}
                </Link>
              )}
            </article>
          ))}
        </div>
      </section>
      <section className="wrap folio-photographs" id="photographs" aria-labelledby="photos-title">
        <div className="folio-photo-heading">
          <div className="folio-section-heading">
            <span className="folio-kicker">
              {copy(lang, "Bộ sưu tập cá nhân", "A personal collection")}
            </span>
            <h2 id="photos-title">{copy(lang, "Góc ảnh", "Photo journal")}</h2>
          </div>
          <Link href={localized("/my-album", lang)} className="text-link">
            {copy(lang, "Mở góc ảnh", "Open photo journal")}
          </Link>
        </div>
        <Gallery photos={profile.photos} variant="portfolio" />
      </section>
      <section className="wrap" aria-labelledby="contact-title">
        <div className="folio-outro">
          <div>
            <span className="folio-kicker">{copy(lang, "Kết nối", "Connect")}</span>
            <h2 id="contact-title">
              {copy(lang, "Cùng trao đổi một ý tưởng.", "Let’s exchange ideas.")}
            </h2>
            <p>
              {copy(
                lang,
                "Một câu chuyện, một ý tưởng, hay đơn giản là lời chào.",
                "A story, an idea, or simply a hello.",
              )}
            </p>
          </div>
          <div className="folio-contact-actions">
            <a href={`mailto:${siteConfig.email}`} className="folio-email-card">
              <Mail size={20} strokeWidth={1.5} aria-hidden="true" />
              <span>
                <small>{copy(lang, "Viết cho mình", "Say hello")}</small>
                <strong>{siteConfig.email}</strong>
              </span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>
            <a
              href={siteConfig.github}
              target="_blank"
              rel="noreferrer"
              className="folio-github-link"
            >
              <Github size={15} aria-hidden="true" />
              GitHub
              <ArrowUpRight size={13} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
