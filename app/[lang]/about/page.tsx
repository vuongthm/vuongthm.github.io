import { localeName } from "@/lib/i18n/english-names.mjs"
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
import { DistanceMap } from "@/components/experience/distance-map"
import { studio } from "@/lib/i18n/studio"
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
  const art = studio[lang]
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
          <section className="folio-curiosities" aria-labelledby="interests-title">
            <h2 id="interests-title">{art.interests}</h2>
            <div className="folio-interests">
              {profile.interests.map((interest) => (
                <span key={interest}>{interest}</span>
              ))}
            </div>
            <p>
              {copy(
                lang,
                "Từ mạng máy tính đến nhiếp ảnh — mình thích tìm hiểu những điều kết nối con người với thế giới.",
                "From computer networks to photography — I like exploring what connects us to the world.",
              )}
            </p>
          </section>
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
              {localeName("Đại Lãnh", lang)} <ArrowRight size={12} /> {localeName("Đà Nẵng", lang)}
            </span>
          </figcaption>
        </figure>
      </section>
      <DistanceMap />
      <section className="wrap about-offscreen" aria-labelledby="offscreen-title">
        <header>
          <span className="eyebrow">{copy(lang, "Ngoài màn hình", "Beyond the screen")}</span>
          <h2 id="offscreen-title">
            {copy(lang, "Một chút nơi mình bắt đầu.", "A little of where it all began.")}
          </h2>
          <p>{profile.timeline[0].description[lang]}</p>
          <Link className="text-link" href={localized("/my-album/", lang)}>
            {copy(lang, "Ghé góc ảnh", "Visit the photo journal")}
            <ArrowUpRight size={15} />
          </Link>
        </header>
        <div className="about-contact-sheet">
          {profile.photos.map((photo, index) => (
            <figure key={photo.src}>
              <div>
                <Image
                  src={photo.src}
                  alt={photo.title[lang]}
                  fill
                  sizes="(max-width:760px) 75vw, 30vw"
                  unoptimized
                />
              </div>
              <figcaption>
                <small>0{index + 1}</small>
                <span>{photo.title[lang]}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
      <section className="wrap about-in-practice" aria-labelledby="practice-title">
        <header>
          <span className="eyebrow">{copy(lang, "Học bằng cách làm", "Learning by doing")}</span>
          <h2 id="practice-title">
            {copy(lang, "Những điều thành trải nghiệm.", "Things that became experiences.")}
          </h2>
        </header>
        <div>
          {profile.achievements.map((item, index) => (
            <article key={item.title.en}>
              <span className="practice-number">0{index + 1}</span>
              <div>
                <span className="eyebrow">{item.category[lang]}</span>
                <h3>{item.title[lang]}</h3>
                <p>{item.description[lang]}</p>
                {item.href && (
                  <Link className="text-link" href={localized(item.href, lang)}>
                    {copy(lang, "Đọc thêm một chút", "A little more")}
                    <ArrowUpRight size={15} />
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="wrap about-postscript" aria-labelledby="contact-title">
        <h2 id="contact-title">{art.contact}</h2>
        <a href={`mailto:${siteConfig.email}`}>
          {siteConfig.email}
          <ArrowUpRight size={18} />
        </a>
      </section>
    </main>
  )
}
