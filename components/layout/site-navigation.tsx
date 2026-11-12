"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Headphones,
  LibraryBig,
  Images,
  Layers,
  Map,
  Route,
  Users,
  LockKeyhole,
} from "lucide-react"
import { useSite } from "@/components/providers/site-provider"
import { SoundToggle, ThemeToggle } from "@/components/experience/interaction-effects"
import { experience } from "@/lib/i18n/experience"
import { editorial } from "@/lib/i18n/editorial"
import { localized } from "@/lib/i18n/config"
import { siteConfig } from "@/lib/site.config"
import { friendsMessages } from "@/lib/i18n/friends"
import { designMessages } from "@/lib/i18n/design"
import { knowledgeMessages } from "@/lib/i18n/knowledge"

function useNavigationLinks(shelfLocked: boolean, journeyLocked: boolean) {
  const { locale, dictionary: m } = useSite()
  const t = experience[locale],
    e = editorial[locale],
    d = designMessages[locale],
    k = knowledgeMessages[locale]
  return {
    knowledge: [
      { href: "/notes/", title: d.articles, description: k.notesMenu, icon: BookOpen },
      { href: "/topics/", title: m.topics, description: k.topicsMenu, icon: Layers },
      {
        href: "/paths/",
        title: d.paths,
        description: k.pathsMenu,
        icon: Route,
      },
    ],
    personal: [
      { href: "/stories/", title: m.stories, icon: BookOpen },
      { href: "/my-album/", title: m.album, icon: Images },
      { href: "/music/", title: t.music, icon: Headphones },
      { href: "/shelf/", title: e.shelf, icon: LibraryBig, locked: shelfLocked },
      { href: "/journey/", title: t.journey, icon: Map, locked: journeyLocked },
      { href: "/friends/", title: friendsMessages[locale].title, icon: Users },
    ],
  }
}

export function SiteNavigation({
  shelfLocked = false,
  journeyLocked = false,
  open,
  onOpenChange: setOpen,
}: {
  shelfLocked?: boolean
  journeyLocked?: boolean
  open: "knowledge" | "corner" | null
  onOpenChange: (menu: "knowledge" | "corner" | null) => void
}) {
  const { locale, dictionary: m } = useSite()
  const path = usePathname()
  const { knowledge, personal } = useNavigationLinks(shelfLocked, journeyLocked)
  const ref = useRef<HTMLElement>(null),
    trigger = useRef<HTMLButtonElement | null>(null)
  const keyboardOpen = useRef(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setOpen(null))
    return () => cancelAnimationFrame(frame)
  }, [path, setOpen])
  useEffect(() => {
    if (!open || !keyboardOpen.current) return
    keyboardOpen.current = false
    // Wait until React has removed inert and the panel is visible before moving focus.
    const frame = requestAnimationFrame(() =>
      ref.current?.querySelector<HTMLAnchorElement>(`#navigation-${open} a`)?.focus(),
    )
    return () => cancelAnimationFrame(frame)
  }, [open])
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(null)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && ref.current?.querySelector('[aria-expanded="true"]')) {
        setOpen(null)
        trigger.current?.focus()
      }
    }
    document.addEventListener("pointerdown", outside)
    document.addEventListener("keydown", escape)
    return () => {
      document.removeEventListener("pointerdown", outside)
      document.removeEventListener("keydown", escape)
    }
  }, [setOpen])
  function panel(menu: "knowledge" | "corner") {
    const links = menu === "knowledge" ? knowledge : personal
    return (
      <div
        className={`navigation-panel ${menu === "knowledge" ? "knowledge-panel" : "personal-panel"}${open === menu ? " is-open" : ""}`}
        id={`navigation-${menu}`}
        inert={open !== menu}
      >
        <div className="navigation-menu-list">
          {links.map((item) => (
            <Link key={item.href} href={localized(item.href, locale)} onClick={() => setOpen(null)}>
              <ArrowRight size={15} aria-hidden="true" />
              <span>
                {item.title}
                {"locked" in item && item.locked === true && (
                  <LockKeyhole size={11} aria-hidden="true" />
                )}
              </span>
            </Link>
          ))}
        </div>
        <div className="navigation-menu-foot">
          <Link
            href={localized(menu === "knowledge" ? "/saved/" : "/about/", locale)}
            onClick={() => setOpen(null)}
          >
            {menu === "knowledge" ? m.saved : m.about}
          </Link>
          <MenuNotebook />
        </div>
      </div>
    )
  }
  return (
    <nav
      className="desktop-nav"
      aria-label={m.menu}
      ref={ref}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(null)
      }}
    >
      {siteConfig.nav.map((item) => {
        const hasMenu = item.key === "knowledge" || item.key === "corner"
        const active =
          item.key === "corner"
            ? personal.some((link) => path.startsWith(localized(link.href, locale)))
            : path.startsWith(localized(item.path, locale)) ||
              (item.key === "knowledge" &&
                ["/topics", "/paths", "/modules"].some((href) =>
                  path.startsWith(localized(href, locale)),
                ))
        return (
          <div className="navigation-item" key={item.key}>
            {hasMenu ? (
              <button
                className="navigation-trigger"
                data-ui-sound="menu"
                data-active={active || undefined}
                aria-expanded={open === item.key}
                aria-controls={`navigation-${item.key}`}
                onClick={(event) => {
                  keyboardOpen.current = false
                  trigger.current = event.currentTarget
                  setOpen(open === item.key ? null : (item.key as "knowledge" | "corner"))
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault()
                    trigger.current = event.currentTarget
                    keyboardOpen.current = true
                    setOpen(item.key as "knowledge" | "corner")
                    if (open === item.key)
                      ref.current
                        ?.querySelector<HTMLAnchorElement>(`#navigation-${item.key} a`)
                        ?.focus()
                  }
                }}
              >
                {m[item.key]}
              </button>
            ) : (
              <Link
                href={localized(item.path, locale)}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(null)}
              >
                {m[item.key]}
              </Link>
            )}
            {hasMenu && panel(item.key as "knowledge" | "corner")}
          </div>
        )
      })}
    </nav>
  )
}

