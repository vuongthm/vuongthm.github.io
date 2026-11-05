"use client"
import { friendsMessages } from "@/lib/i18n/friends"
import { copy } from "@/lib/i18n/copy"
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import {
  ArrowUpRight,
  ChevronDown,
  Check,
  ArrowUp,
  Menu,
  Moon,
  Search,
  Sparkles,
  Sun,
  X,
} from "lucide-react"
import { SocialLinks } from "@/components/brand/social-links"
import { BrandLockup } from "@/components/brand/logo"
import { LanguageFlag } from "@/components/brand/language-flag"
import { useSite } from "@/components/providers/site-provider"
import { localized, locales, languageName, type Locale } from "@/lib/i18n/config"
import { siteConfig } from "@/lib/site.config"
import { Dialog } from "@/components/search/dialog"
import { PanelLoading } from "@/components/search/panel-loading"
const SearchDialog = dynamic(
  () => import("@/components/search/search-dialog").then((module) => module.SearchDialog),
  { ssr: false, loading: PanelLoading },
)
const Assistant = dynamic(
  () => import("@/components/search/assistant").then((module) => module.Assistant),
  { ssr: false, loading: PanelLoading },
)

const subscribe = () => () => {}
export function SiteShell({ children }: { children: ReactNode }) {
  const {
    locale,
    dictionary: m,
    setSearchOpen,
    setAiOpen,
    openAssistant,
    searchOpen,
    aiOpen,
  } = useSite()
  const path = usePathname(),
    { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )
  const [menuOpen, setMenuOpen] = useState(false),
    [languageOpen, setLanguageOpen] = useState(false)
  const languageRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (event.key === "Escape") {
        setMenuOpen(false)
        setLanguageOpen(false)
        setSearchOpen(false)
        setAiOpen(false)
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault()
        setAiOpen(false)
        setSearchOpen(true)
      }
      if (
        event.key === "/" &&
        !/INPUT|TEXTAREA|SELECT/.test(target.tagName) &&
        !target.isContentEditable
      ) {
        event.preventDefault()
        setAiOpen(false)
        setSearchOpen(true)
      }
    }
    const outside = (event: PointerEvent) => {
      if (!languageRef.current?.contains(event.target as Node)) setLanguageOpen(false)
    }
    document.addEventListener("keydown", key)
    document.addEventListener("pointerdown", outside)
    return () => {
      document.removeEventListener("keydown", key)
      document.removeEventListener("pointerdown", outside)
    }
  }, [setSearchOpen, setAiOpen])
  useEffect(() => {
    const viewport = matchMedia("(max-width: 760px)")
    const close = () => {
      if (!viewport.matches) setMenuOpen(false)
    }
    viewport.addEventListener("change", close)
    return () => viewport.removeEventListener("change", close)
  }, [])
  function localeHref(target: Locale) {
    if (target === locale) return path
    const translated = document.querySelector<HTMLAnchorElement>(`a[data-translation="${target}"]`)
    if (translated) return translated.getAttribute("href") ?? `/${target}/`
    const stripped = path.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/"
    const isDetail = /^\/(notes|stories)\/[^/]+/.test(stripped)
    return localized(
      isDetail ? (stripped.startsWith("/stories") ? "/stories" : "/notes") : stripped,
      target,
    )
  }
  return (
    <>
      <span id="site-top" className="site-top-anchor" aria-hidden="true" />
      <a href="#main-content" className="skip-link">
        {m.skip}
      </a>
      <header className="site-header" data-reading-chrome>
        <div className="header-inner wrap">
          <Link
            href={`/${locale}/`}
            aria-label={`${siteConfig.name} — ${m.home}`}
            className="brand"
          >
            <BrandLockup size="sm" />
          </Link>
          <nav className="desktop-nav" aria-label={m.menu}>
            {siteConfig.nav.map((item) => (
              <Link
                key={item.key}
                href={localized(item.path, locale)}
                aria-current={
                  path.startsWith(localized(item.path, locale)) ||
                  (item.key === "corner" && path.startsWith(localized("/music", locale)))
                    ? "page"
                    : undefined
                }
              >
                {m[item.key]}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <button
              className="search-trigger"
              aria-label={m.openSearch}
              onClick={() => setSearchOpen(true)}
            >
              <Search size={17} />
              <span>{m.search}</span>
            </button>
            <button
              className="icon-button"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label={m.theme}
            >
              {mounted && resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div ref={languageRef} className="language-control">
              <button
                className="language-button"
                aria-label={`${m.language}: ${languageName(locale, locale)}`}
                aria-expanded={languageOpen}
                aria-controls="locale-menu"
                onClick={() => setLanguageOpen(!languageOpen)}
              >
                <LanguageFlag locale={locale} />
                <ChevronDown size={12} />
              </button>
              {languageOpen && (
                <div className="dropdown" id="locale-menu">
                  {(Object.keys(locales) as Locale[]).map((code) => (
                    <Link
                      key={code}
                      href={localeHref(code)}
                      hrefLang={code}
                      onClick={() => setLanguageOpen(false)}
                      aria-current={code === locale ? "true" : undefined}
                    >
                      <LanguageFlag locale={code} />
                      <span className="locale-label">{languageName(locale, code)}</span>
                      {code === locale && <Check size={14} />}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <button
              className="icon-button mobile-menu-toggle"
              aria-label={menuOpen ? m.close : m.menu}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
      </header>
      {menuOpen && (
        <Dialog
          label={m.menu}
          onClose={() => setMenuOpen(false)}
          className="mobile-navigation-dialog"
        >
          <div className="mobile-menu" id="mobile-navigation">
            <nav aria-label={m.menu}>
              {siteConfig.nav.map((item, i) => (
                <Link
                  href={localized(item.path, locale)}
                  key={item.key}
                  aria-current={
                    path.startsWith(localized(item.path, locale)) ||
                    (item.key === "corner" && path.startsWith(localized("/music", locale)))
                      ? "page"
                      : undefined
                  }
                  onClick={() => setMenuOpen(false)}
                >
                  <span>0{i + 1}</span>
                  {m[item.key]}
                  <ArrowUpRight size={20} />
                </Link>
              ))}
              <Link
                href={localized("/saved", locale)}
                aria-current={path.startsWith(localized("/saved", locale)) ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {m.saved}
                <ArrowUpRight size={20} />
              </Link>
            </nav>
            <button
              className="button primary"
              onClick={() => {
                setMenuOpen(false)
                openAssistant()
              }}
            >
              <Sparkles size={17} />
              {m.ask}
            </button>
          </div>
        </Dialog>
      )}
      {children}
      <footer className="site-footer" data-reading-chrome>
        <div className="wrap footer-main">
          <div className="footer-identity">
            <Link href={`/${locale}/`} aria-label={`vuongthm. — ${m.home}`}>
              <BrandLockup size="sm" />
            </Link>
            <p>{m.footer}</p>
            <SocialLinks />
          </div>
          <nav className="footer-navigation" aria-label={m.menu}>
            <div className="footer-group">
              <h2>{copy(locale, "Khám phá", "Explore")}</h2>
              <div className="footer-group-links">
                <Link href={localized("/notes", locale)}>{m.knowledge}</Link>
                <Link href={localized("/topics", locale)}>{m.topics}</Link>
                <Link href={localized("/modules/", locale)}>
                  {copy(locale, "Các bộ sưu tập", "Content collections")}
                </Link>
                <Link href={localized("/projects", locale)}>{m.projects}</Link>
              </div>
            </div>
            <div className="footer-group">
              <h2>{copy(locale, "Kết nối", "Connect")}</h2>
              <div className="footer-group-links">
                <Link href={localized("/about", locale)}>{m.about}</Link>
                <Link href={localized("/corner/", locale)}>{m.corner}</Link>
                <Link href={localized("/friends/", locale)}>{friendsMessages[locale].title}</Link>
                <Link href={localized("/my-album", locale)}>{m.album}</Link>
                <Link href={localized("/journey", locale)}>
                  {copy(locale, "Hành trình", "Journey")}
                </Link>
                <Link href={localized("/stories", locale)}>{m.stories}</Link>
              </div>
            </div>
            <div className="footer-group">
              <h2>{copy(locale, "Tiện ích", "Resources")}</h2>
              <div className="footer-group-links">
                <button onClick={() => setSearchOpen(true)}>{m.search}</button>
                <Link href={localized("/saved", locale)}>{m.saved}</Link>
                <button onClick={() => openAssistant()}>{m.ask}</button>
                <a href={`/${locale}/feed.xml`}>RSS</a>
              </div>
            </div>
          </nav>
        </div>
        <div className="footer-base">
          <div className="wrap footer-bottom">
            <span>© {new Date().getFullYear()} vuongthm.</span>
            <span className="footer-place">
              Đại Lãnh <span aria-hidden="true">→</span> Đà Nẵng
            </span>
            <a className="back-to-top" href="#site-top">
              {m.backTop}
              <ArrowUp size={13} />
            </a>
          </div>
        </div>
      </footer>
      {searchOpen && <SearchDialog />}
      {aiOpen && <Assistant />}
    </>
  )
}
