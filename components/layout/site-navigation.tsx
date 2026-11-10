"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  FolderOpen,
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

function useNavigationLinks(shelfLocked: boolean) {
  const { locale, dictionary: m } = useSite()
  const t = experience[locale],
    e = editorial[locale]
  return {
    knowledge: [
      { href: "/notes/", title: m.knowledge, description: t.notesDescription, icon: BookOpen },
      { href: "/topics/", title: m.topics, description: t.topicsDescription, icon: Layers },
      {
        href: "/notes/#reading-paths",
        title: e.footerPaths,
        description: t.pathsDescription,
        icon: Route,
      },
      {
        href: "/modules/",
        title: e.collections,
        description: t.collectionsDescription,
        icon: FolderOpen,
      },
    ],
    personal: [
      { href: "/stories/", title: m.stories, icon: BookOpen },
      { href: "/my-album/", title: m.album, icon: Images },
      { href: "/music/", title: t.music, icon: Headphones },
      { href: "/shelf/", title: e.shelf, icon: LibraryBig, locked: shelfLocked },
      { href: "/journey/", title: t.journey, icon: Map },
      { href: "/friends/", title: friendsMessages[locale].title, icon: Users },
    ],
  }
}

export function SiteNavigation({
  shelfLocked = false,
  open,
  onOpenChange: setOpen,
}: {
  shelfLocked?: boolean
  open: "knowledge" | "corner" | null
  onOpenChange: (menu: "knowledge" | "corner" | null) => void
}) {
  const { locale, dictionary: m } = useSite()
  const e = editorial[locale],
    t = experience[locale],
    path = usePathname()
  const { knowledge, personal } = useNavigationLinks(shelfLocked)
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
                <ChevronDown size={12} />
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
          </div>
        )
      })}
      <div
        className={`navigation-panel knowledge-panel${open === "knowledge" ? " is-open" : ""}`}
        id="navigation-knowledge"
        inert={open !== "knowledge"}
      >
        <div className="navigation-panel-intro">
          <span className="eyebrow">{e.general}</span>
          <h2>{m.knowledge}</h2>
          <p>{t.notesDescription}</p>
          <MenuConstellation />
        </div>
        <div className="navigation-card-grid">
          {knowledge.map(({ href, title, description, icon: Icon }) => (
            <Link href={localized(href, locale)} key={href} onClick={() => setOpen(null)}>
              <span className="navigation-link-icon">
                <Icon size={20} />
              </span>
              <span>
                <strong>{title}</strong>
                <small>{description}</small>
              </span>
              <ArrowUpRight size={14} />
            </Link>
          ))}
        </div>
      </div>
      <div
        className={`navigation-panel personal-panel${open === "corner" ? " is-open" : ""}`}
        id="navigation-corner"
        inert={open !== "corner"}
      >
        <div className="navigation-panel-intro personal-panel-intro">
          <span className="eyebrow">{t.smallWorld}</span>
          <h2>{m.corner}</h2>
          <p>{t.personalDescription}</p>
          <MenuConstellation />
        </div>
        <div className="personal-panel-links">
          {personal.map(({ href, title, icon: Icon, locked }) => (
            <Link key={href} href={localized(href, locale)} onClick={() => setOpen(null)}>
              <span className="navigation-link-icon">
                <Icon size={18} />
              </span>
              <span className="navigation-link-title">
                {title}
                {locked && <LockKeyhole size={12} aria-hidden="true" />}
              </span>
              <ArrowUpRight size={14} />
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}

export function MobileNavigation({
  onClose,
  shelfLocked = false,
}: {
  onClose: () => void
  shelfLocked?: boolean
}) {
  const { locale, dictionary: m } = useSite()
  const e = editorial[locale],
    path = usePathname()
  const { knowledge, personal } = useNavigationLinks(shelfLocked)
  const main = [
    ...knowledge,
    { href: "/projects/", title: m.projects },
    { href: "/about/", title: m.about },
  ]
  return (
    <div className="mobile-menu" id="mobile-navigation">
      <div className="mobile-menu-heading">
        <span>{m.menu}</span>
        <span className="mobile-menu-kicker">vuong.</span>
      </div>
      <nav aria-label={m.menu}>
        {[
          { title: e.general, links: main },
          { title: m.corner, links: personal },
        ].map((group) => (
          <section key={group.title}>
            <h2>{group.title}</h2>
            {group.links.map((item) => (
              <Link
                key={item.href}
                href={localized(item.href, locale)}
                aria-current={
                  path.replace(/\/$/, "") === localized(item.href, locale).replace(/\/$/, "")
                    ? "page"
                    : undefined
                }
                onClick={onClose}
              >
                <span>
                  {item.title}
                  {"locked" in item && item.locked === true && (
                    <LockKeyhole size={12} aria-hidden="true" />
                  )}
                </span>
                <ArrowUpRight size={13} />
              </Link>
            ))}
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

function MenuConstellation() {
  return (
    <svg className="menu-constellation" viewBox="0 0 180 105" fill="none" aria-hidden="true">
      <path className="menu-orbit" d="M8 77C40 17 123 9 166 53S80 107 36 58" />
      <path d="m38 61 50-32 53 45M88 29l-8 54" />
      <circle cx="38" cy="61" r="8" />
      <circle cx="88" cy="29" r="12" />
      <circle cx="141" cy="74" r="6" />
      <circle cx="80" cy="83" r="4" />
      <path className="menu-spark" d="M147 17v12m-6-6h12M15 40v8m-4-4h8" />
    </svg>
  )
}