export function MobileNavigation({
  onClose,
  shelfLocked = false,
  journeyLocked = false,
}: {
  onClose: () => void
  shelfLocked?: boolean
  journeyLocked?: boolean
}) {
  const { locale, dictionary: m } = useSite()
  const path = usePathname()
  const { knowledge, personal } = useNavigationLinks(shelfLocked, journeyLocked)
  const primary = [
    { href: "/", title: m.home },
    { href: "/projects/", title: m.projects },
    { href: "/about/", title: m.about },
  ]
  function active(href: string) {
    return path.replace(/\/$/, "") === localized(href, locale).replace(/\/$/, "")
  }
  return (
    <div className="mobile-menu" id="mobile-navigation">
      <div className="mobile-menu-heading">
        <span>{m.menu}</span>
      </div>
      <nav className="mobile-primary-links" aria-label={m.menu}>
        {primary.map((item) => (
          <Link
            href={localized(item.href, locale)}
            key={item.href}
            onClick={onClose}
            aria-current={active(item.href) ? "page" : undefined}
          >
            {item.title}
          </Link>
        ))}
      </nav>
      <nav className="mobile-menu-groups" aria-label={m.explore}>
        {[
          { title: m.knowledge, links: knowledge, id: "knowledge" },
          { title: m.corner, links: personal, id: "corner" },
        ].map((group) => (
          <section key={group.id} className={`mobile-link-group mobile-link-group-${group.id}`}>
            <h2>{group.title}</h2>
            <div>
              {group.links.map((item) => (
                <Link
                  key={item.href}
                  href={localized(item.href, locale)}
                  onClick={onClose}
                  aria-current={active(item.href) ? "page" : undefined}
                >
                  <item.icon size={16} strokeWidth={1.6} aria-hidden="true" />
                  <span>
                    {item.title}
                    {"locked" in item && item.locked === true && (
                      <LockKeyhole size={10} aria-hidden="true" />
                    )}
                  </span>
                  {group.id === "knowledge" && <ArrowUpRight size={12} aria-hidden="true" />}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </nav>
      <div className="mobile-menu-tools">
        <Link href={localized("/saved/", locale)} onClick={onClose}>
          {m.saved}
        </Link>
        <div>
          <SoundToggle />
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}

function MenuNotebook() {
  return (
    <svg className="menu-notebook" viewBox="0 0 90 90" fill="none" aria-hidden="true">
      <path d="m23 20 44-6 8 58-44 7Z" fill="var(--menu-book-spine)" />
      <path d="m31 13 44 5-6 61-44-5Z" fill="var(--menu-book-cover)" />
      <path d="m35 20 32 4-1 8-32-4Z" fill="var(--paper)" opacity=".9" />
      <path d="m50 22 7 1-2 16-3-3-4 2Z" fill="var(--menu-book-mark)" />
      <circle cx="40" cy="46" r="2" fill="var(--menu-book-eye)" />
      <circle cx="55" cy="48" r="2" fill="var(--menu-book-eye)" />
      <path
        d="M43 54q4 6 8 1"
        stroke="var(--menu-book-eye)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="m24 75-8 5m53-1 7 4"
        stroke="var(--menu-book-spine)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
