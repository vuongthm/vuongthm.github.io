"use client"

import Link from "next/link"
import { ArrowUp, Mail, Rss } from "lucide-react"
import { BrandLockup } from "@/components/brand/logo"
import { Github } from "@/components/brand/github"
import { Contour } from "@/components/brand/contour"
import { SoundToggle, ThemeToggle } from "@/components/experience/interaction-effects"
import { useSite } from "@/components/providers/site-provider"
import { editorial } from "@/lib/i18n/editorial"
import { localized } from "@/lib/i18n/config"
import { siteConfig } from "@/lib/site.config"

export function SiteFooter() {
  const { locale, dictionary: m } = useSite()
  return (
    <footer className="site-footer" data-reading-chrome>
      <Contour className="footer-contour" />
      <div className="wrap compact-footer-main">
        <Link className="footer-brand" href={`/${locale}/`} aria-label={`Vuong — ${m.home}`}>
          <BrandLockup size="sm" />
        </Link>
        <nav className="compact-footer-links" aria-label={m.menu}>
          <Link href={localized("/notes/", locale)}>{m.knowledge}</Link>
          <Link href={localized("/projects/", locale)}>{m.projects}</Link>
          <Link href={localized("/stories/", locale)}>{m.stories}</Link>
          <Link href={localized("/about/", locale)}>{m.about}</Link>
        </nav>
        <div className="compact-footer-tools">
          <a
            className="icon-button"
            href={siteConfig.github}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            title="GitHub"
          >
            <Github size={17} />
          </a>
          <a
            className="icon-button"
            href={`mailto:${siteConfig.email}`}
            aria-label="Email"
            title="Email"
          >
            <Mail size={17} />
          </a>
          <a className="icon-button" href={`/${locale}/feed.xml`} aria-label="RSS" title="RSS">
            <Rss size={17} />
          </a>
          <SoundToggle />
          <ThemeToggle />
        </div>
      </div>
      <div className="wrap compact-footer-base">
        <span>© {new Date().getFullYear()} vuongthm.</span>
        <span>{editorial[locale].footerDescription}</span>
        <a href="#site-top" aria-label={m.backTop} title={m.backTop}>
          <ArrowUp size={16} />
        </a>
      </div>
    </footer>
  )
}
