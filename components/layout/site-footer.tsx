"use client"

import Link from "next/link"
import type { FormEvent } from "react"
import { ArrowRight, ArrowUp, Mail, Rss, Search } from "lucide-react"
import { BrandLockup } from "@/components/brand/logo"
import { Github } from "@/components/brand/github"
import { SoundToggle, ThemeToggle } from "@/components/experience/interaction-effects"
import { useSite } from "@/components/providers/site-provider"
import { editorial } from "@/lib/i18n/editorial"
import { experience } from "@/lib/i18n/experience"
import { friendsMessages } from "@/lib/i18n/friends"
import { footerMessages } from "@/lib/i18n/footer"
import { localized } from "@/lib/i18n/config"
import { siteConfig } from "@/lib/site.config"
import { AppearancePicker } from "@/components/experience/appearance-picker"

export function SiteFooter() {
  const { locale, dictionary: m, setSearchOpen } = useSite()
  const text = editorial[locale],
    extra = experience[locale],
    contribution = footerMessages[locale]
  function contribute(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim()
    if (!email) return
    const body = `${contribution.greeting}\n\n${contribution.contact}: ${email}\n\n${contribution.contribution}\n`
    window.location.href = `mailto:${siteConfig.email}?subject=${encodeURIComponent(contribution.subject)}&body=${encodeURIComponent(body)}`
  }
  const groups = [
    {
      id: "explore",
      label: text.general,
      links: [
        ["/notes/", m.knowledge],
        ["/paths/", m.paths],
        ["/topics/", m.topics],
        ["/projects/", m.projects],
      ],
    },
    {
      id: "personal",
      label: text.personal,
      links: [
        ["/stories/", m.stories],
        ["/my-album/", m.album],
        ["/shelf/", text.shelf],
        ["/music/", extra.music],
      ],
    },
    {
      id: "general",
      label: { vi: "Ghé quanh đây", en: "Around here", ja: "このサイト", zh: "关于这里" }[locale],
      links: [
        ["/about/", m.about],
        ["/journey/", extra.journey],
        ["/friends/", friendsMessages[locale].title],
        ["/saved/", m.saved],
      ],
    },
  ]
  return (
    <footer className="site-footer" data-reading-chrome>
      <div className="wrap footer-layout">
        <div className="footer-intro">
          <Link className="footer-brand" href={`/${locale}/`} aria-label={`THM — ${m.home}`}>
            <BrandLockup />
          </Link>
          <p>{text.footerDescription}</p>
          <form className="footer-contribution" onSubmit={contribute}>
            <label htmlFor="footer-contribution-email">{contribution.invitation}</label>
            <div className="footer-email-field">
              <input
                id="footer-contribution-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder={contribution.email}
                aria-label={contribution.email}
                aria-describedby="footer-contribution-hint"
                required
              />
              <button type="submit" aria-label={contribution.submit} title={contribution.submit}>
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </div>
            <p id="footer-contribution-hint" className="footer-contribution-hint">
              {contribution.hint}
            </p>
          </form>
        </div>
        <div className="footer-directory">
          {groups.map((group) => (
            <nav
              className={`footer-nav footer-nav-${group.id}`}
              key={group.id}
              aria-label={group.label}
            >
              <h2>{group.label}</h2>
              <ul>
                {group.links.map(([href, label]) => (
                  <li key={href}>
                    <Link href={localized(href, locale)}>{label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="footer-toolbar" role="group" aria-label={text.connection}>
          <button
            className="icon-button"
            onClick={() => setSearchOpen(true)}
            aria-label={m.search}
            title={m.search}
          >
            <Search size={18} />
          </button>
          <SoundToggle />
          <ThemeToggle />
          <AppearancePicker />
          <a
            className="icon-button"
            href={`/${locale}/feed.xml`}
            aria-label={text.subscribe}
            title={text.subscribe}
          >
            <Rss size={18} />
          </a>
          <a
            className="icon-button"
            href={siteConfig.github}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            title="GitHub"
          >
            <Github size={18} />
          </a>
          <a
            className="icon-button"
            href={`mailto:${siteConfig.email}`}
            aria-label="Email"
            title="Email"
          >
            <Mail size={18} />
          </a>
          <a
            className="icon-button footer-top"
            href="#site-top"
            aria-label={m.backTop}
            title={m.backTop}
          >
            <ArrowUp size={18} />
          </a>
        </div>
        <div className="footer-base">
          <span>© {new Date().getFullYear()} vuongthm. All Rights Reserved.</span>
        </div>
      </div>
    </footer>
  )
}
