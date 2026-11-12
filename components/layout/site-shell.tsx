"use client"
import { useEffect, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { ChevronDown, Check, Menu, Search } from "lucide-react"
import { BrandLockup } from "@/components/brand/logo"
import { LanguageFlag } from "@/components/brand/language-flag"
import { useSite } from "@/components/providers/site-provider"
import { localized, locales, languageName, type Locale } from "@/lib/i18n/config"
import { siteConfig } from "@/lib/site.config"
import { useScrollLock } from "@/lib/hooks/use-scroll-lock"
import { Dialog } from "@/components/search/dialog"
import { PanelLoading } from "@/components/search/panel-loading"
import { SiteNavigation, MobileNavigation } from "./site-navigation"
import { SiteFooter } from "./site-footer"
import {
  InteractionEffects,
  SoundToggle,
  ThemeToggle,
} from "@/components/experience/interaction-effects"
const SearchDialog = dynamic(
  () => import("@/components/search/search-dialog").then((module) => module.SearchDialog),
  { ssr: false, loading: PanelLoading },
)
const Assistant = dynamic(
  () => import("@/components/search/assistant").then((module) => module.Assistant),
  { ssr: false, loading: PanelLoading },
)

export function SiteShell({
  children,
  shelfLocked = false,
}: {
  children: ReactNode
  shelfLocked?: boolean
}) {
  const { locale, dictionary: m, setSearchOpen, setAiOpen, searchOpen, aiOpen } = useSite()
  const path = usePathname()
  const [menuOpen, setMenuOpen] = useState(false),
    [languageOpen, setLanguageOpen] = useState(false)
  const [desktopMenu, setDesktopMenu] = useState<"knowledge" | "corner" | null>(null)
  const [heroPassed, setHeroPassed] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const navigationOpen = menuOpen || languageOpen || !!desktopMenu
  const headerPinned = navigationOpen || searchOpen || aiOpen
  useScrollLock(!!desktopMenu || languageOpen)
  const languageRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const hero = contentRef.current?.querySelector(".studio-hero")
      if (!hero) {
        setHeroPassed(false)
        return
      }
      const observe = () => {
        observer?.disconnect()
        const height = headerRef.current?.getBoundingClientRect().height ?? 80
        setHeroPassed(hero.getBoundingClientRect().bottom <= height)
        observer = new IntersectionObserver(
          ([entry]) => setHeroPassed(entry.boundingClientRect.bottom <= height),
          { rootMargin: `-${height}px 0px 0px 0px` },
        )
        observer.observe(hero)
      }
      observe()
      resize = observe
      window.addEventListener("resize", observe)
    })
    let observer: IntersectionObserver | undefined, resize: (() => void) | undefined
    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
      if (resize) window.removeEventListener("resize", resize)
    }
  }, [path])
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
    // Animate the persistent surface; remounting PageAccess would discard unlocked sessions.
    const animation = contentRef.current?.animate(
      [
        { opacity: 0, transform: "translateY(7px)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 400, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    )
    return () => animation?.cancel()
  }, [path])
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (event.key === "Escape") {
        setMenuOpen(false)
        setDesktopMenu(null)
        setLanguageOpen(false)
        setSearchOpen(false)
        setAiOpen(false)
      }
      const searchShortcut =
        ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") ||
        (event.key === "/" &&
          !/INPUT|TEXTAREA|SELECT/.test(target.tagName) &&
          !target.isContentEditable)
      if (searchShortcut) {
        event.preventDefault()
        if (menuOpen) return
        setDesktopMenu(null)
        setLanguageOpen(false)
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
  }, [setSearchOpen, setAiOpen, menuOpen])
  useEffect(() => {
    const viewport = matchMedia("(max-width: 760px)")
    const close = () => {
      if (!viewport.matches) setMenuOpen(false)
      else setDesktopMenu(null)
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
      <header
        ref={headerRef}
        className="site-header"
        data-reading-chrome
        data-hero-passed={heroPassed || undefined}
        data-mobile-menu-open={menuOpen || undefined}
        data-header-pinned={headerPinned || undefined}
        inert={menuOpen}
      >
        <div className="header-inner wrap">
          <Link
            href={`/${locale}/`}
            aria-label={`${siteConfig.name} — ${m.home}`}
            className="brand"
          >
            <BrandLockup size="sm" />
          </Link>
          <SiteNavigation
            shelfLocked={shelfLocked}
            open={desktopMenu}
            onOpenChange={setDesktopMenu}
          />
          <div className="header-actions">
            <SoundToggle />
            <button
              className="search-trigger"
              aria-label={m.openSearch}
              onClick={() => {
                setDesktopMenu(null)
                setLanguageOpen(false)
                setMenuOpen(false)
                setAiOpen(false)
                setSearchOpen(true)
              }}
            >
              <Search size={17} />
              <span>{m.search}</span>
            </button>
            <ThemeToggle />
            <div ref={languageRef} className="language-control">
              <button
                className="language-button"
                aria-label={`${m.language}: ${languageName(locale, locale)}`}
                aria-expanded={languageOpen}
                aria-controls="locale-menu"
                onClick={() => {
                  setDesktopMenu(null)
                  setMenuOpen(false)
                  setLanguageOpen(!languageOpen)
                }}
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
              data-ui-sound="menu"
              aria-label={menuOpen ? m.close : m.menu}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => {
                setDesktopMenu(null)
                setLanguageOpen(false)
                setMenuOpen(!menuOpen)
              }}
            >
              <Menu size={21} />
            </button>
          </div>
        </div>
      </header>
      {headerPinned && <div className="header-spacer" aria-hidden="true" />}
      {(desktopMenu || languageOpen) && (
        <button
          className="navigation-backdrop"
          type="button"
          tabIndex={-1}
          aria-label={m.close}
          data-sound="off"
          onClick={() => {
            setDesktopMenu(null)
            setLanguageOpen(false)
          }}
        />
      )}
      {menuOpen && (
        <Dialog
          label={m.menu}
          onClose={() => setMenuOpen(false)}
          className="mobile-navigation-dialog"
        >
          <MobileNavigation shelfLocked={shelfLocked} onClose={() => setMenuOpen(false)} />
        </Dialog>
      )}
      <div className="site-content" ref={contentRef} inert={navigationOpen}>
        {children}
      </div>
      <div className="site-footer-region" inert={navigationOpen}>
        <SiteFooter />
      </div>
      <InteractionEffects />
      {searchOpen && <SearchDialog />}
      {aiOpen && <Assistant />}
    </>
  )
}
